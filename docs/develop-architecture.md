---
outline: deep
---

# 代码架构

本文档深入解析 etl-go 的整体架构设计，包括核心模块、数据流、并发模型和关键设计决策。

## 架构概览

etl-go 采用**分层模块化架构**，各层之间通过定义良好的接口进行通信。整体架构如下：

```
┌─────────────────────────────────────────────────┐
│                  Web 界面 (Vue.js)               │
├─────────────────────────────────────────────────┤
│             RESTful API (Gin Framework)          │
├─────────────────────────────────────────────────┤
│        业务逻辑层 (任务调度、组件管理)              │
├─────────────────────────────────────────────────┤
│             ETL 引擎层 (流水线执行)                │
├─────────────────────────────────────────────────┤
│         组件层 (数据源、提取、处理、加载)           │
├─────────────────────────────────────────────────┤
│         数据访问层 (GORM + SQLite/MySQL)          │
└─────────────────────────────────────────────────┘
```

## 核心模块详解

### 1. ETL 引擎层 (`etl/`)

#### 1.1 核心接口 (`etl/core/`)
定义所有 ETL 组件的统一接口规范：

```go
// 数据源接口
type DataSource interface {
    Connect() error
    Disconnect() error
    GetConnection() interface{}
}

// 数据提取接口
type Source interface {
    Initialize(ctx Context, params Params) error
    Read() ([]Record, error)
    Close() error
}

// 数据处理接口
type Processor interface {
    Initialize(ctx Context, params Params) error
    Process(records []Record) ([]Record, error)
}

// 数据加载接口
type Sink interface {
    Initialize(ctx Context, params Params) error
    Write(records []Record) error
    Close() error
}

// 执行器接口
type Executor interface {
    Initialize(ctx Context, params Params) error
    Execute() error
}

// 变量接口
type Variable interface {
    Initialize(ctx Context, params Params) error
    GetValue() (interface{}, error)
}
```

#### 1.2 工厂模式 (`etl/factory/`)
统一管理组件的创建和注册：

```go
// 组件注册
factory.RegisterDataSource("mysql", NewMySQLDataSource)
factory.RegisterSource("sql", NewSQLSource)
factory.RegisterProcessor("convertType", NewConvertTypeProcessor)

// 组件创建
source := factory.CreateSource("sql", params)
```

#### 1.3 流水线引擎 (`etl/pipeline/`)
基于 Go 协程和通道的并发执行模型：

```go
// 流水线定义
pipeline := NewPipeline()
pipeline.AddStage("source", sourceComponent)
pipeline.AddStage("processor", processorComponent)
pipeline.AddStage("sink", sinkComponent)

// 执行流水线
result := pipeline.Execute(context)
```

### 2. 组件层 (`components/`)

#### 2.1 数据源组件 (`datasource/`)
- `mysql/`: MySQL 数据库连接
- `postgre/`: PostgreSQL 数据库连接
- `sqlite/`: SQLite 数据库连接
- `doris/`: Doris 数据库连接

#### 2.2 数据提取组件 (`sources/`)
- `sql/`: SQL 查询数据提取
- `csv/`: CSV 文件数据提取
- `json/`: JSON 文件数据提取

#### 2.3 数据处理组件 (`processors/`)
- `convertType/`: 数据类型转换
- `filterRows/`: 行数据过滤
- `maskData/`: 数据脱敏处理
- `renameColumn/`: 列重命名
- `selectColumns/`: 列选择

#### 2.4 数据加载组件 (`sinks/`)
- `sql/`: SQL 表数据加载
- `csv/`: CSV 文件输出
- `json/`: JSON 文件输出
- `doris/`: Doris 快速加载

#### 2.5 执行器组件 (`executor/`)
- `sql/`: SQL 语句执行器

#### 2.6 变量组件 (`variable/`)
- `sql/`: SQL 查询变量

### 3. 服务层 (`server/`)

#### 3.1 API 层 (`api/`)
基于 Gin 框架的 RESTful API：
- `login.go`: 用户认证
- `dataSource.go`: 数据源管理
- `task.go`: 任务管理
- `variable.go`: 变量管理
- `file.go`: 文件管理

#### 3.2 数据模型 (`model/`)
使用 GORM 定义的数据表结构：
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

#### 3.3 任务调度 (`task/`)
基于 cron 表达式的任务调度器：
```go
scheduler := NewScheduler()
scheduler.AddTask("* * * * *", task.Execute)
scheduler.Start()
```

### 4. Web 界面层 (`web/`)
- **技术栈**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **构建工具**: Vite

## 数据流设计

### 标准 ETL 数据流
```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐
│ Executor│───▶│  Source  │───▶│ Processor│───▶│ Sink │
└─────────┘    └──────────┘    └──────────┘    └──────┘
     │              │               │              │
     ▼              ▼               ▼              ▼
预处理SQL       数据提取        数据转换        数据加载
```

### 并发处理模型
etl-go 采用**生产者-消费者模式**实现高并发数据处理：

```go
// 数据通道
dataChan := make(chan Record, bufferSize)

// 生产者协程 (数据提取)
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

// 消费者协程 (数据处理和加载)
go func() {
    for record := range dataChan {
        processed := processor.Process(record)
        sink.Write(processed)
    }
}()
```

### 错误处理机制
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

