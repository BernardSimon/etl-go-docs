# 数据输出

数据输出（Sink）是 ETL 任务的最后一步，负责将处理后的数据写入目标位置。ETL-GO 支持多种数据输出方式，包括 SQL 数据库、CSV 文件、JSON 文件和 Doris 数据库。

## 支持的数据输出类型

| 输出类型 | 描述 | 适用场景 |
|----------|------|----------|
| **SQL 数据库** | 将数据写入关系型数据库表 | 数据入库、数据同步、数据备份 |
| **CSV 文件** | 将数据写入 CSV 格式文件 | 数据导出、数据交换、报表生成 |
| **JSON 文件** | 将数据写入 JSON 格式文件 | API 数据导出、配置文件生成 |
| **Doris 数据库** | 将数据写入 Apache Doris 数据库 | 大数据分析、实时数仓 |

## SQL 数据库输出

SQL 数据库输出支持以下数据库：
- MySQL
- PostgreSQL
- SQLite

### 基础配置
```yaml
类型: sql
数据源: 目标数据库         # 选择已配置的数据源
参数:
  - key: table         # 目标表名
    value: "users_backup"
    
  - key: columns       # 要写入的列（可选，不指定则使用所有列）
    value: "id,name,email,created_at"
    
  - key: mode          # 写入模式
    value: "insert"    # 支持：insert, replace, update, upsert
```

### 写入模式详解

#### 1. INSERT 模式（默认）
```yaml
参数:
  - key: mode
    value: "insert"    # 直接插入，重复主键会报错
    
# 生成的SQL：
# INSERT INTO table (col1, col2) VALUES (?, ?)
```

#### 2. REPLACE 模式
```yaml
参数:
  - key: mode
    value: "replace"   # 替换重复记录（先删除再插入）
    
# 生成的SQL：
# REPLACE INTO table (col1, col2) VALUES (?, ?)
# 或
# INSERT INTO table (col1, col2) VALUES (?, ?) ON DUPLICATE KEY UPDATE col1=VALUES(col1), col2=VALUES(col2)
```

#### 3. UPDATE 模式
```yaml
参数:
  - key: mode
    value: "update"    # 更新已存在记录
    
  - key: key_columns   # 主键列（用于匹配记录）
    value: "id"
    
# 生成的SQL：
# UPDATE table SET col1=?, col2=? WHERE id=?
```

#### 4. UPSERT 模式（合并插入）
```yaml
参数:
  - key: mode
    value: "upsert"    # 存在则更新，不存在则插入
  
  - key: key_columns   # 唯一键列
    value: "id,email"
    
# 生成的SQL（MySQL）：
# INSERT INTO table (id, name, email) VALUES (?, ?, ?) 
# ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)
```

### 高级配置

#### 1. 批量插入优化
```yaml
参数:
  - key: batch_size    # 批量大小
    value: "1000"      # 每批1000条记录
    
  - key: batch_timeout # 批量超时时间
    value: "30s"       # 30秒超时
    
  - key: retry_count   # 重试次数
    value: "3"         # 失败时重试3次
```

#### 2. 列映射配置
```yaml
参数:
  - key: column_mapping  # 列名映射（JSON格式）
    value: |
      {
        "source_id": "target_id",
        "source_name": "target_name",
        "source_email": "target_email"
      }
    
# 将源数据中的 source_id 写入目标表的 target_id 列
```

#### 3. 数据转换配置
```yaml
参数:
  - key: value_transform  # 值转换规则
    value: |
      {
        "status": {
          "active": 1,
          "inactive": 0,
          "pending": 2
        },
        "gender": {
          "male": "M",
          "female": "F",
          "other": "O"
        }
      }
    
# 将字符串状态转换为数字代码
```

#### 4. 条件写入
```yaml
参数:
  - key: condition     # 写入条件
    value: "age >= 18 AND status == 'active'"
    
  - key: on_condition_fail  # 条件失败时的处理
    value: "skip"           # skip: 跳过, log: 记录日志, fail: 失败
```

