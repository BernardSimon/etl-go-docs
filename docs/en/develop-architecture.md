---
outline: deep
---

# Code Architecture

This document provides an in-depth analysis of etl-go's overall architecture design, including core modules, data flow, concurrency model, and key design decisions.

## Architecture Overview

etl-go adopts a **layered modular architecture**, where layers communicate through well-defined interfaces. The overall architecture is as follows:

```
┌─────────────────────────────────────────────────┐
│              Web Interface (Vue.js)             │
├─────────────────────────────────────────────────┤
│           RESTful API (Gin Framework)           │
├─────────────────────────────────────────────────┤
│     Business Logic Layer (Task Scheduling,      │
│              Component Management)              │
├─────────────────────────────────────────────────┤
│          ETL Engine Layer (Pipeline Execution)  │
├─────────────────────────────────────────────────┤
│      Component Layer (Data Source, Extraction,  │
│              Processing, Loading)               │
├─────────────────────────────────────────────────┤
│       Data Access Layer (GORM + SQLite/MySQL)   │
└─────────────────────────────────────────────────┘
```

## Core Modules Detailed

### 1. ETL Engine Layer (`etl/`)

#### 1.1 Core Interfaces (`etl/core/`)
Define unified interface specifications for all ETL components:

```go
// Data Source Interface
type DataSource interface {
    Connect() error
    Disconnect() error
    GetConnection() interface{}
}

// Data Extraction Interface
type Source interface {
    Initialize(ctx Context, params Params) error
    Read() ([]Record, error)
    Close() error
}

// Data Processing Interface
type Processor interface {
    Initialize(ctx Context, params Params) error
    Process(records []Record) ([]Record, error)
}

// Data Loading Interface
type Sink interface {
    Initialize(ctx Context, params Params) error
    Write(records []Record) error
    Close() error
}

// Executor Interface
type Executor interface {
    Initialize(ctx Context, params Params) error
    Execute() error
}

// Variable Interface
type Variable interface {
    Initialize(ctx Context, params Params) error
    GetValue() (interface{}, error)
}
```

#### 1.2 Factory Pattern (`etl/factory/`)
Unified management of component creation and registration:

```go
// Component Registration
factory.RegisterDataSource("mysql", NewMySQLDataSource)
factory.RegisterSource("sql", NewSQLSource)
factory.RegisterProcessor("convertType", NewConvertTypeProcessor)

// Component Creation
source := factory.CreateSource("sql", params)
```

#### 1.3 Pipeline Engine (`etl/pipeline/`)
Concurrent execution model based on Go goroutines and channels:

```go
// Pipeline Definition
pipeline := NewPipeline()
pipeline.AddStage("source", sourceComponent)
pipeline.AddStage("processor", processorComponent)
pipeline.AddStage("sink", sinkComponent)

// Execute Pipeline
result := pipeline.Execute(context)
```

### 2. Component Layer (`components/`)

#### 2.1 Data Source Components (`datasource/`)
- `mysql/`: MySQL database connection
- `postgre/`: PostgreSQL database connection
- `sqlite/`: SQLite database connection
- `doris/`: Doris database connection

#### 2.2 Data Extraction Components (`sources/`)
- `sql/`: SQL query data extraction
- `csv/`: CSV file data extraction
- `json/`: JSON file data extraction

#### 2.3 Data Processing Components (`processors/`)
- `convertType/`: Data type conversion
- `filterRows/`: Row data filtering
- `maskData/`: Data masking
- `renameColumn/`: Column renaming
- `selectColumns/`: Column selection

#### 2.4 Data Loading Components (`sinks/`)
- `sql/`: SQL table data loading
- `csv/`: CSV file output
- `json/`: JSON file output
- `doris/`: Doris fast loading

#### 2.5 Executor Components (`executor/`)
- `sql/`: SQL statement executor

#### 2.6 Variable Components (`variable/`)
- `sql/`: SQL query variable

### 3. Service Layer (`server/`)

#### 3.1 API Layer (`api/`)
RESTful API based on Gin framework:
- `login.go`: User authentication
- `dataSource.go`: Data source management
- `task.go`: Task management
- `variable.go`: Variable management
- `file.go`: File management

