# API 参考

本文按“可直接调用”的角度整理 ETL-GO 后端接口，覆盖：

- 认证方式
- 统一响应格式
- 每个接口怎么调
- 请求参数放哪里
- 常见成功响应长什么样
- 报错该怎么处理

## 基础信息

- 基础路径：`/api/v1`
- 文件访问路径：`/file/*`
- 默认响应：`application/json`
- 语言可选：`Accept-Language: zh` 或 `Accept-Language: en`

除以下接口外，其余 `/api/v1/*` 均需要认证：

- `POST /api/v1/login`
- `POST /api/v1/refresh-token`

## 统一响应格式

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败响应：

```json
{
  "code": 2,
  "message": "task not found"
}
```

字段说明：

- `code=0`：成功
- `code=1`：请求参数错误，HTTP 状态码通常为 `400`
- `code=2`：业务错误，HTTP 状态码通常为 `422`
- `code=3`：认证错误，HTTP 状态码通常为 `401`
- `message`：错误提示
- `data`：成功数据，或参数校验详情

参数校验错误示例：

```json
{
  "code": 1,
  "message": "invalid request parameters",
  "data": {
    "errors": [
      {
        "field": "refresh_token",
        "message": "field is required"
      }
    ]
  }
}
```

## 认证

ETL-GO 支持两种认证方式：

- JWT Token
- API 签名

### Token 认证

先登录获取 token：

```http
Authorization: Bearer <token>
```

说明：

- `token` 有效期约 15 分钟
- `refresh_token` 有效期约 7 天

### API 签名认证

当 `config.yaml` 配置了 `apiSecret` 后，可以直接通过签名访问 API。

配置项：

```yaml
apiSecret: your-api-secret
```

query 参数：

- `timestamp`：Unix 秒级时间戳
- `sign`：签名值

签名算法：

1. 取全部 query 参数，排除 `sign`
2. 按参数名升序排序
3. 同名参数有多个值时，对值升序排序
4. 组装为 `key=value&key=value`
5. 读取原始请求体
6. 若请求体是 JSON，服务端会先做紧凑化
7. 最终参与签名的字符串为：

```text
<sorted_query>&body=<normalized_body>&secret=<apiSecret>
```

8. 对该字符串做 `MD5`，得到 `sign`

时间限制：

- `timestamp` 与服务端时间差不能超过 60 秒

说明：

- 如果带了签名参数但签名不正确，会直接返回 `401`
- 如果未带签名参数，仍可继续走 Token 认证

## 通用调用约定

### 1. Header 建议

Token 模式：

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept-Language: zh
```

签名模式：

```http
Content-Type: application/json
Accept-Language: zh
```

### 2. 参数位置

- `GET` 列表接口：多数参数放 query string
- `POST/PUT`：多数参数放 JSON body
- `DELETE /:id`：`id` 放路径参数
- 上传文件：`multipart/form-data`

### 3. Key/Value 结构

很多组件参数不是对象，而是数组形式：

```json
[
  { "key": "host", "value": "127.0.0.1" },
  { "key": "port", "value": "3306" }
]
```

不要误写成：

```json
{
  "host": "127.0.0.1",
  "port": "3306"
}
```

## 认证接口

### `POST /api/v1/login`

用途：登录并获取 Token。

认证：不需要

请求体：

```json
{
  "username": "admin",
  "password": "password123"
}
```

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "<jwt>",
    "refresh_token": "<refresh-jwt>"
  }
}
```

常见报错：

- `invalid username or password`
- `too many login attempts, please try again later`

### `POST /api/v1/refresh-token`

用途：刷新 token。

认证：不需要

请求体：

```json
{
  "refresh_token": "<refresh-jwt>"
}
```

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/refresh-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "refresh_token": "<refresh-jwt>"
  }'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "<new-jwt>",
    "refresh_token": "<new-refresh-jwt>"
  }
}
```

常见报错：

- `invalid or expired refresh token`

## 数据源接口

### `GET /api/v1/data-sources/types`

用途：获取内置数据源类型和参数元信息。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/data-sources/types' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "type": "mysql",
        "params": [
          {
            "key": "host",
            "required": true,
            "defaultValue": "",
            "description": "sql host",
            "placeholder": "sql host",
            "example": "127.0.0.1",
            "type": "text"
          }
        ]
      }
    ]
  }
}
```

