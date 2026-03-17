---
outline: deep
---

# 数据输出组件开发

数据输出组件（Sink）是 etl-go 中负责将处理后的数据写入各种目标系统的核心组件。本文档详细介绍如何开发自定义数据输出组件，包括接口实现、批量写入、事务管理和性能优化。

## 数据输出组件概述

### 作用与职责
数据输出组件负责：
- **数据写入**: 将处理后的记录写入数据库、文件、消息队列等目标系统
- **批量处理**: 支持批量写入以提高性能
- **事务管理**: 确保数据一致性和完整性
- **错误处理**: 处理写入过程中的异常并保证数据质量
- **资源管理**: 管理目标连接和资源释放

### 核心接口
在 `etl/core/sink` 中定义：
```go
// 数据输出接口
type Sink interface {
    // 打开输出组件，加载配置和列映射
    Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error
    
    // 写入一批记录
    Write(columnMapping string, records []record.Record) error
    
    // 关闭输出组件
    Close() error
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/sinks/
└── your-sink/            # 自定义数据输出名称
    ├── main.go          # 主实现文件
    ├── go.mod           # 模块定义
    ├── README.md        # 组件说明
    └── test/            # 测试文件
        └── main_test.go
```

### 2. 定义组件元数据

每个数据输出组件需要导出一个或多个创建器函数：

```go
package yoursink

import (
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/sink"
)

var name = "your-sink"

func SetCustomName(customName string) {
    name = customName
}

// SinkCreator 创建器函数 - 必须导出
func SinkCreator() (string, sink.Sink, *string, []params.Params) {
    return name, &Sink{}, nil, []params.Params{
        {
            Key:          "target",
            DefaultValue: "",
            Required:     true,
            Description:  "目标表名或文件路径",
        },
        // 更多参数...
    }
}
```

### 3. 实现数据输出接口

#### 基础实现模板

```go
package sql

import (
    "database/sql"
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/sink"
)

// Sink 实现了 core.Sink 接口
type Sink struct {
    db            *sql.DB
    table         string
    columnMapping map[string]string
    datasource    *datasource.Datasource
}

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(customName, customDatasourceName string) {
    mysqlName = customName
    mysqlDatasourceName = customDatasourceName
}

func SinkCreatorMysql() (string, sink.Sink, *string, []params.Params) {
    return mysqlName, &Sink{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "table",
            Required:     true,
            DefaultValue: "",
            Description:  "sql table name",
        },
    }
}
```

#### Open 方法实现
```go
func (s *Sink) Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error {
    // 验证列映射不能为空
    if len(columnMapping) == 0 {
        return fmt.Errorf("sql sink: 'column_mapping' cannot be empty")
    }
    s.columnMapping = columnMapping

    // 获取数据库连接
    if dataSource != nil {
        db := (*dataSource).Open()
        if dbInstance, ok := db.(*sql.DB); ok {
            s.db = dbInstance
        } else {
            return fmt.Errorf("sql sink: failed to get database connection from datasource")
        }
        s.datasource = dataSource
    }

    // 获取表名
    if t, ok := config["table"]; ok && t != "" {
        s.table = t
    } else {
        return fmt.Errorf("sql sink: config is missing required key 'table'")
    }

    // 验证数据库连接
    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not available")
    }

    return nil
}
```

