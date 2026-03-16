# 数据输入

数据输入（Source）是 ETL 任务的第一步，负责从各种数据源中提取数据。ETL-GO 支持多种数据输入方式，包括 SQL 查询、CSV 文件和 JSON 文件。

## 支持的数据输入类型

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| **SQL 查询** | 从数据库执行 SQL 查询提取数据 | 关系型数据库数据提取 |
| **CSV 文件** | 读取 CSV 格式的文件数据 | 文件数据导入、数据交换 |
| **JSON 文件** | 读取 JSON 格式的文件数据 | API 数据导出、配置文件 |

## SQL 查询输入

SQL 查询输入支持以下数据库：
- MySQL
- PostgreSQL
- SQLite

### 基础配置
```yaml
类型: sql
数据源: 生产数据库         # 选择已配置的数据源
参数:
  - key: query           # SQL 查询语句
    value: |
      SELECT 
        id,
        name,
        email,
        created_at,
        updated_at
      FROM users
      WHERE status = 'active'
        AND created_at >= '2024-01-01'
```

### 高级功能

#### 1. 使用变量动态查询
```sql
-- 使用日期变量
SELECT * FROM orders 
WHERE order_date >= '{{开始日期}}' 
  AND order_date <= '{{结束日期}}'

-- 使用列表变量
SELECT * FROM products 
WHERE category_id IN ({{品类ID列表}})

-- 使用条件变量
SELECT * FROM users 
WHERE 
  {{是否包含测试用户}} = 1 OR is_test = 0
```

#### 2. 分页查询大数据
```sql
-- 使用 LIMIT 和 OFFSET 分页
SELECT * FROM large_table 
ORDER BY id 
LIMIT 1000 OFFSET {{页码}} * 1000

-- 使用 WHERE 条件分页（性能更好）
SELECT * FROM large_table 
WHERE id > {{上一页最后ID}}
ORDER BY id 
LIMIT 1000
```

#### 3. 连接多个表
```sql
-- 内连接
SELECT 
  o.order_id,
  o.order_date,
  c.customer_name,
  p.product_name,
  o.quantity,
  o.amount
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON o.product_id = p.product_id
WHERE o.order_status = 'completed'

-- 左连接
SELECT 
  e.employee_id,
  e.employee_name,
  d.department_name,
  m.manager_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id
LEFT JOIN employees m ON e.manager_id = m.employee_id
```

#### 4. 聚合查询
```sql
-- 分组统计
SELECT 
  DATE(order_date) as order_day,
  COUNT(*) as order_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY DATE(order_date)
ORDER BY order_day DESC

-- 条件聚合
SELECT 
  product_category,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
FROM orders
GROUP BY product_category
```

### SQL 输入参数说明

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | 是 | 无 | SQL 查询语句，支持多行 |
| `timeout` | 否 | 30s | 查询超时时间 |
| `max_rows` | 否 | 100000 | 最大返回行数限制 |

## CSV 文件输入

CSV 文件输入支持从本地文件系统读取 CSV 格式的数据。

### 基础配置
```yaml
类型: csv
参数:
  - key: file_path      # 文件路径
    value: /data/orders.csv
    
  - key: has_header     # 是否包含表头
    value: "true"
    
  - key: delimiter      # 分隔符
    value: ","          # 逗号分隔
```

### 文件路径支持

#### 1. 绝对路径
```yaml
file_path: /home/user/data/input.csv
```

#### 2. 相对路径（相对于 ETL-GO 工作目录）
```yaml
file_path: ./data/input.csv
```

#### 3. 使用文件管理中的文件
如果文件已通过 ETL-GO 的文件管理功能上传：
```yaml
file_path: file://uploaded_files/订单数据.csv
```

### CSV 格式选项

#### 1. 分隔符配置
```yaml
# 逗号分隔（默认）
delimiter: ","

# 制表符分隔
delimiter: "\t"

# 分号分隔（欧洲常用）
delimiter: ";"

# 竖线分隔
delimiter: "|"
```

