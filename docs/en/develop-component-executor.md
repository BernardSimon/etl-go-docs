---
outline: deep
---

# Executor Component Development

Executor components are the core components in etl-go responsible for executing arbitrary SQL statements or commands. This document details how to develop custom Executor components, including interface implementation, SQL execution, result handling, and performance optimization.

## Executor Component Overview

### Roles and Responsibilities
Executor components are responsible for:
- **SQL Execution**: Executing any SQL statements (SELECT, INSERT, UPDATE, DELETE, DDL, etc.)
- **Command Execution**: Executing system commands or scripts (optional)
- **Transaction Management**: Supporting transactional operations and rollbacks
- **Result Handling**: Getting execution results, affected rows, last insert ID, etc.
- **Error Handling**: Handling errors during execution while ensuring data safety

### Core Interface
Defined in `etl/core/executor`:
```go
// Executor interface
type Executor interface {
    // Open executor with configuration
    Open(config map[string]string, dataSource *datasource.Datasource) error
    
    // Close executor
    Close() error
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/executor/
└── your-executor/        # Custom executor name
    ├── main.go          # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── main_test.go
```

### 2. Define Component Metadata

Each Executor component needs to export a creator function:

```go
package yourexecutor

import (
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/executor"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

var name = "your-executor"

func SetCustomName(customName string, datasourceName string) {
    name = customName
    datasourceName = datasourceName
}

// ExecutorCreator must be exported
func ExecutorCreator() (string, executor.Executor, *string, []params.Params) {
    return name, &Executor{}, nil, []params.Params{
        {
            Key:          "sql",
            DefaultValue: "",
            Required:     true,
            Description:  "SQL query statement",
        },
    }
}
```

### 3. Implement Executor Interface

#### Basic Implementation Template

```go
package sql

import (
    "database/sql"
    "fmt"

    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/executor"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// ==================== MySQL Support ====================

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(name string, datasourceName string) {
    mysqlName = name
    mysqlDatasourceName = datasourceName
}

func ExecutorCreatorMysql() (string, executor.Executor, *string, []params.Params) {
    return mysqlName, &Executor{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL SQL query",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgresql(name string, datasourceName string) {
    postgreName = name
    postgreDatasourceName = datasourceName
}

func ExecutorCreatorPostgre() (string, executor.Executor, *string, []params.Params) {
    return postgreName, &Executor{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL SQL query",
        },
    }
}

// ==================== SQLite Support ====================

var sqliteName = "sqlite"
var sqliteDatasourceName = "sqlite"

func SetCustomNameSqlite(name string, datasourceName string) {
    sqliteName = name
    sqliteDatasourceName = datasourceName
}

func ExecutorCreatorSqlite() (string, executor.Executor, *string, []params.Params) {
    return sqliteName, &Executor{}, &sqliteDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "SQLite SQL query",
        },
    }
}

// ==================== Core Implementation ====================

type Executor struct {
    db         *sql.DB
    results    sql.Result
    datasource *datasource.Datasource
}

func (s *Executor) Open(config map[string]string, dataSource *datasource.Datasource) error {
    query, ok := config["sql"]
    if !ok || query == "" {
        return fmt.Errorf("sql executor: config is missing or has invalid 'sql'")
    }
    
    s.datasource = dataSource
    s.db = (*s.datasource).Open().(*sql.DB)
    
    var err error
    s.results, err = s.db.Exec(query)
    if err != nil {
        return fmt.Errorf("sql executor: failed to execute sql: %w", err)
    }
    
    return nil
}

func (s *Executor) Close() error {
    err := (*s.datasource).Close()
    if err != nil {
        return err
    }
    return nil
}
```

## Practical Examples

### SQL Executor (Complete Version)

Based on actual etl-go project SQL Executor implementation:

