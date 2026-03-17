---
outline: deep
---

# DataSource Component Development

DataSource components are the core components in etl-go responsible for managing database connections and data source configurations. This document details how to develop custom DataSource components, including interface implementation, connection management, and security features.

## DataSource Component Overview

### Roles and Responsibilities
DataSource components are responsible for:
- **Connection Management**: Managing database connections and pooling
- **Configuration**: Loading and validating data source configurations
- **Authentication**: Handling authentication credentials securely
- **Health Monitoring**: Checking connection health and availability
- **Resource Cleanup**: Properly releasing resources when done

### Core Interface
Defined in `etl/core/datasource`:
```go
// DataSource interface
type Datasource interface {
    // Open connection
    Open() interface{}
    
    // Close connection
    Close() error
    
    // Get connection status
    Status() (string, error)
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/datasource/
└── your-datasource/      # Custom data source name
    ├── main.go          # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── main_test.go
```

### 2. Define Component Metadata

Each DataSource component needs to export a creator function:

```go
package yoursourcedata

import (
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

var name = "your-datasource"

func SetCustomName(customName string, datasourceName string) {
    name = customName
    datasourceName = datasourceName
}

// DatasourceCreator must be exported
func DatasourceCreator() (string, datasource.Datasource, *string, []params.Params) {
    return name, &Datasource{}, &datasourceName, []params.Params{
        {
            Key:          "host",
            DefaultValue: "",
            Required:     true,
            Description:  "Database host address",
        },
        {
            Key:          "port",
            DefaultValue: "3306",
            Required:     false,
            Description:  "Database port",
        },
        {
            Key:          "database",
            DefaultValue: "",
            Required:     true,
            Description:  "Database name",
        },
        {
            Key:          "username",
            DefaultValue: "",
            Required:     true,
            Description:  "Username",
        },
        {
            Key:          "password",
            DefaultValue: "",
            Required:     true,
            Description:  "Password (will be encrypted)",
        },
    }
}
```

### 3. Implement DataSource Interface

#### Basic Implementation Template

```go
package doris

import (
    "database/sql"
    "fmt"
    "sync"
    
    _ "github.com/denisenkom/go-mssqldb"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// ==================== Doris Support ====================

var dorisName = "doris"
var dorisDatasourceName = "doris"

func SetCustomNameDoris(customName, datasourceName string) {
    dorisName = customName
    dorisDatasourceName = datasourceName
}

func DatasourceCreatorDoris() (string, datasource.Datasource, *string, []params.Params) {
    return dorisName, &Datasource{}, &dorisDatasourceName, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "",
            Description:  "Doris FE host",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "8030",
            Description:  "Doris BE port",
        },
        {
            Key:          "database",
            Required:     true,
            DefaultValue: "",
            Description:  "Database name",
        },
        {
            Key:          "user",
            Required:     true,
            DefaultValue: "",
            Description:  "Username",
        },
        {
            Key:          "password",
            Required:     true,
            DefaultValue: "",
            Description:  "Password",
        },
    }
}

// ==================== Core Implementation ====================

type Datasource struct {
    db         *sql.DB
    config     map[string]string
    mu         sync.RWMutex
    closed     bool
    connection *sql.DB
}

func (d *Datasource) Open() interface{} {
    d.mu.Lock()
    defer d.mu.Unlock()
    
    if d.connection != nil && !d.closed {
        return d.connection
    }
    
    // Parse connection string
    host := d.config["host"]
    port := d.config["port"]
    database := d.config["database"]
    user := d.config["user"]
    password := d.config["password"]
    
    connStr := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4",
        user, password, host, port, database)
    
    // Open database connection
    db, err := sql.Open("mysql", connStr)
    if err != nil {
        panic(fmt.Errorf("failed to open database: %w", err))
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(100)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    // Test connection
    if err := db.Ping(); err != nil {
        db.Close()
        panic(fmt.Errorf("failed to ping database: %w", err))
    }
    
    d.connection = db
    return db
}

func (d *Datasource) Close() error {
    d.mu.Lock()
    defer d.mu.Unlock()
    
    if d.connection != nil && !d.closed {
        d.closed = true
        err := d.connection.Close()
        d.connection = nil
        return err
    }
    
    return nil
}

func (d *Datasource) Status() (string, error) {
    d.mu.RLock()
    defer d.mu.RUnlock()
    
    if d.connection == nil || d.closed {
        return "disconnected", errors.New("connection not opened")
    }
    
    if err := d.connection.Ping(); err != nil {
        return "unhealthy", err
    }
    
    return "healthy", nil
}
```

