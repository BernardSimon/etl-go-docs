---
outline: deep
---

# 数据输入组件开发

数据输入组件（Source）是 etl-go 中负责从各种数据源提取数据的核心组件。本文档详细介绍如何开发自定义数据输入组件，包括接口实现、数据提取、错误处理和性能优化。

## 数据输入组件概述

### 作用与职责
数据输入组件负责：
- **数据提取**: 从数据库、文件、API等源读取数据
- **数据解析**: 将原始数据转换为统一的记录格式
- **分页处理**: 支持大数据集的分批次读取
- **异常处理**: 处理读取过程中的各种异常
- **资源管理**: 管理数据源连接和资源释放

### 核心接口
在 `etl/core/source` 中定义：
```go
// 数据输入接口
type Source interface {
    // 打开数据源
    Open(config map[string]string, dataSource *datasource.Datasource) error
    
    // 读取单条记录
    Read() (record.Record, error)
    
    // 获取列信息
    Column() map[string]string
    
    // 关闭数据源
    Close() error
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/sources/
└── your-source/           # 自定义数据输入名称
    ├── source.go         # 主实现文件
    ├── go.mod           # 模块定义
    ├── README.md        # 组件说明
    └── test/            # 测试文件
        └── source_test.go
```

### 2. 定义组件元数据

每个数据输入组件需要导出一个或多个创建器函数：

```go
package yoursource

import (
    "github.com/BernardSimon/etl-go/etl/core/source"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// 组件名称和对应的数据源名称
var sourceName = "your-source"
var datasourceName = "your-datasource"

// 设置自定义名称（可选）
func SetCustomName(customSourceName, customDatasourceName string) {
    sourceName = customSourceName
    datasourceName = customDatasourceName
}

// 创建器函数 - 必须导出
func SourceCreator() (string, source.Source, *string, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "query",
            DefaultValue: "",
            Required:     true,
            Description:  "数据查询语句或文件路径",
        },
        {
            Key:          "batchSize",
            DefaultValue: "1000",
            Required:     false,
            Description:  "批量读取大小",
        },
        // 更多参数...
    }
    
    return sourceName, &Source{}, &datasourceName, paramList
}
```

### 3. 实现数据输入接口

#### 基础实现模板
```go
package yoursource

import (
    "database/sql"
    "errors"
    "fmt"
    "io"
    "time"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/source"
)

// Source 结构体定义
type Source struct {
    db          *sql.DB              // 数据库连接（如适用）
    rows        *sql.Rows            // 查询结果集
    datasource  *datasource.Datasource // 数据源引用
    columnNames []string             // 列名列表
    config      map[string]string    // 配置信息
    stats       SourceStats          // 统计信息
    batchBuffer []record.Record      // 批量缓冲区
    batchSize   int                  // 批量大小
}

// SourceStats 统计信息
type SourceStats struct {
    TotalReadCount    int64           // 总读取记录数
    FailedReadCount   int64           // 失败读取次数
    LastReadTime      time.Time       // 最后读取时间
    TotalReadTime     time.Duration   // 总读取时间
    AverageReadTime   time.Duration   // 平均读取时间
}
```

#### Open 方法实现
```go
// Open 打开数据源
func (s *Source) Open(config map[string]string, dataSource *datasource.Datasource) error {
    s.config = config
    s.datasource = dataSource
    
    // 验证必需参数
    if err := s.validateConfig(); err != nil {
        return fmt.Errorf("配置验证失败: %w", err)
    }
    
    // 初始化统计信息
    s.stats = SourceStats{}
    
    // 设置批量大小
    s.batchSize = 1000 // 默认值
    if batchSizeStr, ok := config["batchSize"]; ok && batchSizeStr != "" {
        if batchSize, err := strconv.Atoi(batchSizeStr); err == nil && batchSize > 0 {
            s.batchSize = batchSize
        }
    }
    
    // 初始化批量缓冲区
    s.batchBuffer = make([]record.Record, 0, s.batchSize)
    
    // 建立连接或打开文件
    if err := s.connect(); err != nil {
        return fmt.Errorf("连接数据源失败: %w", err)
    }
    
    return nil
}

// validateConfig 验证配置
func (s *Source) validateConfig() error {
    // 检查必需参数
    if query, ok := s.config["query"]; !ok || query == "" {
        return errors.New("必需参数 'query' 未提供")
    }
    
    // 验证批量大小
    if batchSizeStr, ok := s.config["batchSize"]; ok && batchSizeStr != "" {
        if batchSize, err := strconv.Atoi(batchSizeStr); err != nil || batchSize <= 0 {
            return fmt.Errorf("批量大小必须为正整数，当前值: %s", batchSizeStr)
        }
    }
    
    return nil
}

// connect 建立连接或打开文件
func (s *Source) connect() error {
    // 获取查询语句
    query := s.config["query"]
    
    // 根据数据源类型执行不同的连接逻辑
    switch datasourceType := (*s.datasource).(type) {
    case *sql.DB:
        // 数据库类型数据源
        s.db = datasourceType
        
        // 执行查询
        var err error
        s.rows, err = s.db.Query(query)
        if err != nil {
            return fmt.Errorf("执行查询失败: %w", err)
        }
        
        // 获取列名
        s.columnNames, err = s.rows.Columns()
        if err != nil {
            return fmt.Errorf("获取列名失败: %w", err)
        }
        
    case string:
        // 文件路径类型数据源
        filePath := datasourceType
        return s.openFile(filePath, query)
        
    default:
        return errors.New("不支持的数据源类型")
    }
    
    return nil
}
```

