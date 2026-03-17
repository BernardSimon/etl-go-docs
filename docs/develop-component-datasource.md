---
outline: deep
---

# 数据源组件开发

数据源组件是 etl-go 中用于管理数据库连接的核心组件。本文档详细介绍如何开发自定义数据源组件，包括接口实现、配置定义、连接管理和最佳实践。

## 数据源组件概述

### 作用与职责
数据源组件负责：
- **连接管理**: 建立和关闭数据库连接
- **连接池管理**: 管理数据库连接池
- **连接验证**: 验证连接的有效性
- **配置管理**: 解析和验证连接配置
- **异常处理**: 处理连接异常和重试

### 核心接口
在 `etl/core/datasource` 中定义：
```go
// 数据源接口
type Datasource interface {
    // 初始化数据源
    Init(config map[string]string) error
    
    // 获取数据库连接
    Open() any
    
    // 关闭数据源
    Close() error
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/datasource/
└── your-datasource/          # 自定义数据源名称
    ├── main.go              # 主实现文件
    ├── go.mod              # 模块定义
    ├── README.md           # 组件说明
    └── test/               # 测试文件
        └── main_test.go
```

### 2. 定义组件元数据

每个数据源组件需要导出一个创建器函数：

```go
package yourdatasource

import (
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
)

// 组件名称（可配置）
var name = "your-datasource"

// 设置自定义名称（可选）
func SetCustomName(customName string) {
    name = customName
}

// 创建器函数 - 必须导出
func DatasourceCreator() (string, datasource.Datasource, []params.Params) {
    return name, &DataSource{}, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "",
            Description:  "数据库主机地址",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "3306",
            Description:  "数据库端口",
        },
        // 更多参数...
    }
}
```

### 3. 实现数据源接口

#### 基础实现模板
```go
package yourdatasource

import (
    "database/sql"
    "fmt"
    "time"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    _ "github.com/your-database-driver" // 导入数据库驱动
)

// DataSource 结构体定义
type DataSource struct {
    db        *sql.DB            // 数据库连接
    config    map[string]string  // 配置信息
    isConnected bool             // 连接状态
    stats     ConnectionStats    // 连接统计
}

// ConnectionStats 连接统计
type ConnectionStats struct {
    TotalConnections int           // 总连接次数
    FailedConnections int          // 失败连接次数
    LastConnectionTime time.Time   // 最后连接时间
    TotalQueryTime    time.Duration // 总查询时间
}
```