### 表结构管理

#### 1. 自动建表
```yaml
参数:
  - key: create_table  # 自动创建表
    value: "true"
    
  - key: table_schema  # 表结构定义（JSON格式）
    value: |
      {
        "id": "INT PRIMARY KEY AUTO_INCREMENT",
        "name": "VARCHAR(100) NOT NULL",
        "email": "VARCHAR(255) UNIQUE",
        "age": "INT DEFAULT 0",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      }
```

#### 2. 表存在检查
```yaml
参数:
  - key: check_table_exists  # 检查表是否存在
    value: "true"
    
  - key: create_if_not_exists  # 不存在时创建
    value: "true"
    
  - key: drop_if_exists        # 存在时删除重建（危险！）
    value: "false"
```

#### 3. 索引管理
```yaml
参数:
  - key: create_indexes  # 创建索引
    value: "true"
    
  - key: indexes         # 索引定义
    value: |
      [
        {"name": "idx_email", "columns": "email", "unique": true},
        {"name": "idx_created_at", "columns": "created_at"},
        {"name": "idx_status_created", "columns": "status,created_at"}
      ]
```

### 实际应用示例

#### 示例1：用户数据备份
```yaml
数据输出:
  类型: sql
  数据源: 备份数据库
  参数:
    - key: table
      value: "users_backup_{{日期}}"
    
    - key: mode
      value: "replace"
    
    - key: columns
      value: "id,name,email,phone,created_at,updated_at"
    
    - key: batch_size
      value: "500"
    
    - key: create_if_not_exists
      value: "true"
```

#### 示例2：订单数据同步
```yaml
数据输出:
  类型: sql
  数据源: 分析数据库
  参数:
    - key: table
      value: "order_fact"
    
    - key: mode
      value: "upsert"
    
    - key: key_columns
      value: "order_id"
    
    - key: column_mapping
      value: |
        {
          "order_id": "order_key",
          "customer_id": "customer_key",
          "amount": "order_amount",
          "order_date": "order_date"
        }
    
    - key: condition
      value: "order_status == 'completed'"
```

#### 示例3：日志数据归档
```yaml
数据输出:
  类型: sql
  数据源: 日志数据库
  参数:
    - key: table
      value: "app_logs_{{年月}}"
    
    - key: mode
      value: "insert"
    
    - key: create_table
      value: "true"
    
    - key: table_schema
      value: |
        {
          "id": "BIGINT PRIMARY KEY AUTO_INCREMENT",
          "log_time": "DATETIME NOT NULL",
          "level": "VARCHAR(10)",
          "service": "VARCHAR(50)",
          "message": "TEXT",
          "user_id": "VARCHAR(100)",
          "ip": "VARCHAR(45)"
        }
    
    - key: indexes
      value: |
        [
          {"name": "idx_log_time", "columns": "log_time"},
          {"name": "idx_level", "columns": "level"},
          {"name": "idx_service", "columns": "service,log_time"}
        ]
```

## CSV 文件输出

将数据写入 CSV 格式文件，支持多种配置选项。

### 基础配置
```yaml
类型: csv
参数:
  - key: file_path      # 输出文件路径
    value: "/data/output/users.csv"
    
  - key: include_header # 是否包含表头
    value: "true"
    
  - key: delimiter      # 分隔符
    value: ","          # 默认逗号分隔
```

### 文件路径支持

#### 1. 固定路径
```yaml
file_path: /data/exports/daily_report.csv
```

#### 2. 带变量的动态路径
```yaml
file_path: /data/exports/users_{{日期}}.csv
```

#### 3. 自动编号
```yaml
file_path: /data/exports/batch_{{批次号}}.csv
```

#### 4. 时间戳命名
```yaml
file_path: /data/exports/export_{{时间戳}}.csv
```

### CSV 格式选项

#### 1. 分隔符配置
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

