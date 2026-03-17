---
outline: deep
---

# Processor Component Development

Processor components are the core components in etl-go responsible for data transformation, cleaning, and processing. This document details how to develop custom Processor components, including interface implementation, processing logic, error handling, and performance optimization.

## Processor Component Overview

### Roles and Responsibilities
Processor components are responsible for:
- **Data Transformation**: Type conversion, format conversion, encoding conversion
- **Data Cleaning**: Removing duplicates, correcting errors, filling missing values
- **Data Processing**: Computing derived fields, aggregation statistics, data masking
- **Data Filtering**: Conditional filtering, sampling, sharding
- **Quality Control**: Data validation, quality checks, anomaly detection

### Core Interface
Defined in `etl/core/processor`:
```go
// Processor interface
type Processor interface {
    // Open processor with configuration
    Open(config map[string]string) error
    
    // Process single record
    Process(record Record) (Record, error)
    
    // Handle column information
    HandleColumns(columns *map[string]string)
    
    // Close processor
    Close() error
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/processors/
└── your-processor/       # Custom processor name
    ├── main.go          # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── main_test.go
```

### 2. Define Component Metadata

Each Processor component needs to export a creator function:

```go
package yourprocessor

import (
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
)

var name = "your-processor"

func SetCustomName(customName string) {
    name = customName
}

// ProcessorCreator must be exported
func ProcessorCreator() (string, processor.Processor, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "column",
            DefaultValue: "",
            Required:     true,
            Description:  "Column to process",
        },
        {
            Key:          "type",
            DefaultValue: "string",
            Required:     false,
            Description:  "Target data type",
        },
    }
    
    return name, &Processor{}, paramList
}
```

### 3. Implement Processor Interface

#### Basic Implementation Template

```go
package convertType

import (
    "fmt"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "convertType"

func SetCustomName(customName string) {
    name = customName
}

type Processor struct {
    column string // Column to convert
    toType string // Target data type
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to convert",
        },
        {
            Key:          "type",
            Required:     true,
            DefaultValue: "",
            Description:  "type to convert to",
        },
    }
}

func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("convertType processor: config is missing or has invalid 'column'")
    }
    p.column = column

    toType, ok := config["type"]
    if !ok || toType == "" {
        return fmt.Errorf("convertType processor: config is missing or has invalid 'type'")
    }
    p.toType = toType

    return nil
}
```

#### Process Method Implementation

```go
// Process records processing, converting specified column types
func (p *Processor) Process(record record.Record) (record.Record, error) {
    originalValue, ok := record[p.column]
    if !ok {
        // If column doesn't exist, silently ignore
        return record, nil
    }

    if originalValue == nil {
        // Don't convert nil values
        return record, nil
    }

    var convertedValue interface{}
    var err error

    // Convert to string first, then parse for maximum compatibility
    valStr := fmt.Sprintf("%v", originalValue)

    switch p.toType {
    case "integer", "int":
        convertedValue, err = strconv.ParseInt(valStr, 10, 64)
    case "float", "double":
        convertedValue, err = strconv.ParseFloat(valStr, 64)
    case "string":
        convertedValue = valStr
    case "boolean", "bool":
        // strconv.ParseBool handles "1", "t", "T", "TRUE", "true", "True" etc.
        convertedValue, err = strconv.ParseBool(valStr)
    default:
        return nil, fmt.Errorf("convertType processor: unsupported target type: '%s'", p.toType)
    }

    if err != nil {
        // Return clear error on conversion failure
        return nil, fmt.Errorf("convertType processor: failed to convert value '%v' to type '%s' for column '%s': %w", 
            originalValue, p.toType, p.column, err)
    }

    // Update record with converted value
    record[p.column] = convertedValue
    return record, nil
}
```

#### HandleColumns and Close Methods