#### Write 方法实现（批量写入）
```go
func (s *Sink) Write(_ string, records []record.Record) error {
    if len(records) == 0 {
        return nil
    }

    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not open")
    }

    // 启动事务
    tx, err := s.db.Begin()
    if err != nil {
        return fmt.Errorf("sql sink: failed to begin transaction: %w", err)
    }
    defer func(tx *sql.Tx) {
        _ = tx.Rollback()
    }(tx)

    // 准备 SQL 语句的列名和占位符
    dbColumns := make([]string, 0, len(s.columnMapping))
    placeholders := make([]string, 0, len(s.columnMapping))
    recordKeysInOrder := make([]string, 0, len(s.columnMapping))

    for recordKey, dbCol := range s.columnMapping {
        dbColumns = append(dbColumns, "`"+dbCol+"`")
        placeholders = append(placeholders, "?")
        recordKeysInOrder = append(recordKeysInOrder, recordKey)
    }

    // 构建 INSERT 语句
    valuePlaceholderGroup := "(" + strings.Join(placeholders, ", ") + ")"
    allValuePlaceholders := strings.Repeat(valuePlaceholderGroup+",", len(records)-1) + valuePlaceholderGroup

    query := fmt.Sprintf("INSERT INTO `%s` (%s) VALUES %s", s.table, 
        strings.Join(dbColumns, ", "), allValuePlaceholders)

    // 准备所有参数值
    args := make([]interface{}, 0, len(records)*len(s.columnMapping))
    for _, r := range records {
        for _, recordKey := range recordKeysInOrder {
            val, exists := r[recordKey]
            if !exists {
                val = nil
            }
            args = append(args, val)
        }
    }

    // 执行批量插入
    _, err = tx.Exec(query, args...)
    if err != nil {
        return fmt.Errorf("sql sink: failed to execute batch insert: %w", err)
    }

    // 提交事务
    return tx.Commit()
}
```

#### Close 方法实现
```go
func (s *Sink) Close() error {
    return (*s.datasource).Close()
}
```

## 实际示例

### MySQL Sink 组件（完整版本）

基于实际 etl-go 项目中的 SQL Sink 组件实现：

```go
package sql

import (
    "database/sql"
    "fmt"
    "strings"

    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/sink"
)

// ==================== MySQL Support ====================

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(customName, customDatasourceName string) {
    mysqlName = customName
    mysqlDatasourceName = customDatasourceName
}

func SinkCreatorMysql() (string, sink.Sink, *string, []params.Params) {
    return mysqlName, &Sink{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "table",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL 表名",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgre(customName, customDatasourceName string) {
    postgreName = customName
    mysqlDatasourceName = customDatasourceName // 注意：这里应该是 postgreDatasourceName
}

func SinkCreatorPostgre() (string, sink.Sink, *string, []params.Params) {
    return postgreName, &Sink{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "table",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL 表名",
        },
    }
}

// ==================== SQLite Support ====================

var sqliteName = "sqlite"
var sqliteDatasourceName = "sqlite"

func SetCustomNameSqlite(customName, customDatasourceName string) {
    sqliteName = customName
    sqliteDatasourceName = customDatasourceName
}

func SinkCreatorSqlite() (string, sink.Sink, *string, []params.Params) {
    return sqliteName, &Sink{}, &sqliteDatasourceName, []params.Params{
        {
            Key:          "table",
            Required:     true,
            DefaultValue: "",
            Description:  "SQLite 表名",
        },
    }
}

// ==================== 核心实现 ====================

type Sink struct {
    db            *sql.DB
    table         string
    columnMapping map[string]string
    datasource    *datasource.Datasource
}

func (s *Sink) Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error {
    if len(columnMapping) == 0 {
        return fmt.Errorf("sql sink: 'column_mapping' cannot be empty")
    }
    s.columnMapping = columnMapping

    if dataSource != nil {
        db := (*dataSource).Open()
        if dbInstance, ok := db.(*sql.DB); ok {
            s.db = dbInstance
        } else {
            return fmt.Errorf("sql sink: failed to get database connection from datasource")
        }
        s.datasource = dataSource
    }

    if t, ok := config["table"]; ok && t != "" {
        s.table = t
    } else {
        return fmt.Errorf("sql sink: config is missing required key 'table'")
    }

    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not available")
    }

    return nil
}

func (s *Sink) Write(_ string, records []record.Record) error {
    if len(records) == 0 {
        return nil
    }

    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not open")
    }

    tx, err := s.db.Begin()
    if err != nil {
        return fmt.Errorf("sql sink: failed to begin transaction: %w", err)
    }
    defer func(tx *sql.Tx) {
        _ = tx.Rollback()
    }(tx)

    dbColumns := make([]string, 0, len(s.columnMapping))
    placeholders := make([]string, 0, len(s.columnMapping))
    recordKeysInOrder := make([]string, 0, len(s.columnMapping))

    for recordKey, dbCol := range s.columnMapping {
        dbColumns = append(dbColumns, "`"+dbCol+"`")
        placeholders = append(placeholders, "?")
        recordKeysInOrder = append(recordKeysInOrder, recordKey)
    }

    valuePlaceholderGroup := "(" + strings.Join(placeholders, ", ") + ")"
    allValuePlaceholders := strings.Repeat(valuePlaceholderGroup+",", len(records)-1) + valuePlaceholderGroup

    query := fmt.Sprintf("INSERT INTO `%s` (%s) VALUES %s", s.table, 
        strings.Join(dbColumns, ", "), allValuePlaceholders)

    args := make([]interface{}, 0, len(records)*len(s.columnMapping))
    for _, r := range records {
        for _, recordKey := range recordKeysInOrder {
            val, exists := r[recordKey]
            if !exists {
                val = nil
            }
            args = append(args, val)
        }
    }

    _, err = tx.Exec(query, args...)
    if err != nil {
        return fmt.Errorf("sql sink: failed to execute batch insert: %w", err)
    }

    return tx.Commit()
}

func (s *Sink) Close() error {
    return (*s.datasource).Close()
}
```

