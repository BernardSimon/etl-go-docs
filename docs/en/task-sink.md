# Data Output

Data output (Sink) is the final step in an ETL task, responsible for writing processed data to target locations. ETL-GO supports multiple data output methods, including SQL databases, CSV files, JSON files, and Doris databases.

## Supported Data Output Types

| Output Type | Description | Use Cases |
|-------------|-------------|-----------|
| **SQL Database** | Write data to relational database tables | Data warehousing, data synchronization, data backup |
| **CSV File** | Write data to CSV format files | Data export, data exchange, report generation |
| **JSON File** | Write data to JSON format files | API data export, configuration file generation |
| **Doris Database** | Write data to Apache Doris database | Big data analytics, real-time data warehousing |

## SQL Database Output

SQL database output supports the following databases:
- MySQL
- PostgreSQL
- SQLite

### Basic Configuration
```yaml
Type: sql
Data Source: Target Database        # Select configured data source
Parameters:
  - key: table         # Target table name
    value: "users_backup"
    
  - key: columns       # Columns to write (optional, all columns used if not specified)
    value: "id,name,email,created_at"
    
  - key: mode          # Write mode
    value: "insert"    # Supported: insert, replace, update, upsert
```

### Write Mode Details

#### 1. INSERT Mode (Default)
```yaml
Parameters:
  - key: mode
    value: "insert"    # Direct insert, duplicate primary keys will cause error
    
# Generated SQL:
# INSERT INTO table (col1, col2) VALUES (?, ?)
```

#### 2. REPLACE Mode
```yaml
Parameters:
  - key: mode
    value: "replace"   # Replace duplicate records (delete then insert)
    
# Generated SQL:
# REPLACE INTO table (col1, col2) VALUES (?, ?)
# OR
# INSERT INTO table (col1, col2) VALUES (?, ?) ON DUPLICATE KEY UPDATE col1=VALUES(col1), col2=VALUES(col2)
```

#### 3. UPDATE Mode
```yaml
Parameters:
  - key: mode
    value: "update"    # Update existing records
    
  - key: key_columns   # Primary key columns (for matching records)
    value: "id"
    
# Generated SQL:
# UPDATE table SET col1=?, col2=? WHERE id=?
```

#### 4. UPSERT Mode (Merge Insert)
```yaml
Parameters:
  - key: mode
    value: "upsert"    # Update if exists, insert if not exists
  
  - key: key_columns   # Unique key columns
    value: "id,email"
    
# Generated SQL (MySQL):
# INSERT INTO table (id, name, email) VALUES (?, ?, ?) 
# ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)
```

### Advanced Configuration

#### 1. Batch Insert Optimization
```yaml
Parameters:
  - key: batch_size    # Batch size
    value: "1000"      # 1000 records per batch
    
  - key: batch_timeout # Batch timeout
    value: "30s"       # 30 second timeout
    
  - key: retry_count   # Retry count
    value: "3"         # Retry 3 times on failure
```

#### 2. Column Mapping Configuration
```yaml
Parameters:
  - key: column_mapping  # Column name mapping (JSON format)
    value: |
      {
        "source_id": "target_id",
        "source_name": "target_name",
        "source_email": "target_email"
      }
    
# Write source data's source_id to target table's target_id column
```

#### 3. Data Transformation Configuration
```yaml
Parameters:
  - key: value_transform  # Value transformation rules
    value: |
      {
        "price": "ROUND(price * 1.1, 2)",  # Add 10% tax
        "date": "DATE_FORMAT(date, '%Y-%m-%d')",
        "status": "CASE WHEN status = '1' THEN 'active' ELSE 'inactive' END"
      }
    
  - key: default_values   # Default values
    value: |
      {
        "created_at": "NOW()",
        "updated_at": "NOW()",
        "operator": "'system'"
      }
```

#### 4. Conflict Resolution
```yaml
Parameters:
  - key: conflict_action  # Conflict resolution strategy
    value: "skip"         # skip: Skip, ignore: Ignore, update: Update, fail: Fail
  
  - key: conflict_columns # Columns for conflict detection
    value: "id,email"
    
  - key: on_conflict_update # Columns to update on conflict
    value: "updated_at,version"
```

### Performance Optimization

#### 1. Index Optimization
```yaml
Parameters:
  - key: disable_indexes  # Disable indexes before insert
    value: "true"         # Significantly improves insert performance
  
  - key: enable_indexes   # Re-enable indexes after insert
    value: "true"
  
  - key: optimize_table   # Optimize table after insert
    value: "true"         # Reorganizes table storage
```