```go
func (p *Processor) HandleColumns(columns *map[string]string) {
    // For type conversion processors, columns info typically unchanged
    return
}

func (p *Processor) Close() error {
    // convertType processor is stateless, no cleanup needed
    return nil
}
```

## Practical Examples

### FilterRows Processor (Complete Version)

Based on actual etl-go project filterRows processor implementation:

```go
package filterRows

import (
    "encoding/json"
    "fmt"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "filterRows"

func SetCustomName(customName string) {
    name = customName
}

type Processor struct {
    column   string      // Column to compare
    operator string      // Comparison operator
    value    interface{} // Config value for comparison
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to filter on",
        },
        {
            Key:          "operator",
            Required:     true,
            DefaultValue: "",
            Description:  "comparison operator",
        },
        {
            Key:          "value",
            Required:     true,
            DefaultValue: "",
            Description:  "value to compare against",
        },
    }
}

func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("filterRows processor: config is missing or has invalid 'column'")
    }
    p.column = column

    operator, ok := config["operator"]
    if !ok || operator == "" {
        return fmt.Errorf("filterRows processor: config is missing or has invalid 'operator'")
    }
    p.operator = operator

    value, ok := config["value"]
    if !ok {
        return fmt.Errorf("filterRows processor: config is missing 'value'")
    }
    p.value = value

    return nil
}

func (p *Processor) Process(record record.Record) (record.Record, error) {
    recordVal, ok := record[p.column]
    if !ok {
        // If column doesn't exist, filter out the record
        return nil, nil
    }

    match, err := p.compare(recordVal, p.value)
    if err != nil {
        return nil, fmt.Errorf("filterRows processor: error comparing values for column '%s': %w", p.column, err)
    }

    if match {
        return record, nil // Condition met, keep the record
    }

    return nil, nil // Condition not met, filter out by returning nil
}

// compare implements smart comparison logic, preferring numeric comparison
func (p *Processor) compare(recordValue, configValue interface{}) (bool, error) {
    val1Float, err1 := p.toFloat(recordValue)
    val2Float, err2 := p.toFloat(configValue)

    // If both values can be converted to numbers, do numeric comparison
    if err1 == nil && err2 == nil {
        switch p.operator {
        case "=", "==":
            return val1Float == val2Float, nil
        case "!=", "<>":
            return val1Float != val2Float, nil
        case ">":
            return val1Float > val2Float, nil
        case ">=":
            return val1Float >= val2Float, nil
        case "<":
            return val1Float < val2Float, nil
        case "<=":
            return val1Float <= val2Float, nil
        default:
            return false, fmt.Errorf("unsupported numeric operator: '%s'", p.operator)
        }
    }

    // If numeric comparison fails, do string comparison
    val1Str := fmt.Sprintf("%v", recordValue)
    val2Str := fmt.Sprintf("%v", configValue)

    switch p.operator {
    case "=", "==":
        return val1Str == val2Str, nil
    case "!=", "<>":
        return val1Str != val2Str, nil
    default:
        // For strings, only support equals and not equals
        return false, fmt.Errorf("unsupported string operator: '%s' (only '=', '==', '!=', '<>' are supported)", p.operator)
    }
}

func (p *Processor) toFloat(v interface{}) (float64, error) {
    switch i := v.(type) {
    case float64:
        return i, nil
    case float32:
        return float64(i), nil
    case int:
        return float64(i), nil
    case int64:
        return float64(i), nil
    case json.Number:
        return i.Float64()
    case string:
        return strconv.ParseFloat(i, 64)
    default:
        return 0, fmt.Errorf("cannot convert type %T to float64", v)
    }
}

func (p *Processor) HandleColumns(_ *map[string]string) {
    return
}

func (p *Processor) Close() error {
    return nil
}
```

### MaskData Processor Example

