
# 数据输入

ETL-GO 支持以下数据输入类型：

- SQL Source（MySQL / PostgreSQL / SQLite）
- CSV Source
- JSON Source
- HTTP Source

## SQL Source

SQL Source 适用于从数据库查询数据，并将结果送入处理链。

支持的数据库类型：MySQL、PostgreSQL、SQLite。

参数：

- `query`（必填）：只允许 `SELECT` 查询

## CSV Source

CSV Source 支持从上传的 CSV 文件读取数据。

参数：

- `file_id`（必填）：上传文件 ID
- `delimiter`（默认 `,`）：分隔符
- `has_header`（默认 `true`）：是否有表头

## JSON Source

JSON Source 支持从上传的 JSON 文件读取数据。

参数：

- `file_id`（必填）：上传文件 ID
- `keys_sample_rows`（默认 `100`）：用于推断字段集合的采样行数

## HTTP Source

HTTP Source 支持通过 REST 接口拉取数据，适用于远程数据源。

参数（常用）：

- `url`（必填）
- `method`（默认 `GET`）
- `headers`（JSON 字符串）
- `body`（POST 请求体）
- `pagination_type`：`none|offset|page|cursor`
- `page_size`（默认 `100`）
- `cursor_field`（默认 `next_cursor`）
- `data_path`（如 `data.items`）

## 选择策略

- 结构化数据库数据：优先使用 SQL Source
- 批量文件导入：使用 CSV/JSON Source
- Web API 数据：使用 HTTP Source

## 常见错误排查

### 1. `config is missing required key 'query'/'url'`

- 对应参数未配置或 key 写错。

### 2. CSV 列数不一致报错

- 文件中某行列数与表头不一致，需先清洗源文件。

### 3. JSON 文件格式错误

- JSON Source 期望顶层是数组 `[]`，不支持 JSONL。

### 4. HTTP Source 拉取分页不完整

- 检查 `pagination_type` 与接口协议是否匹配。
- 检查 `data_path` 是否正确指向数组节点。