### CSV 文件输出组件示例

```go
package csv

import (
    "encoding/csv"
    "errors"
    "fmt"
    "os"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/sink"
)

type CSVSink struct {
    file        *os.File
    writer      *csv.Writer
    columnMapping map[string]string
    headerWritten bool
}

var csvName = "csv"

func SinkCreatorCSV() (string, sink.Sink, *string, []params.Params) {
    return csvName, &CSVSink{}, nil, []params.Params{
        {
            Key:          "filePath",
            Required:     true,
            DefaultValue: "",
            Description:  "CSV 文件路径",
        },
        {
            Key:          "append",
            DefaultValue: "false",
            Required:     false,
            Description:  "是否追加模式",
        },
    }
}

func (c *CSVSink) Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error {
    c.columnMapping = columnMapping
    
    filePath, ok := config["filePath"]
    if !ok || filePath == "" {
        return fmt.Errorf("csv sink: filePath is required")
    }
    
    appendMode := false
    if appendStr, ok := config["append"]; ok && appendStr == "true" {
        appendMode = true
    }
    
    var err error
    if appendMode {
        c.file, err = os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    } else {
        c.file, err = os.Create(filePath)
    }
    
    if err != nil {
        return fmt.Errorf("csv sink: failed to create/open file: %w", err)
    }
    
    c.writer = csv.NewWriter(c.file)
    c.headerWritten = false
    
    return nil
}

func (c *CSVSink) Write(_ string, records []record.Record) error {
    if len(records) == 0 {
        return nil
    }
    
    // 写表头
    if !c.headerWritten {
        columns := make([]string, 0, len(c.columnMapping))
        for _, col := range c.columnMapping {
            columns = append(columns, col)
        }
        
        if err := c.writer.Write(columns); err != nil {
            return fmt.Errorf("csv sink: failed to write header: %w", err)
        }
        c.headerWritten = true
    }
    
    // 写入数据行
    for _, r := range records {
        row := make([]string, 0, len(c.columnMapping))
        for _, recordKey := range getKeysInOrder(c.columnMapping) {
            val, exists := r[recordKey]
            if !exists || val == nil {
                row = append(row, "")
            } else {
                strVal, err := formatValue(val)
                if err != nil {
                    return fmt.Errorf("csv sink: failed to format value: %w", err)
                }
                row = append(row, strVal)
            }
        }
        
        if err := c.writer.Write(row); err != nil {
            return fmt.Errorf("csv sink: failed to write row: %w", err)
        }
    }
    
    c.writer.Flush()
    return c.writer.Error()
}

func (c *CSVSink) Close() error {
    if c.writer != nil {
        c.writer.Flush()
        if err := c.writer.Error(); err != nil {
            return err
        }
    }
    if c.file != nil {
        return c.file.Close()
    }
    return nil
}

func formatValue(v interface{}) (string, error) {
    switch val := v.(type) {
    case string:
        return val, nil
    case int:
        return strconv.Itoa(val), nil
    case int64:
        return strconv.FormatInt(val, 10), nil
    case float64:
        return strconv.FormatFloat(val, 'f', -1, 64), nil
    case bool:
        return strconv.FormatBool(val), nil
    default:
        return fmt.Sprintf("%v", v), nil
    }
}

func getKeysInOrder(mapping map[string]string) []string {
    keys := make([]string, 0, len(mapping))
    for k := range mapping {
        keys = append(keys, k)
    }
    return keys
}
```

