# 变量配置

变量是 ETL-GO 中用于存储动态值和查询结果的组件。变量可以在任务执行时动态获取值，实现灵活的配置和数据处理。

## 变量的作用

变量在 ETL 任务中主要用于：

1. **动态参数** - 在 SQL 查询中使用变量作为参数
2. **中间结果** - 存储查询结果供后续步骤使用
3. **条件判断** - 根据变量值决定任务执行逻辑
4. **配置复用** - 将常用配置定义为变量，多处复用

## 支持的变量类型

### SQL 查询变量
通过执行 SQL 查询获取变量值，支持以下数据源：
- MySQL
- PostgreSQL  
- SQLite

## 创建变量

### 通过 Web 界面创建

1. 登录 ETL-GO Web 界面
2. 在左侧导航栏点击「变量管理」
3. 点击「新建变量」按钮
4. 选择变量类型并填写配置信息
5. 点击「测试」验证变量配置
6. 点击「保存」

### SQL 查询变量配置

#### 基础配置
```yaml
# 变量基本信息
name: 用户总数           # 变量名称
description: 统计用户表的总记录数  # 变量描述
type: sql              # 变量类型

# 数据源配置
datasource_id: datasource_mysql_prod  # 关联的数据源ID

# SQL 查询配置
sql: SELECT COUNT(*) as count FROM users  # 查询SQL
```

#### 带参数的 SQL 查询
```yaml
name: 今日新增用户
description: 查询今天新增的用户数量
type: sql
datasource_id: datasource_mysql_prod
sql: |
  SELECT COUNT(*) as count 
  FROM users 
  WHERE DATE(created_at) = CURDATE()
```

#### 多结果 SQL 查询
```yaml
name: 用户统计
description: 获取用户统计数据
type: sql
datasource_id: datasource_mysql_prod
sql: |
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    AVG(age) as avg_age
  FROM users
```

## 变量使用

### 在任务中引用变量

变量可以在任务的各个组件中使用：

#### 1. 在数据输入（Source）中使用
```sql
-- 在SQL查询中使用变量
SELECT * FROM orders 
WHERE order_date >= '{{开始日期}}' 
  AND order_date <= '{{结束日期}}'
  AND user_id IN ({{用户ID列表}})
```

#### 2. 在数据处理（Processor）中使用
```yaml
# 在过滤器中使用变量
filter_condition: "age > {{最小年龄}} AND age < {{最大年龄}}"

# 在数据类型转换中使用变量
target_type: "{{目标数据类型}}"
```

#### 3. 在数据输出（Sink）中使用
```sql
-- 在目标表名中使用变量
INSERT INTO {{目标表名}}_backup (column1, column2) VALUES (?, ?)

-- 在插入值中使用变量
INSERT INTO log_table (event_type, event_time, user_count) 
VALUES ('daily_report', NOW(), {{用户总数}})
```

#### 4. 在执行器（Executor）中使用
```sql
-- 在执行SQL中使用变量
UPDATE config_table 
SET value = '{{新配置值}}' 
WHERE key = '{{配置键}}'
```

### 变量值格式

#### 单值变量
如果 SQL 查询返回单行单列，变量值为该单元格的值：
```sql
-- 查询：SELECT COUNT(*) FROM users
-- 变量值：1000（整数）
```

#### 多值变量
如果 SQL 查询返回多行或多列，变量值为 JSON 格式：
```sql
-- 查询：SELECT id, name FROM users LIMIT 2
-- 变量值：[{"id":1,"name":"张三"},{"id":2,"name":"李四"}]
```

#### 键值对变量
可以通过 SQL 查询创建键值对：
```sql
-- 查询：SELECT config_key, config_value FROM system_config
-- 变量值：{"site_name":"ETL系统","version":"1.0.0"}
```

## 变量管理

### 查看变量列表
在「变量管理」页面可以查看所有已配置的变量，包括：
- 变量名称和描述
- 变量类型
- 最后更新时间
- 最后执行结果

