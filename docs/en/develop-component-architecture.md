---
outline: deep
---

# Component Development Architecture

This document details the core architecture, development conventions, and best practices for etl-go component development, helping developers understand and create custom components.

## Component System Overview

etl-go adopts a **plugin-based component architecture**, where all ETL functionality is implemented through components. The component system is divided into six categories:

```
Component System
├── Data Source (DataSource) - Database connection management
├── Data Input (Source) - Data extraction
├── Data Processing (Processor) - Data transformation and cleaning
├── Data Output (Sink) - Data loading and writing
├── Executor (Executor) - Operation execution
└── Variable (Variable) - Dynamic variable calculation
```

## Component Interface Definitions

### 1. Basic Interface

All components implement the basic `Component` interface:

```go
// Component Basic Interface
type Component interface {
    // Initialize component
    Initialize(ctx Context, params Params) error
    
    // Get component name
    GetName() string
    
    // Get component type
    GetType() string
    
    // Get component version
    GetVersion() string
    
    // Validate configuration
    ValidateConfig() error
}
```

### 2. Specific Component Interfaces

#### Data Source Interface (`DataSource`)
```go
type DataSource interface {
    Component
    
    // Establish connection
    Connect() error
    
    // Disconnect
    Disconnect() error
    
    // Get connection object
    GetConnection() interface{}
    
    // Test connection
    TestConnection() error
    
    // Get connection information
    GetConnectionInfo() map[string]interface{}
}
```

#### Data Input Interface (`Source`)
```go
type Source interface {
    Component
    
    // Read data
    Read() ([]Record, error)
    
    // Batch read
    ReadBatch(batchSize int) ([]Record, error)
    
    // Get total record count
    GetTotalCount() (int64, error)
    
    // Close resources
    Close() error
    
    // Get metadata
    GetMetadata() SourceMetadata
}
```

#### Data Processing Interface (`Processor`)
```go
type Processor interface {
    Component
    
    // Process single record
    Process(record Record) (Record, error)
    
    // Batch process
    ProcessBatch(records []Record) ([]Record, error)
    
    // Get processing statistics
    GetStats() ProcessorStats
    
    // Reset state
    Reset() error
}
```

#### Data Output Interface (`Sink`)
```go
type Sink interface {
    Component
    
    // Write single record
    Write(record Record) error
    
    // Batch write
    WriteBatch(records []Record) error
    
    // Commit transaction
    Commit() error
    
    // Rollback transaction
    Rollback() error
    
    // Close resources
    Close() error
}
```

#### Executor Interface (`Executor`)
```go
type Executor interface {
    Component
    
    // Execute operation
    Execute() error
    
    // Get execution result
    GetResult() ExecutorResult
    
    // Validate execution conditions
    Validate() error
    
    // Clean up execution resources
    Cleanup() error
}
```

#### Variable Interface (`Variable`)
```go
type Variable interface {
    Component
    
    // Get variable value
    GetValue() (interface{}, error)
    
    // Refresh variable value
    Refresh() error
    
    // Get variable type
    GetValueType() string
    
    // Check if variable is expired
    IsExpired() bool
}
```

## Component Development Conventions

### 1. Directory Structure Conventions

#### Component Package Structure
```
components/
├── datasource/          # Data source components
│   ├── mysql/          # MySQL data source
│   │   ├── datasource.go
│   │   ├── config.go
│   │   ├── connection.go
│   │   └── go.mod
│   ├── postgre/        # PostgreSQL data source
│   └── sqlite/         # SQLite data source
├── sources/            # Data input components
│   ├── sql/           # SQL query input
│   ├── csv/           # CSV file input
│   └── json/          # JSON file input
├── processors/         # Data processing components
│   ├── convertType/   # Type conversion
│   ├── filterRows/    # Row filtering
│   └── maskData/      # Data masking
├── sinks/             # Data output components
│   ├── sql/          # SQL table output
│   ├── csv/          # CSV file output
│   └── json/         # JSON file output
├── executor/          # Executor components
│   └── sql/          # SQL executor
└── variable/          # Variable components
    └── sql/          # SQL query variable
```

#### Single Component Structure
```
components/datasource/mysql/
├── datasource.go      # Main implementation file (required)
├── config.go          # Configuration definition (optional)
├── connection.go      # Connection management (optional)
├── pool.go           # Connection pool (optional)
├── utils.go          # Utility functions (optional)
├── go.mod           # Module definition (required)
├── README.md        # Component documentation (recommended)
└── test/            # Test files
    ├── datasource_test.go
    └── config_test.go
```

### 2. Naming Conventions

#### File Naming
- Main files: `datasource.go`, `source.go`, `processor.go`, `sink.go`, `executor.go`, `variable.go`
- Config files: `config.go`
- Test files: `*_test.go`