## 关键设计决策

### 1. 插件化架构
**决策**: 采用插件化设计，将核心引擎与具体实现分离
**优势**:
- 易于扩展新功能
- 组件可独立开发测试
- 支持热插拔

### 2. 接口驱动设计
**决策**: 所有组件通过接口定义行为
**优势**:
- 提高代码可测试性
- 降低模块间耦合
- 支持多态实现

### 3. 通道和协程
**决策**: 使用 Go 原生并发模型
**优势**:
- 高效的内存使用
- 天然的并发安全
- 简洁的代码结构

### 4. 工厂模式
**决策**: 使用工厂模式管理组件生命周期
**优势**:
- 统一组件创建逻辑
- 支持动态组件加载
- 简化配置管理

### 5. 配置驱动
**决策**: 任务配置存储在数据库中
**优势**:
- 支持动态任务调整
- 配置版本化管理
- 易于监控和审计

## 安全性设计

### 1. 认证授权
- **JWT Token**: 基于令牌的身份验证
- **角色权限**: 细粒度的访问控制
- **会话管理**: 安全的会话存储

### 2. 数据安全
- **AES 加密**: 敏感配置信息加密存储
- **SQL 注入防护**: 参数化查询和输入验证
- **文件安全**: 上传文件类型和大小限制

### 3. 网络安全
- **HTTPS 支持**: 生产环境强制使用 HTTPS
- **CORS 配置**: 可控的跨域资源共享
- **速率限制**: API 访问频率限制

## 性能优化

### 1. 连接池管理
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

### 2. 批量处理
```go
// 批量读取
const batchSize = 1000
for {
    records, err := source.ReadBatch(batchSize)
    if err != nil || len(records) == 0 {
        break
    }
    // 批量处理
    processed := processor.ProcessBatch(records)
    // 批量写入
    sink.WriteBatch(processed)
}
```

### 3. 内存优化
- **流式处理**: 避免一次性加载所有数据
- **对象池**: 重用对象减少 GC 压力
- **内存监控**: 实时监控内存使用情况

## 扩展性设计

### 1. 自定义组件开发
```go
// 1. 实现接口
type CustomProcessor struct {
    // 实现 Processor 接口
}

// 2. 注册组件
func init() {
    factory.RegisterProcessor("custom", NewCustomProcessor)
}
```

### 2. 插件系统
支持动态加载外部插件：
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

### 3. 配置扩展
支持自定义配置格式和验证：
```go
type ConfigValidator interface {
    Validate(config interface{}) error
    GetDefaults() interface{}
}
```

## 部署架构

### 单机部署
```
                   ┌─────────────┐
                   │   客户端     │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   Nginx     │
                   │  (反向代理)  │
                   └──────┬──────┘
                          │
┌─────────────────┬───────▼───────┬─────────────────┐
│                 │               │                 │
│   静态文件      │   API服务      │    数据库        │
│   (前端构建)    │  (etl-go)     │   (SQLite)      │
│                 │               │                 │
└─────────────────┴───────────────┴─────────────────┘
```

### 分布式部署
```
┌─────────────────────────────────────────────────┐
│               负载均衡器 (Nginx)                  │
└──────────────┬────────────────┬─────────────────┘
               │                │
    ┌──────────▼────┐   ┌───────▼────────┐
    │  API 服务器 1  │   │  API 服务器 2   │
    └───────┬───────┘   └───────┬────────┘
            │                    │
    ┌───────▼────────────────────▼────────┐
    │          共享存储 (Redis/MySQL)       │
    └─────────────────────────────────────┘
```

## 监控和日志

### 1. 监控指标
- **系统指标**: CPU、内存、磁盘使用率
- **业务指标**: 任务执行次数、成功率、耗时
- **性能指标**: 吞吐量、响应时间、并发数

### 2. 日志系统
```go
type Logger struct {
    zap.Logger
    // 结构化日志
    Info(msg string, fields ...zap.Field)
    Error(msg string, fields ...zap.Field)
    // 上下文日志
    With(fields ...zap.Field) *Logger
}
```

### 3. 告警机制
- **阈值告警**: 资源使用超过阈值
- **错误告警**: 任务执行失败
- **性能告警**: 响应时间过长

## 最佳实践

### 1. 代码组织
```
etl-go/
├── cmd/          # 命令行入口
├── internal/     # 内部包 (不对外暴露)
├── pkg/          # 公共包 (可供外部使用)
├── api/          # API 定义
├── config/       # 配置管理
└── docs/         # 文档
```

### 2. 错误处理
```go
// 使用 errors.Wrap 添加上下文
func processData() error {
    data, err := readData()
    if err != nil {
        return errors.Wrap(err, "读取数据失败")
    }
    
    result, err := transformData(data)
    if err != nil {
        return errors.Wrap(err, "转换数据失败")
    }
    
    return nil
}
```

### 3. 测试策略
- **单元测试**: 测试单个函数或方法
- **集成测试**: 测试模块间集成
- **端到端测试**: 测试完整工作流

## 下一步

理解架构后，您可以：
1. **[注册组件](#组件注册)** - 学习如何注册自定义组件
2. **[开发组件](./develop-component-architecture.md)** - 开始开发具体组件
3. **[扩展功能](#扩展性设计)** - 添加新功能到系统

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*