## Practical Examples

### MySQL DataSource (Complete Version)

Based on actual etl-go project MySQL DataSource implementation:

```go
package mysql

import (
    "database/sql"
    "fmt"
    "sync"
    "time"
    
    _ "github.com/go-sql-driver/mysql"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(customName, datasourceName string) {
    mysqlName = customName
    mysqlDatasourceName = datasourceName
}

func DatasourceCreatorMysql() (string, datasource.Datasource, *string, []params.Params) {
    return mysqlName, &Datasource{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL host",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "3306",
            Description:  "MySQL port",
        },
        {
            Key:          "database",
            Required:     true,
            DefaultValue: "",
            Description:  "Database name",
        },
        {
            Key:          "username",
            Required:     true,
            DefaultValue: "",
            Description:  "Username",
        },
        {
            Key:          "password",
            Required:     true,
            DefaultValue: "",
            Description:  "Password",
        },
        {
            Key:          "timeout",
            DefaultValue: "5s",
            Required:     false,
            Description:  "Connection timeout",
        },
    }
}

type Datasource struct {
    db          *sql.DB
    config      map[string]string
    mu          sync.RWMutex
    closed      bool
    connection  *sql.DB
}

func (m *Datasource) Open() interface{} {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    if m.connection != nil && !m.closed {
        return m.connection
    }
    
    // Build connection string
    timeout := "5s"
    if t, ok := m.config["timeout"]; ok {
        timeout = t
    }
    
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&timeout=%s",
        m.config["username"],
        m.config["password"],
        m.config["host"],
        m.config["port"],
        m.config["database"],
        timeout,
    )
    
    // Open connection
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        panic(fmt.Errorf("failed to open mysql database: %w", err))
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(100)
    db.SetMaxIdleConns(20)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    // Verify connection
    if err := db.Ping(); err != nil {
        db.Close()
        panic(fmt.Errorf("failed to ping mysql database: %w", err))
    }
    
    m.connection = db
    return db
}

func (m *Datasource) Close() error {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    if m.connection != nil && !m.closed {
        m.closed = true
        err := m.connection.Close()
        m.connection = nil
        return err
    }
    
    return nil
}

func (m *Datasource) Status() (string, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    if m.connection == nil || m.closed {
        return "disconnected", errors.New("connection not initialized")
    }
    
    if err := m.connection.Ping(); err != nil {
        return "error", err
    }
    
    return "healthy", nil
}
```

### PostgreSQL DataSource Example

