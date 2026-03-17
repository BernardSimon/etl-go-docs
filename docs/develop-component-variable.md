---
outline: deep
---

# 变量组件开发

变量组件（Variable）是 etl-go 中负责从数据源动态获取配置值的核心组件。本文档详细介绍如何开发自定义变量组件，包括接口实现、SQL 查询、结果解析和安全验证。

## 变量组件概述

### 作用与职责
变量组件负责：
- **动态获取**: 从数据库执行 SELECT 查询获取配置值
- **类型转换**: 将查询结果转换为字符串格式
- **安全验证**: 防止 SQL 注入和其他安全风险
- **错误处理**: 处理查询过程中的异常
- **缓存支持**: 可选地缓存查询结果提高性能

### 核心接口
在 `etl/core/variable` 中定义：
```go
// 变量接口
type Variable interface {
    // 获取变量值
    Get(config map[string]string, dataSource *datasource.Datasource) (string, error)
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/variable/
└── your-variable/        # 自定义变量名称
    ├── main.go          # 主实现文件
    ├── go.mod           # 模块定义
    ├── README.md        # 组件说明
    └── test/            # 测试文件
        └── main_test.go
```

### 2. 定义组件元数据

每个变量组件需要导出一个或多个创建器函数：

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

// VariableCreator 创建器函数 - 必须导出
func VariableCreator() (string, variable.Variable, *string, []params.Params) {
    return name, &Variable{}, nil, []params.Params{
        {
            Key:          "query",
            DefaultValue: "",
            Required:     true,
            Description:  "SQL 查询语句",
        },
    }
}
```

### 3. 实现变量接口

#### 基础实现模板

```go
package sql

import (
    "database/sql"
    "errors"
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
            Description:  "SQL 查询语句",
        },
    }
}

func (v *Variable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query, exist := config["query"]
    if !exist {
        return "", errors.New("variable query is required")
    }
    
    // 验证查询
    if err := v.validateQuery(query); err != nil {
        return "", err
    }
    
    // 打开数据库连接
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    // 执行查询
    var result string
    err := db.QueryRow(query).Scan(&result)
    if err != nil {
        return "", fmt.Errorf("failed to execute query: %w", err)
    }
    
    return result, nil
}