### `POST /api/v1/data-sources/test`

用途：测试数据源连通性，不落库。

认证：需要

请求体：

```json
{
  "type": "mysql",
  "data": [
    { "key": "host", "value": "127.0.0.1" },
    { "key": "port", "value": "3306" },
    { "key": "user", "value": "root" },
    { "key": "password", "value": "123456" },
    { "key": "database", "value": "etl" }
  ]
}
```

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/data-sources/test' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "mysql",
    "data": [
      { "key": "host", "value": "127.0.0.1" },
      { "key": "port", "value": "3306" },
      { "key": "user", "value": "root" },
      { "key": "password", "value": "123456" },
      { "key": "database", "value": "etl" }
    ]
  }'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": "datasource connection test success"
}
```

注意：

- SQLite 数据源只需传 `file_id`
- 服务端会把 `file_id` 自动解析为内部 `file_path`

常见报错：

- `invalid Datasource type`
- `datasource params error`
- `failed to test datasource connection`

### `POST /api/v1/data-sources`

用途：创建或编辑数据源。

认证：需要

请求体字段：

- `id`：编辑时传，创建时可为空
- `name`：数据源名称，必填
- `type`：数据源类型，必填
- `data`：参数数组，必填
- `edit`：是否编辑，必填逻辑字段

创建示例：

```json
{
  "id": "",
  "name": "prod_mysql",
  "type": "mysql",
  "edit": false,
  "data": [
    { "key": "host", "value": "127.0.0.1" },
    { "key": "port", "value": "3306" },
    { "key": "user", "value": "root" },
    { "key": "password", "value": "123456" },
    { "key": "database", "value": "etl" }
  ]
}
```

编辑示例：

```json
{
  "id": "ds_xxx",
  "name": "prod_mysql",
  "type": "mysql",
  "edit": true,
  "data": [
    { "key": "host", "value": "127.0.0.1" },
    { "key": "port", "value": "3306" },
    { "key": "user", "value": "etl_user" },
    { "key": "password", "value": "newpass" },
    { "key": "database", "value": "etl" }
  ]
}
```

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/data-sources' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d @datasource.json
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": "success"
}
```

常见报错：

- `invalid Datasource type`
- `datasource name already exist`
- `datasource params error`
- `failed to save datasource`

### `GET /api/v1/data-sources`

用途：获取已保存的数据源列表。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/data-sources' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "ds_xxx",
        "name": "prod_mysql",
        "type": "mysql",
        "data": [
          { "key": "host", "value": "127.0.0.1" }
        ],
        "updated_at": "2026-04-05T12:00:00+08:00"
      }
    ]
  }
}
```

### `DELETE /api/v1/data-sources/:id`

用途：删除数据源。

认证：需要

路径参数：

- `id`：数据源 ID

调用示例：

```bash
curl -X DELETE 'http://127.0.0.1:8080/api/v1/data-sources/ds_xxx' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `datasource handle not found`
- `failed to delete datasource record`

## 变量接口

### `GET /api/v1/variables/types`

用途：获取变量类型、参数定义，以及可选数据源列表。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/variables/types' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "type": "mysql",
        "params": [
          {
            "key": "query",
            "required": true,
            "defaultValue": "",
            "placeholder": "Please input query",
            "example": "SELECT * FROM table_name LIMIT 100",
            "type": "textarea"
          }
        ],
        "datasource_list": [
          {
            "name": "prod_mysql",
            "ID": "ds_xxx"
          }
        ]
      }
    ]
  }
}
```

### `POST /api/v1/variables`

用途：创建或编辑变量。

认证：需要

请求体字段：

- `id`：编辑时传
- `type`：变量类型
- `datasource_id`：绑定数据源 ID
- `name`：变量名
- `description`：变量描述
- `value`：参数数组
- `edit`：是否编辑

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/variables' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "",
    "type": "mysql",
    "datasource_id": "ds_xxx",
    "name": "max_id",
    "description": "查询最大ID",
    "edit": false,
    "value": [
      { "key": "query", "value": "SELECT MAX(id) FROM demo" }
    ]
  }'
```

