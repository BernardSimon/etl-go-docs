---
outline: deep
---

# Variable Component Development

Variable components are the core components in etl-go responsible for dynamically fetching configuration values from data sources. This document details how to develop custom Variable components, including interface implementation, SQL queries, result parsing, and security validation.

## Variable Component Overview

### Roles and Responsibilities
Variable components are responsible for:
- **Dynamic Retrieval**: Executing SELECT queries from databases to fetch configuration values
- **Type Conversion**: Converting query results to string format
- **Security Validation**: Preventing SQL injection and other security risks
- **Error Handling**: Handling errors during query execution
- **Caching Support**: Optionally caching query results for better performance

### Core Interface
Defined in `etl/core/variable`:
```go
// Variable interface
type Variable interface {
    // Get variable value
    Get(config map[string]string, dataSource *datasource.Datasource) (string, error)
}
```

## Development Steps

### 1. Create Component Directory Structure

```
components/variable/
└── your-variable/        # Custom variable name
    ├── main.go          # Main implementation file
    ├── go.mod           # Module definition
    ├── README.md        # Component documentation
    └── test/            # Test files
        └── main_test.go
```

### 2. Define Component Metadata

Each Variable component needs to export a creator function:

```go
package yourvariable

import (
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/variable"
)

var name = "your-variable"

func SetCustomName(customName string, datasourceName string) {
    name = customName
    datasourceName = datasourceName
}

// VariableCreator must be exported
func VariableCreator() (string, variable.Variable, *string, []params.Params) {
    return name, &Variable{}, nil, []params.Params{
        {
            Key:          "query",
            DefaultValue: "",
            Required:     true,
            Description:  "SQL query statement",
        },
    }
}
```

### 3. Implement Variable Interface

#### Basic Implementation Template

```go
package sql

import (
    "database/sql"
    "errors"
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/variable"
)

var name = "sql-variable"

func SetCustomName(customName string, datasourceName string) {
    name = customName
    datasourceName = datasourceName
}

type Variable struct {
}

func VariableCreator() (string, variable.Variable, *string, []params.Params) {
    return name, &Variable{}, nil, []params.Params{
        {
            Key:          "query",
            Required:     true,
            DefaultValue: "",
            Description:  "SQL query statement",
        },
    }
}

func (v *Variable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query, exist := config["query"]
    if !exist {
        return "", errors.New("variable query is required")
    }
    
    // Validate query
    if err := v.validateQuery(query); err != nil {
        return "", err
    }
    
    // Open database connection
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    // Execute query
    var result string
    err := db.QueryRow(query).Scan(&result)
    if err != nil {
        return "", fmt.Errorf("failed to execute query: %w", err)
    }
    
    return result, nil
}

// validateQuery validates query safety
func (v *Variable) validateQuery(query string) error {
    trimmedSql := strings.TrimSpace(query)
    upperSql := strings.ToUpper(trimmedSql)

    // Must start with SELECT
    if !strings.HasPrefix(upperSql, "SELECT") {
        return errors.New("variable should have SELECT prefix")
    }

    // Check for dangerous keywords
    dangerousKeywords := []string{"INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "EXEC"}
    for _, keyword := range dangerousKeywords {
        if strings.Contains(upperSql, keyword) {
            return errors.New("variable should not contain dangerous keywords")
        }
    }

    return nil
}
```

## Practical Examples

### SQL Variable (Complete Version)

Based on actual etl-go project SQL Variable implementation:

