---
outline: deep
---

# Data Input Component Development

Data input components (Source) are the core components in etl-go responsible for extracting data from various data sources. This document details how to develop custom data input components, including interface implementation, data extraction, error handling, and performance optimization.

## Data Input Component Overview

### Roles and Responsibilities
Data input components are responsible for:
- **Data Extraction**: Reading data from databases, files, APIs, etc.
- **Data Parsing**: Converting raw data into unified record format
- **Batch Processing**: Supporting batch reading for large datasets
- **Exception Handling**: Handling various exceptions during reading
- **Resource Management**: Managing data source connections and resource release

### Core Interface
Defined in `etl/core/source`:
```go
// Data input interface
type Source interface {
    // Open data source
    Open(config map[string]string, dataSource *datasource.Datasource) error
    
    // Read single record
    Read() (record.Record, error)
    
    // Get column information
    Column() map[string]string
    
    // Close data source
    Close() error
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/sources/
└── your-source/           # Custom data input name
    ├── source.go         # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── source_test.go
```

### 2. Define Component Metadata

Each data input component needs to export one or more creator functions:

```go
package yoursource

import (
    "github.com/BernardSimon/etl-go/etl/core/source"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// Component name and corresponding data source name
var sourceName = "your-source"
var datasourceName = "your-datasource"

// Set custom name (optional)
func SetCustomName(customSourceName, customDatasourceName string) {
    sourceName = customSourceName
    datasourceName = customDatasourceName
}

// Creator function - must be exported
func SourceCreator() (string, source.Source, *string, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "query",
            DefaultValue: "",
            Required:     true,
            Description:  "Data query statement or file path",
        },
        {
            Key:          "batchSize",
            DefaultValue: "1000",
            Required:     false,
            Description:  "Batch read size",
        },
        // More parameters...
    }
    
    return sourceName, &Source{}, &datasourceName, paramList
}
```

### 3. Implement Data Input Interface

#### Basic Implementation Template
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

// Source struct definition
type Source struct {
    db          *sql.DB              // Database connection (if applicable)
    rows        *sql.Rows            // Query result set
    datasource  *datasource.Datasource // Data source reference
    columnNames []string             // Column name list
    config      map[string]string    // Configuration information
    stats       SourceStats          // Statistics information
    batchBuffer []record.Record      // Batch buffer
    batchSize   int                  // Batch size
}

// SourceStats statistics information
type SourceStats struct {
    TotalReadCount    int64           // Total read record count
    FailedReadCount   int64           // Failed read count
    LastReadTime      time.Time       // Last read time
    TotalReadTime     time.Duration   // Total read time
    AverageReadTime   time.Duration   // Average read time
}
```

#### Open Method Implementation
```go
// Open data source
func (s *Source) Open(config map[string]string, dataSource *datasource.Datasource) error {
    s.config = config
    s.datasource = dataSource
    
    // Validate required parameters
    if err := s.validateConfig(); err != nil {
        return fmt.Errorf("configuration validation failed: %w", err)
    }
    
    // Initialize statistics
    s.stats = SourceStats{}
    
    // Set batch size
    s.batchSize = 1000 // Default value
    if batchSizeStr, ok := config["batchSize"]; ok && batchSizeStr != "" {
        if batchSize, err := strconv.Atoi(batchSizeStr); err == nil && batchSize > 0 {
            s.batchSize = batchSize
        }
    }
    
    // Initialize batch buffer
    s.batchBuffer = make([]record.Record, 0, s.batchSize)
    
    // Establish connection or open file
    if err := s.connect(); err != nil {
        return fmt.Errorf("failed to connect to data source: %w", err)
    }
    
    return nil
}

// validateConfig validate configuration
func (s *Source) validateConfig() error {
    // Check required parameters
    if query, ok := s.config["query"]; !ok || query == "" {
        return errors.New("required parameter 'query' not provided")
    }
    
    // Validate batch size
    if batchSizeStr, ok := s.config["batchSize"]; ok && batchSizeStr != "" {
        if batchSize, err := strconv.Atoi(batchSizeStr); err != nil || batchSize <= 0 {
            return fmt.Errorf("batch size must be a positive integer, current value: %s", batchSizeStr)
        }
    }
    
    return nil
}

