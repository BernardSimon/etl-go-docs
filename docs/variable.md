
# 变量配置

ETL-GO 当前支持的变量组件类型为 SQL 变量，用于从数据库读取动态参数。

支持的数据源类型：

- MySQL
- PostgreSQL
- SQLite

## 变量用途

变量会在任务执行前被解析，并替换到任务参数值中，常用于：

- 日期分区参数
- 增量游标
- 运行批次号
- 动态 SQL 条件

## 工作方式

1. 在变量配置中选择数据库数据源
2. 编写 SQL 查询语句
3. 变量执行后将结果返回给任务参数

## 参数说明

- `query`：必填，且必须是 `SELECT` 语句

## 示例（推荐）

返回单值：

```sql
SELECT max(updated_at) FROM order_table
```

返回字符串值：

```sql
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d')
```

## 注意事项

- 变量 SQL 应尽量返回单行单列，避免歧义。
- 变量阶段禁止写操作（`INSERT/UPDATE/DELETE/...`）。
- 变量查询过慢会直接拉长任务启动时间。

## 常见错误排查

### 1. `variable query is required`

- 未配置 `query` 参数。

### 2. `variable Should Has SELECT Prefix`

- SQL 不是 `SELECT` 开头。

### 3. `variable Should Not Contains Dangerous Keywords`

- SQL 包含危险关键字，被安全检查拦截。

### 4. 变量替换后仍报参数错误

- 替换值可能为空或格式不匹配下游组件要求，建议在任务记录中检查替换后的参数内容。