```go
package sql

import (
    "database/sql"
    "errors"
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/variable"
)

// ==================== MySQL Support ====================

var mysqlName = "mysql"
var mysqlDatasourceName = "mysql"

func SetCustomNameMysql(customName string, datasourceName string) {
    mysqlName = customName
    mysqlDatasourceName = datasourceName
}

func VariableCreatorMysql() (string, variable.Variable, *string, []params.Params) {
    return mysqlName, &Variable{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "query",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL query",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgre(customName string, datasourceName string) {
    postgreName = customName
    postgreDatasourceName = datasourceName
}

func VariableCreatorPostgre() (string, variable.Variable, *string, []params.Params) {
    return postgreName, &Variable{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "query",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL query",
        },
    }
}

// ==================== SQLite Support ====================

var sqliteName = "sqlite"
var sqliteDatasourceName = "sqlite"

func SetCustomNameSqlite(customName string, datasourceName string) {
    sqliteName = customName
    sqliteDatasourceName = datasourceName
}

func VariableCreatorSqlite() (string, variable.Variable, *string, []params.Params) {
    return sqliteName, &Variable{}, &sqliteDatasourceName, []params.Params{
        {
            Key:          "query",
            Required:     true,
            DefaultValue: "",
            Description:  "SQLite query",
        },
    }
}

// ==================== Core Implementation ====================

type Variable struct {
}

func (s *Variable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query, exist := config["query"]
    if !exist {
        return "", errors.New("variable query is required")
    }
    
    // Validate query
    if err := validVariable(config); err != nil {
        return "", err
    }
    
    // Open database connection
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    // Execute query
    var result string
    err := db.QueryRow(query).Scan(&result)
    if err != nil {
        return "", fmt.Errorf("failed to execute query: %w", err)
    }
    
    return result, nil
}

func validVariable(config map[string]string) error {
    query := config["query"]
    trimmedSql := strings.TrimSpace(query)
    upperSql := strings.ToUpper(trimmedSql)

    // Must start with SELECT
    if !strings.HasPrefix(upperSql, "SELECT") {
        return errors.New("variable Should Has SELECT Prefix")
    }

    // Check for dangerous keywords
    dangerousKeywords := []string{"INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "EXEC"}
    for _, keyword := range dangerousKeywords {
        if strings.Contains(upperSql, keyword) {
            return errors.New("variable Should Not Contains Dangerous Keywords")
        }
    }
    
    return nil
}
```

## Advanced Features

### 1. Parameterized Queries

```go
// ParametrizedVariable parameterized variable query
type ParametrizedVariable struct {
    cacheEnabled bool
    cacheTimeout time.Duration
}

func (p *ParametrizedVariable) GetWithParams(config map[string]string, params map[string]interface{}, dataSource *datasource.Datasource) (string, error) {
    query := config["query"]
    
    // Replace placeholders
    for key, value := range params {
        placeholder := ":" + key
        query = strings.ReplaceAll(query, placeholder, fmt.Sprintf("%v", value))
    }
    
    // Validate query
    if err := p.validateQuery(query); err != nil {
        return "", err
    }
    
    // Execute query
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    var result string
    err := db.QueryRow(query).Scan(&result)
    if err != nil {
        return "", fmt.Errorf("failed to execute query: %w", err)
    }
    
    return result, nil
}
```

### 2. Multi-value Returns

```go
// MultiValueVariable multi-value variable query
type MultiValueVariable struct {
    separator string
}

func (m *MultiValueVariable) Get(config map[string]string, dataSource *datasource.Datasource) ([]string, error) {
    query := config["query"]
    sep := ","
    if sepConfig, ok := config["separator"]; ok {
        sep = sepConfig
    }
    
    // Validate query
    if err := m.validateQuery(query); err != nil {
        return nil, err
    }
    
    // Execute query
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    rows, err := db.Query(query)
    if err != nil {
        return nil, fmt.Errorf("failed to execute query: %w", err)
    }
    defer rows.Close()
    
    var values []string
    for rows.Next() {
        var value string
        if err := rows.Scan(&value); err != nil {
            return nil, fmt.Errorf("failed to scan row: %w", err)
        }
        values = append(values, value)
    }
    
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("error during iteration: %w", err)
    }
    
    return values, nil
}
```

### 3. Cached Variables