#### Read 方法实现
```go
// Read 读取单条记录
func (s *Source) Read() (record.Record, error) {
    startTime := time.Now()
    
    // 首先尝试从批量缓冲区读取
    if len(s.batchBuffer) > 0 {
        record := s.batchBuffer[0]
        s.batchBuffer = s.batchBuffer[1:]
        
        s.updateStats(startTime, true)
        return record, nil
    }
    
    // 批量缓冲区为空，从数据源读取新批次
    if err := s.readNextBatch(); err != nil {
        s.updateStats(startTime, false)
        return nil, err
    }
    
    // 再次尝试从批量缓冲区读取
    if len(s.batchBuffer) > 0 {
        record := s.batchBuffer[0]
        s.batchBuffer = s.batchBuffer[1:]
        
        s.updateStats(startTime, true)
        return record, nil
    }
    
    // 没有更多数据
    s.updateStats(startTime, false)
    return nil, io.EOF
}

// readNextBatch 读取下一个批次
func (s *Source) readNextBatch() error {
    s.batchBuffer = s.batchBuffer[:0] // 清空缓冲区
    
    // 根据数据源类型执行不同的读取逻辑
    if s.rows != nil {
        return s.readBatchFromDatabase()
    } else {
        return s.readBatchFromFile()
    }
}

// readBatchFromDatabase 从数据库读取批次
func (s *Source) readBatchFromDatabase() error {
    count := 0
    
    for count < s.batchSize && s.rows.Next() {
        // 扫描行数据
        record, err := s.scanRow()
        if err != nil {
            return fmt.Errorf("扫描行数据失败: %w", err)
        }
        
        s.batchBuffer = append(s.batchBuffer, record)
        count++
    }
    
    // 检查是否有错误
    if err := s.rows.Err(); err != nil {
        return fmt.Errorf("读取过程中发生错误: %w", err)
    }
    
    // 如果没有读取到任何数据且没有更多行，返回EOF
    if count == 0 {
        return io.EOF
    }
    
    return nil
}

// scanRow 扫描单行数据
func (s *Source) scanRow() (record.Record, error) {
    // 使用通用方法处理各种数据类型
    values := make([]sql.RawBytes, len(s.columnNames))
    scanArgs := make([]interface{}, len(values))
    
    for i := range values {
        scanArgs[i] = &values[i]
    }
    
    // 扫描数据
    if err := s.rows.Scan(scanArgs...); err != nil {
        return nil, fmt.Errorf("扫描失败: %w", err)
    }
    
    // 构建记录
    r := make(record.Record)
    for i, colName := range s.columnNames {
        if values[i] == nil {
            r[colName] = nil
        } else {
            r[colName] = string(values[i])
        }
    }
    
    return r, nil
}

// updateStats 更新统计信息
func (s *Source) updateStats(startTime time.Time, success bool) {
    duration := time.Since(startTime)
    
    if success {
        s.stats.TotalReadCount++
        s.stats.TotalReadTime += duration
        s.stats.AverageReadTime = s.stats.TotalReadTime / time.Duration(s.stats.TotalReadCount)
    } else {
        s.stats.FailedReadCount++
    }
    
    s.stats.LastReadTime = time.Now()
}
```