// connect establish connection or open file
func (s *Source) connect() error {
    // Get query statement
    query := s.config["query"]
    
    // Execute different connection logic based on data source type
    switch datasourceType := (*s.datasource).(type) {
    case *sql.DB:
        // Database type data source
        s.db = datasourceType
        
        // Execute query
        var err error
        s.rows, err = s.db.Query(query)
        if err != nil {
            return fmt.Errorf("failed to execute query: %w", err)
        }
        
        // Get column names
        s.columnNames, err = s.rows.Columns()
        if err != nil {
            return fmt.Errorf("failed to get column names from result set: %w", err)
        }
        
    case string:
        // File path type data source
        filePath := datasourceType
        return s.openFile(filePath, query)
        
    default:
        return errors.New("unsupported data source type")
    }
    
    return nil
}
```

#### Read Method Implementation
```go
// Read single record
func (s *Source) Read() (record.Record, error) {
    startTime := time.Now()
    
    // First try to read from batch buffer
    if len(s.batchBuffer) > 0 {
        record := s.batchBuffer[0]
        s.batchBuffer = s.batchBuffer[1:]
        
        s.updateStats(startTime, true)
        return record, nil
    }
    
    // Batch buffer empty, read new batch from data source
    if err := s.readNextBatch(); err != nil {
        s.updateStats(startTime, false)
        return nil, err
    }
    
    // Try to read from batch buffer again
    if len(s.batchBuffer) > 0 {
        record := s.batchBuffer[0]
        s.batchBuffer = s.batchBuffer[1:]
        
        s.updateStats(startTime, true)
        return record, nil
    }
    
    // No more data
    s.updateStats(startTime, false)
    return nil, io.EOF
}

// readNextBatch read next batch
func (s *Source) readNextBatch() error {
    s.batchBuffer = s.batchBuffer[:0] // Clear buffer
    
    // Execute different reading logic based on data source type
    if s.rows != nil {
        return s.readBatchFromDatabase()
    } else {
        return s.readBatchFromFile()
    }
}

// readBatchFromDatabase read batch from database
func (s *Source) readBatchFromDatabase() error {
    count := 0
    
    for count < s.batchSize && s.rows.Next() {
        // Scan row data
        record, err := s.scanRow()
        if err != nil {
            return fmt.Errorf("failed to scan row data: %w", err)
        }
        
        s.batchBuffer = append(s.batchBuffer, record)
        count++
    }
    
    // Check for errors
    if err := s.rows.Err(); err != nil {
        return fmt.Errorf("error occurred during reading: %w", err)
    }
    
    // If no data read and no more rows, return EOF
    if count == 0 {
        return io.EOF
    }
    
    return nil
}

// scanRow scan single row data
func (s *Source) scanRow() (record.Record, error) {
    // Use generic method to handle various data types
    values := make([]sql.RawBytes, len(s.columnNames))
    scanArgs := make([]interface{}, len(values))
    
    for i := range values {
        scanArgs[i] = &values[i]
    }
    
    // Scan data
    if err := s.rows.Scan(scanArgs...); err != nil {
        return nil, fmt.Errorf("scan failed: %w", err)
    }
    
    // Build record
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

// updateStats update statistics
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

#### Column Method Implementation
```go
// Column get column information
func (s *Source) Column() map[string]string {
    columns := make(map[string]string)
    
    for _, colName := range s.columnNames {
        columns[colName] = colName
    }
    
    return columns
}
```

#### Close Method Implementation
```go
// Close data source
func (s *Source) Close() error {
    var errs []error
    
    // Close result set
    if s.rows != nil {
        if err := s.rows.Close(); err != nil {
            errs = append(errs, fmt.Errorf("failed to close result set: %w", err))
        }
    }
    
    // Close data source connection
    if s.datasource != nil {
        if err := (*s.datasource).Close(); err != nil {
            errs = append(errs, fmt.Errorf("failed to close data source: %w", err))
        }
    }
    
    // Clean buffer
    s.batchBuffer = nil
    
    // Record shutdown statistics
    s.recordShutdownStats()
    
    // Return all errors
    return errors.Join(errs...)
}

// recordShutdownStats record shutdown statistics
func (s *Source) recordShutdownStats() {
    logrus.WithFields(logrus.Fields{
        "component":       sourceName,
        "total_read":      s.stats.TotalReadCount,
        "failed_read":     s.stats.FailedReadCount,
        "avg_read_time":   s.stats.AverageReadTime,
        "total_read_time": s.stats.TotalReadTime,
    }).Info("Data input component shutdown statistics")
}
```

## Practical Examples

### SQL Data Input Component Example
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

// Source implements core.Source interface
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
            Description:  "SQL query statement",
        },
    }
    
    return mysqlName, &Source{}, &mysqlDatasourceName, paramList
}

func (s *Source) Open(config map[string]string, dataSource *datasource.Datasource) error {
    s.datasource = dataSource
    
    // Validate query statement
    query, ok := config["query"]
    if !ok || query == "" {
        return fmt.Errorf("sql source: config is missing or has invalid 'query'")
    }
    
    // Get database connection
    var err error
    s.db = (*dataSource).Open().(*sql.DB)
    
    // Execute query
    s.rows, err = s.db.Query(query)
    if err != nil {
        return fmt.Errorf("sql source: failed to executor query: %w", err)
    }
    
    // Get column names
    s.columnNames, err = s.rows.Columns()
    if err != nil {
        return fmt.Errorf("sql source: failed to get column names from result set: %w", err)
    }
    
    return nil
}

