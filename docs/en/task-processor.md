# Data Processing

Data processing (Processor) is the core component in ETL tasks for transforming, cleaning, and processing data. ETL-GO provides multiple data processing components that can be used individually or combined to implement complex data processing logic.

## Supported Data Processing Types

| Processor | Description | Main Functions |
|-----------|-------------|----------------|
| **Data Type Conversion** (convertType) | Convert data columns to specified types | Type unification, format standardization |
| **Row Filtering** (filterRows) | Filter data rows based on conditions | Data screening, conditional extraction |
| **Data Masking** (maskData) | Apply masking to sensitive data | Privacy protection, security compliance |
| **Column Renaming** (renameColumn) | Modify data column names | Field name standardization, compatibility handling |
| **Column Selection** (selectColumns) | Select needed columns, exclude unneeded ones | Field simplification, performance optimization |

## Data Type Conversion (convertType)

Convert specified column data to target data types, supporting multiple type conversions.

### Basic Configuration
```yaml
Type: convertType
Parameters:
  - key: column        # Column name to convert
    value: "age"
    
  - key: type          # Target data type
    value: "integer"   # Supported: string, integer, float, boolean, datetime
```

### Supported Data Types

| Target Type | Description | Example Input → Output |
|-------------|-------------|------------------------|
| **string** | String type | `123` → `"123"`<br>`true` → `"true"` |
| **integer** | Integer type | `"123"` → `123`<br>`"45.67"` → `45` |
| **float** | Floating-point type | `"123.45"` → `123.45`<br>`"100"` → `100.0` |
| **boolean** | Boolean type | `"true"` → `true`<br>`"1"` → `true`<br>`"0"` → `false` |
| **datetime** | Datetime type | `"2024-01-01"` → `2024-01-01 00:00:00` |

### Advanced Usage

#### 1. Multi-column Type Conversion
```yaml
Type: convertType
Parameters:
  - key: columns      # Multi-column configuration (JSON format)
    value: |
      [
        {"column": "id", "type": "string"},
        {"column": "price", "type": "float"},
        {"column": "is_active", "type": "boolean"},
        {"column": "created_at", "type": "datetime"}
      ]
```

#### 2. Datetime Format Specification
```yaml
Type: convertType
Parameters:
  - key: column
    value: "date_string"
    
  - key: type
    value: "datetime"
    
  - key: format        # Specify date format (optional)
    value: "2006-01-02 15:04:05"
```

#### 3. Conversion Failure Handling
```yaml
Type: convertType
Parameters:
  - key: column
    value: "user_score"
    
  - key: type
    value: "integer"
    
  - key: on_error      # Error handling strategy
    value: "default"   # default: Use default value, skip: Skip the row, fail: Fail
    
  - key: default_value # Default value (used when on_error=default)
    value: "0"
```

### Practical Application Examples

#### Example 1: Type Unification After CSV Import
```yaml
# All data in CSV is strings, need to convert to appropriate types
Data Processing:
  - Type: convertType
    Parameters:
      - key: columns
        value: |
          [
            {"column": "order_id", "type": "integer"},
            {"column": "amount", "type": "float"},
            {"column": "quantity", "type": "integer"},
            {"column": "order_date", "type": "datetime", "format": "yyyy-MM-dd"},
            {"column": "is_urgent", "type": "boolean"}
          ]
```

#### Example 2: Boolean Value Standardization
```yaml
Data Processing:
  - Type: convertType
    Parameters:
      - key: columns
        value: |
          [
            {"column": "active", "type": "boolean", "true_values": ["1", "yes", "true", "是"]},
            {"column": "premium", "type": "boolean", "false_values": ["0", "no", "false", "否"]}
          ]
```

#### Example 3: Date Format Normalization
```yaml
Data Processing:
  - Type: convertType
    Parameters:
      - key: columns
        value: |
          [
            {"column": "create_time", "type": "datetime", "format": "yyyy-MM-dd HH:mm:ss"},
            {"column": "update_time", "type": "datetime", "format": "yyyy/MM/dd HH:mm"},
            {"column": "birth_date", "type": "datetime", "format": "MM/dd/yyyy", "on_error": "skip"}
          ]
```

## Row Filtering (filterRows)

Filter data rows based on conditions, similar to SQL WHERE clause.