#### Column 方法实现
```go
// Column 获取列信息
func (s *Source) Column() map[string]string {
    columns := make(map[string]string)
    
    for _, colName := range s.columnNames {
        columns[colName] = colName
    }
    
    return columns
}
```

#### Close 方法实现
```go
// Close 关闭数据源
func (s *Source) Close() error {
    var errs []error
    
    // 关闭结果集
    if s.rows != nil {
        if err := s.rows.Close(); err != nil {
            errs = append(errs, fmt.Errorf("关闭结果集失败: %w", err))
        }
    }
    
    // 关闭数据源连接
    if s.datasource != nil {
        if err := (*s.datasource).Close(); err != nil {
            errs = append(errs, fmt.Errorf("关闭数据源失败: %w", err))
        }
    }
    
    // 清理缓冲区
    s.batchBuffer = nil
    
    // 记录关闭统计
    s.recordShutdownStats()
    
    // 返回所有错误
    return errors.Join(errs...)
}

// recordShutdownStats 记录关闭统计
func (s *Source) recordShutdownStats() {
    logrus.WithFields(logrus.Fields{
        "component":       sourceName,
        "total_read":      s.stats.TotalReadCount,
        "failed_read":     s.stats.FailedReadCount,
        "avg_read_time":   s.stats.AverageReadTime,
        "total_read_time": s.stats.TotalReadTime,
    }).Info("数据输入组件关闭统计")
}
```

## 实际示例

### SQL 数据输入组件示例
```go
package sql

import (
    "database/sql"
    "errors"
    "fmt"
    "io"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/source"
)

// Source 实现了 core.Source 接口
type Source struct {
    db          *sql.DB
    rows        *sql.Rows
    datasource  *datasource.Datasource
    columnNames []string
}

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(customName, customDatasourceName string) {
    mysqlName = customName
    mysqlDatasourceName = customDatasourceName
}

func SourceCreatorMysql() (string, source.Source, *string, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "query",
            DefaultValue: "",
            Required:     true,
            Description:  "SQL查询语句",
        },
    }
    
    return mysqlName, &Source{}, &mysqlDatasourceName, paramList
}

func (s *Source) Open(config map[string]string, dataSource *datasource.Datasource) error {
    s.datasource = dataSource
    
    // 验证查询语句
    query, ok := config["query"]
    if !ok || query == "" {
        return fmt.Errorf("sql source: config is missing or has invalid 'query'")
    }
    
    // 获取数据库连接
    var err error
    s.db = (*dataSource).Open().(*sql.DB)
    
    // 执行查询
    s.rows, err = s.db.Query(query)
    if err != nil {
        return fmt.Errorf("sql source: failed to executor query: %w", err)
    }
    
    // 获取列名
    s.columnNames, err = s.rows.Columns()
    if err != nil {
        return fmt.Errorf("sql source: failed to get column names from result set: %w", err)
    }
    
    return nil
}

func (s *Source) Read() (record.Record, error) {
    // 检查是否还有下一行
    if !s.rows.Next() {
        // 检查迭代过程中是否有错误
        if err := s.rows.Err(); err != nil {
            return nil, fmt.Errorf("sql source: error during row iteration: %w", err)
        }
        // 没有更多数据
        return nil, io.EOF
    }
    
    // 准备扫描参数
    values := make([]sql.RawBytes, len(s.columnNames))
    scanArgs := make([]interface{}, len(values))
    for i := range values {
        scanArgs[i] = &values[i]
    }
    
    // 扫描行数据
    if err := s.rows.Scan(scanArgs...); err != nil {
        return nil, fmt.Errorf("sql source: failed to scan row: %w", err)
    }
    
    // 构建记录
    r := make(record.Record)
    for i, colName := range s.columnNames {
        if values[i] == nil {
            r[colName] = nil
        } else {
            r[colName] = string(values[i])
        }
    }
    
    return r, nil
}

func (s *Source) Column() map[string]string {
    columns := make(map[string]string)
    for _, v := range s.columnNames {
        columns[v] = v
    }
    return columns
}

func (s *Source) Close() error {
    var errs []error
    
    // 关闭结果集
    if s.rows != nil {
        if err := s.rows.Close(); err != nil {
            errs = append(errs, fmt.Errorf("sql source: failed to close rows: %w", err))
        }
    }
    
    // 关闭数据库连接
    err := (*s.datasource).Close()
    if err != nil {
        errs = append(errs, fmt.Errorf("sql source: failed to close db: %w", err))
    }
    
    return errors.Join(errs...)
}
```