#### 2. Transaction Control
```yaml
Parameters:
  - key: use_transaction  # Use transactions
    value: "true"         # Rollback on failure
  
  - key: transaction_size # Transaction batch size
    value: "1000"         # Commit every 1000 records
  
  - key: isolation_level  # Transaction isolation level
    value: "READ_COMMITTED"  # READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
```

#### 3. Connection Pool Optimization
```yaml
Parameters:
  - key: max_connections  # Maximum connections
    value: "10"
    
  - key: connection_timeout  # Connection timeout
    value: "30s"
    
  - key: idle_timeout     # Idle connection timeout
    value: "300s"         # Close idle connections after 5 minutes
```

### Practical Application Examples

#### Example 1: Daily Data Backup
```yaml
Type: sql
Data Source: backup_mysql
Parameters:
  - key: table
    value: "users_backup_{{日期}}"
    
  - key: mode
    value: "replace"
    
  - key: columns
    value: "id,name,email,phone,created_at,updated_at"
    
  - key: batch_size
    value: "5000"
    
  - key: use_transaction
    value: "true"
```

#### Example 2: Incremental Data Synchronization
```yaml
Type: sql
Data Source: target_mysql
Parameters:
  - key: table
    value: "orders"
    
  - key: mode
    value: "upsert"
    
  - key: key_columns
    value: "order_id"
    
  - key: batch_size
    value: "1000"
    
  - key: on_conflict_update
    value: "updated_at,version,status"
```

#### Example 3: Data Aggregation Output
```yaml
Type: sql
Data Source: report_mysql
Parameters:
  - key: table
    value: "daily_sales_summary"
    
  - key: mode
    value: "replace"
    
  - key: value_transform
    value: |
      {
        "report_date": "CURDATE()",
        "total_sales": "SUM(amount)",
        "order_count": "COUNT(*)",
        "avg_order_value": "AVG(amount)",
        "unique_customers": "COUNT(DISTINCT customer_id)"
      }
    
  - key: group_by
    value: "product_category,date"
```

## CSV File Output

Write data to CSV format files.

### Basic Configuration
```yaml
Type: csv
Parameters:
  - key: file_path      # CSV文件路径
    value: "/data/output/users.csv"
    
  - key: encoding       # 文件编码
    value: "utf-8"      # 支持: utf-8, gbk, gb2312
    
  - key: delimiter      # 分隔符
    value: ","          # 默认逗号分隔
    
  - key: include_header # 是否包含表头
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
```

#### 3. Quote Handling
```yaml
# 双引号（默认）
quote_char: '"'

# 单引号
quote_char: "'"

# 无引号
quote_char: ""

# 条件引用（仅当包含分隔符或换行符时引用）
conditional_quotes: "true"
```

#### 4. Other Options
```yaml
# 换行符
line_terminator: "\n"  # Unix/Linux
line_terminator: "\r\n" # Windows
line_terminator: "\r"   # Classic Mac

# 空值表示
null_value: ""         # 空字符串
null_value: "NULL"     # NULL字符串
null_value: "\N"       # MySQL风格

# 日期时间格式
date_format: "yyyy-MM-dd"
datetime_format: "yyyy-MM-dd HH:mm:ss"

# 数字格式
number_format: "#,##0.00"  # 千分位格式
```

### Advanced Features

#### 1. Multi-file Output
```yaml
Parameters:
  - key: file_pattern    # 文件模式
    value: "/data/output/users_{{日期}}_{{序号}}.csv"
    
  - key: max_file_size   # 最大文件大小
    value: "100MB"       # 超过大小时创建新文件
    
  - key: max_records     # 最大记录数
    value: "100000"      # 超过记录数时创建新文件
    
  - key: compression     # 压缩格式
    value: "gzip"        # gzip, zip, 或空（不压缩）
```

#### 2. Column Selection and Ordering
```yaml
Parameters:
  - key: columns         # 输出列顺序
    value: "id,name,email,phone,created_at"
    
  - key: column_aliases  # 列别名
    value: |
      {
        "id": "用户ID",
        "name": "姓名",
        "email": "邮箱",
        "created_at": "创建时间"
      }
```

#### 3. Data Formatting
```yaml
Parameters:
  - key: format_rules    # 格式化规则
    value: |
      {
        "amount": {
          "type": "number",
          "format": "#,##0.00",
          "locale": "zh-CN"
        },
        "date": {
          "type": "date",
          "format": "yyyy-MM-dd"
        },
        "datetime": {
          "type": "datetime",
          "format": "yyyy-MM-dd HH:mm:ss"
        },
        "percentage": {
          "type": "percentage",
          "format": "0.00%"
        }
      }
```

