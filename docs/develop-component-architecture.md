---
outline: deep
---

# 组件开发架构

本文档详细说明 etl-go 组件开发的核心架构、开发约定和最佳实践，帮助开发者理解和创建自定义组件。

## 组件体系概述

etl-go 采用**插件化组件架构**，所有 ETL 功能都通过组件实现。组件体系分为六大类：

```
组件体系
├── 数据源 (DataSource) - 数据库连接管理
├── 数据输入 (Source) - 数据提取
├── 数据处理 (Processor) - 数据转换和清洗
├── 数据输出 (Sink) - 数据加载和写入
├── 执行器 (Executor) - 执行操作
└── 变量 (Variable) - 动态变量计算
```

## 组件接口定义

### 1. 基础接口

所有组件都实现 `Component` 基础接口：

```go
// 组件基础接口
type Component interface {
    // 初始化组件
    Initialize(ctx Context, params Params) error
    
    // 获取组件名称
    GetName() string
    
    // 获取组件类型
    GetType() string
    
    // 获取组件版本
    GetVersion() string
    
    // 验证配置
    ValidateConfig() error
}
```

### 2. 特定组件接口

#### 数据源接口 (`DataSource`)
```go
type DataSource interface {
    Component
    
    // 建立连接
    Connect() error
    
    // 断开连接
    Disconnect() error
    
    // 获取连接对象
    GetConnection() interface{}
    
    // 测试连接
    TestConnection() error
    
    // 获取连接信息
    GetConnectionInfo() map[string]interface{}
}
```

#### 数据输入接口 (`Source`)
```go
type Source interface {
    Component
    
    // 读取数据
    Read() ([]Record, error)
    
    // 批量读取
    ReadBatch(batchSize int) ([]Record, error)
    
    // 获取总记录数
    GetTotalCount() (int64, error)
    
    // 关闭资源
    Close() error
    
    // 获取元数据
    GetMetadata() SourceMetadata
}
```

#### 数据处理接口 (`Processor`)
```go
type Processor interface {
    Component
    
    // 处理单条记录
    Process(record Record) (Record, error)
    
    // 批量处理
    ProcessBatch(records []Record) ([]Record, error)
    
    // 获取处理统计
    GetStats() ProcessorStats
    
    // 重置状态
    Reset() error
}
```

#### 数据输出接口 (`Sink`)
```go
type Sink interface {
    Component
    
    // 写入单条记录
    Write(record Record) error
    
    // 批量写入
    WriteBatch(records []Record) error
    
    // 提交事务
    Commit() error
    
    // 回滚事务
    Rollback() error
    
    // 关闭资源
    Close() error
}
```

#### 执行器接口 (`Executor`)
```go
type Executor interface {
    Component
    
    // 执行操作
    Execute() error
    
    // 获取执行结果
    GetResult() ExecutorResult
    
    // 验证执行条件
    Validate() error
    
    // 清理执行资源
    Cleanup() error
}
```

#### 变量接口 (`Variable`)
```go
type Variable interface {
    Component
    
    // 获取变量值
    GetValue() (interface{}, error)
    
    // 刷新变量值
    Refresh() error
    
    // 获取变量类型
    GetValueType() string
    
    // 检查变量是否过期
    IsExpired() bool
}
```

## 组件开发约定

### 1. 目录结构约定

#### 组件包结构
```
components/
├── datasource/          # 数据源组件
│   ├── mysql/          # MySQL 数据源
│   │   ├── datasource.go
│   │   ├── config.go
│   │   ├── connection.go
│   │   └── go.mod
│   ├── postgre/        # PostgreSQL 数据源
│   └── sqlite/         # SQLite 数据源
├── sources/            # 数据输入组件
│   ├── sql/           # SQL 查询输入
│   ├── csv/           # CSV 文件输入
│   └── json/          # JSON 文件输入
├── processors/         # 数据处理组件
│   ├── convertType/   # 类型转换
│   ├── filterRows/    # 行过滤
│   └── maskData/      # 数据脱敏
├── sinks/             # 数据输出组件
│   ├── sql/          # SQL 表输出
│   ├── csv/          # CSV 文件输出
│   └── json/         # JSON 文件输出
├── executor/          # 执行器组件
│   └── sql/          # SQL 执行器
└── variable/          # 变量组件
    └── sql/          # SQL 查询变量
```