### CSV 数据输入组件示例
```go
package csv

import (
    "encoding/csv"
    "fmt"
    "io"
    "os"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/record"
    "github.com/BernardSimon/etl-go/etl/core/source"
)

type CSVSource struct {
    file        *os.File
    reader      *csv.Reader
    datasource  *datasource.Datasource
    columnNames []string
    config      map[string]string
}

var csvName = "csv"

func SourceCreatorCSV() (string, source.Source, *string, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "filePath",
            DefaultValue: "",
            Required:     true,
            Description:  "CSV文件路径",
        },
        {
            Key:          "hasHeader",
            DefaultValue: "true",
            Required:     false,
            Description:  "是否包含表头",
        },
        {
            Key:          "delimiter",
            DefaultValue: ",",
            Required:     false,
            Description:  "分隔符",
        },
    }
    
    return csvName, &CSVSource{}, nil, paramList
}

func (c *CSVSource) Open(config map[string]string, dataSource *datasource.Datasource) error {
    c.config = config
    c.datasource = dataSource
    
    // 获取文件路径
    filePath, ok := config["filePath"]
    if !ok || filePath == "" {
        return fmt.Errorf("csv source: filePath is required")
    }
    
    // 打开文件
    file, err := os.Open(filePath)
    if err != nil {
        return fmt.Errorf("csv source: failed to open file: %w", err)
    }
    c.file = file
    
    // 创建CSV阅读器
    c.reader = csv.NewReader(c.file)
    
    // 设置分隔符
    if delimiter, ok := config["delimiter"]; ok && delimiter != "" {
        if len(delimiter) == 1 {
            c.reader.Comma = rune(delimiter[0])
        }
    }
    
    // 读取表头
    if hasHeader, ok := config["hasHeader"]; !ok || hasHeader == "true" {
        headers, err := c.reader.Read()
        if err != nil {
            return fmt.Errorf("csv source: failed to read header: %w", err)
        }
        c.columnNames = headers
    } else {
        // 如果没有表头，生成默认列名
        // 先读取一行获取列数
        sample, err := c.reader.Read()
        if err != nil {
            return fmt.Errorf("csv source: failed to read sample row: %w", err)
        }
        
        // 重置文件指针
        c.file.Seek(0, 0)
        c.reader = csv.NewReader(c.file)
        
        // 生成列名
        c.columnNames = make([]string, len(sample))
        for i := range c.columnNames {
            c.columnNames[i] = fmt.Sprintf("column_%d", i+1)
        }
    }
    
    return nil
}

func (c *CSVSource) Read() (record.Record, error) {
    // 读取一行
    row, err := c.reader.Read()
    if err != nil {
        if err == io.EOF {
            return nil, io.EOF
        }
        return nil, fmt.Errorf("csv source: failed to read row: %w", err)
    }
    
    // 构建记录
    r := make(record.Record)
    for i, colName := range c.columnNames {
        if i < len(row) {
            // 尝试转换数据类型
            value, err := c.convertValue(row[i])
            if err == nil {
                r[colName] = value
            } else {
                r[colName] = row[i] // 保持字符串格式
            }
        } else {
            r[colName] = nil
        }
    }
    
    return r, nil
}

func (c *CSVSource) convertValue(str string) (interface{}, error) {
    // 尝试转换为整数
    if i, err := strconv.ParseInt(str, 10, 64); err == nil {
        return i, nil
    }
    
    // 尝试转换为浮点数
    if f, err := strconv.ParseFloat(str, 64); err == nil {
        return f, nil
    }
    
    // 尝试转换为布尔值
    if b, err := strconv.ParseBool(str); err == nil {
        return b, nil
    }
    
    // 保持字符串格式
    return str, fmt.Errorf("无法转换为基本类型")
}

func (c *CSVSource) Column() map[string]string {
    columns := make(map[string]string)
    for _, colName := range c.columnNames {
        columns[colName] = colName
    }
    return columns
}

func (c *CSVSource) Close() error {
    if c.file != nil {
        return c.file.Close()
    }
    return nil
}
```

## 高级功能实现

### 1. 批量读取优化