#### Type Naming
- Structs: `MySQLDataSource`, `SQLSource`, `ConvertTypeProcessor`
- Interface implementations: `mysqlDataSource`, `sqlSource`, `convertTypeProcessor`
- Constructor functions: `NewMySQLDataSource`, `NewSQLSource`, `NewConvertTypeProcessor`

#### Function Naming
- Initialization: `Initialize()`
- Resource cleanup: `Close()`, `Cleanup()`
- Data processing: `Process()`, `Transform()`, `Filter()`
- Data I/O: `Read()`, `Write()`, `Load()`, `Save()`

### 3. Configuration Conventions

#### Configuration Structure Definition
```go
// Component base configuration
type BaseConfig struct {
    Name        string                 `json:"name" yaml:"name"`
    Type        string                 `json:"type" yaml:"type"`
    Description string                 `json:"description,omitempty" yaml:"description,omitempty"`
    Enabled     bool                   `json:"enabled" yaml:"enabled"`
    Timeout     int                    `json:"timeout,omitempty" yaml:"timeout,omitempty"`
    Retry       RetryConfig            `json:"retry,omitempty" yaml:"retry,omitempty"`
}

// MySQL data source configuration
type MySQLConfig struct {
    BaseConfig
    Host     string `json:"host" yaml:"host"`
    Port     int    `json:"port" yaml:"port"`
    Username string `json:"username" yaml:"username"`
    Password string `json:"password" yaml:"password"`
    Database string `json:"database" yaml:"database"`
    Charset  string `json:"charset,omitempty" yaml:"charset,omitempty"`
    
    // Connection pool configuration
    MaxOpenConns    int `json:"maxOpenConns,omitempty" yaml:"maxOpenConns,omitempty"`
    MaxIdleConns    int `json:"maxIdleConns,omitempty" yaml:"maxIdleConns,omitempty"`
    ConnMaxLifetime int `json:"connMaxLifetime,omitempty" yaml:"connMaxLifetime,omitempty"`
}
```

#### Configuration Validation
```go
func (c *MySQLConfig) Validate() error {
    if c.Host == "" {
        return errors.New("host is required")
    }
    if c.Port <= 0 || c.Port > 65535 {
        return errors.New("port must be between 1 and 65535")
    }
    if c.Username == "" {
        return errors.New("username is required")
    }
    if c.Database == "" {
        return errors.New("database is required")
    }
    return nil
}
```

### 4. Error Handling Conventions

#### Error Definitions
```go
// Component error types
var (
    ErrConnectionFailed = errors.New("connection failed")
    ErrInvalidConfig    = errors.New("invalid configuration")
    ErrDataReadFailed   = errors.New("data read failed")
    ErrDataWriteFailed  = errors.New("data write failed")
    ErrTimeout          = errors.New("operation timeout")
)

// Contextual error
type ComponentError struct {
    Code    string
    Message string
    Cause   error
    Context map[string]interface{}
}

func (e *ComponentError) Error() string {
    return fmt.Sprintf("%s: %s (code: %s)", e.Message, e.Cause, e.Code)
}

func NewComponentError(code, message string, cause error) *ComponentError {
    return &ComponentError{
        Code:    code,
        Message: message,
        Cause:   cause,
        Context: make(map[string]interface{}),
    }
}
```

#### Error Handling Pattern
```go
func (s *SQLSource) Read() ([]Record, error) {
    // Try to read
    records, err := s.readFromDatabase()
    if err != nil {
        // Wrap error, add context
        return nil, NewComponentError(
            "READ_FAILED",
            "failed to read data from database",
            err,
        ).WithContext("query", s.query).WithContext("params", s.params)
    }
    
    // Validate data
    if err := s.validateRecords(records); err != nil {
        return nil, NewComponentError(
            "VALIDATION_FAILED",
            "data validation failed",
            err,
        )
    }
    
    return records, nil
}
```

### 5. Logging Conventions

#### Log Levels
- `DEBUG`: Detailed debugging information
- `INFO`: General operation information
- `WARN`: Warning information, doesn't affect main functionality
- `ERROR`: Error information, needs attention
- `FATAL`: Critical error, component cannot run

#### Log Format
```go
func (c *MySQLDataSource) Connect() error {
    log := logger.WithFields(logrus.Fields{
        "component": "mysql-datasource",
        "host":      c.config.Host,
        "database":  c.config.Database,
    })
    
    log.Info("connecting to MySQL database")
    
    startTime := time.Now()
    err := c.establishConnection()
    duration := time.Since(startTime)
    
    if err != nil {
        log.WithError(err).Error("failed to connect to MySQL database")
        return err
    }
    
    log.WithField("duration", duration).Info("successfully connected to MySQL database")
    return nil
}
```

## Component Registration Mechanism

### 1. Automatic Registration