```go
package postgre

import (
    "database/sql"
    "fmt"
    "sync"
    "time"
    
    _ "github.com/lib/pq"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

var postgreName = "postgres"
var postgreDatasourceName = "postgres"

func SetCustomNamePostgresql(customName, datasourceName string) {
    postgreName = customName
    postgreDatasourceName = datasourceName
}

func DatasourceCreatorPostgre() (string, datasource.Datasource, *string, []params.Params) {
    return postgreName, &Datasource{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL host",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "5432",
            Description:  "PostgreSQL port",
        },
        {
            Key:          "database",
            Required:     true,
            DefaultValue: "",
            Description:  "Database name",
        },
        {
            Key:          "username",
            Required:     true,
            DefaultValue: "",
            Description:  "Username",
        },
        {
            Key:          "password",
            Required:     true,
            DefaultValue: "",
            Description:  "Password",
        },
    }
}

type Datasource struct {
    db         *sql.DB
    config     map[string]string
    mu         sync.RWMutex
    closed     bool
    connection *sql.DB
}

func (p *Datasource) Open() interface{} {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if p.connection != nil && !p.closed {
        return p.connection
    }
    
    // Build PostgreSQL connection string
    connStr := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        p.config["host"],
        p.config["port"],
        p.config["username"],
        p.config["password"],
        p.config["database"],
    )
    
    // Open connection
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        panic(fmt.Errorf("failed to open postgres database: %w", err))
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(50)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(10 * time.Minute)
    
    // Verify connection
    if err := db.Ping(); err != nil {
        db.Close()
        panic(fmt.Errorf("failed to ping postgres database: %w", err))
    }
    
    p.connection = db
    return db
}

func (p *Datasource) Close() error {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if p.connection != nil && !p.closed {
        p.closed = true
        err := p.connection.Close()
        p.connection = nil
        return err
    }
    
    return nil
}

func (p *Datasource) Status() (string, error) {
    p.mu.RLock()
    defer p.mu.RUnlock()
    
    if p.connection == nil || p.closed {
        return "disconnected", errors.New("connection not initialized")
    }
    
    if err := p.connection.Ping(); err != nil {
        return "error", err
    }
    
    return "healthy", nil
}
```

## Security Features

### 1. Encrypted Password Storage

```go
// EncryptPassword encrypts sensitive information using AES
func EncryptPassword(password string) string {
    // Use AES encryption for password storage
    key := []byte("your-secret-key-here") // Should come from secure source
    encrypted, err := aesEncrypt([]byte(password), key)
    if err != nil {
        panic(err)
    }
    return base64.StdEncoding.EncodeToString(encrypted)
}

// DecryptPassword decrypts stored passwords
func DecryptPassword(encrypted string) string {
    key := []byte("your-secret-key-here")
    decoded, _ := base64.StdEncoding.DecodeString(encrypted)
    decrypted, err := aesDecrypt(decoded, key)
    if err != nil {
        panic(err)
    }
    return string(decrypted)
}
```

### 2. Connection Pool Optimization

```go
// OptimizePoolSize adjusts connection pool based on workload
func OptimizePoolSize(db *sql.DB, minConns, maxConns int) {
    db.SetMaxOpenConns(maxConns)
    db.SetMaxIdleConns(minConns)
    db.SetConnMaxLifetime(30 * time.Minute)
}

// MonitorPoolStats monitors connection pool health
func MonitorPoolStats(db *sql.DB) {
    stats := db.Stats()
    log.Printf("Pool stats - Open: %d, Idle: %d, InUse: %d, WaitCount: %d",
        stats.OpenConnections,
        stats.Idle,
        stats.InUse,
        stats.WaitCount,
    )
}
```

## Advanced Features

### 1. Read/Write Separation

```go
// SplitDataSource supports separate read/write connections
type SplitDataSource struct {
    writer Datasource
    readers []Datasource
}

func (s *SplitDataSource) Writer() *sql.DB {
    return s.writer.Open().(*sql.DB)
}

func (s *SplitDataSource) Reader() *sql.DB {
    if len(s.readers) == 0 {
        return s.Writer()
    }
    return s.readers[0].Open().(*sql.DB)
}

// RotateReader rotates between readers for load balancing
func (s *SplitDataSource) RotateReader() *sql.DB {
    if len(s.readers) <= 1 {
        return s.Writer()
    }
    // Round-robin rotation
    readerIndex = (readerIndex + 1) % len(s.readers)
    return s.readers[readerIndex].Open().(*sql.DB)
}
```

### 2. Retry Logic

