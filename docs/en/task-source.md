# Data Input

Data Input (Source) is the first step in an ETL task, responsible for extracting data from various data sources. ETL-GO supports multiple data input methods, including SQL queries, CSV files, and JSON files.

## Supported Data Input Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| **SQL Query** | Execute SQL queries from databases to extract data | Relational database data extraction |
| **CSV File** | Read data from CSV format files | File data import, data exchange |
| **JSON File** | Read data from JSON format files | API data export, configuration files |

## SQL Query Input

SQL query input supports the following databases:
- MySQL
- PostgreSQL
- SQLite

### Basic Configuration
```yaml
Type: sql
Data Source: Production Database      # Select configured data source
Parameters:
  - key: query           # SQL query statement
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

### Advanced Features

#### 1. Using Variables for Dynamic Queries
```sql
-- Using date variables
SELECT * FROM orders 
WHERE order_date >= '{{开始日期}}' 
  AND order_date <= '{{结束日期}}'

-- Using list variables
SELECT * FROM products 
WHERE category_id IN ({{品类ID列表}})

-- Using conditional variables
SELECT * FROM users 
WHERE 
  {{是否包含测试用户}} = 1 OR is_test = 0
```

#### 2. Paginated Queries for Large Data
```sql
-- Using LIMIT and OFFSET for pagination
SELECT * FROM large_table 
ORDER BY id 
LIMIT 1000 OFFSET {{页码}} * 1000

-- Using WHERE condition for pagination (better performance)
SELECT * FROM large_table 
WHERE id > {{上一页最后ID}}
ORDER BY id 
LIMIT 1000
```

#### 3. Joining Multiple Tables
```sql
-- Inner join
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

-- Left join
SELECT 
  e.employee_id,
  e.employee_name,
  d.department_name,
  m.manager_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id
LEFT JOIN employees m ON e.manager_id = m.employee_id
```

#### 4. Aggregation Queries
```sql
-- Group statistics
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

-- Conditional aggregation
SELECT 
  product_category,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
FROM orders
GROUP BY product_category
```

#### 5. Subqueries and CTE
```sql
-- Subquery
SELECT 
  customer_id,
  customer_name,
  (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.customer_id) as order_count,
  (SELECT SUM(amount) FROM orders WHERE orders.customer_id = customers.customer_id) as total_spent
FROM customers
WHERE customer_status = 'active'