#### Init 方法实现
```go
// Init 初始化数据源
func (d *DataSource) Init(config map[string]string) error {
    d.config = config
    
    // 验证必需参数
    if err := d.validateConfig(); err != nil {
        return fmt.Errorf("配置验证失败: %w", err)
    }
    
    // 建立连接
    if err := d.connect(); err != nil {
        d.stats.FailedConnections++
        return fmt.Errorf("连接失败: %w", err)
    }
    
    d.isConnected = true
    d.stats.TotalConnections++
    d.stats.LastConnectionTime = time.Now()
    
    return nil
}

// validateConfig 验证配置
func (d *DataSource) validateConfig() error {
    requiredParams := []string{"host", "port", "user", "password", "database"}
    
    for _, param := range requiredParams {
        if value, ok := d.config[param]; !ok || value == "" {
            return fmt.Errorf("必需参数 %s 未提供", param)
        }
    }
    
    // 验证端口范围
    port := d.config["port"]
    if portNum := 0; portNum < 1 || portNum > 65535 {
        return fmt.Errorf("端口号 %s 无效，必须在 1-65535 范围内", port)
    }
    
    return nil
}

// connect 建立数据库连接
func (d *DataSource) connect() error {
    // 构建连接字符串
    connStr := d.buildConnectionString()
    
    // 打开连接
    db, err := sql.Open("your-driver-name", connStr)
    if err != nil {
        return fmt.Errorf("打开连接失败: %w", err)
    }
    
    // 配置连接池
    d.configureConnectionPool(db)
    
    // 测试连接
    if err := db.Ping(); err != nil {
        db.Close()
        return fmt.Errorf("连接测试失败: %w", err)
    }
    
    d.db = db
    return nil
}

// buildConnectionString 构建连接字符串
func (d *DataSource) buildConnectionString() string {
    // 根据数据库类型构建连接字符串
    // 示例：MySQL格式 "user:password@tcp(host:port)/database"
    return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s",
        d.config["user"],
        d.config["password"],
        d.config["host"],
        d.config["port"],
        d.config["database"],
    )
}

// configureConnectionPool 配置连接池
func (d *DataSource) configureConnectionPool(db *sql.DB) {
    // 设置最大打开连接数
    maxOpenConns := 10
    if val, ok := d.config["maxOpenConns"]; ok {
        if num, err := strconv.Atoi(val); err == nil && num > 0 {
            maxOpenConns = num
        }
    }
    db.SetMaxOpenConns(maxOpenConns)
    
    // 设置最大空闲连接数
    maxIdleConns := 5
    if val, ok := d.config["maxIdleConns"]; ok {
        if num, err := strconv.Atoi(val); err == nil && num > 0 {
            maxIdleConns = num
        }
    }
    db.SetMaxIdleConns(maxIdleConns)
    
    // 设置连接最大生命周期
    connMaxLifetime := time.Hour
    if val, ok := d.config["connMaxLifetime"]; ok {
        if duration, err := time.ParseDuration(val); err == nil && duration > 0 {
            connMaxLifetime = duration
        }
    }
    db.SetConnMaxLifetime(connMaxLifetime)
    
    // 设置连接最大空闲时间
    connMaxIdleTime := 30 * time.Minute
    if val, ok := d.config["connMaxIdleTime"]; ok {
        if duration, err := time.ParseDuration(val); err == nil && duration > 0 {
            connMaxIdleTime = duration
        }
    }
    db.SetConnMaxIdleTime(connMaxIdleTime)
}
```

#### Open 方法实现
```go
// Open 获取数据库连接
func (d *DataSource) Open() any {
    if !d.isConnected || d.db == nil {
        // 尝试重新连接
        if err := d.reconnect(); err != nil {
            return nil
        }
    }
    
    return d.db
}

// reconnect 重新连接
func (d *DataSource) reconnect() error {
    // 关闭旧连接
    if d.db != nil {
        d.db.Close()
    }
    
    // 重新连接
    return d.connect()
}
```

#### Close 方法实现
```go
// Close 关闭数据源
func (d *DataSource) Close() error {
    d.isConnected = false
    
    if d.db != nil {
        if err := d.db.Close(); err != nil {
            return fmt.Errorf("关闭连接失败: %w", err)
        }
        d.db = nil
    }
    
    return nil
}
```

### 4. 添加高级功能

#### 连接健康检查
```go
// HealthCheck 健康检查
func (d *DataSource) HealthCheck() (bool, error) {
    if d.db == nil {
        return false, errors.New("数据库连接未初始化")
    }
    
    // 执行简单查询测试连接
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var result int
    err := d.db.QueryRowContext(ctx, "SELECT 1").Scan(&result)
    if err != nil {
        return false, fmt.Errorf("健康检查失败: %w", err)
    }
    
    if result != 1 {
        return false, errors.New("健康检查结果异常")
    }
    
    return true, nil
}

// IsConnected 检查连接状态
func (d *DataSource) IsConnected() bool {
    if d.db == nil || !d.isConnected {
        return false
    }
    
    // 快速Ping检查
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    err := d.db.PingContext(ctx)
    return err == nil
}
```

#### 连接统计
```go
// GetStats 获取连接统计
func (d *DataSource) GetStats() ConnectionStats {
    return d.stats
}

// ResetStats 重置统计
func (d *DataSource) ResetStats() {
    d.stats = ConnectionStats{}
}
```