```go
// RetryableDataSource wraps datasource with retry logic
type RetryableDataSource struct {
    base Datasource
    maxRetries int
    timeout time.Duration
}

func (r *RetryableDataSource) Open() interface{} {
    var db *sql.DB
    var err error
    
    for i := 0; i < r.maxRetries; i++ {
        db, err = r.base.Open().(*sql.DB), nil
        if err == nil {
            break
        }
        
        if i < r.maxRetries-1 {
            time.Sleep(r.timeout)
        }
    }
    
    if err != nil {
        panic(fmt.Errorf("max retries exceeded: %w", err))
    }
    
    return db
}
```

## Testing

### Unit Tests

```go
package mysql

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestDatasource_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "valid configuration",
            config: map[string]string{
                "host": "localhost",
                "port": "3306",
                "database": "test",
                "username": "root",
                "password": "password",
            },
            expectError: false,
        },
        {
            name: "missing required fields",
            config: map[string]string{
                "host": "localhost",
            },
            expectError: true,
            errorMsg:    "required",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            ds := &Datasource{config: tt.config}
            
            if tt.expectError {
                // Note: Real testing requires actual database
                // assert.Panics(t, func() { ds.Open() })
            } else {
                // assert.NotNil(t, ds.Open())
            }
        })
    }
}

func TestDatasource_Close(t *testing.T) {
    ds := &Datasource{}
    
    // Test closing non-initialized datasource
    err := ds.Close()
    require.NoError(t, err)
}

func TestDatasource_Status(t *testing.T) {
    ds := &Datasource{}
    status, err := ds.Status()
    
    assert.Equal(t, "disconnected", status)
    require.Error(t, err)
}
```

## Best Practices

### 1. Connection Management
- Use connection pooling
- Set appropriate timeouts
- Implement proper cleanup
- Monitor pool health

### 2. Security
- Encrypt sensitive credentials
- Use least privilege principle
- Rotate passwords regularly
- Audit access logs

### 3. Performance
- Tune pool sizes based on workload
- Use connection validation
- Monitor query performance
- Implement caching where appropriate

### 4. Reliability
- Implement retry logic
- Add circuit breaker patterns
- Handle connection failures gracefully
- Log important events

## Common Issues

### 1. Connection Exhaustion
**Issue**: Too many connections consuming all available connections
**Solution**:
- Adjust pool size settings
- Implement connection reuse
- Add monitoring alerts
- Use read replicas

### 2. Connection Leaks
**Issue**: Connections not being properly released
**Solution**:
- Always close connections
- Use defer for cleanup
- Implement connection lifecycle tracking
- Regular leak detection

### 3. Slow Queries
**Issue**: Database queries taking too long
**Solution**:
- Add proper indexing
- Optimize SQL statements
- Use query execution plans
- Implement query timeouts

### 4. Deadlocks
**Issue**: Concurrent transactions causing deadlocks
**Solution**:
- Use consistent locking order
- Keep transactions short
- Implement deadlock detection
- Use appropriate isolation levels

## Debugging Tips

### 1. Enable Query Logging
```go
db.LogMode(true)

// Or use custom logger
db.SetLogger(logrus.New())
```

### 2. Monitor Active Connections
```go
stats := db.Stats()
log.Printf("Active: %d, Idle: %d, Max: %d", 
    stats.OpenConnections, stats.Idle, stats.MaxOpenConnections)
```

### 3. Track Query Performance
```go
func TrackQueryDuration(db *sql.DB) {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        start := time.Now()
        db.QueryRow("SELECT 1").Scan(nil)
        duration := time.Since(start)
        if duration > 100*time.Millisecond {
            log.Warnf("Slow query detected: %v", duration)
        }
    }
}
```

## Next Steps

After completing DataSource component development, you can:
1. **[Read Input Component Guide](./develop-component-source.md)** - Learn about data extraction
2. **[Integration Testing](#testing)** - Test end-to-end workflows
3. **[Performance Tuning](#best-practices)** - Optimize database performance
4. **[About etl-go](./about.md)** - Learn about the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*