#### 2. 引号字符
```yaml
# 双引号（默认）
quote_char: '"'

# 单引号
quote_char: "'"

# 无引号
quote_char: ""
```

#### 3. 编码格式
```yaml
# UTF-8（默认）
encoding: "utf-8"

# GBK（中文编码）
encoding: "gbk"

# UTF-16
encoding: "utf-16"
```

#### 4. 其他选项
```yaml
# 跳过前几行（如注释行）
skip_lines: 2

# 指定列名（当 has_header=false 时）
columns: "id,name,email,phone"

# 处理空值
null_value: "NULL"
```

### CSV 输入示例

#### 示例1：标准 CSV 文件
```csv
id,name,email,created_at
1,张三,zhangsan@example.com,2024-01-01
2,李四,lisi@example.com,2024-01-02
3,王五,wangwu@example.com,2024-01-03
```

配置：
```yaml
类型: csv
参数:
  - key: file_path
    value: /data/users.csv
  - key: has_header
    value: "true"
  - key: delimiter
    value: ","
```

#### 示例2：自定义格式 CSV
```csv
id|name|email|phone|created_at|updated_at
1|张三|zhangsan@example.com|13800138000|2024-01-01 10:00:00|2024-01-01 10:00:00
2|李四|lisi@example.com|13900139000|2024-01-02 11:00:00|2024-01-02 11:00:00
```

配置：
```yaml
类型: csv
参数:
  - key: file_path
    value: /data/users_pipe.csv
  - key: has_header
    value: "true"
  - key: delimiter
    value: "|"
  - key: quote_char
    value: ""
```

## JSON 文件输入

JSON 文件输入支持从本地文件系统读取 JSON 格式的数据。

### 基础配置
```yaml
类型: json
参数:
  - key: file_path      # 文件路径
    value: /data/orders.json
    
  - key: json_path      # JSON 路径表达式（可选）
    value: "$.data.orders"
```

### JSON 格式支持

#### 1. 对象数组格式
```json
[
  {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "created_at": "2024-01-01"
  },
  {
    "id": 2,
    "name": "李四",
    "email": "lisi@example.com",
    "created_at": "2024-01-02"
  }
]
```

配置：
```yaml
类型: json
参数:
  - key: file_path
    value: /data/users.json
```

#### 2. 嵌套对象格式
```json
{
  "status": "success",
  "data": {
    "total": 100,
    "users": [
      {
        "id": 1,
        "name": "张三",
        "email": "zhangsan@example.com"
      },
      {
        "id": 2,
        "name": "李四", 
        "email": "lisi@example.com"
      }
    ]
  }
}
```

配置（使用 json_path 提取数组）：
```yaml
类型: json
参数:
  - key: file_path
    value: /data/api_response.json
  - key: json_path
    value: "$.data.users"
```

#### 3. 行分隔 JSON（JSON Lines）
```json
{"id": 1, "name": "张三", "email": "zhangsan@example.com"}
{"id": 2, "name": "李四", "email": "lisi@example.com"}
{"id": 3, "name": "王五", "email": "wangwu@example.com"}
```

配置：
```yaml
类型: json
参数:
  - key: file_path
    value: /data/users.jsonl
  - key: format
    value: "jsonl"      # 指定为 JSON Lines 格式
```

### JSON 路径表达式

JSON 路径（JSONPath）用于从复杂的 JSON 结构中提取数据：

| 表达式 | 描述 | 示例 |
|--------|------|------|
| `$` | 根元素 | `$` |
| `.` 或 `[]` | 子元素 | `$.store.book` 或 `$['store']['book']` |
| `*` | 通配符，所有元素 | `$.store.*` |
| `..` | 递归下降 | `$..price` |
| `[start:end:step]` | 数组切片 | `$[0:5]` |
| `[?(表达式)]` | 过滤表达式 | `$[?(@.price < 10)]` |