#### 单个组件结构
```
components/datasource/mysql/
├── datasource.go      # 主实现文件（必须）
├── config.go          # 配置定义（可选）
├── connection.go      # 连接管理（可选）
├── pool.go           # 连接池（可选）
├── utils.go          # 工具函数（可选）
├── go.mod           # 模块定义（必须）
├── README.md        # 组件说明（推荐）
└── test/            # 测试文件
    ├── datasource_test.go
    └── config_test.go
```

### 2. 命名约定

#### 文件命名
- 主文件：`datasource.go`, `source.go`, `processor.go`, `sink.go`, `executor.go`, `variable.go`
- 配置文件：`config.go`
- 测试文件：`*_test.go`

#### 类型命名
- 结构体：`MySQLDataSource`, `SQLSource`, `ConvertTypeProcessor`
- 接口实现：`mysqlDataSource`, `sqlSource`, `convertTypeProcessor`
- 构造函数：`NewMySQLDataSource`, `NewSQLSource`, `NewConvertTypeProcessor`

#### 函数命名
- 初始化：`Initialize()`
- 资源清理：`Close()`, `Cleanup()`
- 数据处理：`Process()`, `Transform()`, `Filter()`
- 数据读写：`Read()`, `Write()`, `Load()`, `Save()`

### 3. 配置约定

#### 配置结构定义
```go
// 组件配置基类
type BaseConfig struct {
    Name        string                 `json:"name" yaml:"name"`
    Type        string                 `json:"type" yaml:"type"`
    Description string                 `json:"description,omitempty" yaml:"description,omitempty"`
    Enabled     bool                   `json:"enabled" yaml:"enabled"`
    Timeout     int                    `json:"timeout,omitempty" yaml:"timeout,omitempty"`
    Retry       RetryConfig            `json:"retry,omitempty" yaml:"retry,omitempty"`
}

// MySQL 数据源配置
type MySQLConfig struct {
    BaseConfig
    Host     string `json:"host" yaml:"host"`
    Port     int    `json:"port" yaml:"port"`
    Username string `json:"username" yaml:"username"`
    Password string `json:"password" yaml:"password"`
    Database string `json:"database" yaml:"database"`
    Charset  string `json:"charset,omitempty" yaml:"charset,omitempty"`
    
    // 连接池配置
    MaxOpenConns    int `json:"maxOpenConns,omitempty" yaml:"maxOpenConns,omitempty"`
    MaxIdleConns    int `json:"maxIdleConns,omitempty" yaml:"maxIdleConns,omitempty"`
    ConnMaxLifetime int `json:"connMaxLifetime,omitempty" yaml:"connMaxLifetime,omitempty"`
}
```

#### 配置验证
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

### 4. 错误处理约定