#### 4. File Rotation and Cleanup
```yaml
Parameters:
  - key: rotation        # 文件轮转策略
    value: |
      {
        "strategy": "time",          # time: 时间轮转, size: 大小轮转
        "interval": "daily",         # daily: 每天, hourly: 每小时, weekly: 每周
        "retention": 30,             # 保留30天
        "max_files": 100             # 最大文件数
      }
```

### Practical Application Examples

#### Example 1: Daily Report Export
```yaml
Type: csv
Parameters:
  - key: file_path
    value: "/reports/daily/sales_{{日期}}.csv"
    
  - key: encoding
    value: "utf-8-bom"  # Excel兼容
    
  - key: delimiter
    value: ","
    
  - key: include_header
    value: "true"
    
  - key: columns
    value: "日期,产品类别,销售额,订单数,平均单价,客户数"
    
  - key: format_rules
    value: |
      {
        "销售额": {"type": "number", "format": "#,##0.00"},
        "平均单价": {"type": "number", "format": "#,##0.00"},
        "日期": {"type": "date", "format": "yyyy-MM-dd"}
      }
```

#### Example 2: Large Data Export with Compression
```yaml
Type: csv
Parameters:
  - key: file_pattern
    value: "/exports/users_export_{{批次}}.csv.gz"
    
  - key: max_file_size
    value: "100MB"
    
  - key: compression
    value: "gzip"
    
  - key: delimiter
    value: "|"
    
  - key: quote_char
    value: ""
    
  - key: columns
    value: "id|name|email|phone|created_at|updated_at"
```

#### Example 3: Multi-language Report
```yaml
Type: csv
Parameters:
  - key: file_path
    value: "/reports/international/sales_{{语言}}_{{日期}}.csv"
    
  - key: encoding
    value: "utf-8"
    
  - key: column_aliases
    value: |
      {
        "date": "{{日期列名}}",
        "product": "{{产品列名}}",
        "amount": "{{金额列名}}",
        "customer": "{{客户列名}}"
      }
    
  - key: locale
    value: "{{语言代码}}"  # zh-CN, en-US, ja-JP等
```

## JSON File Output

Write data to JSON format files.

### Basic Configuration
```yaml
Type: json
Parameters:
  - key: file_path      # JSON文件路径
    value: "/data/output/users.json"
    
  - key: encoding       # 文件编码
    value: "utf-8"
    
  - key: format         # JSON格式
    value: "array"      # array: JSON数组, object: 包含数据键的对象
```

### JSON Format Support

#### 1. JSON Array Format
```yaml
Parameters:
  - key: format
    value: "array"      # 输出JSON数组
  
# 输出格式：
# [
#   {"id": 1, "name": "张三", "email": "zhangsan@example.com"},
#   {"id": 2, "name": "李四", "email": "lisi@example.com"}
# ]
```

#### 2. JSON Object with Data Key
```yaml
Parameters:
  - key: format
    value: "object"     # 输出包含数据键的对象
  
  - key: data_key       # 数据数组的键名
    value: "items"
  
  - key: meta_data      # 元数据
    value: |
      {
        "total": "{{总记录数}}",
        "page": "{{页码}}",
        "page_size": "{{每页大小}}",
        "timestamp": "{{时间戳}}"
      }
  
# 输出格式：
# {
#   "items": [
#     {"id": 1, "name": "张三", "email": "zhangsan@example.com"}
#   ],
#   "total": 100,
#   "page": 1,
#   "page_size": 10,
#   "timestamp": "2024-01-01T12:00:00Z"
# }
```

#### 3. JSON Lines Format (ndjson)
```yaml
Parameters:
  - key: format
    value: "jsonl"      # JSON Lines格式
  
# 输出格式：
# {"id": 1, "name": "张三", "email": "zhangsan@example.com"}
# {"id": 2, "name": "李四", "email": "lisi@example.com"}
# {"id": 3, "name": "王五", "email": "wangwu@example.com"}
```

### Advanced Features

#### 1. Nested JSON Generation
```yaml
Parameters:
  - key: nested_structure  # 嵌套结构配置
    value: |
      {
        "user": {
          "id": "id",
          "profile": {
            "name": "name",
            "email": "email"
          },
          "metadata": {
            "created_at": "created_at",
            "updated_at": "updated_at"
          }
        }
      }
  
# 输出格式：
# {
#   "user": {
#     "id": 1,
#     "profile": {
#       "name": "张三",
#       "email": "zhangsan@example.com"
#     },
#     "metadata": {
#       "created_at": "2024-01-01T00:00:00Z",
#       "updated_at": "2024-01-02T12:00:00Z"
#     }
#   }
# }
```