常见报错：

- `variable name already exists`
- `variable not exists`
- `invalid variable type`
- `variable value is not complete`
- `variable type need datasource`
- `datasource does not exist`
- `datasource type is not match`

### `GET /api/v1/variables`

用途：获取变量列表。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/variables' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "var_xxx",
        "name": "max_id",
        "type": "mysql",
        "description": "查询最大ID",
        "datasource_id": "ds_xxx",
        "datasource": {
          "id": "ds_xxx",
          "name": "prod_mysql"
        },
        "value": [
          { "key": "query", "value": "SELECT MAX(id) FROM demo" }
        ]
      }
    ]
  }
}
```

### `POST /api/v1/variables/:id/test`

用途：测试变量，直接返回解析后的值。

认证：需要

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/variables/var_xxx/test' \
  -H 'Authorization: Bearer <token>'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": "12345"
}
```

常见报错：

- `variable not exists`

### `DELETE /api/v1/variables/:id`

用途：删除变量。

认证：需要

调用示例：

```bash
curl -X DELETE 'http://127.0.0.1:8080/api/v1/variables/var_xxx' \
  -H 'Authorization: Bearer <token>'
```

## 组件元数据接口

### `GET /api/v1/components`

用途：获取内置 Executor、Source、Processor、Sink 元信息。

认证：需要

这是自定义前端最重要的接口，建议优先依赖它动态渲染任务表单。

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/components' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "executor": [
      {
        "type": "mysql",
        "data_source": [
          { "name": "prod_mysql", "id": "ds_xxx" }
        ],
        "params": [
          { "key": "sql", "required": true }
        ]
      }
    ],
    "source": [],
    "processor": [],
    "sink": []
  }
}
```

说明：

- `executor/source/sink` 可能带 `data_source`
- `processor` 没有 `data_source`
- `params` 中包含 `key`、`required`、`defaultValue`、`placeholder`、`example`、`type`

## 任务接口

### `POST /api/v1/tasks`

用途：创建任务。

认证：需要

请求体字段：

- `mission_name`：任务名称，必填
- `cron`：`manual` 或 cron 表达式
- `params`：任务结构体

最小可运行示例：

```json
{
  "mission_name": "demo_task",
  "cron": "manual",
  "params": {
    "before_execute": null,
    "source": {
      "type": "mysql",
      "data_source": "ds_xxx",
      "params": [
        { "key": "query", "value": "SELECT id,name FROM demo" }
      ]
    },
    "processors": [],
    "sink": {
      "type": "json",
      "params": [
        { "key": "file_name", "value": "demo_export" },
        { "key": "file_ext", "value": "json" }
      ]
    },
    "after_execute": null
  }
}
```

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/tasks' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d @task.json
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": "success"
}
```

常见报错：

- `invalid cron expression`
- `failed to create task`

### `PUT /api/v1/tasks/:id`

用途：编辑任务。

认证：需要

路径参数：

- `id`：任务 ID

请求体和创建任务一致。

调用示例：

```bash
curl -X PUT 'http://127.0.0.1:8080/api/v1/tasks/task_xxx' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d @task-update.json
```

常见报错：

- `invalid cron expression`
- `task not found`
- `cannot edit in task scheduling`
- `failed to edit task`

### `GET /api/v1/tasks`

用途：分页查询任务列表。

认证：需要

query 参数：

- `page_no`
- `page_size`
- `mission_name`
- `status`
- `search`
- `tasktypes`

其中：

- `tasktypes=manual`：仅手动任务
- `tasktypes=scheduled`：仅定时任务

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/tasks?page_no=1&page_size=10&tasktypes=manual' \
  -H 'Authorization: Bearer <token>'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "task_xxx",
        "mission_name": "demo_task",
        "cron": "manual",
        "status": 0,
        "last_run_time": null,
        "last_success_time": null,
        "last_end_time": null,
        "err_msg": ""
      }
    ],
    "total": 1,
    "page_no": 1,
    "page_size": 10
  }
}
```

### `GET /api/v1/tasks/:id`

用途：获取单个任务详情。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/tasks/task_xxx' \
  -H 'Authorization: Bearer <token>'
```