```go
// BatchSource 支持批量读取的增强源
type BatchSource struct {
    Source
    batchSize    int
    currentBatch []record.Record
    batchIndex   int
}

func (b *BatchSource) ReadBatch() ([]record.Record, error) {
    if len(b.currentBatch) == 0 {
        // 读取新批次
        batch, err := b.fetchNextBatch()
        if err != nil {
            return nil, err
        }
        b.currentBatch = batch
        b.batchIndex = 0
    }
    
    // 返回当前批次
    return b.currentBatch, nil
}

func (b *BatchSource) fetchNextBatch() ([]record.Record, error) {
    batch := make([]record.Record, 0, b.batchSize)
    
    for i := 0; i < b.batchSize; i++ {
        record, err := b.Source.Read()
        if err != nil {
            if err == io.EOF && len(batch) > 0 {
                return batch, nil // 部分批次
            }
            return nil, err
        }
        batch = append(batch, record)
    }
    
    return batch, nil
}
```

### 2. 数据转换管道

```go
// TransformSource 带转换功能的数据源
type TransformSource struct {
    source      source.Source
    transformers []Transformer
}

type Transformer func(record.Record) (record.Record, error)

func (t *TransformSource) Read() (record.Record, error) {
    // 读取原始数据
    rawRecord, err := t.source.Read()
    if err != nil {
        return nil, err
    }
    
    // 应用转换
    transformed := rawRecord
    for _, transformer := range t.transformers {
        transformed, err = transformer(transformed)
        if err != nil {
            return nil, fmt.Errorf("转换失败: %w", err)
        }
    }
    
    return transformed, nil
}

// 示例转换器
func StringToIntTransformer(field string) Transformer {
    return func(r record.Record) (record.Record, error) {
        if value, ok := r[field].(string); ok {
            if intValue, err := strconv.Atoi(value); err == nil {
                r[field] = intValue
            }
        }
        return r, nil
    }
}
```

### 3. 进度跟踪

```go
// ProgressSource 带进度跟踪的数据源
type ProgressSource struct {
    source     source.Source
    totalRows  int64
    processed  int64
    progressCh chan<- ProgressUpdate
}

type ProgressUpdate struct {
    Processed int64
    Total     int64
    Percent   float64
}

func (p *ProgressSource) Read() (record.Record, error) {
    record, err := p.source.Read()
    if err == nil {
        p.processed++
        p.notifyProgress()
    } else if err == io.EOF {
        p.notifyCompletion()
    }
    return record, err
}

func (p *ProgressSource) notifyProgress() {
    if p.progressCh != nil {
        percent := 0.0
        if p.totalRows > 0 {
            percent = float64(p.processed) / float64(p.totalRows) * 100
        }
        
        select {
        case p.progressCh <- ProgressUpdate{
            Processed: p.processed,
            Total:     p.totalRows,
            Percent:   percent,
        }:
        default:
            // 不阻塞主流程
        }
    }
}

func (p *ProgressSource) notifyCompletion() {
    if p.progressCh != nil {
        select {
        case p.progressCh <- ProgressUpdate{
            Processed: p.processed,
            Total:     p.totalRows,
            Percent:   100.0,
        }:
        default:
        }
        close(p.progressCh)
    }
}
```

## 测试开发

### 单元测试
```go
package sql

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestSQLSource_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "有效配置",
            config: map[string]string{
                "query": "SELECT * FROM users",
            },
            expectError: false,
        },
        {
            name: "缺少查询语句",
            config: map[string]string{
                // 缺少query
            },
            expectError: true,
            errorMsg:    "query",
        },
        {
            name: "空查询语句",
            config: map[string]string{
                "query": "",
            },
            expectError: true,
            errorMsg:    "query",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            source := &Source{}
            // 需要模拟datasource
            // err := source.Open(tt.config, mockDataSource)
            
            if tt.expectError {
                // require.Error(t, err)
                // assert.Contains(t, err.Error(), tt.errorMsg)
            } else {
                // require.NoError(t, err)
                // assert.NotNil(t, source.Column())
            }
        })
    }
}

func TestSQLSource_Read(t *testing.T) {
    // 创建模拟数据源和结果集
    // 测试读取功能
}

func TestSQLSource_Column(t *testing.T) {
    source := &Source{
        columnNames: []string{"id", "name", "email"},
    }
    
    columns := source.Column()
    
    assert.Equal(t, 3, len(columns))
    assert.Equal(t, "id", columns["id"])
    assert.Equal(t, "name", columns["name"])
    assert.Equal(t, "email", columns["email"])
}
```

## 性能优化指南

