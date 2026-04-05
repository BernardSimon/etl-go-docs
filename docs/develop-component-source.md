
# 数据输入组件开发

数据输入组件负责从外部读取原始数据并发送到 pipeline。

## 目录结构

位于 `components/sources/<type>/`。

## 接口定义

```go
type Source interface {
    Column() map[string]string
    Open(ctx context.Context, config map[string]string, dataSource datasource.Datasource) error
    Read(ctx context.Context) (record.Record, error)
    Close() error
}
```

## 开发要点

- `Open` 做配置解析和连接准备，不做无限循环读取。
- `Read` 每次返回一条 `record.Record`，读完返回 `io.EOF`。
- `Column` 返回源字段到输出字段的初始映射。
- 使用 `ctx` 支持取消，避免长查询或长请求无法终止。
- 有数据源依赖时在 Creator 返回 `datasource` 名称；无依赖则返回 `nil`。

## 开发步骤

1. 创建 `Source` 结构体，保存连接状态和中间缓冲。
2. 在 `SourceCreator` 定义参数元数据。
3. 在 `Open` 校验必填参数并初始化状态。
4. 在 `Read` 实现逐条读取和 EOF 语义。
5. 在 `Close` 中释放资源。
6. 在 `etl/init.go` 完成注册。

## 示例：CSV Source

```go
func SourceCreator() (name string, source Source, datasource *string, params []params.Params) {
    return "csv", &Source{}, nil, []params.Params{
        {Key: "file_id", Required: true},
        {Key: "delimiter", Required: false, DefaultValue: ","},
    }
}
```

## 参数规范建议

- SQL Source：使用 `query` 作为查询语句参数名。
- HTTP Source：建议 `url/method/headers/body/pagination_type/page_size/data_path`。
- 文件 Source：建议 `file_id`（单文件）或 `file_ids`（多文件）。
- 参数名尽量稳定，避免任务历史配置不可用。

## 注册

```go
factory.RegisterSource(csvSource.SourceCreator)
```

## 常见错误排查

### 1. `factory error: no source registered with name: xxx`

- 原因：任务中的 `source.type` 与注册名不一致，或漏注册。

### 2. `config is missing required key 'query'/'url'`

- 原因：参数 key 与组件读取 key 不一致，或前端未提交该参数。

### 3. 运行无法停止

- 原因：`Read` 内部未检查 `ctx.Err()`，阻塞调用未使用 context 版本 API。

### 4. 字段映射异常

- 原因：`Column()` 返回为空或字段名不稳定。
- 建议：在 `Open` 阶段确定字段集合，并在 `Column` 返回稳定映射。