### JSON 文件输出组件示例

```go
package json

import (
    "encoding/json"
    "fmt"
    "os"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/sink"
)

type JSONSink struct {
    file        *os.File
    encoder     *json.Encoder
    columnMapping map[string]string
    useArray    bool
}

var jsonName = "json"

func SinkCreatorJSON() (string, sink.Sink, *string, []params.Params) {
    return jsonName, &JSONSink{}, nil, []params.Params{
        {
            Key:          "filePath",
            Required:     true,
            DefaultValue: "",
            Description:  "JSON 文件路径",
        },
        {
            Key:          "useArray",
            DefaultValue: "true",
            Required:     false,
            Description:  "是否使用数组格式",
        },
    }
}

func (j *JSONSink) Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error {
    j.columnMapping = columnMapping
    
    filePath, ok := config["filePath"]
    if !ok || filePath == "" {
        return fmt.Errorf("json sink: filePath is required")
    }
    
    useArray := true
    if arrayStr, ok := config["useArray"]; ok && arrayStr == "false" {
        useArray = false
    }
    j.useArray = useArray
    
    var err error
    j.file, err = os.Create(filePath)
    if err != nil {
        return fmt.Errorf("json sink: failed to create file: %w", err)
    }
    
    j.encoder = json.NewEncoder(j.file)
    j.encoder.SetIndent("", "  ")
    
    if useArray {
        if err := j.encoder.Encode([]map[string]interface{}{}); err != nil {
            return fmt.Errorf("json sink: failed to initialize array: %w", err)
        }
    }
    
    return nil
}

func (j *JSONSink) Write(_ string, records []record.Record) error {
    if len(records) == 0 {
        return nil
    }
    
    if j.useArray {
        var arrayData []map[string]interface{}
        if err := j.decoder.Decode(&arrayData); err != nil {
            return fmt.Errorf("json sink: failed to decode array: %w", err)
        }
        
        for _, r := range records {
            obj := convertRecordToMap(r, j.columnMapping)
            arrayData = append(arrayData, obj)
        }
        
        return j.encoder.Encode(arrayData)
    } else {
        // 每行一个 JSON 对象格式
        for _, r := range records {
            obj := convertRecordToMap(r, j.columnMapping)
            if err := j.encoder.Encode(obj); err != nil {
                return fmt.Errorf("json sink: failed to encode record: %w", err)
            }
        }
        return nil
    }
}

func convertRecordToMap(r record.Record, mapping map[string]string) map[string]interface{} {
    obj := make(map[string]interface{})
    for recordKey, dbCol := range mapping {
        if val, exists := r[recordKey]; exists {
            obj[dbCol] = val
        }
    }
    return obj
}

func (j *JSONSink) Close() error {
    if j.file != nil {
        return j.file.Close()
    }
    return nil
}
```

## 高级功能实现

### 1. 批量写入优化

```go
// BatchSizeConfigurableSink 可配置批量大小的 Sink
type BatchSizeConfigurableSink struct {
    baseSink       Sink
    batchSize      int
    currentBatch   []record.Record
}

func (b *BatchSizeConfigurableSink) Process(records []record.Record) error {
    b.currentBatch = append(b.currentBatch, records...)
    
    if len(b.currentBatch) >= b.batchSize {
        err := b.baseSink.Write("", b.currentBatch)
        if err != nil {
            return err
        }
        b.currentBatch = b.currentBatch[:0]
    }
    
    return nil
}
```

### 2. 重试机制

```go
// RetrySink 带重试机制的 Sink
type RetrySink struct {
    sink      Sink
    maxRetries int
    delayMs   int
}

func (r *RetrySink) Write(_ string, records []record.Record) error {
    var lastErr error
    for i := 0; i <= r.maxRetries; i++ {
        err := r.sink.Write("", records)
        if err == nil {
            return nil
        }
        lastErr = err
        
        if i < r.maxRetries {
            time.Sleep(time.Duration(r.delayMs) * time.Millisecond)
        }
    }
    
    return fmt.Errorf("failed after %d retries: %w", r.maxRetries, lastErr)
}
```