### 测试变量
可以随时测试变量配置是否正确：
1. 在变量列表中点击「测试」按钮
2. 系统会执行变量查询并显示结果
3. 检查结果是否符合预期

### 编辑变量
点击变量列表中的「编辑」按钮可以修改变量配置。

### 删除变量
点击变量列表中的「删除」按钮可以删除不再需要的变量。

**注意**：删除变量时，请确保没有任务正在引用该变量。

## 最佳实践

### 1. 命名规范
建议使用有意义的变量名：
- `user_total_count` - 用户总数
- `daily_order_stats` - 每日订单统计
- `config_site_title` - 站点标题配置

### 2. 性能优化
- **缓存结果**：对于不经常变化的数据，可以考虑缓存变量结果
- **简化查询**：避免复杂查询，减少数据库负载
- **分页查询**：对于大量数据，考虑分页查询

### 3. 错误处理
```sql
-- 使用COALESCE处理空值
SELECT COALESCE(COUNT(*), 0) as count FROM users

-- 使用TRY_CATCH处理错误
BEGIN TRY
    SELECT COUNT(*) FROM users
END TRY
BEGIN CATCH
    SELECT 0 as count
END CATCH
```

### 4. 安全考虑
- **避免 SQL 注入**：不要在变量配置中拼接用户输入
- **最小权限原则**：变量查询使用只读权限账户
- **敏感数据脱敏**：避免在变量中存储敏感信息

## 实际应用示例

### 示例1：动态日期范围
```yaml
# 变量：上个月第一天
name: last_month_first_day
sql: SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') as date

# 变量：上个月最后一天  
name: last_month_last_day
sql: SELECT LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) as date

# 在任务中使用
SELECT * FROM orders 
WHERE order_date BETWEEN '{{last_month_first_day}}' AND '{{last_month_last_day}}'
```

### 示例2：配置驱动任务
```yaml
# 变量：需要同步的表列表
name: sync_table_list
sql: SELECT table_name FROM sync_config WHERE enabled = 1

# 任务中循环处理每个表
# 使用变量值动态生成SQL
```

### 示例3：条件执行
```yaml
# 变量：检查数据是否就绪
name: data_ready_check
sql: SELECT COUNT(*) as ready FROM data_source WHERE status = 'ready'

# 在任务条件中使用
# 只有当 ready > 0 时才执行后续步骤
```

## 故障排除

### 常见问题

#### 1. 变量查询失败
**可能原因**：
- 数据源连接失败
- SQL 语法错误
- 权限不足
- 表不存在

**解决方案**：
- 检查数据源连接状态
- 验证 SQL 语法
- 检查数据库权限
- 确认表结构

#### 2. 变量值为空
**可能原因**：
- 查询结果为空
- 列名不匹配
- 数据类型转换错误

**解决方案**：
- 检查查询条件
- 确认返回列名
- 验证数据类型

#### 3. 变量引用错误
**可能原因**：
- 变量名拼写错误
- 变量未定义
- 变量作用域问题

**解决方案**：
- 检查变量名是否正确
- 确认变量已创建
- 检查变量作用域

## API 参考

### 创建变量
```http
POST /api/variable
Content-Type: application/json

{
  "type": "sql",
  "datasource_id": "datasource_123",
  "name": "用户统计",
  "description": "统计用户基本信息",
  "value": [
    {
      "key": "sql",
      "value": "SELECT COUNT(*) as total, AVG(age) as avg_age FROM users"
    }
  ],
  "edit": "true"
}
```

### 获取变量列表
```http
GET /api/variable/list
```

### 测试变量
```http
POST /api/variable/test
Content-Type: application/json

{
  "id": "variable_123"
}
```

### 删除变量
```http
DELETE /api/variable
Content-Type: application/json

{
  "id": "variable_123"
}
```

## 下一步

配置好变量后，您可以：
1. [创建任务](/task) - 在任务中使用变量
2. [设置任务调度](/task-schedule) - 自动化执行带变量的任务
3. [查看任务执行情况](/task-record) - 监控变量使用情况