#### 事务支持
```go
// BeginTransaction 开始事务
func (d *DataSource) BeginTransaction() (*sql.Tx, error) {
    if !d.IsConnected() {
        return nil, errors.New("数据库未连接")
    }
    
    return d.db.Begin()
}

// BeginTransactionWithContext 带上下文开始事务
func (d *DataSource) BeginTransactionWithContext(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error) {
    if !d.IsConnected() {
        return nil, errors.New("数据库未连接")
    }
    
    return d.db.BeginTx(ctx, opts)
}
```

## 配置参数定义

### 必需参数
每个数据源组件必须定义以下必需参数：

```go
[]params.Params{
    {
        Key:          "host",
        Required:     true,
        DefaultValue: "",
        Description:  "数据库主机地址",
    },
    {
        Key:          "port",
        Required:     true,
        DefaultValue: "3306",
        Description:  "数据库端口",
    },
    {
        Key:          "user",
        Required:     true,
        DefaultValue: "",
        Description:  "数据库用户名",
    },
    {
        Key:          "password",
        Required:     true,
        DefaultValue: "",
        Description:  "数据库密码",
    },
    {
        Key:          "database",
        Required:     true,
        DefaultValue: "",
        Description:  "数据库名称",
    },
}
```

### 可选参数
```go
{
    Key:          "charset",
    Required:     false,
    DefaultValue: "utf8mb4",
    Description:  "字符集设置",
},
{
    Key:          "timeout",
    Required:     false,
    DefaultValue: "30s",
    Description:  "连接超时时间",
},
{
    Key:          "maxOpenConns",
    Required:     false,
    DefaultValue: "10",
    Description:  "最大打开连接数",
},
{
    Key:          "maxIdleConns",
    Required:     false,
    DefaultValue: "5",
    Description:  "最大空闲连接数",
},
{
    Key:          "connMaxLifetime",
    Required:     false,
    DefaultValue: "1h",
    Description:  "连接最大生命周期",
},
{
    Key:          "ssl",
    Required:     false,
    DefaultValue: "false",
    Description:  "是否启用SSL",
},
```

## 实际示例

