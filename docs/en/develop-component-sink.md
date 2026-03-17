---
outline: deep
---

# Sink Component Development

Sink components are the core components in etl-go responsible for writing processed data to various target systems. This document details how to develop custom Sink components, including interface implementation, batch writing, transaction management, and performance optimization.

## Sink Component Overview

### Roles and Responsibilities
Sink components are responsible for:
- **Data Writing**: Writing processed records to databases, files, message queues, etc.
- **Batch Processing**: Supporting batch writing for improved performance
- **Transaction Management**: Ensuring data consistency and integrity
- **Error Handling**: Handling errors during writing while maintaining data quality
- **Resource Management**: Managing target connections and resource cleanup

### Core Interface
Defined in `etl/core/sink`:
```go
// Sink interface
type Sink interface {
    // Open sink with configuration and column mapping
    Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error
    
    // Write a batch of records
    Write(columnMapping string, records []record.Record) error
    
    // Close sink
    Close() error
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/sinks/
└── your-sink/            # Custom sink name
    ├── main.go          # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── main_test.go
```

### 2. Define Component Metadata

Each Sink component needs to export a creator function:

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

// SinkCreator must be exported
func SinkCreator() (string, sink.Sink, *string, []params.Params) {
    return name, &Sink{}, nil, []params.Params{
        {
            Key:          "target",
            DefaultValue: "",
            Required:     true,
            Description:  "Target table name or file path",
        },
    }
}
```

### 3. Implement Sink Interface

#### Basic Implementation Template

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

// Sink implements core.Sink interface
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
            Description:  "SQL table name",
        },
    }
}
```

#### Open Method Implementation

```go
func (s *Sink) Open(config map[string]string, columnMapping map[string]string, dataSource *datasource.Datasource) error {
    // Validate column mapping cannot be empty
    if len(columnMapping) == 0 {
        return fmt.Errorf("sql sink: 'column_mapping' cannot be empty")
    }
    s.columnMapping = columnMapping

    // Get database connection from datasource
    if dataSource != nil {
        db := (*dataSource).Open()
        if dbInstance, ok := db.(*sql.DB); ok {
            s.db = dbInstance
        } else {
            return fmt.Errorf("sql sink: failed to get database connection from datasource")
        }
        s.datasource = dataSource
    }

    // Get table name
    if t, ok := config["table"]; ok && t != "" {
        s.table = t
    } else {
        return fmt.Errorf("sql sink: config is missing required key 'table'")
    }

    // Validate database connection
    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not available")
    }

    return nil
}
```

#### Write Method Implementation (Batch Write)

```go
func (s *Sink) Write(_ string, records []record.Record) error {
    if len(records) == 0 {
        return nil
    }

    if s.db == nil {
        return fmt.Errorf("sql sink: database connection is not open")
    }

    // Start transaction
    tx, err := s.db.Begin()
    if err != nil {
        return fmt.Errorf("sql sink: failed to begin transaction: %w", err)
    }
    defer func(tx *sql.Tx) {
        _ = tx.Rollback()
    }(tx)

    // Prepare SQL columns and placeholders
    dbColumns := make([]string, 0, len(s.columnMapping))
    placeholders := make([]string, 0, len(s.columnMapping))
    recordKeysInOrder := make([]string, 0, len(s.columnMapping))

    for recordKey, dbCol := range s.columnMapping {
        dbColumns = append(dbColumns, "`"+dbCol+"`")
        placeholders = append(placeholders, "?")
        recordKeysInOrder = append(recordKeysInOrder, recordKey)
    }

    // Build INSERT statement
    valuePlaceholderGroup := "(" + strings.Join(placeholders, ", ") + ")"
    allValuePlaceholders := strings.Repeat(valuePlaceholderGroup+",", len(records)-1) + valuePlaceholderGroup

    query := fmt.Sprintf("INSERT INTO `%s` (%s) VALUES %s", s.table, 
        strings.Join(dbColumns, ", "), allValuePlaceholders)

    // Prepare all parameter values
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

    // Execute batch insert
    _, err = tx.Exec(query, args...)
    if err != nil {
        return fmt.Errorf("sql sink: failed to execute batch insert: %w", err)
    }

    // Commit transaction
    return tx.Commit()
}
```

#### Close Method Implementation

```go
func (s *Sink) Close() error {
    return (*s.datasource).Close()
}
```

## Practical Examples

### MySQL Sink (Complete Version)

Based on actual etl-go project MySQL Sink implementation:

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
            Description:  "MySQL table name",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgre(customName, customDatasourceName string) {
    postgreName = customName
    mysqlDatasourceName = customDatasourceName
}