func (s *Source) Read() (record.Record, error) {
    // Check if there's next row
    if !s.rows.Next() {
        // Check for errors during iteration
        if err := s.rows.Err(); err != nil {
            return nil, fmt.Errorf("sql source: error during row iteration: %w", err)
        }
        // No more data
        return nil, io.EOF
    }
    
    // Prepare scan parameters
    values := make([]sql.RawBytes, len(s.columnNames))
    scanArgs := make([]interface{}, len(values))
    for i := range values {
        scanArgs[i] = &values[i]
    }
    
    // Scan row data
    if err := s.rows.Scan(scanArgs...); err != nil {
        return nil, fmt.Errorf("sql source: failed to scan row: %w", err)
    }
    
    // Build record
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
    
    // Close result set
    if s.rows != nil {
        if err := s.rows.Close(); err != nil {
            errs = append(errs, fmt.Errorf("sql source: failed to close rows: %w", err))
        }
    }
    
    // Close database connection
    err := (*s.datasource).Close()
    if err != nil {
        errs = append(errs, fmt.Errorf("sql source: failed to close db: %w", err))
    }
    
    return errors.Join(errs...)
}
```

### CSV Data Input Component Example
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
            Description:  "CSV file path",
        },
        {
            Key:          "hasHeader",
            DefaultValue: "true",
            Required:     false,
            Description:  "Whether includes header",
        },
        {
            Key:          "delimiter",
            DefaultValue: ",",
            Required:     false,
            Description:  "Delimiter",
        },
    }
    
    return csvName, &CSVSource{}, nil, paramList
}

func (c *CSVSource) Open(config map[string]string, dataSource *datasource.Datasource) error {
    c.config = config
    c.datasource = dataSource
    
    // Get file path
    filePath, ok := config["filePath"]
    if !ok || filePath == "" {
        return fmt.Errorf("csv source: filePath is required")
    }
    
    // Open file
    file, err := os.Open(filePath)
    if err != nil {
        return fmt.Errorf("csv source: failed to open file: %w", err)
    }
    c.file = file
    
    // Create CSV reader
    c.reader = csv.NewReader(c.file)
    
    // Set delimiter
    if delimiter, ok := config["delimiter"]; ok && delimiter != "" {
        if len(delimiter) == 1 {
            c.reader.Comma = rune(delimiter[0])
        }
    }
    
    // Read header
    if hasHeader, ok := config["hasHeader"]; !ok || hasHeader == "true" {
        headers, err := c.reader.Read()
        if err != nil {
            return fmt.Errorf("csv source: failed to read header: %w", err)
        }
        c.columnNames = headers
    } else {
        // If no header, generate default column names
        // First read a row to get column count
        sample, err := c.reader.Read()
        if err != nil {
            return fmt.Errorf("csv source: failed to read sample row: %w", err)
        }
        
        // Reset file pointer
        c.file.Seek(0, 0)
        c.reader = csv.NewReader(c.file)
        
        // Generate column names
        c.columnNames = make([]string, len(sample))
        for i := range c.columnNames {
            c.columnNames[i] = fmt.Sprintf("column_%d", i+1)
        }
    }
    
    return nil
}

func (c *CSVSource) Read() (record.Record, error) {
    // Read a row
    row, err := c.reader.Read()
    if err != nil {
        if err == io.EOF {
            return nil, io.EOF
        }
        return nil, fmt.Errorf("csv source: failed to read row: %w", err)
    }
    
    // Build record
    r := make(record.Record)
    for i, colName := range c.columnNames {
        if i < len(row) {
            // Try to convert data type
            value, err := c.convertValue(row[i])
            if err == nil {
                r[colName] = value
            } else {
                r[colName] = row[i] // Keep string format
            }
        } else {
            r[colName] = nil
        }
    }
    
    return r, nil
}

func (c *CSVSource) convertValue(str string) (interface{}, error) {
    // Try to convert to integer
    if i, err := strconv.ParseInt(str, 10, 64); err == nil {
        return i, nil
    }
    
    // Try to convert to float
    if f, err := strconv.ParseFloat(str, 64); err == nil {
        return f, nil
    }
    
    // Try to convert to boolean
    if b, err := strconv.ParseBool(str); err == nil {
        return b, nil
    }
    
    // Keep string format
    return str, fmt.Errorf("cannot convert to basic type")
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

## Advanced Features Implementation

### 1. Batch Reading Optimization

```go
// BatchSource enhanced source supporting batch reading
type BatchSource struct {
    Source
    batchSize    int
    currentBatch []record.Record
    batchIndex   int
}