#### 2. 引号配置
```yaml
# 双引号（默认）
quote_char: '"'

# 单引号
quote_char: "'"

# 无引号
quote_char: ""

# 自动引号（包含分隔符或换行符时加引号）
auto_quote: "true"
```

#### 3. 编码配置
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

#### 4. 行结束符
```yaml
# Unix/Linux（默认）
line_terminator: "\n"

# Windows
line_terminator: "\r\n"

# 经典Mac
line_terminator: "\r"
```

#### 5. 其他选项
```yaml
# 压缩输出
compress: "gzip"      # 支持：gzip, zip

# 文件权限
file_mode: "0644"     # 文件权限（八进制）

# 追加模式（不覆盖原有内容）
append: "false"

# 空值处理
null_string: "NULL"

# 日期格式
date_format: "2006-01-02"
datetime_format: "2006-01-02 15:04:05"
```

### 高级配置

#### 1. 分文件输出
```yaml
参数:
  - key: max_rows_per_file  # 每个文件最大行数
    value: "100000"
    
  - key: file_pattern       # 文件命名模式
    value: "part_{{序号}}.csv"
    
# 生成：part_001.csv, part_002.csv, ...
```

#### 2. 列顺序控制
```yaml
参数:
  - key: columns          # 指定列顺序
    value: "id,name,email,phone,created_at"
    
  - key: column_mapping   # 列重命名
    value: |
      {
        "user_id": "ID",
        "user_name": "姓名",
        "user_email": "邮箱"
      }
```

#### 3. 数据过滤
```yaml
参数:
  - key: filter_condition  # 输出过滤条件
    value: "status == 'active' AND age >= 18"
    
  - key: on_filter_fail    # 过滤失败处理
    value: "skip"          # skip: 跳过, log: 记录日志
```

#### 4. 数据转换
```yaml
参数:
  - key: transform_rules   # 数据转换规则
    value: |
      {
        "amount": "ROUND(amount, 2)",
        "percentage": "CONCAT(percentage, '%')",
        "date": "DATE_FORMAT(date, '%Y-%m-%d')"
      }
```

### 实际应用示例

#### 示例1：每日报表导出
```yaml
数据输出:
  类型: csv
  参数:
    - key: file_path
      value: "/reports/daily/sales_{{日期}}.csv"
    
    - key: include_header
      value: "true"
    
    - key: columns
      value: "order_id,customer_name,product_name,quantity,amount,order_date"
    
    - key: delimiter
      value: ","
    
    - key: encoding
      value: "utf-8-bom"  # Excel兼容
    
    - key: date_format
      value: "yyyy-MM-dd"
    
    - key: compress
      value: "gzip"
```

#### 示例2：大数据分文件导出
```yaml
数据输出:
  类型: csv
  参数:
    - key: file_path
      value: "/data/exports/users"
    
    - key: file_pattern
      value: "part_{{序号}}.csv"
    
    - key: max_rows_per_file
      value: "50000"
    
    - key: include_header
      value: "true"
    
    - key: delimiter
      value: "|"
    
    - key: quote_char
      value: ""
    
    - key: line_terminator
      value: "\n"
```

#### 示例3：API数据格式导出
```yaml
数据输出:
  类型: csv
  参数:
    - key: file_path
      value: "/api/exports/{{接口名}}_{{时间戳}}.csv"
    
    - key: columns
      value: "id,name,email,created_at,updated_at"
    
    - key: column_mapping
      value: |
        {
          "id": "user_id",
          "name": "user_name",
          "email": "user_email",
          "created_at": "create_time",
          "updated_at": "update_time"
        }
    
    - key: transform_rules
      value: |
        {
          "created_at": "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')",
          "updated_at": "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ')"
        }
    
    - key: null_string
      value: ""
```

## JSON 文件输出

将数据写入 JSON 格式文件，支持多种 JSON 格式。

### 基础配置
```yaml
类型: json
参数:
  - key: file_path      # 输出文件路径
    value: "/data/output/users.json"
    
  - key: format         # JSON 格式
    value: "array"      # 支持：array, object, jsonl
```

### JSON 格式选项