```go
package maskData

import (
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "maskData"

type Processor struct {
    column string
    mask   string
    keep   int
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to mask",
        },
        {
            Key:          "mask",
            DefaultValue: "*",
            Required:     false,
            Description:  "mask character",
        },
        {
            Key:          "keep",
            DefaultValue: "0",
            Required:     false,
            Description:  "number of characters to keep at end",
        },
    }
}

func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("maskData processor: config is missing or has invalid 'column'")
    }
    p.column = column

    mask, ok := config["mask"]
    if !ok || mask == "" {
        p.mask = "*"
    } else {
        p.mask = mask
    }

    keepStr, ok := config["keep"]
    if !ok || keepStr == "" {
        p.keep = 0
    } else {
        if keep, err := strconv.Atoi(keepStr); err == nil && keep >= 0 {
            p.keep = keep
        } else {
            return fmt.Errorf("maskData processor: invalid 'keep' value: %s", keepStr)
        }
    }

    return nil
}

func (p *Processor) Process(record record.Record) (record.Record, error) {
    value, ok := record[p.column]
    if !ok {
        return record, nil
    }

    if value == nil {
        return record, nil
    }

    strValue := fmt.Sprintf("%v", value)
    
    // Calculate masked length
    maskLength := len(strValue) - p.keep
    if maskLength <= 0 {
        maskLength = len(strValue)
    }
    
    // Build masked string
    masked := strings.Repeat(p.mask, maskLength)
    if p.keep > 0 && p.keep < len(strValue) {
        masked += strValue[len(strValue)-p.keep:]
    }
    
    record[p.column] = masked
    return record, nil
}

func (p *Processor) HandleColumns(_ *map[string]string) {
    return
}

func (p *Processor) Close() error {
    return nil
}
```

## Advanced Features

### 1. Batch Processing Optimization

```go
// BatchProcessor enhanced processor supporting batch operations
type BatchProcessor struct {
    baseProcessor processor.Processor
    batchSize     int
    batchBuffer   []record.Record
}

func (b *BatchProcessor) ProcessBatch(records []record.Record) ([]record.Record, error) {
    var results []record.Record
    
    for _, record := range records {
        processed, err := b.baseProcessor.Process(record)
        if err != nil {
            return nil, err
        }
        if processed != nil {
            results = append(results, processed)
        }
    }
    
    return results, nil
}
```

### 2. Chain Processors

```go
// PipelineProcessor chain of processors
type PipelineProcessor struct {
    processors []processor.Processor
}

func (p *PipelineProcessor) Process(record record.Record) (record.Record, error) {
    var err error
    current := record
    
    for _, proc := range p.processors {
        current, err = proc.Process(current)
        if err != nil {
            return nil, err
        }
        if current == nil {
            return nil, nil // Record filtered out
        }
    }
    
    return current, nil
}
```

### 3. Stateful Processing

```go
// StatefulProcessor processor with state management
type StatefulProcessor struct {
    column      string
    state       map[string]interface{}
    windowSize  int
    recentValues []interface{}
}

func (s *StatefulProcessor) Process(record record.Record) (record.Record, error) {
    value, ok := record[s.column]
    if !ok {
        return record, nil
    }
    
    // Update state
    s.updateState(value)
    
    // Calculate result based on state
    result := s.calculateResult()
    record[s.column+"_avg"] = result
    
    return record, nil
}

func (s *StatefulProcessor) updateState(value interface{}) {
    s.recentValues = append(s.recentValues, value)
    if len(s.recentValues) > s.windowSize {
        s.recentValues = s.recentValues[1:]
    }
}

func (s *StatefulProcessor) calculateResult() float64 {
    if len(s.recentValues) == 0 {
        return 0
    }
    
    // Calculate moving average
    sum := 0.0
    count := 0
    for _, val := range s.recentValues {
        if f, err := strconv.ParseFloat(fmt.Sprintf("%v", val), 64); err == nil {
            sum += f
            count++
        }
    }
    
    if count == 0 {
        return 0
    }
    return sum / float64(count)
}
```

## Performance Optimization