```go
// CachedVariable cached variable query
type CachedVariable struct {
    baseVariable variable.Variable
    cache        sync.Map
    ttl          time.Duration
}

func (c *CachedVariable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query := config["query"]
    
    // Check cache
    if cachedResult, exists := c.cache.Load(query); exists {
        if time.Since(cachedTime.(time.Time)) < c.ttl {
            return cachedResult.(string), nil
        } else {
            c.cache.Delete(query)
        }
    }
    
    // Query and cache
    result, err := c.baseVariable.Get(config, dataSource)
    if err != nil {
        return "", err
    }
    
    c.cache.Store(query, result)
    c.cacheStoreTime(query, time.Now())
    
    return result, nil
}
```

### 4. Composite Variables

```go
// CompositeVariable composite of multiple variables
type CompositeVariable struct {
    variables   []variable.Variable
    configs     []map[string]string
    transformer func([]string) string
}

func (c *CompositeVariable) Get(dataSource *datasource.Datasource) (string, error) {
    results := make([]string, len(c.variables))
    
    for i, v := range c.variables {
        result, err := v.Get(c.configs[i], dataSource)
        if err != nil {
            return "", fmt.Errorf("failed to get variable %d: %w", i, err)
        }
        results[i] = result
    }
    
    if c.transformer != nil {
        return c.transformer(results), nil
    }
    
    return strings.Join(results, "|"), nil
}
```

## Performance Optimization

### 1. Batch Queries Optimization

```go
// BatchVariableQuery batch query single table
func BatchVariableQuery(tableName string, ids []int, dataSource *datasource.Datasource) ([]string, error) {
    if len(ids) == 0 {
        return []string{}, nil
    }
    
    placeholders := make([]string, len(ids))
    args := make([]interface{}, len(ids))
    for i, id := range ids {
        placeholders[i] = "?"
        args[i] = id
    }
    
    query := fmt.Sprintf("SELECT id FROM %s WHERE id IN (%s)", tableName, strings.Join(placeholders, ","))
    
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    rows, err := db.Query(query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var results []string
    for rows.Next() {
        var id string
        if err := rows.Scan(&id); err != nil {
            return nil, err
        }
        results = append(results, id)
    }
    
    return results, nil
}
```

### 2. Prepared Statements

```go
// PrecompiledVariable precompiled variable
type PrecompiledVariable struct {
    queryTemplate string
    stmt          *sql.Stmt
}

func (p *PrecompiledVariable) Open(query string, dataSource *datasource.Datasource) error {
    p.queryTemplate = query
    db := (*dataSource).Open().(*sql.DB)
    
    var err error
    p.stmt, err = db.Prepare(query)
    if err != nil {
        return fmt.Errorf("failed to prepare statement: %w", err)
    }
    
    return nil
}

func (p *PrecompiledVariable) Get(params ...interface{}) (string, error) {
    var result string
    err := p.stmt.QueryRow(params...).Scan(&result)
    if err != nil {
        return "", fmt.Errorf("failed to execute prepared query: %w", err)
    }
    
    return result, nil
}

func (p *PrecompiledVariable) Close() error {
    if p.stmt != nil {
        return p.stmt.Close()
    }
    return nil
}
```

### 3. Async Variable Fetch