成功响应中的关键字段：

- `id`
- `mission_name`
- `cron`
- `status`
- `data`
- `last_run_time`
- `last_success_time`
- `last_end_time`
- `err_msg`

### `DELETE /api/v1/tasks/:id`

用途：删除任务。

认证：需要

调用示例：

```bash
curl -X DELETE 'http://127.0.0.1:8080/api/v1/tasks/task_xxx' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `task not found`
- `cannot delete in task scheduling`
- `failed to delete task`

### `POST /api/v1/tasks/:id/schedule`

用途：启动定时调度。

认证：需要

说明：

- 仅适用于非 `manual` 任务

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/tasks/task_xxx/schedule' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `task not found`
- `manual task cannot be scheduled`
- `task already scheduling`
- `failed to update task status`

### `POST /api/v1/tasks/:id/stop`

用途：停止调度中的任务。

认证：需要

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/tasks/task_xxx/stop' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `unable to stop scheduling task has not started yet`

### `POST /api/v1/tasks/:id/run`

用途：立即执行一次任务。

认证：需要

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/tasks/task_xxx/run' \
  -H 'Authorization: Bearer <token>'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": "task has started running, please check the results"
}
```

## 任务模板接口

### `GET /api/v1/task-templates`

用途：获取任务模板列表。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/task-templates' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "tpl_xxx",
        "name": "mysql_to_json",
        "tasktypes": "manual",
        "cron": "manual",
        "data": {}
      }
    ]
  }
}
```

### `POST /api/v1/task-templates`

用途：创建或更新任务模板。

认证：需要

请求体字段：

- `id`：更新时可传
- `name`：模板名
- `tasktypes`：模板类型
- `cron`
- `params`

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/task-templates' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "",
    "name": "mysql_to_json",
    "tasktypes": "manual",
    "cron": "manual",
    "params": {
      "before_execute": null,
      "source": {
        "type": "mysql",
        "data_source": "ds_xxx",
        "params": [
          { "key": "query", "value": "SELECT id,name FROM demo" }
        ]
      },
      "processors": [],
      "sink": {
        "type": "json",
        "params": [
          { "key": "file_name", "value": "demo_export" },
          { "key": "file_ext", "value": "json" }
        ]
      },
      "after_execute": null
    }
  }'
```

常见报错：

- `task template not found`
- `failed to save task template`

### `DELETE /api/v1/task-templates/:id`

用途：删除模板。

认证：需要

调用示例：

```bash
curl -X DELETE 'http://127.0.0.1:8080/api/v1/task-templates/tpl_xxx' \
  -H 'Authorization: Bearer <token>'
```

## 任务记录接口

### `GET /api/v1/task-records`

用途：分页获取任务执行记录。

认证：需要

query 参数：

- `page_no`
- `page_size`
- `mission_name`
- `status`
- `id`
- `task_id`

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/task-records?page_no=1&page_size=10&status=1' \
  -H 'Authorization: Bearer <token>'
```

成功响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 1,
    "page_no": 1,
    "page_size": 10,
    "list": [
      {
        "id": "record_xxx",
        "task_id": "task_xxx",
        "status": 1,
        "start_time": "2026-04-05T10:00:00+08:00",
        "end_time": "2026-04-05T10:00:10+08:00",
        "message": ""
      }
    ]
  }
}
```

### `GET /api/v1/tasks/:id/records`

用途：按任务 ID 查询执行记录。

认证：需要

说明：

- 实际上是 `task-records` 的任务维度查询封装

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/tasks/task_xxx/records?page_no=1&page_size=10' \
  -H 'Authorization: Bearer <token>'
```

### `GET /api/v1/tasks/:id/log`

用途：获取某任务最近一次执行摘要。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/tasks/task_xxx/log' \
  -H 'Authorization: Bearer <token>'
```