### Basic Configuration
```yaml
Type: filterRows
Parameters:
  - key: condition    # 过滤条件表达式
    value: "age >= 18 AND status = 'active'"
```

### Condition Expression Syntax

#### 1. Comparison Operators
```yaml
# 等于
condition: "age = 18"
condition: "name = '张三'"

# 不等于
condition: "status != 'deleted'"

# 大于、小于
condition: "salary > 5000"
condition: "score < 60"

# 大于等于、小于等于
condition: "quantity >= 10"
condition: "price <= 100.0"

# 包含（字符串）
condition: "email LIKE '%@gmail.com'"
condition: "name LIKE '张%'"

# 不包含
condition: "address NOT LIKE '%测试%'"

# IN 操作符
condition: "category IN ('电子产品', '图书', '服装')"

# NOT IN 操作符
condition: "status NOT IN ('deleted', 'archived')"

# BETWEEN 操作符
condition: "age BETWEEN 18 AND 60"
condition: "price BETWEEN 100.0 AND 1000.0"

# IS NULL / IS NOT NULL
condition: "phone IS NOT NULL"
condition: "middle_name IS NULL"
```

#### 2. Logical Operators
```yaml
# AND 逻辑与
condition: "age >= 18 AND gender = 'male'"

# OR 逻辑或
condition: "status = 'active' OR status = 'pending'"

# NOT 逻辑非
condition: "NOT (deleted = true)"

# 复杂组合
condition: "(age >= 18 AND status = 'active') OR (vip_level > 3 AND registration_days > 30)"
```

#### 3. Function Operators
```yaml
# 字符串函数
condition: "LENGTH(name) > 2"
condition: "UPPER(status) = 'ACTIVE'"
condition: "TRIM(address) != ''"
condition: "SUBSTR(email, -10) = '@gmail.com'"

# 数值函数
condition: "ROUND(price, 2) > 100.00"
condition: "ABS(balance) < 1000"
condition: "CEIL(score) >= 80"

# 日期函数
condition: "YEAR(created_at) = 2024"
condition: "MONTH(birth_date) = 12"
condition: "DAY(join_date) <= 15"
condition: "DATE(updated_at) = CURDATE()"
```

### Advanced Usage

#### 1. Multiple Conditions with Logic
```yaml
Type: filterRows
Parameters:
  - key: condition
    value: |
      (status = 'active' AND login_count > 0) 
      OR 
      (vip_level >= 3 AND registration_days > 365)
```

#### 2. Using Variables in Conditions
```yaml
Type: filterRows
Parameters:
  - key: condition
    value: |
      created_at >= '{{开始日期}}' 
      AND created_at <= '{{结束日期}}'
      AND department_id IN ({{部门ID列表}})
```

#### 3. Complex String Matching
```yaml
Type: filterRows
Parameters:
  - key: condition
    value: |
      (email LIKE '%@company.com' OR email LIKE '%@partner.com')
      AND NOT (email LIKE '%test%' OR email LIKE '%demo%')
      AND LENGTH(username) BETWEEN 3 AND 20
```

#### 4. Data Quality Filtering
```yaml
Type: filterRows
Parameters:
  - key: condition
    value: |
      -- 数据质量检查
      id IS NOT NULL
      AND name IS NOT NULL 
      AND TRIM(name) != ''
      AND email LIKE '%@%.%'
      AND age BETWEEN 0 AND 150
      AND created_at <= NOW()
      AND (phone IS NULL OR LENGTH(phone) >= 7)
```

### Performance Optimization

#### 1. Index-friendly Conditions
```yaml
# 好的条件（可以使用索引）
condition: "user_id = 12345"
condition: "order_date >= '2024-01-01' AND order_date <= '2024-01-31'"
condition: "status IN ('active', 'pending')"

# 不好的条件（索引无效）
condition: "YEAR(created_at) = 2024"  # 应改为: created_at >= '2024-01-01' AND created_at < '2025-01-01'
condition: "UPPER(name) = 'JOHN'"      # 应改为: name = 'John'（存储时统一大小写）
```

#### 2. Condition Order Optimization
```yaml
# 将过滤性强的条件放在前面
condition: |
  status = 'active'          -- 过滤性强，先执行
  AND created_at >= '2024-01-01'  -- 其次
  AND email LIKE '%@gmail.com'    -- 最后
```

### Practical Application Examples