#### 错误定义
```go
// 组件错误类型
var (
    ErrConnectionFailed = errors.New("connection failed")
    ErrInvalidConfig    = errors.New("invalid configuration")
    ErrDataReadFailed   = errors.New("data read failed")
    ErrDataWriteFailed  = errors.New("data write failed")
    ErrTimeout          = errors.New("operation timeout")
)

// 带上下文的错误
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

#### 错误处理模式
```go
func (s *SQLSource) Read() ([]Record, error) {
    // 尝试读取
    records, err := s.readFromDatabase()
    if err != nil {
        // 包装错误，添加上下文
        return nil, NewComponentError(
            "READ_FAILED",
            "failed to read data from database",
            err,
        ).WithContext("query", s.query).WithContext("params", s.params)
    }
    
    // 验证数据
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

### 5. 日志约定

#### 日志级别
- `DEBUG`: 详细调试信息
- `INFO`: 一般操作信息
- `WARN`: 警告信息，不影响主要功能
- `ERROR`: 错误信息，需要关注
- `FATAL`: 严重错误，导致组件无法运行

#### 日志格式
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

## 组件注册机制

### 1. 自动注册

#### 使用 `init()` 函数
```go
package mysql

import (
    "github.com/BernardSimon/etl-go/etl/factory"
)

func init() {
    // 注册 MySQL 数据源
    factory.RegisterDataSource("mysql", NewMySQLDataSource)
    
    // 注册配置验证器
    factory.RegisterConfigValidator("mysql", ValidateMySQLConfig)
}
```

### 2. 手动注册

#### 在应用启动时注册
```go
func main() {
    // 注册自定义组件
    factory.RegisterDataSource("custom", NewCustomDataSource)
    factory.RegisterSource("custom", NewCustomSource)
    factory.RegisterProcessor("custom", NewCustomProcessor)
    
    // 启动应用
    app.Start()
}
```

### 3. 动态注册

#### 从配置文件加载
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
        // 动态加载组件
        comp, err := loadComponentDynamic(compConfig)
        if err != nil {
            return err
        }
        
        // 注册组件
        factory.RegisterComponent(name, comp)
    }
    
    return nil
}
```

## 组件生命周期

### 1. 生命周期阶段
```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│  创建    │────▶│  初始化   │────▶│   运行    │────▶│  清理   │
└─────────┘     └──────────┘     └──────────┘     └─────────┘
     │               │                │               │
     ▼               ▼                ▼               ▼
  New()        Initialize()      Process()       Close()
```

### 2. 生命周期管理

```go
// 生命周期管理器
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
    
    // 逆序关闭，依赖关系处理
    for i := len(lm.components) - 1; i >= 0; i-- {
        comp := lm.components[i]
        if err := comp.Close(); err != nil {
            errors = append(errors, fmt.Errorf("failed to close component %s: %w", comp.GetName(), err))
        }
        lm.state[comp.GetName()] = StateClosed
    }
    
    if len(errors) > 0 {
        return errors[0] // 返回第一个错误
    }
    return nil
}
```

## 组件测试约定

### 1. 单元测试

#### 测试文件结构
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
        // 准备
        config := &MySQLConfig{
            Host:     "localhost",
            Port:     3306,
            Username: "test",
            Password: "test",
            Database: "testdb",
        }
        
        ds := NewMySQLDataSource(config)
        
        // 执行
        err := ds.Connect()
        
        // 断言
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

### 2. 集成测试

```go
func TestMySQLDataSource_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }
    
    // 启动测试数据库
    dbContainer := startTestMySQLContainer(t)
    defer dbContainer.Stop()
    
    // 创建数据源
    ds := NewMySQLDataSource(&MySQLConfig{
        Host:     dbContainer.Host(),
        Port:     dbContainer.Port(),
        Username: "root",
        Password: "test",
        Database: "testdb",
    })
    
    // 测试连接
    require.NoError(t, ds.Connect())
    defer ds.Disconnect()
    
    // 测试查询
    conn := ds.GetConnection().(*sql.DB)
    rows, err := conn.Query("SELECT 1")
    require.NoError(t, err)
    defer rows.Close()
    
    // 验证结果
    var result int
    require.True(t, rows.Next())
    require.NoError(t, rows.Scan(&result))
    assert.Equal(t, 1, result)
}
```

## 性能优化指南

### 1. 连接池优化

```go
type OptimizedConnectionPool struct {
    pool      *sql.DB
    stats     PoolStats
    lastReset time.Time
}

