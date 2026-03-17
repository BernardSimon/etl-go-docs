---
outline: deep
---

# 执行器组件开发

执行器组件（Executor）是 etl-go 中负责执行任意 SQL 语句或命令的核心组件。本文档详细介绍如何开发自定义执行器组件，包括接口实现、SQL 执行、结果处理和性能优化。

## 执行器组件概述

### 作用与职责
执行器组件负责：
- **SQL 执行**: 执行任意 SQL 语句（SELECT、INSERT、UPDATE、DELETE、DDL 等）
- **命令执行**: 执行系统命令或脚本（可选功能）
- **事务管理**: 支持事务性操作和回滚
- **结果处理**: 获取和执行结果，影响行数、插入 ID 等
- **错误处理**: 处理执行过程中的异常并保证数据安全

### 核心接口
在 `etl/core/executor` 中定义：
```go
// 执行器接口
type Executor interface {
    // 打开执行器，加载配置
    Open(config map[string]string, dataSource *datasource.Datasource) error
    
    // 关闭执行器
    Close() error
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/executor/
└── your-executor/        # 自定义执行器名称
    ├── main.go          # 主实现文件
    ├── go.mod           # 模块定义
    ├── README.md        # 组件说明
    └── test/            # 测试文件
        └── main_test.go
```

### 2. 定义组件元数据

每个执行器组件需要导出一个或多个创建器函数：

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

// ExecutorCreator 创建器函数 - 必须导出
func ExecutorCreator() (string, executor.Executor, *string, []params.Params) {
    return name, &Executor{}, nil, []params.Params{
        {
            Key:          "sql",
            DefaultValue: "",
            Required:     true,
            Description:  "SQL 查询语句",
        },
        // 更多参数...
    }
}
```

### 3. 实现执行器接口

#### 基础实现模板

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

func SetCustomNameMysql(name, datasourceName string) {
    mysqlName = name
    mysqlDatasourceName = datasourceName
}

func ExecutorCreatorMysql() (string, executor.Executor, *string, []params.Params) {
    return mysqlName, &Executor{}, &mysqlDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL SQL 查询",
        },
    }
}

// ==================== PostgreSQL Support ====================

var postgreName = "postgre"
var postgreDatasourceName = "postgre"

func SetCustomNamePostgresql(name, datasourceName string) {
    postgreName = name
    postgreDatasourceName = datasourceName
}

func ExecutorCreatorPostgre() (string, executor.Executor, *string, []params.Params) {
    return postgreName, &Executor{}, &postgreDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL SQL 查询",
        },
    }
}

// ==================== SQLite Support ====================

var sqliteName = "sqlite"
var sqliteDatasourceName = "sqlite"

func SetCustomNameSqlite(name, datasourceName string) {
    sqliteName = name
    sqliteDatasourceName = datasourceName
}

func ExecutorCreatorSqlite() (string, executor.Executor, *string, []params.Params) {
    return sqliteName, &Executor{}, &sqliteDatasourceName, []params.Params{
        {
            Key:          "sql",
            Required:     true,
            DefaultValue: "",
            Description:  "SQLite SQL 查询",
        },
    }
}

// ==================== 核心实现 ====================

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

## 实际示例

### SQL Executor 组件（完整版本）

基于实际 etl-go 项目中的 SQL Executor 组件实现：

```go
package sql

import (
    "database/sql"
    "fmt"

    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/executor"
    "github.com/BernardSimon/etl-go/etl/core/params"
    "log"
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
            Description:  "MySQL SQL 查询",
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
            Description:  "PostgreSQL SQL 查询",
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
            Description:  "SQLite SQL 查询",
        },
    }
}

// ==================== 核心实现 ====================

type Executor struct {
    db         *sql.DB
    results    sql.Result
    lastInsertID int64
    rowsAffected int64
    datasource *datasource.Datasource
    queryType  string // INSERT, UPDATE, DELETE, DDL, etc.
}