### 1. Memory Optimization

```go
// Use object pool to reduce GC pressure
var recordPool = sync.Pool{
    New: func() interface{} {
        return make(record.Record, 10)
    },
}

func (p *Processor) processWithPool(r record.Record) (record.Record, error) {
    // Get from pool
    processed := recordPool.Get().(record.Record)
    
    // Processing logic...
    
    // Return to pool after use
    defer func() {
        // Clear content
        for k := range processed {
            delete(processed, k)
        }
        recordPool.Put(processed)
    }()
    
    return processed, nil
}
```

### 2. Concurrent Processing

```go
// ConcurrentProcessor concurrent processor
type ConcurrentProcessor struct {
    processor    processor.Processor
    workerCount  int
    bufferSize   int
    inputCh      chan record.Record
    outputCh     chan record.Record
    errorCh      chan error
}

func (c *ConcurrentProcessor) Start() {
    c.inputCh = make(chan record.Record, c.bufferSize)
    c.outputCh = make(chan record.Record, c.bufferSize)
    c.errorCh = make(chan error, 1)
    
    // Start multiple worker goroutines
    for i := 0; i < c.workerCount; i++ {
        go c.worker(i)
    }
}

func (c *ConcurrentProcessor) worker(id int) {
    for record := range c.inputCh {
        processed, err := c.processor.Process(record)
        if err != nil {
            select {
            case c.errorCh <- err:
            default:
            }
            break
        }
        
        if processed != nil {
            select {
            case c.outputCh <- processed:
            case <-time.After(1 * time.Second):
                break
            }
        }
    }
}
```

### 3. Caching

```go
// CachedProcessor with caching
type CachedProcessor struct {
    processor processor.Processor
    cache     map[string]interface{}
    cacheSize int
    cacheKeys []string
}

func (c *CachedProcessor) Process(record record.Record) (record.Record, error) {
    // Generate cache key
    cacheKey := c.generateCacheKey(record)
    
    // Check cache
    if cachedResult, ok := c.cache[cacheKey]; ok {
        c.updateCacheAccess(cacheKey)
        record["processed_value"] = cachedResult
        return record, nil
    }
    
    // Process record
    processed, err := c.processor.Process(record)
    if err != nil {
        return nil, err
    }
    
    // Update cache
    if processed != nil {
        c.updateCache(cacheKey, processed["processed_value"])
    }
    
    return processed, nil
}

func (c *CachedProcessor) generateCacheKey(record record.Record) string {
    var builder strings.Builder
    for k, v := range record {
        builder.WriteString(k)
        builder.WriteString("=")
        builder.WriteString(fmt.Sprintf("%v", v))
        builder.WriteString("|")
    }
    return builder.String()
}

func (c *CachedProcessor) updateCache(key string, value interface{}) {
    if len(c.cache) >= c.cacheSize {
        oldestKey := c.cacheKeys[0]
        delete(c.cache, oldestKey)
        c.cacheKeys = c.cacheKeys[1:]
    }
    
    c.cache[key] = value
    c.cacheKeys = append(c.cacheKeys, key)
}
```

## Testing

### Unit Tests