### 3. 批量写入监控

```go
// MonitoredSink 带监控的 Sink
type MonitoredSink struct {
    sink               Sink
    totalRecordsWrite  int64
    totalBatchesWrite  int64
    errors             int64
    startTime          time.Time
}

func (m *MonitoredSink) Write(_ string, records []record.Record) error {
    startTime := time.Now()
    err := m.sink.Write("", records)
    
    if err == nil {
        m.totalRecordsWrite += int64(len(records))
        m.totalBatchesWrite++
    } else {
        m.errors++
    }
    
    duration := time.Since(startTime)
    logrus.WithFields(logrus.Fields{
        "batch_size":     len(records),
        "duration_ms":    duration.Milliseconds(),
        "records_per_sec": float64(len(records)) / duration.Seconds(),
    }).Debug("Sink write completed")
    
    return err
}

func (m *MonitoredSink) GetStats() map[string]interface{} {
    uptime := time.Since(m.startTime).Seconds()
    return map[string]interface{}{
        "total_records_written": m.totalRecordsWrite,
        "total_batches_written": m.totalBatchesWrite,
        "total_errors":          m.errors,
        "uptime_seconds":        uptime,
        "throughput":            float64(m.totalRecordsWrite) / uptime,
    }
}
```

## 性能优化指南

### 1. 批量策略优化

```go
// AdaptiveBatchSizer 自适应批大小调整器
type AdaptiveBatchSizer struct {
    targetLatencyMs int64
    currentBatchSize int
    minBatchSize   int
    maxBatchSize   int
    latencyHistory []int64
}

func (a *AdaptiveBatchSizer) Adjust(currentSize int, latencyMs int64) int {
    a.latencyHistory = append(a.latencyHistory, latencyMs)
    if len(a.latencyHistory) > 10 {
        a.latencyHistory = a.latencyHistory[1:]
    }
    
    avgLatency := calculateAverage(a.latencyHistory)
    
    if avgLatency > a.targetLatencyMs {
        // 延迟过高，减小批大小
        newSize := currentSize / 2
        if newSize < a.minBatchSize {
            return a.minBatchSize
        }
        return newSize
    } else if avgLatency < a.targetLatencyMs/2 {
        // 延迟过低，增大批大小
        newSize := currentSize * 2
        if newSize > a.maxBatchSize {
            return a.maxBatchSize
        }
        return newSize
    }
    
    return currentSize
}

func calculateAverage(values []int64) int64 {
    if len(values) == 0 {
        return 0
    }
    sum := int64(0)
    for _, v := range values {
        sum += v
    }
    return sum / int64(len(values))
}
```

### 2. 异步写入

```go
// AsyncSink 异步写入 Sink
type AsyncSink struct {
    sink       Sink
    bufferCh   chan []record.Record
    workerCh   chan struct{}
    wg         sync.WaitGroup
    bufferSize int
}

func (a *AsyncSink) Start() {
    a.bufferCh = make(chan []record.Record, a.bufferSize)
    
    // 启动写入 worker
    a.wg.Add(1)
    go func() {
        defer a.wg.Done()
        for batch := range a.bufferCh {
            if err := a.sink.Write("", batch); err != nil {
                logrus.WithError(err).Error("Async sink write failed")
            }
        }
    }()
}

func (a *AsyncSink) Write(_ string, records []record.Record) error {
    select {
    case a.bufferCh <- records:
        return nil
    case <-time.After(5 * time.Second):
        return errors.New("async sink buffer timeout")
    }
}

func (a *AsyncSink) Close() error {
    close(a.bufferCh)
    a.wg.Wait()
    return a.sink.Close()
}
```

### 3. 内存池优化

```go
var batchPool = sync.Pool{
    New: func() interface{} {
        return make([]record.Record, 0, 1000)
    },
}

func (s *YourSink) writeWithPool(records []record.Record) error {
    // 从池中获取批次
    batch := batchPool.Get().([]record.Record)
    defer batchPool.Put(batch)
    
    // 复制数据到批次
    for _, r := range records {
        batch = append(batch, r)
    }
    
    return s.Write("", batch)
}
```