#### 3.2 Data Models (`model/`)
Data table structures defined using GORM:
```go
type DataSource struct {
    gorm.Model
    Name     string `gorm:"type:varchar(100);not null"`
    Type     string `gorm:"type:varchar(50);not null"`
    Config   string `gorm:"type:text"`
    IsActive bool   `gorm:"default:true"`
}

type Task struct {
    gorm.Model
    Name        string `gorm:"type:varchar(100);not null"`
    Description string `gorm:"type:text"`
    Config      string `gorm:"type:text"`
    Status      string `gorm:"type:varchar(20);default:'draft'"`
    Schedule    string `gorm:"type:varchar(100)"`
}
```

#### 3.3 Task Scheduling (`task/`)
Task scheduler based on cron expressions:
```go
scheduler := NewScheduler()
scheduler.AddTask("* * * * *", task.Execute)
scheduler.Start()
```

### 4. Web Interface Layer (`web/`)
- **Tech Stack**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **UI Components**: Element Plus
- **Build Tool**: Vite

## Data Flow Design

### Standard ETL Data Flow
```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐
│ Executor│───▶│  Source  │───▶│ Processor│───▶│ Sink │
└─────────┘    └──────────┘    └──────────┘    └──────┘
     │              │               │              │
     ▼              ▼               ▼              ▼
Pre-processing  Data Extraction  Data Transformation  Data Loading
```

### Concurrent Processing Model
etl-go uses **Producer-Consumer Pattern** for high-concurrency data processing:

```go
// Data Channel
dataChan := make(chan Record, bufferSize)

// Producer Goroutine (Data Extraction)
go func() {
    for {
        records, err := source.Read()
        if err != nil {
            close(dataChan)
            break
        }
        for _, record := range records {
            dataChan <- record
        }
    }
}()

// Consumer Goroutine (Data Processing and Loading)
go func() {
    for record := range dataChan {
        processed := processor.Process(record)
        sink.Write(processed)
    }
}()
```

### Error Handling Mechanism
```go
type ErrorHandler struct {
    RetryCount    int
    RetryInterval time.Duration
    ErrorCallback func(error)
}

func (h *ErrorHandler) Handle(err error, operation string) {
    for i := 0; i < h.RetryCount; i++ {
        if h.tryOperation(operation) {
            return
        }
        time.Sleep(h.RetryInterval)
    }
    h.ErrorCallback(err)
}
```

## Key Design Decisions

### 1. Plugin Architecture
**Decision**: Adopt plugin design, separating core engine from implementations
**Advantages**:
- Easy to extend new functionality
- Components can be developed and tested independently
- Supports hot swapping

### 2. Interface-Driven Design
**Decision**: All components define behavior through interfaces
**Advantages**:
- Improves code testability
- Reduces coupling between modules
- Supports polymorphic implementations

### 3. Channels and Goroutines
**Decision**: Use Go's native concurrency model
**Advantages**:
- Efficient memory usage
- Naturally concurrent-safe
- Clean code structure

### 4. Factory Pattern
**Decision**: Use factory pattern to manage component lifecycle
**Advantages**:
- Unified component creation logic
- Supports dynamic component loading
- Simplifies configuration management

### 5. Configuration-Driven
**Decision**: Store task configurations in database
**Advantages**:
- Supports dynamic task adjustments
- Configuration version management
- Easy monitoring and auditing

## Security Design

### 1. Authentication and Authorization
- **JWT Token**: Token-based authentication
- **Role Permissions**: Fine-grained access control
- **Session Management**: Secure session storage

### 2. Data Security
- **AES Encryption**: Encrypted storage of sensitive configuration
- **SQL Injection Protection**: Parameterized queries and input validation
- **File Security**: Upload file type and size restrictions

### 3. Network Security
- **HTTPS Support**: Mandatory HTTPS in production
- **CORS Configuration**: Controlled Cross-Origin Resource Sharing
- **Rate Limiting**: API access frequency limiting

## Performance Optimization

### 1. Connection Pool Management
```go
type ConnectionPool struct {
    maxConnections int
    idleTimeout    time.Duration
    connections    chan *Connection
}

func (p *ConnectionPool) Get() (*Connection, error) {
    select {
    case conn := <-p.connections:
        return conn, nil
    case <-time.After(p.idleTimeout):
        return p.createNewConnection()
    }
}
```

