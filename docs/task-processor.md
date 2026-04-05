
# 数据处理

ETL-GO 提供内置数据处理组件，用于清洗和转换数据。

## 支持的 Processor

- `convertType`：列类型转换
- `filterRows`：行过滤
- `maskData`：脱敏处理
- `renameColumn`：重命名列
- `selectColumns`：选择列

## 处理器参数说明

### convertType
将指定列转换为目标类型。

- `column`：目标列
- `type`：目标类型（`int|float|string|bool`）

### filterRows
根据条件过滤行数据，常用于去除空行或业务规则过滤。

- `column`
- `operator`（`= != > >= < <=`）
- `value`

### maskData
对敏感字段进行脱敏，例如哈希或部分遮盖。

- `column`
- `method`（`md5|sha256`）

### renameColumn
对列名进行重命名，便于后续 Sink 写入目标字段。

- `mapping`：JSON 对象字符串，如 `{"old":"new"}`

### selectColumns
从数据集中选取需要保留的列，减少传输和写入成本。

- `columns`：JSON 数组字符串，如 `["id","name"]`

## 组合建议

- 先使用 `selectColumns` 过滤字段
- 再使用 `convertType` 统一类型
- 最后使用 `maskData` 或 `renameColumn` 完成清洗

## 常见错误排查

### 1. `selectColumns processor: 'columns' must be an array of strings`

- `columns` 不是合法 JSON 数组字符串。

### 2. `renameColumn processor: 'mapping' must be a map`

- `mapping` 不是合法 JSON 对象字符串。

### 3. `unsupported target type` / `failed to convert value`

- `convertType` 目标类型不支持，或源值无法转换。

### 4. 处理器导致整任务失败

- 任一 Processor 返回 error 会触发全链路取消。
- 预期“过滤掉异常记录”时，应返回 `(nil, nil)`。