### MySQL 数据源示例
```go
package mysql

import (
    "database/sql"
    "fmt"
    "strconv"
    "time"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    _ "github.com/go-sql-driver/mysql"
)

type MySQLDataSource struct {
    db           *sql.DB
    config       map[string]string
    isConnected  bool
    connectionID string
}

var name = "mysql"

func SetCustomName(customName string) {
    name = customName
}

func DatasourceCreator() (string, datasource.Datasource, []params.Params) {
    return name, &MySQLDataSource{}, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "localhost",
            Description:  "MySQL服务器地址",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "3306",
            Description:  "MySQL服务器端口",
        },
        {
            Key:          "user",
            Required:     true,
            DefaultValue: "root",
            Description:  "MySQL用户名",
        },
        {
            Key:          "password",
            Required:     true,
            DefaultValue: "",
            Description:  "MySQL密码",
        },
        {
            Key:          "database",
            Required:     true,
            DefaultValue: "",
            Description:  "数据库名称",
        },
        {
            Key:          "charset",
            Required:     false,
            DefaultValue: "utf8mb4",
            Description:  "字符集",
        },
        {
            Key:          "parseTime",
            Required:     false,
            DefaultValue: "true",
            Description:  "是否解析时间",
        },
        {
            Key:          "loc",
            Required:     false,
            DefaultValue: "Local",
            Description:  "时区设置",
        },
    }
}

func (m *MySQLDataSource) Init(config map[string]string) error {
    m.config = config
    
    // 构建连接字符串
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s",
        config["user"],
        config["password"],
        config["host"],
        config["port"],
        config["database"],
    )
    
    // 添加可选参数
    if charset, ok := config["charset"]; ok && charset != "" {
        dsn += "?charset=" + charset
    }
    if parseTime, ok := config["parseTime"]; ok && parseTime != "" {
        if dsn[len(dsn)-1] != '?' {
            dsn += "&"
        }
        dsn += "parseTime=" + parseTime
    }
    if loc, ok := config["loc"]; ok && loc != "" {
        if dsn[len(dsn)-1] != '?' && dsn[len(dsn)-1] != '&' {
            dsn += "&"
        }
        dsn += "loc=" + loc
    }
    
    // 建立连接
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return fmt.Errorf("MySQL连接失败: %w", err)
    }
    
    // 配置连接池
    m.configurePool(db)
    
    // 测试连接
    if err := db.Ping(); err != nil {
        db.Close()
        return fmt.Errorf("MySQL连接测试失败: %w", err)
    }
    
    m.db = db
    m.isConnected = true
    m.connectionID = fmt.Sprintf("mysql-%s-%s", config["host"], config["database"])
    
    return nil
}

func (m *MySQLDataSource) configurePool(db *sql.DB) {
    // 默认连接池配置
    db.SetMaxOpenConns(10)
    db.SetMaxIdleConns(5)
    db.SetConnMaxLifetime(time.Hour)
    
    // 从配置读取连接池设置
    if maxOpen, ok := m.config["maxOpenConns"]; ok {
        if n, err := strconv.Atoi(maxOpen); err == nil && n > 0 {
            db.SetMaxOpenConns(n)
        }
    }
    
    if maxIdle, ok := m.config["maxIdleConns"]; ok {
        if n, err := strconv.Atoi(maxIdle); err == nil && n > 0 {
            db.SetMaxIdleConns(n)
        }
    }
    
    if maxLifetime, ok := m.config["connMaxLifetime"]; ok {
        if d, err := time.ParseDuration(maxLifetime); err == nil && d > 0 {
            db.SetConnMaxLifetime(d)
        }
    }
}

func (m *MySQLDataSource) Open() any {
    return m.db
}

func (m *MySQLDataSource) Close() error {
    m.isConnected = false
    if m.db != nil {
        return m.db.Close()
    }
    return nil
}
```

### PostgreSQL 数据源示例
```go
package postgresql

import (
    "database/sql"
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/datasource"
    "github.com/BernardSimon/etl-go/etl/core/params"
    _ "github.com/lib/pq"
)

type PostgreSQLDataSource struct {
    db          *sql.DB
    config      map[string]string
    isConnected bool
}

var name = "postgresql"

func DatasourceCreator() (string, datasource.Datasource, []params.Params) {
    return name, &PostgreSQLDataSource{}, []params.Params{
        {
            Key:          "host",
            Required:     true,
            DefaultValue: "localhost",
            Description:  "PostgreSQL服务器地址",
        },
        {
            Key:          "port",
            Required:     true,
            DefaultValue: "5432",
            Description:  "PostgreSQL服务器端口",
        },
        {
            Key:          "user",
            Required:     true,
            DefaultValue: "postgres",
            Description:  "PostgreSQL用户名",
        },
        {
            Key:          "password",
            Required:     true,
            DefaultValue: "",
            Description:  "PostgreSQL密码",
        },
        {
            Key:          "database",
            Required:     true,
            DefaultValue: "postgres",
            Description:  "数据库名称",
        },
        {
            Key:          "sslmode",
            Required:     false,
            DefaultValue: "disable",
            Description:  "SSL模式",
        },
        {
            Key:          "search_path",
            Required:     false,
            DefaultValue: "",
            Description:  "搜索路径",
        },
    }
}

func (p *PostgreSQLDataSource) Init(config map[string]string) error {
    p.config = config
    
    // 构建连接参数
    params := []string{
        fmt.Sprintf("host=%s", config["host"]),
        fmt.Sprintf("port=%s", config["port"]),
        fmt.Sprintf("user=%s", config["user"]),
        fmt.Sprintf("password=%s", config["password"]),
        fmt.Sprintf("dbname=%s", config["database"]),
    }
    
    // 添加可选参数
    if sslmode, ok := config["sslmode"]; ok && sslmode != "" {
        params = append(params, fmt.Sprintf("sslmode=%s", sslmode))
    }
    
    if searchPath, ok := config["search_path"]; ok && searchPath != "" {
        params = append(params, fmt.Sprintf("search_path=%s", searchPath))
    }
    
    // 构建连接字符串
    connStr := strings.Join(params, " ")
    
    // 建立连接
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("PostgreSQL连接失败: %w", err)
    }
    
    // 测试连接
    if err := db.Ping(); err != nil {
        db.Close()
        return fmt.Errorf("PostgreSQL连接测试失败: %w", err)
    }
    
    p.db = db
    p.isConnected = true
    
    return nil
}

func (p *PostgreSQLDataSource) Open() any {
    return p.db
}

func (p *PostgreSQLDataSource) Close() error {
    p.isConnected = false
    if p.db != nil {
        return p.db.Close()
    }
    return nil
}
```