#### 2. JSON Schema Validation
```yaml
Parameters:
  - key: schema         # JSON Schema定义
    value: |
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "name": {"type": "string", "maxLength": 100},
          "email": {"type": "string", "format": "email"}
        },
        "required": ["id", "name"]
      }
  
  - key: on_schema_fail  # Schema验证失败处理
    value: "skip"        # skip: 跳过, log: 记录日志, fail: 失败
```

#### 3. JSON Transformation
```yaml
Parameters:
  - key: transform      # 数据转换规则
    value: |
      {
        "id": "String(id)",
        "name": "UpperCase(name)",
        "email": "LowerCase(email)",
        "created_at": "DateFormat(created_at, 'yyyy-MM-dd\\'T\\'HH:mm:ss\\'Z\\'')",
        "metadata": {
          "source": "'etl-go'",
          "version": "'1.0.0'",
          "processed_at": "NOW()"
        }
      }
```

### Practical Application Examples

#### Example 1: API Data Export
```yaml
Type: json
Parameters:
  - key: file_path
    value: "/api/exports/users_{{时间戳}}.json"
    
  - key: format
    value: "object"
    
  - key: data_key
    value: "data"
    
  - key: meta_data
    value: |
      {
        "success": "true",
        "code": "200",
        "message": "'Success'",
        "timestamp": "NOW()",
        "total": "COUNT(*)",
        "page": "1",
        "page_size": "100"
      }
```

#### Example 2: Configuration File Generation
```yaml
Type: json
Parameters:
  - key: file_path
    value: "/configs/system_config.json"
    
  - key: format
    value: "object"
    
  - key: transform
    value: |
      {
        "database": {
          "host": "'localhost'",
          "port": "3306",
          "username": "'root'",
          "password": "'password123'"
        },
        "redis": {
          "host": "'127.0.0.1'",
          "port": "6379"
        },
        "logging": {
          "level": "'info'",
          "file": "'/logs/app.log'"
        }
      }
```

#### Example 3: Real-time Data Stream
```yaml
Type: json
Parameters:
  - key: file_pattern
    value: "/streams/logs_{{时间戳}}.jsonl"
    
  - key: format
    value: "jsonl"
    
  - key: rotation
    value: |
      {
        "strategy": "time",
        "interval": "hourly",
        "retention": 24
      }
```

## Doris Database Output

Write data to Apache Doris database using stream_load.

### Basic Configuration
```yaml
Type: doris
参数:
  - key: host          # Doris主机地址
    value: "doris.example.com"
    
  - key: port          # Doris端口
    value: "8030"
    
  - key: database      # 数据库名
    value: "datalake"
    
  - key: table         # 表名
    value: "user_behavior"
    
  - key: user          # 用户名
    value: "admin"
    
  - key: password      # 密码
    value: "password123"
```

### Advanced Configuration

#### 1. Stream Load Parameters
```yaml
参数:
  - key: format        # 数据格式
    value: "json"      # 支持：json, csv
    
  - key: strip_outer_array  # 去除外层数组
    value: "true"
    
  - key: num_as_string # 数字作为字符串处理
    value: "false"
    
  - key: fuzzy_parse   # 模糊解析
    value: "true"
```

#### 2. Performance Optimization
```yaml
参数:
  - key: batch_size    # 批量大小
    value: "1024"      # 每批1024条记录
    
  - key: max_batch_interval  # 最大批处理间隔
    value: "10s"       # 最多等待10秒
    
  - key: channel_timeout  # 通道超时时间
    value: "60s"       # 60秒超时
    
  - key: max_error_number  # 最大错误数
    value: "1000"      # 最多允许1000条错误记录
```

#### 3. Data Mapping
```yaml
参数:
  - key: column_mapping  # 列映射
    value: |
      {
        "user_id": "user_id",
        "event_time": "event_time",
        "event_type": "event_type",
        "properties": "properties"
      }
    
  - key: jsonpaths     # JSON路径映射
    value: |
      ["$.user_id", "$.event_time", "$.event_type", "$.properties"]
```

### Practical Application Examples

