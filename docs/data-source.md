
# 数据源配置

ETL-GO 内置的数据库数据源类型包括：

- MySQL
- PostgreSQL
- SQLite
- Doris

## 数据源作用与边界

- 数据源用于管理连接参数，并提供给 `Source/Sink/Executor/Variable` 复用。
- 一个任务内可共享同一数据源连接，减少重复连接创建。
- 数据源本身不执行业务逻辑，只负责连接初始化和生命周期。

## 通用字段

- `name`：数据源名称
- `type`：数据源类型，例如 `mysql`, `postgre`, `sqlite`, `doris`
- `host` / `port`：服务地址
- `user` / `password`：登录账号
- `database`：数据库名称

## 各类型最小配置建议

### MySQL

- `host`
- `port`（默认 `3306`）
- `user`
- `password`
- `database`

### PostgreSQL

- `host`
- `port`
- `user`
- `password`
- `database`

### SQLite

- `path`（文件路径）

### Doris

- `host`
- `port`
- `user`
- `password`
- `database`

## 使用场景

- SQL 源读取数据库内容
- SQL Sink 将数据写回数据库
- Executor 执行上下游 SQL 语句
- Variable 从数据库读取动态参数

## 使用建议与最佳实践

- 为“源库”和“目标库”分别建独立数据源，避免配置混淆。
- 数据源命名建议包含环境和用途，例如 `prod_mysql_read`。
- 当任务中同时使用多个数据库时，请分别配置不同的数据源名称。
- `Doris` 主要用于 Sink 端 Stream Load。

## 常见错误排查

### 1. `数据源不存在`

- 任务里引用的 `data_source` ID 无效或已删除。

### 2. `数据源类型错误`

- 例如 SQL Sink 期望 `mysql`，但任务绑定了 `postgre` 数据源。

### 3. 连接失败/超时

- 检查网络连通性、防火墙、账号权限、库名拼写。
