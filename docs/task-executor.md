
# 前后置处理器

Executor 用于执行任务的前置和后置 SQL 语句，通常用于准备环境或写入状态。

## 支持的 Executor

- MySQL
- PostgreSQL
- SQLite

## 使用场景

- 任务开始前创建临时表
- 在 Source 之前清理旧数据
- 在任务完成后写入执行结果、归档数据或通知状态

## 典型配置

- `Before Executor`：任务开始前执行的 SQL
- `After Executor`：任务完成后执行的 SQL

参数：

- `sql`（必填）
- `allow_dangerous`（可选，默认 `false`）

## 注意

- Executor 不会直接参与数据管道的数据流
- 若前置 SQL 失败，任务会被中止
- 后置 SQL 一般用于补偿、统计或回写任务状态

## 常见错误

### 1. `config is missing or has invalid 'sql'`

- 未配置 SQL 或 key 不匹配。

### 2. SQL 被安全校验拦截

- SQL 包含危险语句，且未显式允许。

### 3. 数据源未绑定

- 执行器依赖数据库数据源，必须选择对应类型数据源。