```go
package sql

import (
    "database/sql"
    "fmt"
    "strings"
    "log"

    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/executor"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// ==================== MySQL Support ====================

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(name string, datasourceName string) {
    mysqlName = name
    mysqlDatasourceName = datasourceName
}

func ExecutorCreatorMysql() (string, executor.Executor, *string, []params.Params) {
    return mysqlName, &Executor{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL SQL query",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgresql(name string, datasourceName string) {
    postgreName = name
    postgreDatasourceName = datasourceName
}

func ExecutorCreatorPostgre() (string, executor.Executor, *string, []params.Params) {
    return postgreName, &Executor{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL SQL query",
        },
    }
}

// ==================== SQLite Support ====================

var sqliteName = "sqlite"
var sqliteDatasourceName = "sqlite"

func SetCustomNameSqlite(name string, datasourceName string) {
    sqliteName = name
    sqliteDatasourceName = datasourceName
}

func ExecutorCreatorSqlite() (string, executor.Executor, *string, []params.Params) {
    return sqliteName, &Executor{}, &sqliteDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "SQLite SQL query",
        },
    }
}

// ==================== Core Implementation ====================

type Executor struct {
    db           *sql.DB
    results      sql.Result
    lastInsertID int64
    rowsAffected int64
    datasource   *datasource.Datasource
    queryType    string // INSERT, UPDATE, DELETE, DDL, etc.
}

func (s *Executor) Open(config map[string]string, dataSource *datasource.Datasource) error {
    query, ok := config["sql"]
    if !ok || query == "" {
        return fmt.Errorf("sql executor: config is missing or has invalid 'sql'")
    }
    
    s.datasource = dataSource
    s.db = (*s.datasource).Open().(*sql.DB)
    
    // Determine query type
    s.queryType = determineQueryType(query)
    
    var err error
    s.results, err = s.db.Exec(query)
    if err != nil {
        return fmt.Errorf("sql executor: failed to execute sql: %w", err)
    }
    
    // Get execution results
    s.lastInsertID, _ = s.results.LastInsertId()
    s.rowsAffected, _ = s.results.RowsAffected()
    
    log.Printf("SQL executed: %s, type: %s, rows: %d, insert_id: %d", 
        query, s.queryType, s.rowsAffected, s.lastInsertID)
    
    return nil
}

func (s *Executor) Close() error {
    err := (*s.datasource).Close()
    if err != nil {
        return err
    }
    return nil
}

// GetExecutionResult returns execution result
func (s *Executor) GetExecutionResult() ExecutionResult {
    return ExecutionResult{
        QueryType:    s.queryType,
        RowsAffected: s.rowsAffected,
        LastInsertID: s.lastInsertID,
    }
}

// ExecutionResult execution result structure
type ExecutionResult struct {
    QueryType    string
    RowsAffected int64
    LastInsertID int64
}

// determineQueryType determines SQL query type
func determineQueryType(query string) string {
    queryUpper := strings.ToUpper(strings.TrimSpace(query))
    
    if strings.HasPrefix(queryUpper, "SELECT") {
        return "SELECT"
    } else if strings.HasPrefix(queryUpper, "INSERT") {
        return "INSERT"
    } else if strings.HasPrefix(queryUpper, "UPDATE") {
        return "UPDATE"
    } else if strings.HasPrefix(queryUpper, "DELETE") {
        return "DELETE"
    } else if strings.HasPrefix(queryUpper, "CREATE") || 
              strings.HasPrefix(queryUpper, "ALTER") || 
              strings.HasPrefix(queryUpper, "DROP") {
        return "DDL"
    }
    
    return "UNKNOWN"
}
```

## Advanced Features

### 1. Transaction Support

```go
// TransactionalExecutor supports transactions
type TransactionalExecutor struct {
    baseExecutor Executor
    tx           *sql.Tx
    autoCommit   bool
}

func (t *TransactionalExecutor) ExecuteWithTransaction(sql string) error {
    var err error
    
    if t.autoCommit {
        // Auto-commit mode
        err = t.baseExecutor.Execute(sql)
    } else {
        // Manual commit mode
        if t.tx == nil {
            t.tx, err = t.baseExecutor.Begin()
            if err != nil {
                return fmt.Errorf("failed to begin transaction: %w", err)
            }
        }
        
        _, err = t.tx.Exec(sql)
        if err != nil {
            t.tx.Rollback()
            return fmt.Errorf("transaction failed: %w", err)
        }
    }
    
    return err
}

func (t *TransactionalExecutor) Commit() error {
    if t.tx != nil {
        return t.tx.Commit()
    }
    return nil
}

func (t *TransactionalExecutor) Rollback() error {
    if t.tx != nil {
        return t.tx.Rollback()
    }
    return nil
}
```

### 2. Batch Execution