#### 1. 数组格式（默认）
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

配置：
```yaml
参数:
  - key: format
    value: "array"
```

#### 2. 对象格式（带键）
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
  "timestamp": "2024-01-01T00:00:00Z"
}
```

配置：
```yaml
参数:
  - key: format
    value: "object"
    
  - key: object_key    # 数据数组的键名
    value: "data"
    
  - key: metadata      # 元数据（JSON格式）
    value: |
      {
        "total": "{{记录数}}",
        "timestamp": "{{时间戳}}",
        "version": "1.0"
      }
```

#### 3. JSON Lines 格式
```json
{"id": 1, "name": "张三", "email": "zhangsan@example.com"}
{"id": 2, "name": "李四", "email": "lisi@example.com"}
{"id": 3, "name": "王五", "email": "wangwu@example.com"}
```

配置：
```yaml
参数:
  - key: format
    value: "jsonl"      # JSON Lines格式
```

### 高级配置

#### 1. 数据筛选
```yaml
参数:
  - key: filter_condition  # 输出过滤条件
    value: "status == 'active' AND created_at >= '2024-01-01'"
    
  - key: select_fields     # 选择字段
    value: "id,name,email,created_at"
```

#### 2. 数据转换
```yaml
参数:
  - key: transform_rules   # 数据转换规则
    value: |
      {
        "created_at": "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%M:%SZ')",
        "amount": "ROUND(amount, 2)",
        "metadata": "JSON_EXTRACT(metadata, '$')"
      }
```

#### 3. 美化输出
```yaml
参数:
  - key: pretty_print      # 美化输出（增加缩进和换行）
    value: "true"
    
  - key: indent_size       # 缩进大小
    value: "2"
    
  - key: sort_keys         # 按键名排序
    value: "true"
```

#### 4. 分文件输出
```yaml
参数:
  - key: max_records_per_file  # 每个文件最大记录数
    value: "10000"
    
  - key: file_pattern          # 文件命名模式
    value: "data_part_{{序号}}.json"
```

### 实际应用示例

#### 示例1：API数据导出
```yaml
数据输出:
  类型: json
  参数:
    - key: file_path
      value: "/api/exports/users_{{日期}}.json"
    
    - key: format
      value: "object"
    
    - key: object_key
      value: "items"
    
    - key: metadata
      value: |
        {
          "total": "{{记录数}}",
          "export_time": "{{时间戳}}",
          "format": "json",
          "version": "1.0"
        }
    
    - key: pretty_print
      value: "true"
    
    - key: indent_size
      value: "2"
```

#### 示例2：日志数据JSON Lines格式
```yaml
数据输出:
  类型: json
  参数:
    - key: file_path
      value: "/logs/app_{{日期}}.jsonl"
    
    - key: format
      value: "jsonl"
    
    - key: select_fields
      value: "timestamp,level,service,message,user_id,ip"
    
    - key: transform_rules
      value: |
        {
          "timestamp": "DATE_FORMAT(timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')"
        }
    
    - key: compress
      value: "gzip"
```

#### 示例3：配置数据导出
```yaml
数据输出:
  类型: json
  参数:
    - key: file_path
      value: "/configs/system_config.json"
    
    - key: format
      value: "object"
    
    - key: filter_condition
      value: "config_type == 'system' AND enabled == true"
    
    - key: transform_rules
      value: |
        {
          "config_value": "JSON_PARSE(config_value)",
          "created_at": "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%M:%SZ')",
          "updated_at": "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%M:%SZ')"
        }
    
    - key: sort_keys
      value: "true"
```

## Doris 数据库输出

将数据写入 Apache Doris 数据库，支持 Doris 的 Stream Load 功能，适合大数据量写入。

### 基础配置
```yaml
类型: doris
数据源: doris_cluster      # Doris 数据源配置
参数:
  - key: table            # Doris 表名
    value: "user_behavior"
    
  - key: columns          # 列映射
    value: "user_id,item_id,behavior_type,behavior_time"
    
  - key: format           # 数据格式
    value: "json"         # 支持：json, csv