```go
package convertType

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestConvertTypeProcessor_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "valid configuration",
            config: map[string]string{
                "column": "age",
                "type":   "integer",
            },
            expectError: false,
        },
        {
            name: "missing column",
            config: map[string]string{
                "type": "integer",
            },
            expectError: true,
            errorMsg:    "column",
        },
        {
            name: "invalid type",
            config: map[string]string{
                "column": "age",
                "type":   "invalid_type",
            },
            expectError: true,
            errorMsg:    "unsupported",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            processor := &Processor{}
            err := processor.Open(tt.config)
            
            if tt.expectError {
                require.Error(t, err)
                if tt.errorMsg != "" {
                    assert.Contains(t, err.Error(), tt.errorMsg)
                }
            } else {
                require.NoError(t, err)
                assert.Equal(t, tt.config["column"], processor.column)
                assert.Equal(t, tt.config["type"], processor.toType)
            }
        })
    }
}

func TestConvertTypeProcessor_Process(t *testing.T) {
    processor := &Processor{
        column: "age",
        toType: "integer",
    }
    
    tests := []struct {
        name     string
        input    record.Record
        expected record.Record
        expectError bool
    }{
        {
            name: "string to integer",
            input: record.Record{"age": "25", "name": "John"},
            expected: record.Record{"age": int64(25), "name": "John"},
        },
        {
            name: "float to integer",
            input: record.Record{"age": 25.5, "name": "Jane"},
            expected: record.Record{"age": int64(25), "name": "Jane"},
        },
        {
            name: "column does not exist",
            input: record.Record{"name": "Bob"},
            expected: record.Record{"name": "Bob"},
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := processor.Process(tt.input)
            
            if tt.expectError {
                require.Error(t, err)
            } else {
                require.NoError(t, err)
                assert.Equal(t, tt.expected, result)
            }
        })
    }
}
```

## Best Practices

### 1. Error Handling
- Provide detailed error messages
- Classify errors (configuration, processing, data)
- Graceful degradation on partial failures
- Recovery mechanisms and retry logic

### 2. Performance
- Support batch processing
- Use object pools and caches
- Implement concurrent processing
- Lazy initialization

### 3. Maintainability
- Clear interfaces and contracts
- Modular design with loose coupling
- Configuration-driven behavior
- Detailed logging

### 4. Testability
- Depend on interfaces
- Mock support for testing
- Flexible configuration options
- Good test coverage

## Common Issues

### 1. Memory Leaks
**Issue**: Memory grows during long-running operations
**Solution**:
- Use object pools
- Release unused resources promptly
- Clean up caches regularly
- Monitor memory usage

### 2. Performance Bottlenecks
**Issue**: Processor becomes performance bottleneck
**Solution**:
- Implement batch processing
- Use concurrent processing
- Optimize algorithms
- Add caching for expensive operations

### 3. Data Quality Problems
**Issue**: Inconsistent input formats cause failures
**Solution**:
- Implement flexible data validation
- Provide data cleaning functions
- Record data quality metrics
- Support multiple input formats

### 4. Configuration Complexity
**Issue**: Too complex to configure
**Solution**:
- Provide reasonable defaults
- Implement configuration validation
- Provide configuration templates
- Support hot updates

## Debugging Tips

### 1. Enable Debug Logging

```go
func (p *Processor) debugLog(message string, fields map[string]interface{}) {
    if p.config["debug"] == "true" {
        log := logrus.WithField("component", name)
        for k, v := range fields {
            log = log.WithField(k, v)
        }
        log.Debug(message)
    }
}

p.debugLog("processing record", map[string]interface{}{
    "record_id": record["id"],
    "column":    p.column,
})
```

### 2. Performance Monitoring

```go
func (p *Processor) enableMonitoring() {
    if p.config["monitor"] == "true" {
        go func() {
            ticker := time.NewTicker(30 * time.Second)
            defer ticker.Stop()
            
            for range ticker.C {
                var m runtime.MemStats
                runtime.ReadMemStats(&m)
                
                logrus.WithFields(logrus.Fields{
                    "alloc":       m.Alloc,
                    "records_processed": p.stats.RecordsProcessed,
                    "processing_time":   p.stats.TotalProcessingTime,
                }).Info("Processor performance stats")
            }
        }()
    }
}
```

## Next Steps

After completing Processor component development, you can:
1. **[Read Output Component Guide](./develop-component-sink.md)** - Learn about data writing
2. **[Integration Testing](#testing)** - Test full ETL workflows
3. **[Performance Tuning](#best-practices)** - Optimize overall performance
4. **[About etl-go](./about.md)** - Learn about the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*