#### Example 1: User Data Cleaning
```yaml
Data Processing:
  - Type: filterRows
    Parameters:
      - key: condition
        value: |
          -- 有效用户数据
          status = 'active'
          AND email IS NOT NULL
          AND email LIKE '%@%.%'
          AND phone IS NOT NULL
          AND LENGTH(phone) >= 10
          AND created_at >= '2020-01-01'
          AND (last_login IS NULL OR last_login >= DATE_SUB(NOW(), INTERVAL 1 YEAR))
```

#### Example 2: Financial Transaction Filtering
```yaml
Data Processing:
  - Type: filterRows
    Parameters:
      - key: condition
        value: |
          -- 有效交易
          transaction_status = 'completed'
          AND amount > 0
          AND transaction_date >= '{{开始日期}}'
          AND transaction_date <= '{{结束日期}}'
          AND (fraud_score IS NULL OR fraud_score < 0.7)
          AND payment_method IN ('credit_card', 'bank_transfer', 'digital_wallet')
```

#### Example 3: Log Data Filtering
```yaml
Data Processing:
  - Type: filterRows
    Parameters:
      - key: condition
        value: |
          -- 重要日志
          log_level IN ('ERROR', 'WARN', 'INFO')
          AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND service IN ('api-gateway', 'user-service', 'payment-service')
          AND NOT (message LIKE '%health_check%' OR message LIKE '%heartbeat%')
          AND NOT (user_agent LIKE '%bot%' OR user_agent LIKE '%crawler%')
```

## Data Masking (maskData)

Apply masking to sensitive data for privacy protection and security compliance.

### Basic Configuration
```yaml
Type: maskData
Parameters:
  - key: column        # 要脱敏的列名
    value: "phone"
    
  - key: algorithm     # 脱敏算法
    value: "mask"      # 支持：mask, hash, encrypt, redact
```

### Supported Masking Algorithms

#### 1. Mask Algorithm
Replaces part of the data with masking characters.

```yaml
Parameters:
  - key: algorithm
    value: "mask"
    
  - key: show_first    # 显示前N位
    value: "3"
    
  - key: show_last     # 显示后N位
    value: "4"
    
  - key: mask_char     # 掩码字符
    value: "*"
```

**Examples:**
- Phone: `13800138000` → `138****8000`
- ID Card: `110101199001011234` → `110101********1234`
- Email: `zhangsan@example.com` → `zha****@example.com`

#### 2. Hash Algorithm
Uses hash function for irreversible encryption.

```yaml
Parameters:
  - key: algorithm
    value: "hash"
    
  - key: hash_type     # 哈希算法类型
    value: "md5"       # 支持：md5, sha256, sha512
```

**Examples:**
- Email: `zhangsan@example.com` → `e10adc3949ba59abbe56e057f20f883e`
- Name: `张三` → `7d793037a0760186574b0282f2f435e7`

#### 3. Encrypt Algorithm
Uses reversible encryption.

```yaml
Parameters:
  - key: algorithm
    value: "encrypt"
    
  - key: key           # 加密密钥
    value: "my_secret_key"
    
  - key: method        # 加密方法
    value: "aes"       # 支持：aes, des
```

#### 4. Redact Algorithm
Completely removes sensitive data.

```yaml
Parameters:
  - key: algorithm
    value: "redact"
    
  - key: replacement   # 替换文本
    value: "[REDACTED]"
```

### Advanced Usage

#### 1. Multi-column Masking
```yaml
Type: maskData
Parameters:
  - key: columns      # 多列脱敏配置
    value: |
      [
        {
          "column": "phone",
          "algorithm": "mask",
          "show_first": 3,
          "show_last": 4,
          "mask_char": "*"
        },
        {
          "column": "email",
          "algorithm": "hash",
          "hash_type": "sha256"
        },
        {
          "column": "id_card",
          "algorithm": "mask",
          "show_first": 6,
          "show_last": 4,
          "mask_char": "*"
        },
        {
          "column": "address",
          "algorithm": "redact",
          "replacement": "[地址已脱敏]"
        }
      ]
```

#### 2. Conditional Masking
Only mask data under certain conditions.

```yaml
Type: maskData
Parameters:
  - key: columns
    value: |
      [
        {
          "column": "phone",
          "algorithm": "mask",
          "condition": "mask_level >= 2"  # 只有mask_level>=2时才脱敏
        },
        {
          "column": "email",
          "algorithm": "hash",
          "condition": "user_type = 'external'"  # 只有外部用户时才脱敏
        }
      ]
```

