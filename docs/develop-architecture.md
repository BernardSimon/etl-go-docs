
# 代码架构

ETL-GO 的核心架构由三层组成：

## 1. 组件层

`components/` 目录包含所有内置组件：

- `datasource`：数据库连接信息
- `sources`：数据读取组件
- `processors`：数据转换组件
- `sinks`：数据写入组件
- `executor`：任务前后 SQL 执行组件
- `variable`：变量查询组件

## 2. 引擎层

`etl/` 目录包含核心接口与执行引擎：

- `etl/core`：定义 `Source`, `Processor`, `Sink`, `Executor`, `Variable`, `Datasource` 接口
- `etl/factory`：组件注册与创建工厂
- `etl/pipeline`：并发执行引擎与消息传递

## 3. 服务层

`server/` 目录实现运行时服务：

- `config`：配置读取
- `model`：GORM 数据模型
- `api`：REST API 处理
- `router`：路由注册
- `task`：任务调度与执行管理

## 启动流程概览

`main.go` 启动后：

1. 加载配置
2. 初始化数据库
3. 注册组件
4. 启动 Web 和 API 服务器
5. 启动定时任务调度

## 运行时核心链路（重构版）

### 1. 任务装配层（`server/task`）

- 从任务 JSON 结构中解析 Source / Processors / Sink / Executor 配置。
- 使用 `factory.Create*` 按组件 `type` 动态创建实例。
- 通过 `buildConfig` 将参数列表转换为 `map[string]string`。
- 按需初始化数据源，并做类型匹配校验。

### 2. 引擎层（`etl/pipeline`）

- 顺序执行 `Open`：Before Executor -> Source -> Processors -> Sink。
- 运行期并发执行：Source 读、Processor 链式处理、Sink 批量写。
- 错误后触发 `context cancel`，全链路快速停机。
- 退出时统一 `Close`，并处理输出文件归档。

### 3. API 层（`server/api`）

- 统一走 `/api/v1` 路由。
- 参数校验失败返回结构化错误字段。
- 组件元数据接口 `/api/v1/components` 可直接用于前端表单渲染。

## 重构后的关键设计点

- 工厂注册并发安全，类型列表按字典序稳定输出。
- Source / Processor / Sink / Executor / Variable 全部支持 `context.Context`。
- 阻塞 SQL / HTTP 操作支持取消传播。
- 数据源支持共享租约，避免多组件复用时提前关闭连接。
- 参数元数据支持类型推断（text/number/password/file/textarea）。

## 排查建议

- “任务能创建但运行失败”：优先看 `server/task/task.go` 的装配逻辑和错误返回。
- “组件参数填了但不生效”：检查组件 `Open` 是否读取了同名 key。
- “并发执行异常”：检查 `etl/pipeline/engine.go` 的 channel 大小与错误传播。
- “组件列表缺失”：检查 `etl/init.go` 是否完成注册，以及是否在启动阶段报 fatal。