#### Using `init()` Function
```go
package mysql

import (
    "github.com/BernardSimon/etl-go/etl/factory"
)

func init() {
    // Register MySQL data source
    factory.RegisterDataSource("mysql", NewMySQLDataSource)
    
    // Register configuration validator
    factory.RegisterConfigValidator("mysql", ValidateMySQLConfig)
}
```

### 2. Manual Registration

#### Register at Application Startup
```go
func main() {
    // Register custom components
    factory.RegisterDataSource("custom", NewCustomDataSource)
    factory.RegisterSource("custom", NewCustomSource)
    factory.RegisterProcessor("custom", NewCustomProcessor)
    
    // Start application
    app.Start()
}
```

### 3. Dynamic Registration

#### Load from Configuration File
```yaml
# components.yaml
components:
  datasource:
    custom-mysql:
      type: mysql
      class: github.com/your-org/custom-mysql-datasource
      config:
        host: localhost
        port: 3306
  processors:
    custom-transform:
      type: transform
      class: github.com/your-org/custom-transform-processor
```

```go
func LoadComponentsFromConfig(configPath string) error {
    config, err := loadConfig(configPath)
    if err != nil {
        return err
    }
    
    for name, compConfig := range config.Components {
        // Dynamically load component
        comp, err := loadComponentDynamic(compConfig)
        if err != nil {
            return err
        }
        
        // Register component
        factory.RegisterComponent(name, comp)
    }
    
    return nil
}
```

## Component Lifecycle

### 1. Lifecycle Stages
```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Create  │────▶│ Initialize │────▶│   Run    │────▶│ Cleanup │
└─────────┘     └──────────┘     └──────────┘     └─────────┘
     │               │                │               │
     ▼               ▼                ▼               ▼
  New()        Initialize()      Process()       Close()
```

### 2. Lifecycle Management

```go
// Lifecycle manager
type LifecycleManager struct {
    components []Component
    state      map[string]ComponentState
}

func (lm *LifecycleManager) InitializeAll() error {
    for _, comp := range lm.components {
        if err := comp.Initialize(); err != nil {
            return fmt.Errorf("failed to initialize component %s: %w", comp.GetName(), err)
        }
        lm.state[comp.GetName()] = StateInitialized
    }
    return nil
}

func (lm *LifecycleManager) CloseAll() error {
    var errors []error
    
    // Close in reverse order for dependency handling
    for i := len(lm.components) - 1; i >= 0; i-- {
        comp := lm.components[i]
        if err := comp.Close(); err != nil {
            errors = append(errors, fmt.Errorf("failed to close component %s: %w", comp.GetName(), err))
        }
        lm.state[comp.GetName()] = StateClosed
    }
    
    if len(errors) > 0 {
        return errors[0] // Return first error
    }
    return nil
}
```

## Component Testing Conventions

### 1. Unit Testing

#### Test File Structure
```go
// datasource_test.go
package mysql

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestMySQLDataSource_Connect(t *testing.T) {
    t.Run("successful connection", func(t *testing.T) {
        // Setup
        config := &MySQLConfig{
            Host:     "localhost",
            Port:     3306,
            Username: "test",
            Password: "test",
            Database: "testdb",
        }
        
        ds := NewMySQLDataSource(config)
        
        // Execute
        err := ds.Connect()
        
        // Assert
        require.NoError(t, err)
        assert.True(t, ds.IsConnected())
    })
    
    t.Run("invalid host", func(t *testing.T) {
        config := &MySQLConfig{
            Host: "invalid-host",
            Port: 3306,
        }
        
        ds := NewMySQLDataSource(config)
        err := ds.Connect()
        
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "connection failed")
    })
}
```

### 2. Integration Testing

```go
func TestMySQLDataSource_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }
    
    // Start test database
    dbContainer := startTestMySQLContainer(t)
    defer dbContainer.Stop()
    
    // Create data source
    ds := NewMySQLDataSource(&MySQLConfig{
        Host:     dbContainer.Host(),
        Port:     dbContainer.Port(),
        Username: "root",
        Password: "test",
        Database: "testdb",
    })
    
    // Test connection
    require.NoError(t, ds.Connect())
    defer ds.Disconnect()
    
    // Test query
    conn := ds.GetConnection().(*sql.DB)
    rows, err := conn.Query("SELECT 1")
    require.NoError(t, err)
    defer rows.Close()
    
    // Verify result
    var result int
    require.True(t, rows.Next())
    require.NoError(t, rows.Scan(&result))
    assert.Equal(t, 1, result)
}
```

## Performance Optimization Guide

### 1. Connection Pool Optimization