```go
// BatchExecutor batch executor
type BatchExecutor struct {
    baseExecutor Executor
    batchSize    int
    sqlTemplates []string
}

func (b *BatchExecutor) ExecuteBatches(data [][]interface{}) ([]ExecutionResult, error) {
    var results []ExecutionResult
    
    for i := 0; i < len(data); i += b.batchSize {
        end := min(i+b.batchSize, len(data))
        batch := data[i:end]
        
        result, err := b.executeBatch(batch)
        if err != nil {
            return nil, err
        }
        results = append(results, result)
    }
    
    return results, nil
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

### 3. Prepared Statements

```go
// PreparedExecutor prepared statement executor
type PreparedExecutor struct {
    db           *sql.DB
    preparedStmt *sql.Stmt
    params       []string
}

func (p *PreparedExecutor) Open(config map[string]string, dataSource *datasource.Datasource) error {
    query, ok := config["sql"]
    if !ok || query == "" {
        return fmt.Errorf("preparedStatement executor: config is missing 'sql'")
    }
    
    p.db = (*dataSource).Open().(*sql.DB)
    
    var err error
    p.preparedStmt, err = p.db.Prepare(query)
    if err != nil {
        return fmt.Errorf("failed to prepare statement: %w", err)
    }
    
    return nil
}

func (p *PreparedExecutor) Close() error {
    if p.preparedStmt != nil {
        p.preparedStmt.Close()
    }
    return (*p.db).Close()
}
```

### 4. SQL Validator

```go
// SQLValidatorExecutor SQL validation executor
type SQLValidatorExecutor struct {
    baseExecutor Executor
    whitelist    []string
    blacklist    []string
}

func (v *SQLValidatorExecutor) Execute(sql string) error {
    // Security check
    if err := v.validateSQL(sql); err != nil {
        return err
    }
    
    return v.baseExecutor.Execute(sql)
}

func (v *SQLValidatorExecutor) validateSQL(sql string) error {
    sqlUpper := strings.ToUpper(sql)
    
    // Check blacklist
    for _, banned := range v.blacklist {
        if strings.Contains(sqlUpper, banned) {
            return fmt.Errorf("SQL contains forbidden keyword: %s", banned)
        }
    }
    
    // Check whitelist
    if len(v.whitelist) > 0 {
        found := false
        for _, allowed := range v.whitelist {
            if strings.Contains(sqlUpper, allowed) {
                found = true
                break
            }
        }
        if !found {
            return fmt.Errorf("SQL does not contain any allowed keywords")
        }
    }
    
    return nil
}
```

## Performance Optimization

### 1. Connection Pool Optimization

```go
// OptimizeConnPool optimize database connection pool
func OptimizeConnPool(db *sql.DB, maxSize, minSize int) {
    db.SetMaxOpenConns(maxSize)
    db.SetMinOpenConns(minSize)
    db.SetMaxIdleConns(maxSize / 2)
    db.SetConnMaxLifetime(30 * time.Minute)
}
```

### 2. Async Execution

```go
// AsyncExecutor async executor
type AsyncExecutor struct {
    executor Executor
    queue    chan string
    workers  int
}

func (a *AsyncExecutor) Start() {
    a.queue = make(chan string, 1000)
    
    for i := 0; i < a.workers; i++ {
        go func() {
            for sql := range a.queue {
                if err := a.executor.Execute(sql); err != nil {
                    log.Printf("Async execution failed: %v", err)
                }
            }
        }()
    }
}

func (a *AsyncExecutor) Execute(sql string) error {
    select {
    case a.queue <- sql:
        return nil
    case <-time.After(5 * time.Second):
        return errors.New("async executor queue timeout")
    }
}
```

### 3. SQL Caching

```go
// CachedExecutor SQL caching executor
type CachedExecutor struct {
    executor Executor
    cache    map[string]interface{}
}

func (c *CachedExecutor) Execute(sql string) error {
    // Use cache for SELECT statements
    if strings.HasPrefix(strings.ToUpper(sql), "SELECT") {
        if cached, exists := c.cache[sql]; exists {
            return cached.(error)
        }
    }
    
    err := c.executor.Execute(sql)
    c.cache[sql] = err
    
    return err
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

func TestSQLExecutor_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "valid SQL",
            config: map[string]string{
                "sql": "SELECT 1",
            },
            expectError: false,
        },
        {
            name: "missing SQL",
            config: map[string]string{},
            expectError: true,
            errorMsg:    "sql",
        },
        {
            name: "empty SQL",
            config: map[string]string{
                "sql": "",
            },
            expectError: true,
            errorMsg:    "sql",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            executor := &Executor{}
            err := executor.Open(tt.config, mockDataSource)
            
            if tt.expectError {
                require.Error(t, err)
                if tt.errorMsg != "" {
                    assert.Contains(t, err.Error(), tt.errorMsg)
                }
            } else {
                require.NoError(t, err)
            }
        })
    }
}