-- Common Table Expression (CTE)
WITH monthly_sales AS (
  SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    COUNT(*) as order_count,
    SUM(amount) as total_sales
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
customer_stats AS (
  SELECT 
    customer_id,
    COUNT(*) as order_count,
    AVG(amount) as avg_order_value
  FROM orders
  GROUP BY customer_id
)
SELECT 
  ms.month,
  ms.order_count,
  ms.total_sales,
  cs.avg_order_value
FROM monthly_sales ms
LEFT JOIN customer_stats cs ON 1=1
ORDER BY ms.month DESC
```

#### 6. Window Functions
```sql
-- Ranking
SELECT 
  product_id,
  product_name,
  sales_amount,
  RANK() OVER (ORDER BY sales_amount DESC) as sales_rank,
  DENSE_RANK() OVER (ORDER BY sales_amount DESC) as dense_sales_rank,
  ROW_NUMBER() OVER (ORDER BY sales_amount DESC) as row_num
FROM product_sales
WHERE year = 2024;

-- Moving averages
SELECT 
  date,
  sales_amount,
  AVG(sales_amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as weekly_avg,
  AVG(sales_amount) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as monthly_avg
FROM daily_sales;

-- Cumulative totals
SELECT 
  date,
  sales_amount,
  SUM(sales_amount) OVER (ORDER BY date) as cumulative_sales
FROM daily_sales;
```

### SQL Query Performance Optimization

#### 1. Index Usage
```sql
-- Use indexed columns in WHERE clause
SELECT * FROM users WHERE email = 'user@example.com';

-- Use indexed columns in ORDER BY
SELECT * FROM orders ORDER BY order_date DESC;

-- Avoid functions on indexed columns
-- Bad: SELECT * FROM users WHERE YEAR(created_at) = 2024;
-- Good: SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

#### 2. Query Optimization
```sql
-- Use EXISTS instead of IN for large datasets
-- Bad: SELECT * FROM customers WHERE customer_id IN (SELECT customer_id FROM large_orders);
-- Good: SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM large_orders o WHERE o.customer_id = c.customer_id);

-- Limit result set size
SELECT * FROM large_table LIMIT 1000;

-- Select only needed columns
SELECT id, name, email FROM users;
```

#### 3. Join Optimization
```sql
-- Use appropriate join types
SELECT * FROM small_table s LEFT JOIN large_table l ON s.id = l.small_id;

-- Use indexes for join conditions
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_customers_id ON customers(customer_id);
```

## CSV File Input

Read data from CSV format files.

### Basic Configuration
```yaml
类型: csv
参数:
  - key: file_path      # CSV文件路径
    value: "/data/input/users.csv"
    
  - key: encoding       # 文件编码
    value: "utf-8"      # 支持: utf-8, gbk, gb2312
    
  - key: delimiter      # 分隔符
    value: ","          # 默认逗号分隔
    
  - key: quote_char     # 引号字符
    value: '"'          # 默认双引号
    
  - key: has_header     # 是否包含表头
    value: "true"
```

### CSV Format Options

#### 1. Different Delimiters
```yaml
# 逗号分隔（默认）
delimiter: ","

# 制表符分隔
delimiter: "\t"

# 分号分隔
delimiter: ";"

# 竖线分隔
delimiter: "|"
```

#### 2. Different Encodings
```yaml
# UTF-8（默认）
encoding: "utf-8"

# UTF-8 with BOM（Excel兼容）
encoding: "utf-8-bom"

# GBK（中文编码）
encoding: "gbk"

# GB2312
encoding: "gb2312"

# ASCII
encoding: "ascii"
```

#### 3. Quote Handling
```yaml
# 双引号（默认）
quote_char: '"'

# 单引号
quote_char: "'"

# 无引号
quote_char: ""

# 自动检测引号
auto_detect_quotes: "true"
```

#### 4. Other Options
```yaml
# 跳过空行
skip_empty_lines: "true"

# 空值处理
null_value: "NULL"

# 注释字符
comment_char: "#"

# 转义字符
escape_char: "\\"

# 行结束符
line_terminator: "\n"  # Unix/Linux
line_terminator: "\r\n" # Windows
line_terminator: "\r"   # Classic Mac
```

### Advanced CSV Features

#### 1. Column Mapping
```yaml
参数:
  - key: columns        # 列映射配置
    value: |
      [
        {"name": "id", "type": "integer"},
        {"name": "name", "type": "string"},
        {"name": "email", "type": "string"},
        {"name": "age", "type": "integer"},
        {"name": "created_at", "type": "datetime", "format": "yyyy-MM-dd HH:mm:ss"}
      ]
```

#### 2. Data Filtering
```yaml
参数:
  - key: filter_condition  # 过滤条件
    value: "age >= 18 AND email LIKE '%@%'"
    
  - key: on_filter_fail    # 过滤失败处理
    value: "skip"          # skip: 跳过, log: 记录日志
```

#### 3. Data Transformation
```yaml
参数:
  - key: transform_rules   # 数据转换规则
    value: |
      {
        "amount": "REPLACE(amount, ',', '')",  # 移除千分位逗号
        "date": "DATE_FORMAT(date, '%Y-%m-%d')",  # 格式化日期
        "name": "TRIM(name)"  # 去除首尾空格
      }
```

#### 4. Multi-file Processing
```yaml
参数:
  - key: file_pattern      # 文件模式匹配
    value: "/data/input/sales_*.csv"
    
  - key: file_encoding     # 按文件指定编码
    value: |
      {
        "sales_2024.csv": "utf-8",
        "sales_legacy.csv": "gbk"
      }
    
  - key: merge_results     # 合并多个文件结果
    value: "true"
```

### CSV File Examples

#### Example 1: User Data Import
```yaml
类型: csv
参数:
  - key: file_path
    value: "/data/import/users_{{日期}}.csv"
    
  - key: encoding
    value: "utf-8-bom"  # Excel兼容
    
  - key: delimiter
    value: ","
    
  - key: has_header
    value: "true"
    
  - key: columns
    value: |
      [
        {"name": "user_id", "type": "integer"},
        {"name": "username", "type": "string"},
        {"name": "email", "type": "string"},
        {"name": "phone", "type": "string"},
        {"name": "registration_date", "type": "datetime", "format": "yyyy-MM-dd"},
        {"name": "status", "type": "string"}
      ]
```

#### Example 2: Financial Data Processing
```yaml
类型: csv
参数:
  - key: file_path
    value: "/finance/reports/daily_transactions.csv"
    
  - key: delimiter
    value: "|"
    
  - key: quote_char
    value: ""
    
  - key: has_header
    value: "false"
    
  - key: columns
    value: |
      [
        {"name": "transaction_id", "type": "string", "position": 0},
        {"name": "account_number", "type": "string", "position": 1},
        {"name": "transaction_date", "type": "datetime", "position": 2, "format": "yyyyMMdd"},
        {"name": "amount", "type": "float", "position": 3},
        {"name": "currency", "type": "string", "position": 4},
        {"name": "description", "type": "string", "position": 5}
      ]
    
  - key: filter_condition
    value: "amount != 0 AND transaction_date >= '{{处理日期}}'"
```

#### Example 3: Log File Analysis
```yaml
类型: csv
参数:
  - key: file_pattern
    value: "/logs/app/*.log"
    
  - key: delimiter
    value: "\t"
    
  - key: has_header
    value: "false"
    
  - key: columns
    value: |
      [
        {"name": "timestamp", "type": "datetime", "format": "yyyy-MM-dd HH:mm:ss.SSS"},
        {"name": "log_level", "type": "string"},
        {"name": "service", "type": "string"},
        {"name": "message", "type": "string"},
        {"name": "user_id", "type": "string"},
        {"name": "ip_address", "type": "string"}
      ]
    
  - key: filter_condition
    value: "log_level IN ('ERROR', 'WARN')"
    
  - key: merge_results
    value: "true"
```

## JSON File Input

Read data from JSON format files.

### Basic Configuration
```yaml
类型: json
参数:
  - key: file_path      # JSON文件路径
    value: "/data/input/users.json"
    
  - key: encoding       # 文件编码
    value: "utf-8"
    
  - key: format         # JSON格式
    value: "array"      # array: JSON数组, object: 包含数据键的对象
```

### JSON Format Support

#### 1. JSON Array Format
```json
[
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
```

Configuration:
```yaml
参数:
  - key: format
    value: "array"
```

#### 2. JSON Object with Data Key
```json
{
  "data": [
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
  ],
  "total": 2,
  "page": 1,
  "page_size": 10
}
```

Configuration:
```yaml
参数:
  - key: format
    value: "object"
    
  - key: data_key       # 数据数组的键名
    value: "data"
```

#### 3. JSON Lines Format (ndjson)
```json
{"id": 1, "name": "张三", "email": "zhangsan@example.com"}
{"id": 2, "name": "李四", "email": "lisi@example.com"}
{"id": 3, "name": "王五", "email": "wangwu@example.com"}
```

Configuration:
```yaml
参数:
  - key: format
    value: "jsonl"      # JSON Lines格式
```

### Advanced JSON Features

#### 1. Nested JSON Processing
```yaml
参数:
  - key: flatten_nested  # 展平嵌套JSON
    value: "true"
    
  - key: nested_separator  # 嵌套字段分隔符
    value: "_"
    
# 输入: {"user": {"id": 1, "profile": {"name": "张三", "age": 30}}}
# 输出: {"user_id": 1, "user_profile_name": "张三", "user_profile_age": 30}
```

#### 2. JSON Path Filtering
```yaml
参数:
  - key: json_path      # JSON路径过滤
    value: "$.data[?(@.status == 'active')]"
    
  - key: select_fields  # 选择字段
    value: "$.id, $.name, $.email"
```

#### 3. Schema Validation
```yaml
参数:
  - key: schema         # JSON Schema验证
    value: |
      {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "name": {"type": "string"},
          "email": {"type": "string", "format": "email"}
        },
        "required": ["id", "name"]
      }
    
  - key: on_schema_fail  # Schema验证失败处理
    value: "skip"        # skip: 跳过, log: 记录日志, fail: 失败
```

### JSON File Examples

#### Example 1: API Response Processing
```yaml
类型: json
参数:
  - key: file_path
    value: "/api/responses/users_{{时间戳}}.json"
    
  - key: format
    value: "object"
    
  - key: data_key
    value: "items"
    
  - key: encoding
    value: "utf-8"
    
  - key: flatten_nested
    value: "true"
    
  - key: nested_separator
    value: "_"
```

#### Example 2: Configuration File Loading
```yaml
类型: json
参数:
  - key: file_path
    value: "/configs/system_config.json"
    
  - key: format
    value: "object"
    
  - key: json_path
    value: "$.modules[?(@.enabled == true)]"
    
  - key: select_fields
    value: "$.name, $.version, $.config"
```

#### Example 3: Log Data in JSON Lines
```yaml
类型: json
参数:
  - key: file_path
    value: "/logs/json/app_{{日期}}.jsonl"
    
  - key: format
    value: "jsonl"
    
  - key: encoding
    value: "utf-8"
    
  - key: filter_condition
    value: "level == 'ERROR' OR level == 'WARN'"
    
  - key: flatten_nested
    value: "true"
```

## Performance Optimization

### 1. Batch Processing
```yaml
batch_config:
  size: 1000           # 每批记录数
  timeout: 30s         # 批次超时时间
  workers: 4           # 并行工作线程数
```

### 2. Memory Management
```yaml
memory_config:
  max_heap_mb: 1024    # 最大堆内存（MB）
  spill_to_disk: true  # 内存不足时溢出到磁盘
  temp_dir: /tmp/etl   # 临时目录
```

### 3. File Processing Optimization
```yaml
file_config:
  buffer_size: 65536   # 缓冲区大小（字节）
  read_ahead: true     # 预读优化
  compression: auto    # 自动检测压缩格式（gzip, zip等）
```

## Error Handling

### Common Input Errors

#### 1. File Not Found
**Causes**:
- Incorrect file path
- File permissions
- Network mount issues

**Solutions**:
- Verify file path
- Check file permissions
- Test network connectivity

#### 2. Encoding Issues
**Causes**:
- Incorrect encoding specification
- Corrupted file
- Mixed encoding

**Solutions**:
- Try different encodings
- Use encoding detection
- Validate file integrity

#### 3. Format Errors
**Causes**:
- Invalid CSV/JSON format
- Malformed data
- Schema violations

**Solutions**:
- Validate file format
- Use strict parsing
- Implement error recovery

### Error Handling Strategies
```yaml
error_handling:
  strategy: continue_on_error  # 继续处理，记录错误
  max_errors: 100             # 最大错误数
  error_log_file: /logs/input_errors.log
  
  recovery:
    bad_lines: skip           # 跳过错误行
    missing_files: log        # 记录缺失文件
    encoding_errors: try_next # 尝试其他编码
```

## Best Practices

### 1. Input Validation
- Validate file existence and permissions before processing
- Check file size and modification time
- Verify encoding and format compatibility

### 2. Performance Tuning
- Use appropriate batch sizes
- Enable compression for large files
- Optimize memory usage

### 3. Data Quality
- Implement data validation rules
- Handle missing and malformed data
- Log data quality issues

### 4. Security
- Validate file paths to prevent path traversal
- Sanitize input data
- Implement access control

## API Reference

### SQL Query Input
```http
POST /api/task/source/sql
Content-Type: application/json

{
  "data_source_id": "datasource_mysql",
  "sql": "SELECT * FROM users WHERE status = 'active'",
  "parameters": {
    "limit": 1000,
    "timeout": "30s"
  }
}
```

### CSV File Input
```http
POST /api/task/source/csv
Content-Type: application/json

{
  "file_path": "/data/input/users.csv",
  "encoding": "utf-8",
  "delimiter": ",",
  "has_header": true,
  "columns": [
    {"name": "id", "type": "integer"},
    {"name": "name", "type": "string"}
  ]
}
```

### JSON File Input
```http
POST /api/task/source/json
Content-Type: application/json

{
  "file_path": "/data/input/users.json",
  "encoding": "utf-8",
  "format": "array",
  "flatten_nested": true
}
```

## Next Steps

After configuring data input, you can:
1. [Configure Data Processing](/task-processor) - Process the input data
2. [Configure Data Output](/task-sink) - Output the processed data
3. [Monitor Input Performance](/task-monitor) - Track input performance metrics
4. [Troubleshoot Input Issues](/troubleshooting) - Resolve input-related problems