```

### Doris 特有配置

#### 1. Stream Load 配置
```yaml
参数:
  - key: stream_load_url        # Stream Load URL
    value: "http://doris-fe:8030/api/database/table/_stream_load"
    
  - key: load_timeout           # 加载超时时间
    value: "60"
    
  - key: max_filter_ratio       # 最大过滤比例
    value: "0.1"
    
  - key: strict_mode            # 严格模式
    value: "true"
```

#### 2. 批量配置
```yaml
参数:
  - key: batch_size            # 批量大小
    value: "1024"
    
  - key: max_batch_interval    # 最大批间隔（秒）
    value: "10"
    
  - key: max_batch_rows        # 最大批行数
    value: "100000"
    
  - key: max_batch_bytes       # 最大批字节数
    value: "104857600"         # 100MB
```

#### 3. 错误处理
```yaml
参数:
  - key: max_error_count       # 最大错误数
    value: "1000"
    
  - key: error_log_path        # 错误日志路径
    value: "/logs/doris_errors.log"
    
  - key: retry_count           # 重试次数
    value: "3"
    
  - key: retry_interval        # 重试间隔（秒）
    value: "5"
```

### 实际应用示例

#### 示例1：用户行为数据写入
```yaml
数据输出:
  类型: doris
  数据源: doris_behavior
  参数:
    - key: table
      value: "dws_user_behavior"
    
    - key: columns
      value: "user_id,item_id,behavior_type,behavior_time,city,device"
    
    - key: format
      value: "json"
    
    - key: batch_size
      value: "1000"
    
    - key: max_batch_interval
      value: "5"
    
    - key: strict_mode
      value: "true"
    
    - key: max_filter_ratio
      value: "0.05"
```

#### 示例2：日志数据分析
```yaml
数据输出:
  类型: doris
  数据源: doris_logs
  参数:
    - key: table
      value: "ads_app_logs"
    
    - key: columns
      value: "log_time,level,service,module,message,user_id,ip,duration"
    
    - key: format
      value: "csv"
    
    - key: column_separator
      value: "|"
    
    - key: batch_size
      value: "5000"
    
    - key: max_batch_rows
      value: "500000"
    
    - key: error_log_path
      value: "/logs/doris_load_errors.log"
```

## 性能优化

### 1. 批量写入优化
```yaml
# 所有输出类型都支持批量优化
参数:
  - key: batch_size        # 根据目标系统调整
    value: "1000"          # SQL: 100-5000, CSV/JSON: 1000-10000, Doris: 1000-5000
  
  - key: batch_timeout
    value: "30s"           # 批量超时时间
  
  - key: batch_worker      # 批量工作线程数
    value: "4"             # 根据CPU核心数调整
```

### 2. 内存控制
```yaml
参数:
  - key: max_memory_mb     # 最大内存使用
    value: "1024"          # 1GB
  
  - key: spill_to_disk     # 内存不足时溢出到磁盘
    value: "true"
  
  - key: temp_dir          # 临时目录
    value: "/tmp/etl_go"
```

### 3. 连接池优化
```yaml
# SQL输出专用
参数:
  - key: max_connections   # 最大连接数
    value: "10"
  
  - key: max_idle_connections  # 最大空闲连接数
    value: "5"
  
  - key: connection_timeout    # 连接超时
    value: "30s"
```

### 4. 文件输出优化
```yaml
# CSV/JSON输出专用
参数:
  - key: buffer_size       # 缓冲区大小
    value: "65536"         # 64KB
  
  - key: write_buffer      # 写缓冲区
    value: "true"
  
  - key: sync_on_write     # 每次写入后同步
    value: "false"         # 性能模式设为false
```

## 错误处理

### 1. 写入失败处理
```yaml
参数:
  - key: on_error          # 错误处理策略
    value: "retry"         # retry: 重试, skip: 跳过, fail: 失败
  
  - key: max_retries       # 最大重试次数
    value: "3"
  
  - key: retry_delay       # 重试延迟
    value: "5s"
  
  - key: error_log_file    # 错误日志文件
    value: "/logs/output_errors.log"