## 测试开发

### 单元测试
```go
package mysql

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestMySQLDataSource_Init(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "有效的MySQL配置",
            config: map[string]string{
                "host":     "localhost",
                "port":     "3306",
                "user":     "test",
                "password": "test",
                "database": "testdb",
            },
            expectError: false,
        },
        {
            name: "缺少必需参数",
            config: map[string]string{
                "host": "localhost",
                "port": "3306",
                // 缺少 user, password, database
            },
            expectError: true,
            errorMsg: "必需参数",
        },
        {
            name: "无效端口",
            config: map[string]string{
                "host":     "localhost",
                "port":     "99999", // 无效端口
                "user":     "test",
                "password": "test",
                "database": "testdb",
            },
            expectError: true,
            errorMsg: "端口",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            ds := &MySQLDataSource{}
            err := ds.Init(tt.config)
            
            if tt.expectError {
                require.Error(t, err)
                if tt.errorMsg != "" {
                    assert.Contains(t, err.Error(), tt.errorMsg)
                }
            } else {
                require.NoError(t, err)
                assert.NotNil(t, ds.Open())
            }
        })
    }
}

func TestMySQLDataSource_Open(t *testing.T) {
    ds := &MySQLDataSource{}
    
    // 测试未初始化的数据源
    conn := ds.Open()
    assert.Nil(t, conn)
    
    // 测试已初始化的数据源
    config := map[string]string{
        "host":     "localhost",
        "port":     "3306",
        "user":     "test",
        "password": "test",
        "database": "testdb",
    }
    
    err := ds.Init(config)
    require.NoError(t, err)
    
    conn = ds.Open()
    assert.NotNil(t, conn)
}

func TestMySQLDataSource_Close(t *testing.T) {
    ds := &MySQLDataSource{}
    
    // 测试未初始化的关闭
    err := ds.Close()
    assert.NoError(t, err)
    
    // 测试已初始化的关闭
    config := map[string]string{
        "host":     "localhost",
        "port":     "3306",
        "user":     "test",
        "password": "test",
        "database": "testdb",
    }
    
    err = ds.Init(config)
    require.NoError(t, err)
    
    err = ds.Close()
    assert.NoError(t, err)
}
```

