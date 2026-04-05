
# 数据处理组件开发

Processor 组件负责逐行处理数据流。

## 目录结构

位于 `components/processors/<type>/`。

## 接口定义

```go
type Processor interface {
    Open(ctx context.Context, config map[string]string) error
    Process(ctx context.Context, record record.Record) (record.Record, error)
    Close() error
    HandleColumns(columns *map[string]string)
}
```

## 开发要点

- `Process` 输入一条记录，输出一条记录或 `nil`（过滤）。
- `HandleColumns` 用于在运行前调整字段映射。
- 无状态处理器可让 `Close` 为 no-op。
- 所有逻辑应可被取消，优先检查 `ctx.Err()`。

## 开发步骤

1. 在 `ProcessorCreator` 定义类型名和参数。
2. 在 `Open` 解析参数并校验操作符或规则。
3. 在 `Process` 处理记录，返回转换后的 `record`。
4. 如果处理器会增删改字段，在 `HandleColumns` 同步更新列信息。
5. 注册到 `etl/init.go`。

## 示例：convertType

```go
func ProcessorCreator() (name string, processor Processor, params []params.Params) {
    return "convertType", &Processor{}, []params.Params{
        {Key: "column", Required: true},
        {Key: "target_type", Required: true},
    }
}
```

## 参数设计建议

- 过滤类参数建议：`column/operator/value`。
- 列选择类参数建议：`columns`，值可为 JSON 数组字符串。
- 映射类参数建议：`mapping`，值为 JSON 对象字符串。
- 对 JSON 参数解析失败时，返回原始错误上下文。

## 注册

```go
factory.RegisterProcessor(convertTypeProcessor.ProcessorCreator)
```

## 常见错误排查

### 1. 条件过滤异常（全部通过或全部过滤）

- 检查 `operator` 是否支持当前类型。
- 检查 `value` 的数字/字符串转换逻辑。

### 2. 处理器报错导致整条任务失败

- Processor 返回 error 会触发引擎 cancel。
- 如果某些异常数据应跳过，返回 `(nil, nil)` 而不是 error。

### 3. Sink 字段缺失

- 原因：`HandleColumns` 没同步字段变更。
- 处理：在 `HandleColumns` 中更新列映射，保持与 `Process` 一致。