func SinkCreatorPostgre() (string, sink.Sink, *string, []params.Params) {
    return postgreName, &Sink{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "table",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL table name",
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
            Description:  "SQLite table name",
        },
    }
}

// ==================== Core Implementation ====================

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

### CSV File Output Example

```go
package csv

import (
    "encoding/csv"
    "errors"
    "fmt"
    "os"
    
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
            Description:  "CSV file path",
        },
        {
            Key:          "append",
            DefaultValue: "false",
            Required:     false,
            Description:  "Whether to append mode",
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
    
    // Write header
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
    
    // Write data rows
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
```

## Advanced Features

### 1. Batch Size Optimization

```go
// BatchSizeConfigurableSink configurable batch size
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

### 2. Retry Mechanism

```go
// RetrySink with retry mechanism
type RetrySink struct {
    sink       Sink
    maxRetries int
    delayMs    int
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

### 3. Batch Write Monitoring

```go
// MonitoredSink with monitoring
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

## Performance Optimization

### 1. Batch Strategy Optimization

```go
// AdaptiveBatchSizer adaptive batch size adjustment
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
        newSize := currentSize / 2
        if newSize < a.minBatchSize {
            return a.minBatchSize
        }
        return newSize
    } else if avgLatency < a.targetLatencyMs/2 {
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

### 2. Async Writing

```go
// AsyncSink async writing sink
type AsyncSink struct {
    sink       Sink
    bufferCh   chan []record.Record
    workerCh   chan struct{}
    wg         sync.WaitGroup
    bufferSize int
}

func (a *AsyncSink) Start() {
    a.bufferCh = make(chan []record.Record, a.bufferSize)
    
    // Start write worker
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

### 3. Memory Pool Optimization

```go
var batchPool = sync.Pool{
    New: func() interface{} {
        return make([]record.Record, 0, 1000)
    },
}

func (s *YourSink) writeWithPool(records []record.Record) error {
    // Get batch from pool
    batch := batchPool.Get().([]record.Record)
    defer batchPool.Put(batch)
    
    // Copy data to batch
    for _, r := range records {
        batch = append(batch, r)
    }
    
    return s.Write("", batch)
}
```

## Testing

### Unit Tests

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
            name: "valid configuration",
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
            name: "missing table name",
            config: map[string]string{},
            columnMapping: map[string]string{
                "id": "id",
            },
            expectError: true,
            errorMsg:    "table",
        },
        {
            name: "empty column mapping",
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
            err := sink.Open(tt.config, tt.columnMapping, mockDataSource)
            
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
```

## Best Practices

### 1. Error Handling
- Use atomic operations with transactions
- Provide detailed error messages
- Graceful degradation on partial failures

### 2. Performance
- Batch writes to reduce network IO
- Reuse connections efficiently
- Consider async processing for non-critical data
- Cache appropriately

### 3. Consistency
- Use transactions
- Implement retry mechanisms
- Support idempotent operations
- Monitor data consistency

### 4. Observability
- Track metrics (writes, success rate, latency)
- Detailed logging
- Alerting for anomalies

## Common Issues

### 1. Batch Timeout
**Issue**: Large batches timeout during write
**Solution**:
- Reduce batch size
- Increase timeout settings
- Use async writing
- Process in chunks

### 2. Memory Overflow
**Issue**: High memory usage when writing large amounts of data
**Solution**:
- Use streaming processing
- Release buffers promptly
- Control batch size
- Use object pools

### 3. Deadlocks
**Issue**: Deadlocks after long-running operations
**Solution**:
- Avoid nested transactions
- Set reasonable timeouts
- Periodic connection cleanup
- Use connection pool monitoring

### 4. Data Inconsistency
**Issue**: Inconsistent data after write completion
**Solution**:
- Use transactions
- Enable logging
- Implement data validation
- Provide rollback mechanisms

## Debugging Tips

### 1. Enable Detailed Logging

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

s.debugLog("writing batch", map[string]interface{}{
    "batch_size": len(records),
    "table": s.table,
})
```

### 2. Performance Profiling

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
                }).Info("Sink performance stats")
            }
        }()
    }
}
```

## Next Steps

After completing Sink component development, you can:
1. **[Read Executor Component Guide](./develop-component-executor.md)** - Learn about task execution
2. **[Integration Testing](#testing)** - Test full ETL workflows
3. **[Performance Tuning](#best-practices)** - Optimize overall performance
4. **[About etl-go](./about.md)** - Learn about the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*