func (b *BatchSource) ReadBatch() ([]record.Record, error) {
    if len(b.currentBatch) == 0 {
        // Read new batch
        batch, err := b.fetchNextBatch()
        if err != nil {
            return nil, err
        }
        b.currentBatch = batch
        b.batchIndex = 0
    }
    
    // Return current batch
    return b.currentBatch, nil
}

func (b *BatchSource) fetchNextBatch() ([]record.Record, error) {
    batch := make([]record.Record, 0, b.batchSize)
    
    for i := 0; i < b.batchSize; i++ {
        record, err := b.Source.Read()
        if err != nil {
            if err == io.EOF && len(batch) > 0 {
                return batch, nil // Partial batch
            }
            return nil, err
        }
        batch = append(batch, record)
    }
    
    return batch, nil
}
```

### 2. Data Transformation Pipeline

```go
// TransformSource data source with transformation capability
type TransformSource struct {
    source      source.Source
    transformers []Transformer
}

type Transformer func(record.Record) (record.Record, error)

func (t *TransformSource) Read() (record.Record, error) {
    // Read raw data
    rawRecord, err := t.source.Read()
    if err != nil {
        return nil, err
    }
    
    // Apply transformations
    transformed := rawRecord
    for _, transformer := range t.transformers {
        transformed, err = transformer(transformed)
        if err != nil {
            return nil, fmt.Errorf("transformation failed: %w", err)
        }
    }
    
    return transformed, nil
}

// Example transformer
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

### 3. Progress Tracking

```go
// ProgressSource data source with progress tracking
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
            // Don't block main flow
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

## Test Development

### Unit Tests
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
            name: "Valid configuration",
            config: map[string]string{
                "query": "SELECT * FROM users",
            },
            expectError: false,
        },
        {
            name: "Missing query statement",
            config: map[string]string{
                // Missing query
            },
            expectError: true,
            errorMsg:    "query",
        },
        {
            name: "Empty query statement",
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
            // Need to mock datasource
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
    // Create mock data source and result set
    // Test read functionality
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

## Performance Optimization Guide

### 1. Memory Optimization
```go
// Use object pool to reduce GC pressure
var recordPool = sync.Pool{
    New: func() interface{} {
        return make(record.Record)
    },
}

func (s *Source) readWithPool() (record.Record, error) {
    r := recordPool.Get().(record.Record)
    // Clear existing content
    for k := range r {
        delete(r, k)
    }
    
    // Fill data...
    
    // Return to pool after use
    defer func() {
        // Only return small records
        if len(r) < 100 {
            recordPool.Put(r)
        }
    }()
    
    return r, nil
}
```

### 2. Concurrent Reading
```go
// ConcurrentSource concurrent reading data source
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
    
    // Start multiple worker goroutines
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
            // Timeout handling
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
        return nil, errors.New("read timeout")
    }
}
```

## Best Practices

### 1. Error Handling
- **Detailed error information**: Include context information for debugging
- **Error classification**: Distinguish configuration errors, connection errors, data errors, etc.
- **Graceful degradation**: Continue processing other data when partial failure occurs

### 2. Resource Management
- **Timely release**: Ensure all resources are properly closed
- **Connection reuse**: Make full use of connection pools
- **Memory control**: Control buffer size, avoid memory leaks

### 3. Observability
- **Detailed logging**: Record key operations and performance metrics
- **Monitoring metrics**: Expose read speed, success rate and other metrics
- **Tracing support**: Support distributed tracing

### 4. Testability
- **Interface design**: Depend on interfaces rather than implementations
- **Mock support**: Provide mock implementations for testing
- **Configuration injection**: Control behavior through configuration for easy testing

## Common Issues

### 1. Memory Overflow
**Issue**: High memory usage when reading large amounts of data
**Solution**:
- Use batch reading, control batch size
- Implement streaming processing, don't load all data at once
- Monitor memory usage, release resources promptly

### 2. Poor Read Performance
**Issue**: Slow data reading speed
**Solution**:
- Optimize query statements, use indexes
- Increase batch size, reduce IO operations
- Use concurrent reading to improve throughput

### 3. Inconsistent Data Format
**Issue**: Source data format changes cause read failures
**Solution**:
- Implement flexible data parsing logic
- Provide data validation and transformation functions
- Record data quality metrics for troubleshooting

## Debugging Tips

### 1. Enable Debug Logging
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

// Add debug logs at key positions
s.debugLog("start reading batch", map[string]interface{}{
    "batch_size": s.batchSize,
    "config":     s.config,
})
```

### 2. Performance Profiling
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
                }).Info("Memory statistics")
            }
        }()
    }
}
```

## Next Steps

After completing data input component development, you can:
1. **[Develop Data Processing Components](./develop-component-processor.md)** - Learn how to develop data transformation components
2. **[Integration Testing](#测试开发)** - Ensure components work together with other components
3. **[Performance Tuning](#性能优化指南)** - Optimize component performance

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*