示例：
```yaml
# 提取所有书籍
json_path: "$.store.book[*]"

# 提取价格低于10的书籍
json_path: "$.store.book[?(@.price < 10)]"

# 提取前5个用户
json_path: "$.users[0:5]"
```

## 性能优化

### 1. SQL 查询优化
```sql
-- 使用索引字段作为条件
SELECT * FROM large_table WHERE indexed_column = 'value'

-- 只选择需要的列
SELECT id, name, email FROM users

-- 避免使用 SELECT *
SELECT id, name, email FROM users  -- 好
SELECT * FROM users                 -- 不好（性能差）

-- 使用 EXISTS 代替 IN（大数据量时）
SELECT * FROM orders o
WHERE EXISTS (
  SELECT 1 FROM customers c 
  WHERE c.customer_id = o.customer_id
)
```

### 2. 文件读取优化
```yaml
# 分批读取大文件
参数:
  - key: batch_size
    value: "1000"      # 每次读取1000行
    
  - key: buffer_size
    value: "65536"     # 缓冲区大小64KB
```

### 3. 内存控制
```yaml
# 限制最大内存使用
参数:
  - key: max_memory_mb
    value: "512"       # 最大使用512MB内存
    
  - key: spill_to_disk
    value: "true"      # 内存不足时溢出到磁盘
```

## 错误处理

### 1. SQL 查询错误
```yaml
# 设置查询超时
参数:
  - key: timeout
    value: "60s"       # 60秒超时
    
  - key: retry_count
    value: "3"         # 重试3次
    
  - key: retry_delay
    value: "5s"        # 每次重试间隔5秒
```

### 2. 文件读取错误
```yaml
# 文件不存在时的处理
参数:
  - key: skip_if_missing
    value: "true"      # 文件不存在时跳过
    
  - key: create_if_missing
    value: "false"     # 不自动创建文件
    
  - key: encoding_fallback
    value: "gbk"       # UTF-8失败时尝试GBK
```

### 3. 数据格式错误
```yaml
# CSV 格式容错
参数:
  - key: strict_mode
    value: "false"     # 宽松模式，跳过格式错误行
    
  - key: error_log_file
    value: "/logs/csv_errors.log"  # 错误日志文件
```

## 最佳实践

### 1. 数据验证
```sql
-- 在查询中添加数据验证
SELECT 
  id,
  name,
  email,
  CASE 
    WHEN email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    THEN email 
    ELSE NULL 
  END as valid_email,
  created_at
FROM users
```

### 2. 增量数据提取
```sql
-- 基于时间戳的增量提取
SELECT * FROM orders 
WHERE updated_at > '{{上次提取时间}}'
  AND updated_at <= NOW()
ORDER BY updated_at

-- 基于自增ID的增量提取
SELECT * FROM users 
WHERE id > {{上次最大ID}}
ORDER BY id 
LIMIT 10000
```

### 3. 数据采样（测试用）
```sql
-- 随机采样
SELECT * FROM large_table 
ORDER BY RAND() 
LIMIT 1000

-- 分层采样
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY RAND()) as rn
  FROM products
) t
WHERE rn <= 10  -- 每个品类取10个
```

## API 参考

### 创建带数据输入的任务
```http
POST /api/task
Content-Type: application/json

{
  "mission_name": "数据导入任务",
  "cron": "0 1 * * *",
  "params": {
    "source": {
      "type": "sql",
      "data_source": "datasource_mysql_prod",
      "params": [
        {
          "key": "query",
          "value": "SELECT * FROM daily_orders WHERE order_date = CURDATE() - INTERVAL 1 DAY"
        }
      ]
    },
    // ... 其他配置 ...
  }
}
```

## 下一步

配置好数据输入后，您可以：
1. [配置数据处理](/task-processor) - 对输入数据进行转换和清洗
2. [配置数据输出](/task-sink) - 将处理后的数据写入目标
3. [查看任务执行情况](/task-record) - 监控数据提取效果
4. [分析任务日志](/task-log) - 排查数据提取问题