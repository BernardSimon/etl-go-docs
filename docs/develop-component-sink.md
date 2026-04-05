
# 数据输出组件开发

Sink 组件负责最终写入目标数据存储。

## 目录结构

位于 `components/sinks/<type>/`。

## 接口定义

```go
type Sink interface {
    Open(ctx context.Context, config map[string]string, columnMapping map[string]string, dataSource datasource.Datasource) error
    Write(ctx context.Context, id string, records []record.Record) error
    Close() error
}
```

## 开发要点

- `Open` 做参数校验、数据源绑定、预构建写入上下文。
- `Write` 接收一批记录，保证批量写入可重复执行和可取消。
- `columnMapping` 是 Source/Processor 链计算后的字段映射，Sink 必须按映射写入。
- 处理空批次时应直接返回 `nil`，避免无效请求/事务。

## 开发步骤

1. 定义 `SinkCreator`，声明参数与依赖数据源。
2. 在 `Open` 中解析配置并检查必填项（如表名、URL）。
3. 在 `Write` 中实现批量写入逻辑。
4. 处理错误时带上 `sink type` 前缀，便于日志定位。
5. 在 `Close` 中释放连接或客户端资源。
6. 注册到 `etl/init.go`。

## 示例：SQL Sink

```go
func SinkCreatorMysql() (name string, sink Sink, datasource *string, params []params.Params) {
    return "mysql", &Sink{}, strPtr("mysql"), []params.Params{
        {Key: "table", Required: true},
    }
}
```

## 参数规范建议

- SQL Sink：`table` 必填。
- HTTP Sink：建议 `url/method/headers/auth_type/auth_value/body_template/send_mode`。
- 文件输出 Sink：建议 `file_name`、`delimiter`、`encoding` 等明确参数。

## 注册

```go
factory.RegisterSink(sqlSink.SinkCreatorMysql)
```

## 常见错误排查

### 1. `column_mapping cannot be empty`

- 原因：Source 未返回列或 Processor 列处理异常。
- 处理：检查 Source `Column` 和 Processor `HandleColumns`。

### 2. `database connection is not available`

- 原因：未正确绑定 datasource，或 datasource 初始化失败。
- 处理：检查任务配置中的 `data_source` 与组件依赖类型。

### 3. 批量写入失败

- SQL 场景：检查目标表字段是否与 `column_mapping` 一致。
- HTTP 场景：检查请求体模板是否可正确渲染 JSON。