### 2. Batch Processing
```go
// Batch Reading
const batchSize = 1000
for {
    records, err := source.ReadBatch(batchSize)
    if err != nil || len(records) == 0 {
        break
    }
    // Batch Processing
    processed := processor.ProcessBatch(records)
    // Batch Writing
    sink.WriteBatch(processed)
}
```

### 3. Memory Optimization
- **Stream Processing**: Avoid loading all data at once
- **Object Pool**: Reuse objects to reduce GC pressure
- **Memory Monitoring**: Real-time memory usage monitoring

## Extensibility Design

### 1. Custom Component Development
```go
// 1. Implement Interface
type CustomProcessor struct {
    // Implement Processor interface
}

// 2. Register Component
func init() {
    factory.RegisterProcessor("custom", NewCustomProcessor)
}
```

### 2. Plugin System
Support dynamic loading of external plugins:
```go
plugin, err := plugin.Open("custom-plugin.so")
if err != nil {
    log.Fatal(err)
}

symbol, err := plugin.Lookup("NewProcessor")
if err != nil {
    log.Fatal(err)
}

newProcessor := symbol.(func() Processor)
factory.RegisterProcessor("custom", newProcessor)
```

### 3. Configuration Extension
Support custom configuration formats and validation:
```go
type ConfigValidator interface {
    Validate(config interface{}) error
    GetDefaults() interface{}
}
```

## Deployment Architecture

### Single Machine Deployment
```
                   ┌─────────────┐
                   │   Client    │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   Nginx     │
                   │ (Reverse Proxy) │
                   └──────┬──────┘
                          │
┌─────────────────┬───────▼───────┬─────────────────┐
│                 │               │                 │
│  Static Files   │   API Service │    Database     │
│ (Frontend Build)│   (etl-go)    │   (SQLite)      │
│                 │               │                 │
└─────────────────┴───────────────┴─────────────────┘
```

### Distributed Deployment
```
┌─────────────────────────────────────────────────┐
│              Load Balancer (Nginx)              │
└──────────────┬────────────────┬─────────────────┘
               │                │
    ┌──────────▼────┐   ┌───────▼────────┐
    │  API Server 1  │   │  API Server 2   │
    └───────┬───────┘   └───────┬────────┘
            │                    │
    ┌───────▼────────────────────▼────────┐
    │      Shared Storage (Redis/MySQL)    │
    └─────────────────────────────────────┘
```

## Monitoring and Logging

### 1. Monitoring Metrics
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Task execution count, success rate, duration
- **Performance Metrics**: Throughput, response time, concurrency

### 2. Logging System
```go
type Logger struct {
    zap.Logger
    // Structured Logging
    Info(msg string, fields ...zap.Field)
    Error(msg string, fields ...zap.Field)
    // Context Logging
    With(fields ...zap.Field) *Logger
}
```

### 3. Alert Mechanism
- **Threshold Alerts**: Resource usage exceeds thresholds
- **Error Alerts**: Task execution failures
- **Performance Alerts**: Long response times

## Best Practices

### 1. Code Organization
```
etl-go/
├── cmd/          # Command line entry points
├── internal/     # Internal packages (not exposed)
├── pkg/          # Public packages (available externally)
├── api/          # API definitions
├── config/       # Configuration management
└── docs/         # Documentation
```

### 2. Error Handling
```go
// Use errors.Wrap to add context
func processData() error {
    data, err := readData()
    if err != nil {
        return errors.Wrap(err, "failed to read data")
    }
    
    result, err := transformData(data)
    if err != nil {
        return errors.Wrap(err, "failed to transform data")
    }
    
    return nil
}
```

### 3. Testing Strategy
- **Unit Tests**: Test individual functions or methods
- **Integration Tests**: Test integration between modules
- **End-to-End Tests**: Test complete workflows

## Next Steps

After understanding the architecture, you can:
1. **[Register Components](#component-registration)** - Learn how to register custom components
2. **[Develop Components](./develop-component-architecture.md)** - Start developing specific components
3. **[Extend Functionality](#extensibility-design)** - Add new functionality to the system

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*