成功响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "task_id": "task_xxx",
    "record_id": "record_xxx",
    "status": 1,
    "start_time": "2026-04-05T10:00:00+08:00",
    "end_time": "2026-04-05T10:00:10+08:00",
    "message": ""
  }
}
```

常见报错：

- `task record not found`

### `POST /api/v1/task-records/:id/cancel`

用途：取消运行中的任务记录。

认证：需要

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/task-records/record_xxx/cancel' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `task record not found`
- `task record already finish`

### `GET /api/v1/task-records/:id/files`

用途：查看某次任务执行关联的文件。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/task-records/record_xxx/files' \
  -H 'Authorization: Bearer <token>'
```

成功响应中的元素字段：

- `id`
- `name`
- `path`
- `size`
- `ex_name`

### `GET /api/v1/task-records/:id/params`

用途：查看该次任务执行实际使用的参数快照。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/task-records/record_xxx/params' \
  -H 'Authorization: Bearer <token>'
```

成功响应中的关键字段：

- `id`
- `task_id`
- `mission_name`
- `params`

### `GET /api/v1/task-records/:id/logs`

用途：查看该次任务执行日志摘要。

认证：需要

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/task-records/record_xxx/logs' \
  -H 'Authorization: Bearer <token>'
```

成功响应中的关键字段：

- `id`
- `task_id`
- `mission_name`
- `status`
- `start_time`
- `end_time`
- `message`
- `log`

## 文件接口

### `GET /api/v1/files`

用途：分页查询文件列表。

认证：需要

query 参数：

- `page_no`
- `page_size`
- `keyword`
- `ids`

说明：

- `ids` 为逗号分隔的文件 ID 列表

调用示例：

```bash
curl 'http://127.0.0.1:8080/api/v1/files?page_no=1&page_size=10&keyword=demo' \
  -H 'Authorization: Bearer <token>'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 1,
    "page_no": 1,
    "page_size": 10,
    "list": [
      {
        "id": "file_xxx",
        "name": "demo.csv",
        "path": "2026/04/05/demo.csv",
        "size": 1024,
        "ex_name": ".csv"
      }
    ]
  }
}
```

### `POST /api/v1/files`

用途：上传文件。

认证：需要

请求类型：

- `multipart/form-data`

表单字段：

- `file`

调用示例：

```bash
curl -X POST 'http://127.0.0.1:8080/api/v1/files' \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@/path/to/demo.csv'
```

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "file_xxx",
    "name": "demo.csv",
    "path": "2026/04/05/demo.csv",
    "size": 1024,
    "ex_name": ".csv"
  }
}
```

常见报错：

- `failed to upload file`

### `DELETE /api/v1/files/:id`

用途：删除文件。

认证：需要

调用示例：

```bash
curl -X DELETE 'http://127.0.0.1:8080/api/v1/files/file_xxx' \
  -H 'Authorization: Bearer <token>'
```

常见报错：

- `failed to delete file`

## 文件下载

### `GET /file/<path>?token=<jwt>`

用途：直接访问物理文件。

方式一：Token

```text
http://127.0.0.1:8080/file/2026/04/05/demo.csv?token=<jwt>
```

方式二：签名

```text
http://127.0.0.1:8080/file/2026/04/05/demo.csv?timestamp=1712300000&sign=<md5>
```

说明：

- `/file/*` 不走 `/api/v1` 包装响应
- 文件鉴权失败时，会直接返回错误 JSON

## 报错处理建议

### 1. 先区分是哪一类错误

- `400`：你传错了
- `401`：你没登录、Token 失效、或签名错了
- `422`：参数格式对了，但业务不允许

### 2. Token 模式建议

- 请求前检查 token 是否为空
- 收到 `invalid token` 后，先刷新 token 再重试一次
- 刷新失败则重新登录

### 3. 签名模式建议

重点检查：

- `timestamp` 是否是秒级时间戳
- 客户端时间是否准确
- query 参数是否按规则排序
- 请求体是否与签名前完全一致
- `sign` 是否使用了正确的 `apiSecret`

### 4. 组件和任务类接口建议

在创建任务前，建议先调用：

1. `GET /api/v1/data-sources/types`
2. `GET /api/v1/variables/types`
3. `GET /api/v1/components`

这样客户端可以根据服务端元信息动态生成表单，减少：

- key 写错
- 必填项缺失
- 数据源类型绑定错误
- 把内部参数当成用户参数传递