```

### 2. 数据验证
```yaml
参数:
  - key: validate_before_write  # 写入前验证
    value: "true"
  
  - key: validation_rules       # 验证规则
    value: |
      {
        "id": "NOT NULL AND id > 0",
        "email": "LIKE '%@%'",
        "age": "age >= 0 AND age <= 150"
      }
  
  - key: on_validation_fail     # 验证失败处理
    value: "log"                # log: 记录日志, skip: 跳过, fail: 失败
```

### 3. 一致性保证
```yaml
参数:
  - key: transaction      # 使用事务（SQL输出）
    value: "true"
  
  - key: isolation_level  # 事务隔离级别
    value: "READ_COMMITTED"
  
  - key: rollback_on_fail # 失败时回滚
    value: "true"
```

## 监控和日志

### 1. 性能监控
```yaml
参数:
  - key: enable_metrics   # 启用性能指标
    value: "true"
  
  - key: metrics_interval # 指标收集间隔
    value: "60s"
  
  - key: metrics_output   # 指标输出位置
    value: "/logs/output_metrics.log"
```

### 2. 详细日志
```yaml
参数:
  - key: log_level        # 日志级别
    value: "info"         # debug, info, warn, error
  
  - key: log_detail       # 日志详细程度
    value: "summary"      # summary: 摘要, detail: 详细, verbose: 全部
  
  - key: log_file         # 日志文件
    value: "/logs/output_{{任务名}}.log"
```

### 3. 进度报告
```yaml
参数:
  - key: progress_report  # 进度报告
    value: "true"
  
  - key: report_interval  # 报告间隔
    value: "1000"         # 每1000条记录报告一次
  
  - key: report_callback  # 报告回调（Webhook URL）
    value: "http://monitor.example.com/webhook"
```

## 最佳实践

### 1. 输出策略选择
```yaml
# 根据数据量和用途选择输出方式：
# - 小批量数据：SQL插入
# - 中批量数据：SQL批量插入
# - 大批量数据：CSV文件 + 数据库LOAD DATA
# - 实时数据：Doris Stream Load
# - 数据交换：CSV/JSON文件
# - 数据备份：SQL/CSV/JSON
```

### 2. 性能调优顺序
```yaml
# 性能优化步骤：
# 1. 调整batch_size（最重要的参数）
# 2. 增加worker数量（多线程）
# 3. 优化网络和磁盘I/O
# 4. 调整数据库配置
# 5. 使用合适的输出格式
```

### 3. 数据质量保障
```yaml
# 数据质量检查清单：
# 1. 写入前验证数据格式
# 2. 记录写入成功/失败数量
# 3. 对比源数据和目标数据数量
# 4. 定期抽样检查数据正确性
# 5. 建立数据质量监控告警
```

## API 参考

### 在任务中使用数据输出
```http
POST /api/task
Content-Type: application/json

{
  "mission_name": "数据输出示例",
  "cron": "0 3 * * *",
  "params": {
    "source": {
      // ... 数据输入配置 ...
    },
    "processors": [
      // ... 数据处理配置 ...
    ],
    "sink": {
      "type": "sql",
      "data_source": "datasource_mysql_backup",
      "params": [
        {"key": "table", "value": "users_backup"},
        {"key": "mode", "value": "upsert"},
        {"key": "key_columns", "value": "id"},
        {"key": "batch_size", "value": "1000"},
        {"key": "transaction", "value": "true"}
      ]
    }
  }
}
```

## 下一步

配置好数据输出后，您可以：
1. [查看任务执行情况](/task-record) - 监控数据输出效果
2. [分析任务日志](/task-log) - 排查数据输出问题
3. [配置任务调度](/task-schedule) - 自动化执行数据输出任务
4. [管理输出文件](/file) - 管理生成的CSV/JSON文件