## 测试开发

### 单元测试示例

```go
package sql

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestSQLSink_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        columnMapping map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "有效配置",
            config: map[string]string{
                "table": "users",
            },
            columnMapping: map[string]string{
                "id":   "id",
                "name": "name",
            },
            expectError: false,
        },
        {
            name: "缺少表名",
            config: map[string]string{},
            columnMapping: map[string]string{
                "id": "id",
            },
            expectError: true,
            errorMsg:    "table",
        },
        {
            name: "空列映射",
            config: map[string]string{
                "table": "users",
            },
            columnMapping: map[string]string{},
            expectError: true,
            errorMsg:    "column_mapping",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            sink := &Sink{}
            // 需要使用 mock datasource
            // err := sink.Open(tt.config, tt.columnMapping, mockDataSource)
            
            if tt.expectError {
                require.Error(t, err)
                if tt.errorMsg != "" {
                    assert.Contains(t, err.Error(), tt.errorMsg)
                }
            } else {
                require.NoError(t, err)
                assert.Equal(t, tt.config["table"], sink.table)
            }
        })
    }
}

func TestSQLSink_Write(t *testing.T) {
    // 测试批量写入功能
}
```

## 最佳实践

### 1. 错误处理
- **原子性操作**: 使用事务确保批量操作的原子性
- **详细错误信息**: 包含上下文信息便于调试
- **优雅降级**: 部分失败时尽量处理成功的数据

### 2. 性能优化
- **批量写入**: 减少网络 IO 次数
- **连接复用**: 充分利用连接池
- **异步处理**: 对于非关键数据可以使用异步写入
- **缓存策略**: 合理控制缓冲区大小

### 3. 一致性保障
- **事务管理**: 确保数据一致性
- **重试机制**: 网络故障自动重试
- **幂等性**: 支持重复写入不产生副作用

### 4. 可观测性
- **监控指标**: 记录写入数量、成功率、延迟等
- **详细日志**: 记录关键操作和错误信息
- **告警机制**: 异常情况及时通知

## 常见问题

### 1. 批量写入超时
**问题**: 大批量数据写入超时
**解决方案**:
- 减小批量大小
- 增加超时时间
- 使用异步写入
- 分批次处理

### 2. 内存溢出
**问题**: 写入大量数据时内存占用过高
**解决方案**:
- 使用流式处理
- 及时释放缓冲区
- 控制批量大小
- 使用对象池

### 3. 死锁问题
**问题**: 长时间运行后出现死锁
**解决方案**:
- 避免嵌套事务
- 设置合理的超时时间
- 定期清理连接
- 使用连接池监控

### 4. 数据不一致
**问题**: 写入完成后数据不一致
**解决方案**:
- 使用事务
- 启用日志记录
- 实施数据校验
- 提供回滚机制

## 调试技巧

### 1. 启用详细日志
```go
func (s *Sink) debugLog(message string, fields map[string]interface{}) {
    if s.config["debug"] == "true" {
        log := logrus.WithField("component", "sink")
        for k, v := range fields {
            log = log.WithField(k, v)
        }
        log.Debug(message)
    }
}

s.debugLog("写入批次", map[string]interface{}{
    "batch_size": len(records),
    "table": s.table,
})
```

### 2. 性能剖析
```go
func (s *Sink) enableProfiling() {
    if s.config["profile"] == "true" {
        go func() {
            ticker := time.NewTicker(30 * time.Second)
            defer ticker.Stop()
            
            for range ticker.C {
                logrus.WithFields(logrus.Fields{
                    "connections": s.getConnCount(),
                    "buffer_size": s.getBufferSize(),
                    "write_rate": s.getWriteRate(),
                }).Info("Sink 性能统计")
            }
        }()
    }
}
```

## 下一步

完成数据输出组件开发后，您可以：
1. **[开发执行器组件](./develop-component-executor.md)** - 学习如何开发任务执行组件
2. **[集成测试](#测试开发)** - 确保整个 ETL 流程正常工作
3. **[性能调优](#性能优化指南)** - 优化整体性能
4. **[部署生产](#调试技巧)** - 配置生产环境参数

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者：etl-go 开发团队*