```go
type OptimizedConnectionPool struct {
    pool      *sql.DB
    stats     PoolStats
    lastReset time.Time
}

func (p *OptimizedConnectionPool) Get() (*sql.Conn, error) {
    // Check if connection pool needs reset
    if time.Since(p.lastReset) > resetInterval {
        p.resetIdleConnections()
    }
    
    // Get connection
    ctx, cancel := context.WithTimeout(context.Background(), acquireTimeout)
    defer cancel()
    
    conn, err := p.pool.Conn(ctx)
    if err != nil {
        p.stats.AcquireErrors++
        return nil, err
    }
    
    p.stats.ActiveConnections++
    return conn, nil
}
```

### 2. Batch Processing Optimization

```go
type BatchProcessor struct {
    batchSize int
    buffer    []Record
    processor Processor
}

func (bp *BatchProcessor) Process(record Record) (Record, error) {
    bp.buffer = append(bp.buffer, record)
    
    if len(bp.buffer) >= bp.batchSize {
        return bp.flush()
    }
    
    return record, nil
}

func (bp *BatchProcessor) flush() (Record, error) {
    if len(bp.buffer) == 0 {
        return nil, nil
    }
    
    // Batch processing
    results, err := bp.processor.ProcessBatch(bp.buffer)
    if err != nil {
        return nil, err
    }
    
    // Clear buffer
    bp.buffer = bp.buffer[:0]
    
    // Return last result
    if len(results) > 0 {
        return results[len(results)-1], nil
    }
    
    return nil, nil
}
```

## Component Development Process

### 1. Development Steps

1. **Requirement Analysis**: Determine component functionality and interface
2. **Interface Design**: Define component interface and configuration structure
3. **Core Implementation**: Write component main logic
4. **Add Tests**: Write unit tests and integration tests
5. **Documentation**: Add usage instructions and examples
6. **Code Review**: Submit code for review
7. **Integration Testing**: Test in complete environment
8. **Release Deployment**: Release component to repository

### 2. Code Template

#### Component Template
```go
// Component Description: Briefly describe component functionality
// Author: Your Name
// Version: 1.0.0
// Created: 2026-03-17

package customcomponent

import (
    "errors"
    "fmt"
    "time"
    
    "github.com/BernardSimon/etl-go/etl/core"
    "github.com/BernardSimon/etl-go/etl/factory"
)

// Component configuration
type CustomConfig struct {
    core.BaseConfig
    // Add custom configuration fields
    CustomField string `json:"customField" yaml:"customField"`
}

// Component implementation
type CustomComponent struct {
    config *CustomConfig
    state  ComponentState
    stats  ComponentStats
}

// Create new instance
func NewCustomComponent(config *CustomConfig) (*CustomComponent, error) {
    // Validate configuration
    if err := config.Validate(); err != nil {
        return nil, err
    }
    
    return &CustomComponent{
        config: config,
        state:  StateCreated,
        stats:  ComponentStats{},
    }, nil
}

// Initialize component
func (c *CustomComponent) Initialize(ctx core.Context, params core.Params) error {
    c.state = StateInitializing
    
    // Initialization logic
    // ...
    
    c.state = StateInitialized
    return nil
}

// Main processing logic
func (c *CustomComponent) Process(record core.Record) (core.Record, error) {
    c.stats.ProcessedCount++
    startTime := time.Now()
    
    // Processing logic
    // ...
    
    c.stats.LastProcessTime = time.Since(startTime)
    return record, nil
}

// Close component
func (c *CustomComponent) Close() error {
    c.state = StateClosing
    
    // Cleanup logic
    // ...
    
    c.state = StateClosed
    return nil
}

// Register component
func init() {
    factory.RegisterProcessor("custom", func() core.Processor {
        return &CustomComponent{}
    })
}
```

## Best Practices

### 1. Design Principles
- **Single Responsibility**: Each component does one thing
- **Open-Closed Principle**: Open for extension, closed for modification
- **Dependency Inversion**: Depend on abstractions, not implementations
- **Interface Segregation**: Use small, focused interfaces

### 2. Performance Considerations
- Use connection pools for database connections
- Implement batch processing to reduce I/O operations
- Set reasonable buffer sizes
- Monitor memory usage, avoid leaks

### 3. Maintainability
- Write clear documentation and comments
- Use meaningful variable and function names
- Keep code simple, avoid over-engineering
- Regular refactoring to maintain code quality

## Next Steps

After understanding component development architecture, you can:
1. **[Develop Data Source Components](./develop-component-datasource.md)** - Learn data source component development
2. **[Develop Data Input Components](./develop-component-source.md)** - Learn data extraction component development
3. **[Develop Data Processing Components](./develop-component-processor.md)** - Learn data transformation component development
4. **[Develop Data Output Components](./develop-component-sink.md)** - Learn data loading component development
5. **[Develop Executor Components](./develop-component-executor.md)** - Learn executor component development
6. **[Develop Variable Components](./develop-component-variable.md)** - Learn variable component development

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*