### 1. 内存优化
```go
// 使用对象池减少GC压力
var recordPool = sync.Pool{
    New: func() interface{} {
        return make(record.Record)
    },
}

func (s *Source) readWithPool() (record.Record, error) {
    r := recordPool.Get().(record.Record)
    // 清空现有内容
    for k := range r {
        delete(r, k)
    }
    
    // 填充数据...
    
    // 使用后放回池中
    defer func() {
        // 只放回小的记录
        if len(r) < 100 {
            recordPool.Put(r)
        }
    }()
    
    return r, nil
}
```

### 2. 并发读取
```go
// ConcurrentSource 并发读取数据源
type ConcurrentSource struct {
    source      source.Source
    workerCount int
    bufferSize  int
    recordsCh   chan record.Record
    errorCh     chan error
}

func (c *ConcurrentSource) Start() {
    c.recordsCh = make(chan record.Record, c.bufferSize)
    c.errorCh = make(chan error, 1)
    
    // 启动多个工作goroutine
    for i := 0; i < c.workerCount; i++ {
        go c.worker(i)
    }
}

func (c *ConcurrentSource) worker(id int) {
    for {
        record, err := c.source.Read()
        if err != nil {
            if err == io.EOF {
                break
            }
            select {
            case c.errorCh <- err:
            default:
            }
            break
        }
        
        select {
        case c.recordsCh <- record:
        case <-time.After(1 * time.Second):
            // 超时处理
            break
        }
    }
}

func (c *ConcurrentSource) Next() (record.Record, error) {
    select {
    case record := <-c.recordsCh:
        return record, nil
    case err := <-c.errorCh:
        return nil, err
    case <-time.After(30 * time.Second):
        return nil, errors.New("读取超时")
    }
}
```

## 最佳实践

### 1. 错误处理
- **详细错误信息**: 包含上下文信息，便于调试
- **错误分类**: 区分配置错误、连接错误、数据错误等
- **优雅降级**: 部分失败时继续处理其他数据

### 2. 资源管理
- **及时释放**: 确保所有资源都被正确关闭
- **连接复用**: 充分利用连接池
- **内存控制**: 控制缓冲区大小，避免内存泄漏

### 3. 可观测性
- **详细日志**: 记录关键操作和性能指标
- **监控指标**: 暴露读取速度、成功率等指标
- **跟踪追踪**: 支持分布式跟踪

### 4. 可测试性
- **接口设计**: 依赖接口而非具体实现
- **模拟支持**: 提供测试用的模拟实现
- **配置注入**: 通过配置控制行为，便于测试

## 常见问题

### 1. 内存溢出
**问题**: 读取大量数据时内存占用过高
**解决方案**:
- 使用批量读取，控制批次大小
- 实现流式处理，不一次性加载所有数据
- 监控内存使用，及时释放资源

### 2. 读取性能差
**问题**: 数据读取速度慢
**解决方案**:
- 优化查询语句，使用索引
- 增加批量大小，减少IO次数
- 使用并发读取，提高吞吐量

### 3. 数据格式不一致
**问题**: 源数据格式变化导致读取失败
**解决方案**:
- 实现灵活的数据解析逻辑
- 提供数据验证和转换功能
- 记录数据质量指标，便于排查

## 调试技巧

### 1. 启用调试日志
```go
func (s *Source) debugLog(message string, fields map[string]interface{}) {
    if s.config["debug"] == "true" {
        log := logrus.WithField("component", "source")
        for k, v := range fields {
            log = log.WithField(k, v)
        }
        log.Debug(message)
    }
}

// 在关键位置添加调试日志
s.debugLog("开始读取批次", map[string]interface{}{
    "batch_size": s.batchSize,
    "config":     s.config,
})
```

### 2. 性能分析
```go
func (s *Source) enableProfiling() {
    if s.config["profile"] == "true" {
        go func() {
            ticker := time.NewTicker(30 * time.Second)
            defer ticker.Stop()
            
            for range ticker.C {
                var m runtime.MemStats
                runtime.ReadMemStats(&m)
                
                logrus.WithFields(logrus.Fields{
                    "alloc":      m.Alloc,
                    "total_alloc": m.TotalAlloc,
                    "sys":        m.Sys,
                    "num_gc":     m.NumGC,
                }).Info("内存统计")
            }
        }()
    }
}
```

## 下一步

完成数据输入组件开发后，您可以：
1. **[开发数据处理组件](./develop-component-processor.md)** - 学习如何开发数据转换组件
2. **[集成测试](#测试开发)** - 确保组件与其他组件协同工作
3. **[性能调优](#性能优化指南)** - 优化组件性能

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*