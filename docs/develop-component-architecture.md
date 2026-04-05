
# 开发组件默认约定

ETL-GO 的组件开发采用统一接口与工厂注册机制。

## 组件类型

- `Datasource`：提供数据库或连接信息
- `Source`：读取数据
- `Processor`：处理数据行
- `Sink`：写入结果
- `Executor`：执行前后 SQL
- `Variable`：读取任务参数

## 接口契约

所有组件接口定义在 `etl/core`。开发新组件时必须实现对应接口，并提供 `Creator` 函数返回组件元信息。

## Creator 模式

Creator 函数统一返回：

- `name`：组件类型名（任务 JSON 中 `type` 字段）
- `instance`：接口实现对象
- `datasource`：可选，依赖的数据源类型
- `params`：参数定义（用于前端自动渲染配置表单）

```go
type SourceCreator func() (name string, source Source, datasource *string, params []params.Params)
```

`params.Params` 常用字段：

- `Key`：参数 key（组件 `Open`/`Get` 使用）
- `Required`：是否必填
- `DefaultValue`：默认值
- `Description`：参数说明

服务端会对参数补齐 `Type/Placeholder/Example` 推断，用于 UI 体验增强。

## 组件命名约定

- 类型名建议小写、语义明确，如 `mysql`、`filterRows`、`http`。
- 同类组件不要重名，否则注册时报重复错误。
- 如需复用实现但区分方言，建议采用多 Creator（例如 mysql/postgre/sqlite）。

## context 约定（重构重点）

- 所有阻塞逻辑必须优先检查 `ctx.Err()`。
- 数据库请求使用 `QueryContext` / `ExecContext`。
- HTTP 请求使用 `NewRequestWithContext`。
- 出错时返回带组件前缀的错误，便于定位，例如 `sql sink: ...`。

## 资源生命周期约定

- 初始化放在 `Open`。
- 核心处理放在 `Read/Process/Write/Get`。
- 释放资源放在 `Close`（或 `defer`）。
- 组件应支持“打开失败后安全退出”。

## 参数设计建议

- 参数 key 一经发布尽量保持兼容，避免前端和历史任务失效。
- 数值参数存储为字符串，在组件内显式解析与校验。
- 文件参数推荐使用 `file_id` 或 `file_ids` 命名，便于 UI 推断为文件选择器。
- 涉及 JSON 字符串参数（如 HTTP headers）必须返回清晰解析错误。

## 注册方式

组件实现后在 `etl/init.go` 注册，推荐顺序：

1. DataSource
2. Variable
3. Executor
4. Source
5. Sink
6. Processor

顺序错误会导致依赖数据源的组件注册失败（例如 Source 依赖的 DataSource 尚未注册）。

## 组件完成定义（DoD）

- 组件可正常注册且能出现在 `/api/v1/components`。
- 参数定义完整，必填项与默认值合理。
- 关键路径支持 `context` 取消。
- 有最少一条成功路径和一条失败路径测试。
- 错误信息可被运维直接定位，不返回笼统 `internal error`。