func (p *OptimizedConnectionPool) Get() (*sql.Conn, error) {
    // 检查是否需要重置连接池
    if time.Since(p.lastReset) > resetInterval {
        p.resetIdleConnections()
    }
    
    // 获取连接
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

### 2. 批量处理优化

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
    
    // 批量处理
    results, err := bp.processor.ProcessBatch(bp.buffer)
    if err != nil {
        return nil, err
    }
    
    // 清空缓冲区
    bp.buffer = bp.buffer[:0]
    
    // 返回最后一个结果
    if len(results) > 0 {
        return results[len(results)-1], nil
    }
    
    return nil, nil
}
```

## 组件开发流程

### 1. 开发步骤

1. **需求分析**: 确定组件功能和接口
2. **设计接口**: 定义组件接口和配置结构
3. **实现核心**: 编写组件主要逻辑
4. **添加测试**: 编写单元测试和集成测试
5. **文档编写**: 添加使用说明和示例
6. **代码审查**: 提交代码进行审查
7. **集成测试**: 在完整环境中测试
8. **发布部署**: 发布组件到仓库

### 2. 代码模板

#### 组件模板
```go
// 组件说明：简要描述组件功能
// 作者：您的姓名
// 版本：1.0.0
// 创建时间：2026-03-17

package customcomponent

import (
    "errors"
    "fmt"
    "time"
    
    "github.com/BernardSimon/etl-go/etl/core"
    "github.com/BernardSimon/etl-go/etl/factory"
)

// 组件配置
type CustomConfig struct {
    core.BaseConfig
    // 添加自定义配置字段
    CustomField string `json:"customField" yaml:"customField"`
}

// 组件实现
type CustomComponent struct {
    config *CustomConfig
    state  ComponentState
    stats  ComponentStats
}

// 创建新实例
func NewCustomComponent(config *CustomConfig) (*CustomComponent, error) {
    // 验证配置
    if err := config.Validate(); err != nil {
        return nil, err
    }
    
    return &CustomComponent{
        config: config,
        state:  StateCreated,
        stats:  ComponentStats{},
    }, nil
}

// 初始化组件
func (c *CustomComponent) Initialize(ctx core.Context, params core.Params) error {
    c.state = StateInitializing
    
    // 初始化逻辑
    // ...
    
    c.state = StateInitialized
    return nil
}

// 主要处理逻辑
func (c *CustomComponent) Process(record core.Record) (core.Record, error) {
    c.stats.ProcessedCount++
    startTime := time.Now()
    
    // 处理逻辑
    // ...
    
    c.stats.LastProcessTime = time.Since(startTime)
    return record, nil
}

// 关闭组件
func (c *CustomComponent) Close() error {
    c.state = StateClosing
    
    // 清理逻辑
    // ...
    
    c.state = StateClosed
    return nil
}

// 注册组件
func init() {
    factory.RegisterProcessor("custom", func() core.Processor {
        return &CustomComponent{}
    })
}
```

## 最佳实践

### 1. 设计原则
- **单一职责**: 每个组件只做一件事
- **开闭原则**: 对扩展开放，对修改关闭
- **依赖倒置**: 依赖抽象，不依赖具体实现
- **接口隔离**: 使用小而专的接口

### 2. 性能考虑
- 使用连接池管理数据库连接
- 实现批量处理减少IO操作
- 合理设置缓冲区大小
- 监控内存使用，避免泄漏

### 3. 可维护性
- 编写清晰的文档和注释
- 使用有意义的变量和函数名
- 保持代码简洁，避免过度设计
- 定期重构，保持代码质量

## 下一步

了解组件开发架构后，您可以：
1. **[开发数据源组件](./develop-component-datasource.md)** - 学习数据源组件开发
2. **[开发数据输入组件](./develop-component-source.md)** - 学习数据提取组件开发
3. **[开发数据处理组件](./develop-component-processor.md)** - 学习数据转换组件开发
4. **[开发数据输出组件](./develop-component-sink.md)** - 学习数据加载组件开发
5. **[开发执行器组件](./develop-component-executor.md)** - 学习执行器组件开发
6. **[开发变量组件](./develop-component-variable.md)** - 学习变量组件开发

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*