func (s *Executor) Open(config map[string]string, dataSource *datasource.Datasource) error {
    query, ok := config["sql"]
    if !ok || query == "" {
        return fmt.Errorf("sql executor: config is missing or has invalid 'sql'")
    }
    
    s.datasource = dataSource
    s.db = (*s.datasource).Open().(*sql.DB)
    
    // 确定查询类型
    s.queryType = determineQueryType(query)
    
    var err error
    s.results, err = s.db.Exec(query)
    if err != nil {
        return fmt.Errorf("sql executor: failed to execute sql: %w", err)
    }
    
    // 获取执行结果
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

// GetExecutionResult 返回执行结果
func (s *Executor) GetExecutionResult() ExecutionResult {
    return ExecutionResult{
        QueryType:    s.queryType,
        RowsAffected: s.rowsAffected,
        LastInsertID: s.lastInsertID,
    }
}

// ExecutionResult 执行结果结构
type ExecutionResult struct {
    QueryType    string
    RowsAffected int64
    LastInsertID int64
}

// determineQueryType 确定 SQL 查询类型
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

### CSV Executor 示例（批量导入）

```go
package csv

import (
    "encoding/csv"
    "fmt"
    "os"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/executor"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

type CSVEexecutor struct {
    file      *os.File
    reader    *csv.Reader
    delimiter rune
}

var csvExecName = "csv-executor"

func CSVEexecutorCreator() (string, executor.Executor, *string, []params.Params) {
    return csvExecName, &CSVEexecutor{}, nil, []params.Params{
        {
            Key:          "filePath",
            Required:     true,
            DefaultValue: "",
            Description:  "CSV 文件路径",
        },
        {
            Key:          "delimiter",
            DefaultValue: ",",
            Required:     false,
            Description:  "分隔符",
        },
    }
}

func (e *CSVEexecutor) Open(config map[string]string, dataSource *datasource.Datasource) error {
    filePath, ok := config["filePath"]
    if !ok || filePath == "" {
        return fmt.Errorf("csv executor: filePath is required")
    }
    
    e.file, err := os.Open(filePath)
    if err != nil {
        return fmt.Errorf("csv executor: failed to open file: %w", err)
    }
    
    delimiter := ','
    if delimStr, ok := config["delimiter"]; ok && len(delimStr) > 0 {
        delimiter = rune(delimStr[0])
    }
    e.delimiter = delimiter
    
    e.reader = csv.NewReader(e.file)
    e.reader.Comma = delimiter
    
    return nil
}

func (e *CSVEexecutor) Close() error {
    if e.file != nil {
        return e.file.Close()
    }
    return nil
}
```

## 高级功能实现

### 1. 事务支持

```go
// TransactionalExecutor 支持事务的执行器
type TransactionalExecutor struct {
    executor   Executor
    tx         *sql.Tx
    autoCommit bool
}

func (t *TransactionalExecutor) ExecuteWithTransaction(sql string) error {
    var err error
    
    if t.autoCommit {
        // 自动提交模式
        err = t.executor.Execute(sql)
    } else {
        // 手动提交模式
        if t.tx == nil {
            t.tx, err = t.executor.Begin()
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

### 2. 批量执行

```go
// BatchExecutor 批量执行器
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

func (b *BatchExecutor) executeBatch(batch [][]interface{}) (ExecutionResult, error) {
    // 构建批次化 SQL
    sql := b.buildBatchSQL(batch)
    
    // 执行
    executor := b.baseExecutor
    err := executor.Open(map[string]string{"sql": sql}, nil)
    if err != nil {
        return ExecutionResult{}, err
    }
    defer executor.Close()
    
    return executor.GetExecutionResult(), nil
}

func (b *BatchExecutor) buildBatchSQL(batch [][]interface{}) string {
    // 构建 INSERT INTO table VALUES (?, ?), (?, ?), ...
    values := make([]string, len(batch))
    for i, row := range batch {
        placeholders := make([]string, len(row))
        for j := range placeholders {
            placeholders[j] = "?"
        }
        values[i] = "(" + strings.Join(placeholders, ", ") + ")"
    }
    
    return fmt.Sprintf("INSERT INTO table VALUES %s", strings.Join(values, ", "))
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

### 3. SQL 预处理

```go
// PreparedExecutor 预编译执行器
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

### 4. SQL 验证器

```go
// SQLValidatorExecutor SQL 验证执行器
type SQLValidatorExecutor struct {
    baseExecutor Executor
    whitelist    []string
    blacklist    []string
}

func (v *SQLValidatorExecutor) Execute(sql string) error {
    // 安全检查
    if err := v.validateSQL(sql); err != nil {
        return err
    }
    
    return v.baseExecutor.Execute(sql)
}

func (v *SQLValidatorExecutor) validateSQL(sql string) error {
    sqlUpper := strings.ToUpper(sql)
    
    // 检查黑名单
    for _, banned := range v.blacklist {
        if strings.Contains(sqlUpper, banned) {
            return fmt.Errorf("SQL contains forbidden keyword: %s", banned)
        }
    }
    
    // 检查白名单
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

## 性能优化指南

### 1. 连接池优化

```go
// OptimizeConnPool 优化数据库连接池
func OptimizeConnPool(db *sql.DB, maxSize, minSize int) {
    db.SetMaxOpenConns(maxSize)
    db.SetMinOpenConns(minSize)
    db.SetMaxIdleConns(maxSize / 2)
    db.SetConnMaxLifetime(30 * time.Minute)
}
```

### 2. 异步执行

```go
// AsyncExecutor 异步执行器
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

### 3. SQL 缓存

```go
// CachedExecutor SQL 缓存执行器
type CachedExecutor struct {
    executor Executor
    cache    map[string]interface{}
}

func (c *CachedExecutor) Execute(sql string) error {
    // 对于 SELECT 语句使用缓存
    if strings.HasPrefix(strings.ToUpper(sql), "SELECT") {
        if cached, exists := c.cache[sql]; exists {
            return cached
        }
    }
    
    err := c.executor.Execute(sql)
    c.cache[sql] = err
    
    return err
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

func TestSQLExecutor_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "有效 SQL",
            config: map[string]string{
                "sql": "SELECT 1",
            },
            expectError: false,
        },
        {
            name: "缺少 SQL",
            config: map[string]string{},
            expectError: true,
            errorMsg:    "sql",
        },
        {
            name: "空 SQL",
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
            // 需要使用 mock datasource
            // err := executor.Open(tt.config, mockDataSource)
            
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
        {"ALTER TABLE test ADD COLUMN name VARCHAR(100)", "DDL"},
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

## 最佳实践

### 1. 安全性
- **SQL 注入防护**: 使用预编译语句
- **权限控制**: 最小权限原则
- **输入验证**: 验证用户输入
- **审计日志**: 记录所有执行操作

### 2. 性能
- **连接复用**: 使用连接池
- **批量操作**: 减少网络 IO
- **查询优化**: 使用索引和 EXPLAIN
- **异步处理**: 非阻塞执行

### 3. 可靠性
- **事务支持**: 保证数据一致性
- **重试机制**: 处理临时失败
- **超时控制**: 防止长时间等待
- **监控告警**: 及时发现异常

### 4. 可维护性
- **代码规范**: 统一命名和格式
- **注释完善**: 说明复杂逻辑
- **单元测试**: 保证质量
- **文档清晰**: 使用说明和示例

## 常见问题

### 1. SQL 注入风险
**问题**: 直接使用用户输入可能导致 SQL 注入
**解决方案**:
- 使用预编译语句
- 验证和过滤输入
- 限制 SQL 关键字
- 使用 ORM 框架

### 2. 长时间运行查询
**问题**: 复杂查询导致超时
**解决方案**:
- 设置合理超时时间
- 使用分页和分批
- 添加适当索引
- 异步执行

### 3. 连接泄露
**问题**: 忘记关闭连接导致资源泄露
**解决方案**:
- 使用 defer 确保关闭
- 实现自动清理机制
- 定期监控连接数
- 使用连接池

### 4. 死锁问题
**问题**: 并发操作导致死锁
**解决方案**:
- 保持事务顺序一致
- 缩短事务时间
- 使用合适的隔离级别
- 检测和恢复死锁

## 调试技巧

### 1. 启用详细日志
```go
func (e *Executor) EnableDebug() {
    e.db.LogMode(true)
}

// 或者使用自定义日志
func (e *Executor) debugLog(sql string, params ...interface{}) {
    log.Printf("Executing: %s with params: %v", sql, params)
}
```

### 2. 慢查询监控
```go
func (e *Executor) MonitorSlowQueries(threshold time.Duration) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        // 查询慢查询日志
        var count int
        e.db.QueryRow("SHOW SESSION STATUS LIKE 'Slow_queries'").Scan(&count)
        
        if count > 100 {
            log.Warnf("High slow query count: %d", count)
        }
    }
}
```

### 3. 执行计划分析
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

## 下一步

完成执行器组件开发后，您可以：
1. **[开发变量组件](./develop-component-variable.md)** - 学习如何使用动态变量
2. **[集成测试](#测试开发)** - 测试整个 ETL 流程
3. **[部署生产](#最佳实践)** - 配置生产环境
4. **[监控运维](#调试技巧)** - 添加监控和告警

---

*文档版本: 1.0.0*  
*最后更新：2026-03-17*  
*作者：etl-go 开发团队*