### 集成测试
```go
package mysql

import (
    "context"
    "testing"
    "time"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/wait"
)

func TestMySQLDataSource_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("跳过集成测试")
    }
    
    // 使用Testcontainers启动MySQL容器
    ctx := context.Background()
    
    req := testcontainers.ContainerRequest{
        Image:        "mysql:8.0",
        ExposedPorts: []string{"3306/tcp"},
        Env: map[string]string{
            "MYSQL_ROOT_PASSWORD": "test",
            "MYSQL_DATABASE":      "testdb",
            "MYSQL_USER":          "test",
            "MYSQL_PASSWORD":      "test",
        },
        WaitingFor: wait.ForLog("port: 3306  MySQL Community Server"),
    }
    
    mysqlContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: req,
        Started:          true,
    })
    require.NoError(t, err)
    defer mysqlContainer.Terminate(ctx)
    
    // 获取容器信息
    host, err := mysqlContainer.Host(ctx)
    require.NoError(t, err)
    
    port, err := mysqlContainer.MappedPort(ctx, "3306")
    require.NoError(t, err)
    
    // 创建数据源
    ds := &MySQLDataSource{}
    config := map[string]string{
        "host":     host,
        "port":     port.Port(),
        "user":     "test",
        "password": "test",
        "database": "testdb",
    }
    
    // 测试连接
    err = ds.Init(config)
    require.NoError(t, err)
    
    // 测试查询
    conn := ds.Open().(*sql.DB)
    require.NotNil(t, conn)
    
    var result int
    err = conn.QueryRow("SELECT 1 + 1").Scan(&result)
    require.NoError(t, err)
    assert.Equal(t, 2, result)
    
    // 测试关闭
    err = ds.Close()
    assert.NoError(t, err)
}
```

## 最佳实践

### 1. 连接管理
- **连接池配置**: 合理设置连接池参数，避免资源浪费
- **连接验证**: 定期检查连接健康状态
- **优雅关闭**: 确保连接正确关闭，避免资源泄漏
- **重试机制**: 实现连接失败时的重试逻辑

### 2. 错误处理
- **详细错误信息**: 提供有意义的错误信息和上下文
- **错误分类**: 区分连接错误、配置错误、权限错误等
- **错误恢复**: 实现自动恢复机制

### 3. 性能优化
- **连接复用**: 充分利用连接池
- **参数优化**: 根据数据库类型优化连接参数
- **监控统计**: 收集连接和使用统计信息

### 4. 安全性
- **敏感信息保护**: 密码等敏感信息加密存储
- **连接安全**: 支持SSL/TLS加密连接
- **权限控制**: 使用最小权限原则

## 常见问题

### 1. 连接超时
**问题**: 数据库连接超时
**解决方案**:
- 增加连接超时时间
- 检查网络连通性
- 验证数据库服务状态

### 2. 连接池耗尽
**问题**: 连接池资源不足
**解决方案**:
- 增加最大连接数
- 优化SQL查询性能
- 实现连接复用

### 3. 权限问题
**问题**: 连接权限不足
**解决方案**:
- 检查用户名和密码
- 验证数据库权限设置
- 使用正确的认证方式

## 调试技巧

### 1. 启用详细日志
```go
import "github.com/sirupsen/logrus"

func (d *DataSource) connect() error {
    log := logrus.WithFields(logrus.Fields{
        "component": "datasource",
        "type":      d.config["type"],
        "host":      d.config["host"],
    })
    
    log.Debug("开始建立数据库连接")
    
    // 连接逻辑...
    
    if err != nil {
        log.WithError(err).Error("数据库连接失败")
        return err
    }
    
    log.Info("数据库连接成功")
    return nil
}
```

### 2. 性能监控
```go
func (d *DataSource) monitorPerformance() {
    go func() {
        ticker := time.NewTicker(5 * time.Minute)
        defer ticker.Stop()
        
        for range ticker.C {
            stats := d.db.Stats()
            logrus.WithFields(logrus.Fields{
                "open_connections":   stats.OpenConnections,
                "in_use":             stats.InUse,
                "idle":               stats.Idle,
                "wait_count":         stats.WaitCount,
                "wait_duration":      stats.WaitDuration,
                "max_open_connections": stats.MaxOpenConnections,
            }).Info("数据库连接池统计")
        }
    }()
}
```

## 下一步

完成数据源组件开发后，您可以：
1. **[开发数据输入组件](./develop-component-source.md)** - 学习如何开发数据提取组件
2. **[测试组件集成](#测试开发)** - 确保组件与系统良好集成
3. **[提交组件贡献](#组件贡献)** - 将组件贡献到社区

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*