// validateQuery 验证查询安全性
func (v *Variable) validateQuery(query string) error {
    trimmedSql := strings.TrimSpace(query)
    upperSql := strings.ToUpper(trimmedSql)

    // 必须以 SELECT 开头
    if !strings.HasPrefix(upperSql, "SELECT") {
        return errors.New("variable should have SELECT prefix")
    }

    // 检查是否包含危险关键字
    dangerousKeywords := []string{"INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "EXEC"}
    for _, keyword := range dangerousKeywords {
        if strings.Contains(upperSql, keyword) {
            return errors.New("variable should not contain dangerous keywords")
        }
    }

    return nil
}
```

## 实际示例

### SQL Variable 组件（完整版本）

基于实际 etl-go 项目中的 SQL Variable 组件实现：

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
            Description:  "MySQL 查询",
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
            Description:  "PostgreSQL 查询",
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
            Description:  "SQLite 查询",
        },
    }
}

// ==================== 核心实现 ====================

type Variable struct {
}

func (s *Variable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query, exist := config["query"]
    if !exist {
        return "", errors.New("variable query is required")
    }
    
    // 验证查询
    if err := validVariable(config); err != nil {
        return "", err
    }
    
    // 打开数据库连接
    db := (*dataSource).Open().(*sql.DB)
    defer (*dataSource).Close()
    
    // 执行查询
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

    // 必须以 SELECT 开头
    if !strings.HasPrefix(upperSql, "SELECT") {
        return errors.New("variable Should Has SELECT Prefix")
    }

    // 检查是否包含危险关键字
    dangerousKeywords := []string{"INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "EXEC"}
    for _, keyword := range dangerousKeywords {
        if strings.Contains(upperSql, keyword) {
            return errors.New("variable Should Not Contains Dangerous Keywords")
        }
    }
    
    return nil
}
```

## 高级功能实现

### 1. 带参数化的变量查询

```go
// ParametrizedVariable 带参数的变量查询
type ParametrizedVariable struct {
    cacheEnabled bool
    cacheTimeout time.Duration
}

func (p *ParametrizedVariable) GetWithParams(config map[string]string, params map[string]interface{}, dataSource *datasource.Datasource) (string, error) {
    query := config["query"]
    
    // 替换占位符
    for key, value := range params {
        placeholder := ":" + key
        query = strings.ReplaceAll(query, placeholder, fmt.Sprintf("%v", value))
    }
    
    // 验证查询
    if err := p.validateQuery(query); err != nil {
        return "", err
    }
    
    // 执行查询
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

### 2. 多行返回的变量查询

```go
// MultiValueVariable 多值变量查询
type MultiValueVariable struct {
    separator string
}

func (m *MultiValueVariable) Get(config map[string]string, dataSource *datasource.Datasource) ([]string, error) {
    query := config["query"]
    sep := ","
    if sepConfig, ok := config["separator"]; ok {
        sep = sepConfig
    }
    
    // 验证查询
    if err := m.validateQuery(query); err != nil {
        return nil, err
    }
    
    // 执行查询
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

// GetStringJoin 将结果拼接成单个字符串
func (m *MultiValueVariable) GetAsString(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    values, err := m.Get(config, dataSource)
    if err != nil {
        return "", err
    }
    
    return strings.Join(values, m.separator), nil
}
```

### 3. 带缓存的变量查询

```go
// CachedVariable 带缓存的变量查询
type CachedVariable struct {
    baseVariable variable.Variable
    cache        sync.Map
    ttl          time.Duration
}

func (c *CachedVariable) Get(config map[string]string, dataSource *datasource.Datasource) (string, error) {
    query := config["query"]
    
    // 检查缓存
    if cachedResult, exists := c.cache.Load(query); exists {
        if time.Since(cachedTime.(time.Time)) < c.ttl {
            return cachedResult.(string), nil
        } else {
            c.cache.Delete(query)
        }
    }
    
    // 查询并缓存
    result, err := c.baseVariable.Get(config, dataSource)
    if err != nil {
        return "", err
    }
    
    c.cache.Store(query, result)
    c.cacheStoreTime(query, time.Now())
    
    return result, nil
}

func (c *CachedVariable) cacheStoreTime(key string, t time.Time) {
    c.cache.Store(key+"__time__", t)
}
```

### 4. 组合式变量

```go
// CompositeVariable 组合多个变量
type CompositeVariable struct {
    variables []variable.Variable
    config []map[string]string
    transformer func([]string) string
}

func (c *CompositeVariable) Get(dataSource *datasource.Datasource) (string, error) {
    results := make([]string, len(c.variables))
    
    for i, v := range c.variables {
        result, err := v.Get(c.config[i], dataSource)
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

## 性能优化指南

### 1. 批量查询优化

```go
// BatchVariableQuery 批量查询单个表
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

### 2. 预编译查询

```go
// PrecompiledVariable 预编译变量
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

### 3. 异步变量获取

```go
// AsyncVariable 异步获取变量
type AsyncVariable struct {
    executor Executor
    variable Variable
    queue chan QueryTask
}

type QueryTask struct {
    query string
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

## 测试开发

### 单元测试示例

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
            name: "有效 SELECT 查询",
            config: map[string]string{
                "query": "SELECT name FROM users WHERE id = 1",
            },
            expectError: false,
        },
        {
            name: "缺少查询",
            config: map[string]string{},
            expectError: true,
            errorMsg:    "query is required",
        },
        {
            name: "非 SELECT 查询",
            config: map[string]string{
                "query": "UPDATE users SET name='test'",
            },
            expectError: true,
            errorMsg:    "SELECT Prefix",
        },
        {
            name: "包含危险关键字",
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

func TestVariable_Get(t *testing.T) {
    // 测试实际查询功能
    // 需要使用 mock datasource
}
```

## 最佳实践

### 1. 安全性
- **只读查询**: 只允许 SELECT 语句
- **黑名单过滤**: 阻止危险关键字
- **输入验证**: 严格验证用户输入
- **最小权限**: 使用只读账号

### 2. 性能
- **查询优化**: 使用索引和 EXPLAIN
- **结果限制**: 使用 LIMIT 控制返回行数
- **缓存策略**: 合理设置缓存 TTL
- **异步处理**: 非关键路径异步获取

### 3. 可靠性
- **超时控制**: 防止查询长时间阻塞
- **重试机制**: 处理临时失败
- **默认值**: 提供合理的默认值
- **降级方案**: 查询失败时的回退策略

### 4. 可维护性
- **命名规范**: 清晰的变量命名
- **注释完善**: 说明用途和约束
- **配置灵活**: 易于修改和优化
- **日志记录**: 记录关键操作

## 常见问题

### 1. SQL 注入风险
**问题**: 构造恶意查询可能导致 SQL 注入
**解决方案**:
- 严格验证查询语法
- 禁止危险关键字
- 使用预编译语句
- 只允许白名单字符

### 2. 查询超时
**问题**: 复杂查询导致超时
**解决方案**:
- 设置合理的超时时间
- 添加适当索引
- 使用 LIMIT 限制结果
- 异步执行长查询

### 3. 内存占用过高
**问题**: 大量结果导致内存溢出
**解决方案**:
- 限制单次查询结果数量
- 流式处理大数据集
- 及时释放查询资源
- 使用分页技术

### 4. 数据一致性
**问题**: 并发查询导致数据不一致
**解决方案**:
- 使用事务隔离级别
- 加锁保护
- 版本控制
- 冲突检测

## 调试技巧

### 1. 启用详细日志
```go
func (v *Variable) EnableDebug() {
    log.Printf("Variable query enabled for debug")
}

// 记录查询信息
func (v *Variable) debugLog(query string, result string, err error) {
    log.Printf("Query: %s, Result: %s, Error: %v", query, result, err)
}
```

### 2. 慢查询监控
```go
func (v *Variable) MonitorSlowQueries(threshold time.Duration) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        // 统计慢查询数量
        slowCount := getSlowQueryCount()
        if slowCount > 10 {
            log.Warnf("High slow query count in variable: %d", slowCount)
        }
    }
}
```

### 3. 查询分析
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

## 下一步

完成变量组件开发后，您可以：
1. **[集成测试](#测试开发)** - 测试整个 ETL 流程中的变量使用
2. **[部署生产](#最佳实践)** - 配置生产环境参数
3. **[监控运维](#调试技巧)** - 添加监控和告警
4. **[关于 etl-go](./about.md)** - 了解项目背景

---

*文档版本: 1.0.0*  
*最后更新：2026-03-17*  
*作者：etl-go 开发团队*