#### 3. Data Type-specific Masking
Apply different masking strategies based on data types.

```yaml
Type: maskData
Parameters:
  - key: rules
    value: |
      [
        {
          "pattern": "^1[3-9]\\d{9}$",  # 手机号正则
          "algorithm": "mask",
          "show_first": 3,
          "show_last": 4
        },
        {
          "pattern": "^\\d{17}[\\dXx]$",  # 身份证号正则
          "algorithm": "mask",
          "show_first": 6,
          "show_last": 4
        },
        {
          "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",  # 邮箱正则
          "algorithm": "hash",
          "hash_type": "sha256"
        }
      ]
```

### Practical Application Examples

#### Example 1: User Privacy Protection
```yaml
Data Processing:
  - Type: maskData
    Parameters:
      - key: columns
        value: |
          [
            {
              "column": "phone",
              "algorithm": "mask",
              "show_first": 3,
              "show_last": 4,
              "mask_char": "*",
              "description": "手机号脱敏，显示前3后4"
            },
            {
              "column": "id_card",
              "algorithm": "mask", 
              "show_first": 6,
              "show_last": 4,
              "mask_char": "*",
              "description": "身份证号脱敏，显示前6后4"
            },
            {
              "column": "bank_card",
              "algorithm": "mask",
              "show_first": 4,
              "show_last": 4,
              "mask_char": "*",
              "description": "银行卡号脱敏，显示前4后4"
            }
          ]
```

#### Example 2: Log Data Anonymization
```yaml
Data Processing:
  - Type: maskData
    Parameters:
      - key: columns
        value: |
          [
            {
              "column": "user_id",
              "algorithm": "hash",
              "hash_type": "sha256",
              "description": "用户ID哈希，保护隐私"
            },
            {
              "column": "ip_address",
              "algorithm": "mask",
              "show_first": 2,
              "mask_char": "*",
              "description": "IP地址脱敏，只显示前两段"
            },
            {
              "column": "user_agent",
              "algorithm": "redact",
              "replacement": "[BROWSER_INFO]",
              "description": "浏览器信息完全脱敏"
            }
          ]
```

#### Example 3: GDPR Compliance Data Processing
```yaml
Data Processing:
  - Type: maskData
    Parameters:
      - key: columns
        value: |
          [
            {
              "column": "personal_data",
              "algorithm": "encrypt",
              "key": "{{加密密钥}}",
              "method": "aes",
              "description": "个人数据AES加密，GDPR合规"
            },
            {
              "column": "sensitive_info",
              "algorithm": "redact", 
              "replacement": "[SENSITIVE_DATA]",
              "description": "敏感信息完全脱敏"
            }
          ]
```

## Column Renaming (renameColumn)

Rename data columns for standardization and compatibility.

### Basic Configuration
```yaml
Type: renameColumn
Parameters:
  - key: mapping      # 列名映射配置
    value: |
      {
        "old_name": "new_name",
        "user_id": "id",
        "create_time": "created_at"
      }
```

### Advanced Usage

#### 1. Multiple Column Renaming
```yaml
Type: renameColumn
Parameters:
  - key: mapping
    value: |
      {
        "user_name": "username",
        "user_email": "email", 
        "user_phone": "phone",
        "reg_date": "registration_date",
        "last_login_time": "last_login_at"
      }
```

#### 2. Pattern-based Renaming
```yaml
Type: renameColumn
Parameters:
  - key: patterns     # 正则表达式模式匹配
    value: |
      [
        {
          "pattern": "^old_(.*)$",
          "replacement": "new_$1"
        },
        {
          "pattern": "_(time|date)$", 
          "replacement": "_at"
        },
        {
          "pattern": "user_",
          "replacement": ""
        }
      ]
```

**Examples:**
- `old_name` → `new_name`
- `create_time` → `create_at`
- `user_email` → `email`

#### 3. Conditional Renaming
```yaml
Type: renameColumn
Parameters:
  - key: rules
    value: |
      [
        {
          "condition": "table_name = 'users'",
          "mapping": {
            "uid": "user_id",
            "uname": "username"
          }
        },
        {
          "condition": "table_name = 'orders'", 
          "mapping": {
            "oid": "order_id",
            "uid": "customer_id"
          }
        }
      ]
```