func TestDetermineQueryType(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        {"SELECT * FROM users", "SELECT"},
        {"INSERT INTO users VALUES (1)", "INSERT"},
        {"UPDATE users SET name='test'", "UPDATE"},
        {"DELETE FROM users WHERE id=1", "DELETE"},
        {"CREATE TABLE test (id INT)", "DDL"},
        {"INVALID QUERY", "UNKNOWN"},
    }
    
    for _, tt := range tests {
        t.Run(tt.input, func(t *testing.T) {
            result := determineQueryType(tt.input)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

## Best Practices

### 1. Security
- Prevent SQL injection using prepared statements
- Follow principle of least privilege
- Validate user input
- Audit all execution operations

### 2. Performance
- Reuse connections with pools
- Use batch operations
- Optimize queries with indexes
- Consider async processing

### 3. Reliability
- Support transactions for consistency
- Implement retry mechanisms
- Set appropriate timeouts
- Monitor and alert on anomalies

### 4. Maintainability
- Consistent naming and formatting
- Clear comments for complex logic
- Comprehensive unit tests
- Well-documented APIs

## Common Issues

### 1. SQL Injection Risk
**Issue**: Direct use of user input may lead to SQL injection
**Solution**:
- Use prepared statements
- Validate and filter inputs
- Limit SQL keywords
- Consider ORM frameworks

### 2. Long-running Queries
**Issue**: Complex queries cause timeouts
**Solution**:
- Set reasonable timeouts
- Use pagination and chunking
- Add proper indexes
- Execute asynchronously

### 3. Connection Leaks
**Issue**: Forgetting to close connections causes resource leaks
**Solution**:
- Use defer to ensure cleanup
- Implement automatic cleanup mechanisms
- Regular connection monitoring
- Use connection pooling

### 4. Deadlocks
**Issue**: Concurrent operations causing deadlocks
**Solution**:
- Keep consistent lock ordering
- Keep transactions short
- Use appropriate isolation levels
- Detect and recover from deadlocks

## Debugging Tips

### 1. Enable Detailed Logging

```go
func (e *Executor) EnableDebug() {
    e.db.LogMode(true)
}

// Or use custom logger
func (e *Executor) debugLog(sql string, params ...interface{}) {
    log.Printf("Executing: %s with params: %v", sql, params)
}
```

### 2. Slow Query Monitoring

```go
func (e *Executor) MonitorSlowQueries(threshold time.Duration) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        var count int
        e.db.QueryRow("SHOW SESSION STATUS LIKE 'Slow_queries'").Scan(&count)
        
        if count > 100 {
            log.Warnf("High slow query count: %d", count)
        }
    }
}
```

### 3. Explain Plan Analysis

```go
func (e *Executor) ExplainQuery(sql string) (string, error) {
    explainSQL := "EXPLAIN " + sql
    rows, err := e.db.Query(explainSQL)
    if err != nil {
        return "", err
    }
    defer rows.Close()
    
    var result strings.Builder
    columns, _ := rows.Columns()
    
    for rows.Next() {
        vals := make([]interface{}, len(columns))
        valPtrs := make([]interface{}, len(columns))
        for i := range vals {
            valPtrs[i] = &vals[i]
        }
        rows.Scan(valPtrs...)
        result.WriteString(fmt.Sprintln(vals))
    }
    
    return result.String(), nil
}
```

## Next Steps

After completing Executor component development, you can:
1. **[Read Variable Component Guide](./develop-component-variable.md)** - Learn about dynamic variables
2. **[Integration Testing](#testing)** - Test complete ETL flows
3. **[Production Deployment](#best-practices)** - Configure production environment
4. **[Monitoring and Operations](#debugging-tips)** - Add monitoring and alerts
5. **[About etl-go](./about.md)** - Learn about the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*