```go
// AsyncVariable async variable fetch
type AsyncVariable struct {
    executor Executor
    variable Variable
    queue    chan QueryTask
}

type QueryTask struct {
    query    string
    resultCh chan<- string
    errCh    chan<- error
}

func (a *AsyncVariable) Start() {
    go func() {
        for task := range a.queue {
            result, err := a.variable.Get(map[string]string{"query": task.query}, nil)
            task.resultCh <- result
            task.errCh <- err
        }
    }()
}

func (a *AsyncVariable) GetAsync(query string) (<-chan string, <-chan error) {
    resultCh := make(chan string, 1)
    errCh := make(chan error, 1)
    
    a.queue <- QueryTask{
        query: query,
        resultCh: resultCh,
        errCh: errCh,
    }
    
    return resultCh, errCh
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

func TestValidVariable(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "valid SELECT query",
            config: map[string]string{
                "query": "SELECT name FROM users WHERE id = 1",
            },
            expectError: false,
        },
        {
            name: "missing query",
            config: map[string]string{},
            expectError: true,
            errorMsg:    "query is required",
        },
        {
            name: "non-SELECT query",
            config: map[string]string{
                "query": "UPDATE users SET name='test'",
            },
            expectError: true,
            errorMsg:    "SELECT Prefix",
        },
        {
            name: "contains dangerous keywords",
            config: map[string]string{
                "query": "SELECT * FROM users; DROP TABLE users;",
            },
            expectError: true,
            errorMsg:    "Dangerous Keywords",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validVariable(tt.config)
            
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
```

## Best Practices

### 1. Security
- Read-only queries only
- Blacklist filtering for dangerous keywords
- Strict input validation
- Use read-only accounts

### 2. Performance
- Optimize queries with indexes
- Use LIMIT to control result count
- Reasonable cache TTL settings
- Async processing for non-critical paths

### 3. Reliability
- Set appropriate timeouts
- Implement retry mechanisms
- Provide sensible defaults
- Fallback strategies for failures

### 4. Maintainability
- Clear variable naming
- Comprehensive comments explaining usage and constraints
- Flexible configuration
- Logging of important events

## Common Issues

### 1. SQL Injection Risk
**Issue**: Maliciously crafted queries may lead to SQL injection
**Solution**:
- Strict query syntax validation
- Block dangerous keywords
- Use prepared statements
- Only allow whitelist characters

### 2. Query Timeout
**Issue**: Complex queries cause timeouts
**Solution**:
- Set reasonable timeout values
- Add appropriate indexes
- Use LIMIT to restrict results
- Execute long queries asynchronously

### 3. High Memory Usage
**Issue**: Large result sets cause memory overflow
**Solution**:
- Limit result count per query
- Stream process large datasets
- Release query resources promptly
- Use pagination techniques

### 4. Data Consistency
**Issue**: Concurrent queries cause inconsistent data
**Solution**:
- Use transaction isolation levels
- Lock protection
- Version control
- Conflict detection

## Debugging Tips

### 1. Enable Detailed Logging

```go
func (v *Variable) EnableDebug() {
    log.Printf("Variable query enabled for debug")
}

// Log query information
func (v *Variable) debugLog(query string, result string, err error) {
    log.Printf("Query: %s, Result: %s, Error: %v", query, result, err)
}
```

### 2. Slow Query Monitoring

```go
func (v *Variable) MonitorSlowQueries(threshold time.Duration) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        slowCount := getSlowQueryCount()
        if slowCount > 10 {
            log.Warnf("High slow query count in variable: %d", slowCount)
        }
    }
}
```

### 3. Query Analysis

```go
func (v *Variable) AnalyzeQuery(query string, dataSource *datasource.Datasource) (string, error) {
    explainSQL := "EXPLAIN " + query
    
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    rows, err := db.Query(explainSQL)
    if err != nil {
        return "", err
    }
    defer rows.Close()
    
    var explanation strings.Builder
    columns, _ := rows.Columns()
    
    for rows.Next() {
        vals := make([]interface{}, len(columns))
        valPtrs := make([]interface{}, len(columns))
        for i := range vals {
            valPtrs[i] = &vals[i]
        }
        rows.Scan(valPtrs...)
        explanation.WriteString(fmt.Sprintln(vals))
    }
    
    return explanation.String(), nil
}
```

## Next Steps

After completing Variable component development, you can:
1. **[Integration Testing](#testing)** - Test variable usage in complete ETL flows
2. **[Production Deployment](#best-practices)** - Configure production environment parameters
3. **[Monitoring and Operations](#debugging-tips)** - Add monitoring and alerts
4. **[About etl-go](./about.md)** - Learn about the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*