### Practical Application Examples

#### Example 1: Database Schema Standardization
```yaml
Data Processing:
  - Type: renameColumn
    Parameters:
      - key: mapping
        value: |
          {
            "id": "user_id",
            "name": "full_name",
            "mail": "email_address",
            "tel": "phone_number",
            "reg_time": "registration_timestamp",
            "last_login": "last_login_time"
          }
```

#### Example 2: API Response Field Mapping
```yaml
Data Processing:
  - Type: renameColumn
    Parameters:
      - key: mapping
        value: |
          {
            "userId": "user_id",
            "userName": "username",
            "emailAddress": "email",
            "phoneNumber": "phone",
            "createdAt": "created_at",
            "updatedAt": "updated_at"
          }
```

#### Example 3: Legacy System Migration
```yaml
Data Processing:
  - Type: renameColumn
    Parameters:
      - key: patterns
        value: |
          [
            {
              "pattern": "^tbl_(.*)$",
              "replacement": "$1"
            },
            {
              "pattern": "_cd$",
              "replacement": "_code"
            },
            {
              "pattern": "_dt$",
              "replacement": "_date"
            },
            {
              "pattern": "^(f_|c_|m_)",
              "replacement": ""
            }
          ]
```

## Column Selection (selectColumns)

Select needed columns and exclude unneeded ones for field simplification and performance optimization.

### Basic Configuration
```yaml
Type: selectColumns
Parameters:
  - key: columns      # 要选择的列名列表
    value: "id,name,email,created_at"
```

### Advanced Usage

#### 1. Include and Exclude Mode
```yaml
Type: selectColumns
Parameters:
  - key: mode         # 选择模式
    value: "exclude"  # include: 包含模式, exclude: 排除模式
  
  - key: columns
    value: "password,salt,secret_key,token"  # 要排除的列
```

#### 2. Column Selection with Aliases
```yaml
Type: selectColumns
Parameters:
  - key: columns
    value: |
      [
        {"name": "id", "alias": "user_id"},
        {"name": "name", "alias": "full_name"},
        {"name": "email", "alias": "email_address"}
      ]
```

#### 3. Dynamic Column Selection
```yaml
Type: selectColumns
Parameters:
  - key: columns
    value: "{{所需列列表}}"
    
  - key: on_missing    # 列不存在时的处理
    value: "warn"      # warn: 警告, error: 错误, skip: 跳过
```

### Practical Application Examples

#### Example 1: Privacy Column Filtering
```yaml
Data Processing:
  - Type: selectColumns
    Parameters:
      - key: mode
        value: "exclude"
      
      - key: columns
        value: |
          password,password_hash,salt,secret_key,
          api_token,access_token,refresh_token,
          private_key,encryption_key,session_id
```

#### Example 2: Performance Optimization
```yaml
Data Processing:
  - Type: selectColumns
    Parameters:
      - key: columns
        value: |
          id,name,email,phone,status,
          created_at,updated_at,last_login_at
```

#### Example 3: Report Data Preparation
```yaml
Data Processing:
  - Type: selectColumns
    Parameters:
      - key: columns
        value: |
          [
            {"name": "user_id", "alias": "用户ID"},
            {"name": "username", "alias": "用户名"},
            {"name": "order_count", "alias": "订单数量"},
            {"name": "total_amount", "alias": "总金额"},
            {"name": "avg_amount", "alias": "平均金额"}
          ]
```

## Processor Chain

Multiple processors can be chained together for complex data processing.

### Sequential Processing Example
```yaml
数据处理:
  # 1. 首先过滤无效数据
  - 类型: filterRows
    参数:
      - key: condition
        value: "status = 'active' AND email IS NOT NULL"
  
  # 2. 选择需要的列
  - 类型: selectColumns
    参数:
      - key: columns
        value: "id,name,email,phone,age,created_at"
  
  # 3. 重命名列
  - 类型: renameColumn
    参数:
      - key: mapping
        value: |
          {
            "id": "user_id",
            "name": "full_name",
            "phone": "phone_number"
          }
  
  # 4. 类型转换
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "user_id", "type": "string"},
            {"column": "age", "type": "integer"},
            {"column": "created_at", "type": "datetime"}
          ]
  
  # 5. 脱敏处理
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {
              "column": "phone_number",
              "algorithm": "mask",
              "show_first": 3,
              "show_last": 4
            },
            {
              "column": "email",
              "algorithm": "hash",
              "hash_type": "sha256"
            }
          ]
```

