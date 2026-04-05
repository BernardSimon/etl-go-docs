
# 数据输出

ETL-GO 支持以下输出组件：

- SQL Sink（MySQL / PostgreSQL / SQLite）
- CSV Sink
- JSON Sink
- Doris Sink
- HTTP Sink

## SQL Sink

将处理结果写入数据库表，适用于数据同步和数据仓库导入。

参数：

- `table`（必填）：目标表名

## CSV Sink / JSON Sink

将结果导出为文件，适合数据备份、下载或交给下游系统处理。

参数：

- `file_name`（必填）
- `file_ext`（CSV 默认 `csv`，JSON 默认 `json`）

## Doris Sink

用于将数据写入 Apache Doris，典型场景是目标分析仓库加载。

参数：

- `table`（必填）
- 数据源中需提供 `host/port/user/password/database`

## HTTP Sink

将结果推送到外部 HTTP 接口，适合实时接口对接。

参数（常用）：

- `url`（必填）
- `method`（默认 `POST`）
- `headers`（JSON 字符串）
- `auth_type`（`none|bearer|basic|api_key`）
- `auth_value`
- `api_key_name`（默认 `X-API-Key`）
- `body_template`
- `send_mode`（`batch|single`）

## 选择建议

- 目标为数据库：优先使用 SQL Sink
- 目标为文件存储：使用 CSV / JSON Sink
- 目标为分析系统：使用 Doris Sink
- 目标为 API：使用 HTTP Sink

## 常见错误排查

### 1. `column_mapping cannot be empty`

- 上游字段信息为空，检查 Source/Processor 列处理逻辑。

### 2. `config is missing required key 'table'`

- SQL/Doris Sink 未配置表名。

### 3. HTTP Sink 报模板解析错误

- `body_template` 语法不合法，建议先用最小模板验证。

### 4. 文件输出成功但无结果

- 上游可能已将所有记录过滤，检查 Processor 配置。
