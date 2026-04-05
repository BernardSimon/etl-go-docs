# 内置组件

本文汇总 ETL-GO 当前内置组件，并说明：

- 每类组件支持哪些 `type`
- 每个组件参数是什么
- 参数应该如何规范填写
- 哪些字段是用户层填写，哪些是服务端内部处理

## 先理解两层参数

### 1. 用户层参数

用户层参数是你在 Web 表单、任务 JSON、或调用 API 时真正需要提交的字段，例如：

- 数据源的 `host`、`port`、`user`
- SQL Source 的 `query`
- HTTP Sink 的 `url`
- CSV Sink 的 `file_name`

### 2. 服务端内部参数

服务端会根据用户层参数自动补充一些内部字段，这些字段通常不应该由用户直接提交，例如：

- `file_path`
- `file_paths`

生成规则：

- 提交 `file_id` 后，服务端会解析成 `file_path`
- 提交 `file_ids` 后，服务端会解析成 `file_paths`
- 提交 `file_name` + `file_ext` 后，服务端会创建输出文件并回填 `file_path`

结论：

- 用户应提交 `file_id`，不要直接提交 `file_path`
- 用户应提交 `file_name` / `file_ext`，不要手工构造输出文件物理路径
- 客户端应以元信息接口返回的 `params` 为准

## 参数填写总规范

- 所有组件参数最终都会以 `key/value` 字符串形式提交
- 即使逻辑上是数字、布尔值、JSON，也要作为字符串传输
- 复杂结构推荐使用合法 JSON 字符串
- `key` 必须与组件定义完全一致

推荐规则：

- SQL 使用完整字符串
- 数组参数用 JSON 数组字符串
- 映射参数用 JSON 对象字符串
- Header 参数用 JSON 对象字符串
- 布尔参数统一传 `true` 或 `false`
- 需要绑定数据源的组件，使用 `data_source` 传数据源 ID

## 数据源组件

### MySQL 数据源 `mysql`

参数：

- `host`：必填
- `port`：必填，默认 `3306`
- `user`：必填
- `password`：必填
- `database`：必填

### PostgreSQL 数据源 `postgre`

参数：

- `host`：必填
- `port`：必填，默认 `5432`
- `user`：必填
- `password`：必填
- `database`：必填
- `sslmode`：可选，默认 `disable`

### SQLite 数据源 `sqlite`

用户层参数：

- `file_id`：必填

服务端内部处理：

- 服务端会自动将 `file_id` 解析为 `file_path`

### Doris 数据源 `doris`

参数：

- `host`：必填
- `port`：必填
- `user`：必填
- `password`：必填
- `database`：必填

## 变量组件

当前内置变量类型：

- `mysql`
- `postgre`
- `sqlite`

### SQL Variable

参数：

- `query`：必填

必须额外绑定：

- `datasource_id`

填写规范：

- 必须是 `SELECT` 查询
- 建议返回单行单列

## 执行器组件

当前内置类型：

- `mysql`
- `postgre`
- `sqlite`

### SQL Executor

参数：

- `sql`：必填

必须额外绑定：

- `data_source`

说明：

- `allow_dangerous` 是内部兼容读取项，不在元信息接口里公开，不建议普通用户层暴露

## Source 组件

### SQL Source

类型：

- `mysql`
- `postgre`
- `sqlite`

参数：

- `query`：必填

必须额外绑定：

- `data_source`

### CSV Source `csv`

用户层参数：

- `file_id`：必填
- `delimiter`：必填，默认 `,`
- `has_header`：必填，默认 `true`

服务端内部处理：

- `file_id` 会被解析成 `file_path`

### JSON Source `json`

用户层参数：

- `file_id`：必填
- `keys_sample_rows`：必填，默认 `100`

服务端内部处理：

- `file_id` 会被解析成 `file_path`

### HTTP Source `http`

参数：

- `url`：必填
- `method`：可选，默认 `GET`
- `headers`：可选，JSON 字符串
- `body`：可选
- `pagination_type`：可选，默认 `none`
- `page_size`：可选，默认 `100`
- `cursor_field`：可选，默认 `next_cursor`
- `data_path`：可选

填写规范：

- `headers` 示例：`{"Authorization":"Bearer xxx"}`
- `pagination_type` 支持 `none`、`offset`、`page`、`cursor`
- `data_path` 用点路径，如 `data.items`

## Processor 组件

### `convertType`

参数：

- `column`：必填
- `type`：必填

填写规范：

- `type` 支持 `integer`、`int`、`float`、`double`、`string`、`boolean`、`bool`

### `filterRows`

参数：

- `column`：必填
- `operator`：必填
- `value`：必填

### `maskData`

参数：

- `column`：必填
- `method`：必填，默认 `sha256`

填写规范：

- `method` 支持 `md5`、`sha256`

### `renameColumn`

参数：

- `mapping`：必填，JSON 对象字符串

示例：

```json
{"old_name":"new_name","age":"user_age"}
```

### `selectColumns`

参数：

- `columns`：必填，JSON 数组字符串

示例：

```json
["id","name","created_at"]
```

## Sink 组件

### SQL Sink

类型：

- `mysql`
- `postgre`
- `sqlite`

参数：

- `table`：必填

必须额外绑定：

- `data_source`

说明：

- `column_mapping` 是运行期内部结构，不是普通 API 调用者需要提交的参数

### CSV Sink `csv`

用户层参数：

- `file_name`：必填
- `file_ext`：必填，默认 `csv`

服务端内部处理：

- 自动创建输出文件并回填 `file_path`

### JSON Sink `json`

用户层参数：

- `file_name`：必填
- `file_ext`：必填，默认 `json`

服务端内部处理：

- 自动生成输出文件并回填 `file_path`

### Doris Sink `doris`

参数：

- `table`：必填

必须额外绑定：

- `data_source`

说明：

- 导入 label、HTTP 请求头等细节由服务端生成

### HTTP Sink `http`

参数：

- `url`：必填
- `method`：可选，默认 `POST`
- `headers`：可选，JSON 字符串
- `auth_type`：可选，默认 `none`
- `auth_value`：可选
- `api_key_name`：可选，默认 `X-API-Key`
- `body_template`：可选
- `send_mode`：可选，默认 `batch`

填写规范：

- `auth_type` 支持 `none`、`bearer`、`basic`、`api_key`
- `basic` 模式下，`auth_value` 格式为 `user:password`
- `send_mode` 支持 `batch`、`single`

`body_template` 可用变量：

- `.DataJSON`
- `.Timestamp`
- `.TimestampMs`
- `.ID`
- `.Count`

可用函数：

- `hmacSHA256`
- `md5`
- `sha256`
- `concat`
- `toString`

## 最佳实践

### 1. 客户端不要写死参数表

优先使用：

- `/api/v1/data-sources/types`
- `/api/v1/variables/types`
- `/api/v1/components`

### 2. 文件类参数只传 ID 或逻辑文件名

正确做法：

- 输入文件传 `file_id`
- 输出文件传 `file_name` + `file_ext`

### 3. SQL、JSON、数组统一按字符串提交

- SQL 直接传字符串
- JSON 对象传 JSON 字符串
- JSON 数组传 JSON 字符串

### 4. 把数据源绑定和组件参数分开

例如 SQL Source 正确结构应是：

```json
{
  "type": "mysql",
  "data_source": "ds_xxx",
  "params": [
    {
      "key": "query",
      "value": "SELECT id,name FROM demo"
    }
  ]
}
```