### Conditional Processing
```yaml
数据处理:
  # 根据数据特征选择不同的处理流程
  - 类型: filterRows
    参数:
      - key: condition
        value: "data_source = 'legacy_system'"
  
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "legacy_id", "type": "string"},
            {"column": "legacy_date", "type": "datetime", "format": "dd/MM/yyyy"}
          ]
  
  - 类型: renameColumn
    参数:
      - key: mapping
        value: |
          {
            "legacy_id": "id",
            "legacy_date": "created_date"
          }
```

## Performance Optimization

### 1. Processor Order Optimization
```yaml
# 优化的处理顺序
数据处理:
  # 1. 先过滤，减少后续处理数据量
  - 类型: filterRows
  
  # 2. 再选择列，减少内存占用
  - 类型: selectColumns
  
  # 3. 然后进行类型转换
  - 类型: convertType
  
  # 4. 最后进行脱敏等复杂操作
  - 类型: maskData
```

### 2. Batch Processing
```yaml
batch_config:
  size: 1000           # 每批处理记录数
  workers: 4           # 并行工作线程数
  timeout: 30s         # 批次超时时间
```

### 3. Memory Management
```yaml
memory_config:
  max_heap_mb: 2048    # 最大堆内存（MB）
  spill_to_disk: true  # 内存不足时溢出到磁盘
  temp_dir: /tmp/etl   # 临时目录
```

## Error Handling

### Processor Error Types

#### 1. Configuration Errors
**Causes**:
- Invalid parameter format
- Missing required parameters
- Unsupported options

**Solutions**:
- Validate configuration before execution
- Provide default values for optional parameters
- Implement configuration schema validation

#### 2. Data Processing Errors
**Causes**:
- Invalid data format
- Type conversion failures
- Out of range values

**Solutions**:
- Implement data validation
- Add error recovery mechanisms
- Log detailed error information

#### 3. System Errors
**Causes**:
- Memory exhaustion
- Disk space insufficient
- Resource constraints

**Solutions**:
- Monitor system resources
- Implement resource limits
- Add graceful degradation

### Error Handling Strategies
```yaml
error_handling:
  strategy: skip_on_error  # 错误处理策略
  max_errors: 100         # 最大错误数
  
  processor_errors:
    convertType: warn     # 类型转换错误：警告
    filterRows: skip      # 过滤错误：跳过
    maskData: fail        # 脱敏错误：失败
    
  logging:
    level: warn           # 日志级别
    detailed_errors: true # 记录详细错误信息
```

## Best Practices

### 1. Processor Design
- Each processor should have single responsibility
- Design processors to be reusable
- Make processors easy to test independently
- Ensure idempotency for safe retries

### 2. Performance Optimization
- Place filtering processors early in the chain
- Use appropriate batch sizes
- Monitor and optimize memory usage
- Enable parallel processing when possible

### 3. Data Quality
- Implement comprehensive data validation
- Handle missing and malformed data properly
- Maintain data integrity throughout processing
- Document data transformation rules

### 4. Security
- Validate all input data
- Implement proper data masking for sensitive information
- Sanitize data to prevent injection attacks
- Follow security best practices

## API Reference

### Create Processor Configuration
```http
POST /api/processor
Content-Type: application/json

{
  "name": "data_cleaning",
  "type": "filterRows",
  "params": [
    {"key": "condition", "value": "status = 'active'"},
    {"key": "on_error", "value": "skip"}
  ]
}
```

### Execute Processor
```http
POST /api/processor/execute
Content-Type: application/json

{
  "processor_id": "processor_123",
  "input_data": [...],
  "params": {
    "date": "2024-01-01"
  }
}
```

### Get Processor Execution Statistics
```http
GET /api/processor/stats
Content-Type: application/json

{
  "processor_id": "processor_123",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-31T23:59:59Z"
}
```

## Next Steps

After configuring data processing, you can:
1. [Configure Data Output](/task-sink) - Output the processed data
2. [Monitor Processing Performance](/task-monitor) - Track processing performance metrics
3. [Troubleshoot Processing Issues](/troubleshooting) - Resolve data processing problems
4. [Optimize Processing Pipeline](/task-optimization) - Improve overall processing efficiency