#### Example 1: User Behavior Data Import
```yaml
Type: doris
参数:
  - key: host
    value: "doris-analytics.example.com"
    
  - key: database
    value: "user_analytics"
    
  - key: table
    value: "clickstream"
    
  - key: format
    value: "json"
    
  - key: strip_outer_array
    value: "true"
    
  - key: batch_size
    value: "4096"
    
  - key: column_mapping
    value: |
      {
        "session_id": "session_id",
        "user_id": "user_id",
        "page_url": "page_url",
        "event_time": "event_time",
        "device_type": "device_type",
        "geo_location": "geo_location"
      }
```

#### Example 2: Real-time Metrics Import
```yaml
Type: doris
参数:
  - key: host
    value: "doris-metrics.example.com"
    
  - key: database
    value: "system_metrics"
    
  - key: table
    value: "application_metrics"
    
  - key: format
    value: "csv"
    
  - key: column_separator
    value: "|"
    
  - key: batch_size
    value: "10000"
    
  - key: max_batch_interval
    value: "5s"
```

## Performance Optimization

### 1. Parallel Processing
```yaml
parallel_config:
  workers: 4           # 并行工作线程数
  queue_size: 10000    # 队列大小
  timeout: 300s        # 超时时间
```

### 2. Memory Management
```yaml
memory_config:
  max_heap_mb: 4096    # 最大堆内存（MB）
  buffer_size: 65536   # 缓冲区大小
  spill_threshold: 0.8 # 溢出阈值（80%）
```

### 3. Network Optimization
```yaml
network_config:
  connect_timeout: 30s   # 连接超时
  read_timeout: 60s      # 读取超时
  write_timeout: 60s     # 写入超时
  max_retries: 3         # 最大重试次数
```

## Error Handling

### Common Output Errors

#### 1. Database Connection Errors
**Causes**:
- Network connectivity issues
- Authentication failures
- Database service down

**Solutions**:
- Implement connection retry mechanism
- Validate credentials before execution
- Monitor database service status

#### 2. Data Format Errors
**Causes**:
- Invalid data types
- Missing required columns
- Schema mismatches

**Solutions**:
- Implement data validation
- Provide default values
- Use schema migration tools

#### 3. Resource Constraints
**Causes**:
- Disk space insufficient
- Memory exhaustion
- File permission issues

**Solutions**:
- Monitor resource usage
- Implement cleanup mechanisms
- Validate permissions before execution

### Error Handling Strategies
```yaml
error_handling:
  strategy: retry_then_skip  # 重试后跳过
  max_retries: 3             # 最大重试次数
  retry_delay: 5s           # 重试延迟
  
  fallback_action: log       # 降级操作
  error_log_file: /logs/output_errors.log
  
  notification:
    enabled: true
    channels: [email, webhook]
    threshold: 10          # 错误数阈值
```

## Best Practices

### 1. Output Strategy Design
- Choose appropriate output format based on use case
- Implement incremental output for large datasets
- Design for idempotency and retry safety

### 2. Performance Optimization
- Use batch processing for database output
- Enable compression for file output
- Implement parallel processing when possible

### 3. Data Quality
- Validate data before output
- Implement data reconciliation mechanisms
- Monitor output data quality metrics

### 4. Security
- Encrypt sensitive data during output
- Validate file paths to prevent path traversal
- Implement access control for output destinations

## API Reference

### SQL Database Output
```http
POST /api/task/sink/sql
Content-Type: application/json

{
  "data_source_id": "datasource_mysql",
  "table": "users_backup",
  "mode": "upsert",
  "key_columns": ["id"],
  "batch_size": 1000
}
```

### CSV File Output
```http
POST /api/task/sink/csv
Content-Type: application/json

{
  "file_path": "/data/output/users.csv",
  "encoding": "utf-8",
  "delimiter": ",",
  "include_header": true,
  "columns": ["id", "name", "email"]
}
```

### JSON File Output
```http
POST /api/task/sink/json
Content-Type: application/json

{
  "file_path": "/data/output/users.json",
  "format": "array",
  "encoding": "utf-8",
  "pretty_print": true
}
```

### Doris Database Output
```http
POST /api/task/sink/doris
Content-Type: application/json

{
  "host": "doris.example.com",
  "database": "analytics",
  "table": "user_events",
  "format": "json",
  "batch_size": 4096
}
```

## Next Steps

After configuring data output, you can:
1. [Monitor Output Performance](/task-monitor) - Track output performance metrics
2. [Verify Output Data](/data-verification) - Verify output data quality and completeness
3. [Troubleshoot Output Issues](/troubleshooting) - Resolve output-related problems
4. [Optimize Output Pipeline](/task-optimization) - Improve overall output efficiency