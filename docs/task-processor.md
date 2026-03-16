# 数据处理

数据处理（Processor）是 ETL 任务中对数据进行转换、清洗和加工的核心组件。ETL-GO 提供了多种数据处理组件，可以单独使用或组合使用，实现复杂的数据处理逻辑。

## 支持的数据处理类型

| 处理器 | 描述 | 主要功能 |
|--------|------|----------|
| **数据类型转换** (convertType) | 将数据列转换为指定类型 | 类型统一、格式标准化 |
| **行过滤** (filterRows) | 根据条件过滤数据行 | 数据筛选、条件提取 |
| **数据脱敏** (maskData) | 对敏感数据进行脱敏处理 | 隐私保护、安全合规 |
| **列重命名** (renameColumn) | 修改数据列的名称 | 字段名标准化、兼容性处理 |
| **列选择** (selectColumns) | 选择需要的列，排除不需要的列 | 字段精简、性能优化 |

## 数据类型转换 (convertType)

将指定列的数据转换为目标数据类型，支持多种类型转换。

### 基础配置
```yaml
类型: convertType
参数:
  - key: column        # 要转换的列名
    value: "age"
    
  - key: type          # 目标数据类型
    value: "integer"   # 支持：string, integer, float, boolean, datetime
```

### 支持的数据类型

| 目标类型 | 描述 | 示例输入 → 输出 |
|----------|------|----------------|
| **string** | 字符串类型 | `123` → `"123"`<br>`true` → `"true"` |
| **integer** | 整数类型 | `"123"` → `123`<br>`"45.67"` → `45` |
| **float** | 浮点数类型 | `"123.45"` → `123.45`<br>`"100"` → `100.0` |
| **boolean** | 布尔类型 | `"true"` → `true`<br>`"1"` → `true`<br>`"0"` → `false` |
| **datetime** | 日期时间类型 | `"2024-01-01"` → `2024-01-01 00:00:00` |

### 高级用法

#### 1. 多列类型转换
```yaml
类型: convertType
参数:
  - key: columns      # 多列配置（JSON格式）
    value: |
      [
        {"column": "id", "type": "string"},
        {"column": "price", "type": "float"},
        {"column": "is_active", "type": "boolean"},
        {"column": "created_at", "type": "datetime"}
      ]
```

#### 2. 日期时间格式指定
```yaml
类型: convertType
参数:
  - key: column
    value: "date_string"
    
  - key: type
    value: "datetime"
    
  - key: format        # 指定日期格式（可选）
    value: "2006-01-02 15:04:05"
```

#### 3. 转换失败处理
```yaml
类型: convertType
参数:
  - key: column
    value: "user_score"
    
  - key: type
    value: "integer"
    
  - key: on_error      # 错误处理策略
    value: "default"   # default: 使用默认值, skip: 跳过该行, fail: 失败
    
  - key: default_value # 默认值（当on_error=default时使用）
    value: "0"
```

### 实际应用示例

#### 示例1：CSV 导入后的类型统一
```yaml
# CSV中的数据都是字符串，需要转换为适当类型
数据处理:
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "order_id", "type": "integer"},
            {"column": "amount", "type": "float"},
            {"column": "quantity", "type": "integer"},
            {"column": "order_date", "type": "datetime"},
            {"column": "is_paid", "type": "boolean"}
          ]
```

#### 示例2：API 数据标准化
```yaml
# API返回的数据类型不一致，需要标准化
数据处理:
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "user_id", "type": "string"},
            {"column": "age", "type": "integer"},
            {"column": "balance", "type": "float", "precision": 2},
            {"column": "registration_date", "type": "datetime", "format": "2006-01-02T15:04:05Z"}
          ]
```

## 行过滤 (filterRows)

根据指定的条件过滤数据行，只保留满足条件的数据。

### 基础配置
```yaml
类型: filterRows
参数:
  - key: condition    # 过滤条件表达式
    value: "age >= 18"
```

### 条件表达式语法

#### 1. 比较运算符
```yaml
# 等于
condition: "status == 'active'"

# 不等于
condition: "status != 'deleted'"

# 大于
condition: "age > 18"

# 大于等于
condition: "score >= 60"

# 小于
condition: "price < 1000"

# 小于等于
condition: "quantity <= 100"
```

#### 2. 逻辑运算符
```yaml
# 与（AND）
condition: "age >= 18 AND status == 'active'"

# 或（OR）
condition: "user_type == 'vip' OR total_spent > 1000"

# 非（NOT）
condition: "NOT is_deleted"

# 组合条件
condition: "(age >= 18 AND age <= 60) AND (status == 'active' OR status == 'pending')"
```

#### 3. 字符串操作
```yaml
# 包含
condition: "email LIKE '%@gmail.com%'"

# 以...开头
condition: "name LIKE '张%'"

# 以...结尾
condition: "filename LIKE '%.csv'"

# 正则匹配
condition: "phone REGEXP '^1[3-9]\\d{9}$'"

# 在列表中
condition: "category IN ('电子产品', '服装', '食品')"
```

#### 4. 空值判断
```yaml
# 为空
condition: "email IS NULL"

# 不为空
condition: "phone IS NOT NULL"

# 空字符串
condition: "name != ''"
```

### 高级用法

#### 1. 多条件过滤
```yaml
类型: filterRows
参数:
  - key: conditions   # 多个条件（JSON格式）
    value: |
      [
        {"column": "age", "operator": ">=", "value": "18"},
        {"column": "status", "operator": "==", "value": "active"},
        {"column": "last_login", "operator": ">", "value": "2024-01-01"}
      ]
    
  - key: logic        # 条件逻辑
    value: "AND"      # 支持 AND, OR
```

#### 2. 复杂条件表达式
```yaml
类型: filterRows
参数:
  - key: condition
    value: |
      (age >= 18 AND age <= 60) 
      AND (status == 'active' OR status == 'pending')
      AND (email LIKE '%@company.com%' OR department IN ('研发部', '市场部'))
      AND NOT is_deleted
```

#### 3. 使用变量动态过滤
```yaml
类型: filterRows
参数:
  - key: condition
    value: |
      created_at >= '{{开始时间}}' 
      AND created_at <= '{{结束时间}}'
      AND category IN ({{品类列表}})
```

### 实际应用示例

#### 示例1：用户数据清洗
```yaml
数据处理:
  - 类型: filterRows
    参数:
      - key: condition
        value: |
          age >= 18 
          AND email IS NOT NULL 
          AND email LIKE '%@%'
          AND phone REGEXP '^1[3-9]\\d{9}$'
          AND NOT is_test_user
```

#### 示例2：订单数据分析
```yaml
数据处理:
  - 类型: filterRows
    参数:
      - key: condition
        value: |
          order_status == 'completed'
          AND order_date >= '2024-01-01'
          AND amount > 0
          AND customer_id IS NOT NULL
          AND (payment_method == 'alipay' OR payment_method == 'wechat')
```

#### 示例3：日志数据筛选
```yaml
数据处理:
  - 类型: filterRows
    参数:
      - key: condition
        value: |
          log_level IN ('ERROR', 'WARN')
          AND timestamp >= '{{今天开始时间}}'
          AND timestamp <= '{{现在时间}}'
          AND (message LIKE '%timeout%' OR message LIKE '%error%')
```

## 数据脱敏 (maskData)

对敏感数据进行脱敏处理，保护用户隐私和数据安全。

### 基础配置
```yaml
类型: maskData
参数:
  - key: columns      # 要脱敏的列
    value: "email,phone,id_card"
    
  - key: algorithm    # 脱敏算法
    value: "md5"      # 支持：md5, sha256, mask
```

### 支持的脱敏算法

#### 1. MD5 哈希
```yaml
类型: maskData
参数:
  - key: columns
    value: "email"
    
  - key: algorithm
    value: "md5"      # 生成32位MD5哈希值
    
# 示例：zhangsan@example.com → e10adc3949ba59abbe56e057f20f883e
```

#### 2. SHA256 哈希
```yaml
类型: maskData
参数:
  - key: columns
    value: "phone"
    
  - key: algorithm
    value: "sha256"   # 生成64位SHA256哈希值
    
# 示例：13800138000 → 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

#### 3. 掩码脱敏
```yaml
类型: maskData
参数:
  - key: columns
    value: "id_card,bank_card"
    
  - key: algorithm
    value: "mask"
    
  - key: mask_char    # 掩码字符（可选）
    value: "*"
    
  - key: keep_length  # 保持原长度（可选）
    value: "true"
    
  - key: show_first   # 显示前几位（可选）
    value: "3"
    
  - key: show_last    # 显示后几位（可选）
    value: "4"
```

### 掩码脱敏示例

```yaml
# 身份证号：保留前3位和后4位，中间用*替换
类型: maskData
参数:
  - key: columns
    value: "id_card"
    
  - key: algorithm
    value: "mask"
    
  - key: show_first
    value: "3"
    
  - key: show_last
    value: "4"
    
# 示例：310101199001011234 → 310***********1234
```

```yaml
# 手机号：保留前3位和后4位
类型: maskData
参数:
  - key: columns
    value: "phone"
    
  - key: algorithm
    value: "mask"
    
  - key: show_first
    value: "3"
    
  - key: show_last
    value: "4"
    
# 示例：13800138000 → 138****8000
```

```yaml
# 邮箱：保留@符号前的第一个字符和域名
类型: maskData
参数:
  - key: columns
    value: "email"
    
  - key: algorithm
    value: "mask"
    
  - key: email_mask   # 邮箱专用掩码规则
    value: "first_char_and_domain"
    
# 示例：zhangsan@example.com → z*******@example.com
```

### 高级用法

#### 1. 多列不同脱敏策略
```yaml
类型: maskData
参数:
  - key: columns
    value: |
      [
        {"column": "email", "algorithm": "md5"},
        {"column": "phone", "algorithm": "sha256"},
        {"column": "id_card", "algorithm": "mask", "show_first": 3, "show_last": 4},
        {"column": "real_name", "algorithm": "mask", "mask_char": "*", "keep_length": true}
      ]
```

#### 2. 条件脱敏
```yaml
类型: maskData
参数:
  - key: columns
    value: "email,phone"
    
  - key: algorithm
    value: "mask"
    
  - key: condition    # 脱敏条件
    value: "user_type != 'internal'"
    
# 只对非内部用户脱敏
```

#### 3. 加盐哈希（增强安全性）
```yaml
类型: maskData
参数:
  - key: columns
    value: "password"
    
  - key: algorithm
    value: "sha256"
    
  - key: salt         # 加盐值
    value: "etl_go_salt_2024"
```

### 实际应用示例

#### 示例1：用户数据脱敏导出
```yaml
数据处理:
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {"column": "email", "algorithm": "md5"},
            {"column": "phone", "algorithm": "mask", "show_first": 3, "show_last": 4},
            {"column": "id_card", "algorithm": "mask", "show_first": 3, "show_last": 4},
            {"column": "real_name", "algorithm": "mask", "mask_char": "*", "keep_length": true}
          ]
```

#### 示例2：日志数据匿名化
```yaml
数据处理:
  - 类型: maskData
    参数:
      - key: columns
        value: "user_ip,device_id,session_token"
      
      - key: algorithm
        value: "sha256"
      
      - key: condition
        value: "log_level != 'DEBUG'"
      
      # 只有非DEBUG日志才脱敏
```

#### 示例3：测试数据生成
```yaml
# 生产数据脱敏后用于测试环境
数据处理:
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {"column": "customer_email", "algorithm": "mask", "email_mask": "first_char_and_domain"},
            {"column": "customer_phone", "algorithm": "mask", "show_first": 3, "show_last": 4},
            {"column": "customer_address", "algorithm": "mask", "mask_char": "#", "keep_length": true}
          ]
```

## 列重命名 (renameColumn)

修改数据列的名称，用于字段名标准化、兼容性处理等场景。

### 基础配置
```yaml
类型: renameColumn
参数:
  - key: columns      # 列重命名映射
    value: |
      [
        {"old_name": "user_id", "new_name": "id"},
        {"old_name": "user_name", "new_name": "name"},
        {"old_name": "user_email", "new_name": "email"}
      ]
```

### 使用场景

#### 1. 字段名标准化
```yaml
# 不同数据源字段名不一致，统一为标准字段名
类型: renameColumn
参数:
  - key: columns
    value: |
      [
        {"old_name": "UID", "new_name": "user_id"},
        {"old_name": "UNAME", "new_name": "user_name"},
        {"old_name": "EMAIL_ADDR", "new_name": "email"},
        {"old_name": "PHONE_NUM", "new_name": "phone"},
        {"old_name": "CREATE_TIME", "new_name": "created_at"}
      ]
```

#### 2. 中文字段名转英文
```yaml
类型: renameColumn
参数:
  - key: columns
    value: |
      [
        {"old_name": "用户ID", "new_name": "user_id"},
        {"old_name": "用户姓名", "new_name": "user_name"},
        {"old_name": "电子邮箱", "new_name": "email"},
        {"old_name": "手机号码", "new_name": "phone"},
        {"old_name": "创建时间", "new_name": "created_at"}
      ]
```

#### 3. 兼容性处理
```yaml
# 目标系统有保留字段名限制
类型: renameColumn
参数:
  - key: columns
    value: |
      [
        {"old_name": "order", "new_name": "order_info"},      # order是SQL关键字
        {"old_name": "group", "new_name": "group_name"},      # group是SQL关键字
        {"old_name": "user", "new_name": "user_info"},        # user可能是保留字
        {"old_name": "desc", "new_name": "description"}       # desc是SQL关键字
      ]
```

### 高级用法

#### 1. 批量重命名规则
```yaml
类型: renameColumn
参数:
  - key: rule         # 重命名规则
    value: "prefix"   # 支持：prefix, suffix, snake_case, camel_case
    
  - key: old_prefix   # 旧前缀
    value: "tb_"
    
  - key: new_prefix   # 新前缀
    value: ""
    
# 示例：tb_user_id → user_id, tb_user_name → user_name
```

#### 2. 正则表达式重命名
```yaml
类型: renameColumn
参数:
  - key: pattern      # 正则匹配模式
    value: "^old_(.*)$"
    
  - key: replacement  # 替换模式
    value: "new_$1"
    
# 示例：old_user_id → new_user_id, old_user_name → new_user_name
```

#### 3. 条件重命名
```yaml
类型: renameColumn
参数:
  - key: columns
    value: |
      [
        {"old_name": "amount", "new_name": "amount_cny", "condition": "currency == 'CNY'"},
        {"old_name": "amount", "new_name": "amount_usd", "condition": "currency == 'USD'"},
        {"old_name": "amount", "new_name": "amount_eur", "condition": "currency == 'EUR'"}
      ]
```

### 实际应用示例

#### 示例1：多数据源字段统一
```yaml
数据处理:
  - 类型: renameColumn
    参数:
      - key: columns
        value: |
          [
            # 用户表字段统一
            {"old_name": "uid", "new_name": "user_id"},
            {"old_name": "U_ID", "new_name": "user_id"},
            {"old_name": "UserId", "new_name": "user_id"},
            
            # 时间字段统一
            {"old_name": "create_time", "new_name": "created_at"},
            {"old_name": "CreateTime", "new_name": "created_at"},
            {"old_name": "ctime", "new_name": "created_at"},
            
            # 状态字段统一
            {"old_name": "status_code", "new_name": "status"},
            {"old_name": "State", "new_name": "status"},
            {"old_name": "flag", "new_name": "status"}
          ]
```

#### 示例2：API数据字段规范化
```yaml
数据处理:
  - 类型: renameColumn
    参数:
      - key: columns
        value: |
          [
            # 蛇形命名法转驼峰命名法
            {"old_name": "user_id", "new_name": "userId"},
            {"old_name": "user_name", "new_name": "userName"},
            {"old_name": "created_at", "new_name": "createdAt"},
            {"old_name": "updated_at", "new_name": "updatedAt"},
            
            # 移除前缀
            {"old_name": "api_user_id", "new_name": "userId"},
            {"old_name": "api_user_name", "new_name": "userName"}
          ]
```

## 列选择 (selectColumns)

选择需要的列，排除不需要的列，用于字段精简和性能优化。

### 基础配置
```yaml
类型: selectColumns
参数:
  - key: columns      # 要保留的列（逗号分隔或数组）
    value: "id,name,email,created_at"
```

### 使用场景

#### 1. 字段精简
```yaml
# 只选择需要的字段，排除敏感或不必要的字段
类型: selectColumns
参数:
  - key: columns
    value: "user_id,user_name,email,phone,created_at"
    
# 排除的字段：password, id_card, bank_card, address等敏感信息
```

#### 2. 性能优化
```yaml
# 大数据量时，只选择需要的列可以减少内存和网络开销
类型: selectColumns
参数:
  - key: columns
    value: "order_id,customer_id,amount,order_date,status"
    
# 排除的字段：order_details, customer_address, payment_info等大字段
```

#### 3. 数据导出格式控制
```yaml
# 控制导出数据的字段顺序和内容
类型: selectColumns
参数:
  - key: columns
    value: |
      [
        "id",
        "name",
        "category",
        "price",
        "stock",
        "created_at",
        "updated_at"
      ]
    
  - key: keep_order   # 保持指定顺序
    value: "true"
```

### 高级用法

#### 1. 动态列选择
```yaml
类型: selectColumns
参数:
  - key: columns
    value: "{{需要导出的字段列表}}"
    
# 使用变量动态控制要导出的字段
```

#### 2. 排除特定列
```yaml
类型: selectColumns
参数:
  - key: exclude      # 要排除的列
    value: "password,token,secret_key,salt"
    
# 保留除了这些列之外的所有列
```

#### 3. 条件列选择
```yaml
类型: selectColumns
参数:
  - key: columns
    value: |
      [
        {"column": "id", "condition": "true"},                    # 总是包含
        {"column": "name", "condition": "true"},                  # 总是包含
        {"column": "email", "condition": "user_type == 'vip'"},   # 仅VIP用户包含邮箱
        {"column": "phone", "condition": "has_phone == true"},    # 有手机号的用户包含手机
        {"column": "address", "condition": "export_type == 'full'"} # 完整导出才包含地址
      ]
```

### 实际应用示例

#### 示例1：用户数据导出
```yaml
数据处理:
  - 类型: selectColumns
    参数:
      - key: columns
        value: |
          [
            "id",
            "username",
            "nickname",
            "email",
            "phone",
            "gender",
            "birthday",
            "created_at",
            "last_login_at"
          ]
      
      # 排除的敏感字段：password, pay_password, id_card, bank_card
```

#### 示例2：订单报表生成
```yaml
数据处理:
  - 类型: selectColumns
    参数:
      - key: columns
        value: "order_id,customer_id,customer_name,order_date,amount,status,payment_method"
      
      # 排除的详细字段：order_items, shipping_address, billing_address, notes
```

#### 示例3：API接口数据返回
```yaml
数据处理:
  - 类型: selectColumns
    参数:
      - key: columns
        value: |
          [
            "id",
            "title",
            "description",
            "price",
            "stock",
            "category",
            "images",
            "created_at"
          ]
      
      - key: condition
        value: "status == 'published'"
      
      # 只对已发布商品返回完整字段，草稿商品只返回基础字段
```

## 处理器组合使用

多个处理器可以组合使用，实现复杂的数据处理逻辑。

### 示例1：完整的数据清洗流程
```yaml
数据处理:
  # 1. 选择需要的列
  - 类型: selectColumns
    参数:
      - key: columns
        value: "id,name,email,phone,age,created_at"
  
  # 2. 重命名字段
  - 类型: renameColumn
    参数:
      - key: columns
        value: |
          [
            {"old_name": "id", "new_name": "user_id"},
            {"old_name": "name", "new_name": "user_name"},
            {"old_name": "created_at", "new_name": "registration_date"}
          ]
  
  # 3. 过滤无效数据
  - 类型: filterRows
    参数:
      - key: condition
        value: "age >= 18 AND email IS NOT NULL"
  
  # 4. 脱敏敏感数据
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {"column": "email", "algorithm": "md5"},
            {"column": "phone", "algorithm": "mask", "show_first": 3, "show_last": 4}
          ]
  
  # 5. 统一数据类型
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "user_id", "type": "string"},
            {"column": "age", "type": "integer"},
            {"column": "registration_date", "type": "datetime"}
          ]
```

### 示例2：日志数据处理
```yaml
数据处理:
  # 1. 过滤重要日志
  - 类型: filterRows
    参数:
      - key: condition
        value: "level IN ('ERROR', 'WARN', 'INFO') AND timestamp >= '{{今天开始}}'"
  
  # 2. 选择关键字段
  - 类型: selectColumns
    参数:
      - key: columns
        value: "timestamp,level,service,module,message,user_id,ip"
  
  # 3. 脱敏用户信息
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {"column": "user_id", "algorithm": "sha256"},
            {"column": "ip", "algorithm": "mask", "show_first": 1, "show_last": 0}
          ]
  
  # 4. 重命名字段
  - 类型: renameColumn
    参数:
      - key: columns
        value: |
          [
            {"old_name": "timestamp", "new_name": "log_time"},
            {"old_name": "level", "new_name": "log_level"},
            {"old_name": "message", "new_name": "log_message"}
          ]
```

### 示例3：销售数据分析
```yaml
数据处理:
  # 1. 过滤有效订单
  - 类型: filterRows
    参数:
      - key: condition
        value: |
          order_status == 'completed'
          AND amount > 0
          AND order_date >= '{{本月开始}}'
          AND order_date <= '{{本月结束}}'
  
  # 2. 选择分析字段
  - 类型: selectColumns
    参数:
      - key: columns
        value: "order_id,customer_id,product_id,quantity,amount,order_date,region,salesperson"
  
  # 3. 数据类型转换
  - 类型: convertType
    参数:
      - key: columns
        value: |
          [
            {"column": "order_id", "type": "string"},
            {"column": "quantity", "type": "integer"},
            {"column": "amount", "type": "float"},
            {"column": "order_date", "type": "datetime"}
          ]
  
  # 4. 脱敏客户信息
  - 类型: maskData
    参数:
      - key: columns
        value: |
          [
            {"column": "customer_id", "algorithm": "md5"},
            {"column": "salesperson", "algorithm": "mask", "show_first": 1}
          ]
```

## 性能优化建议

### 1. 处理器顺序优化
```yaml
# 推荐的处理器顺序：
# 1. filterRows - 先过滤，减少后续处理的数据量
# 2. selectColumns - 再选择列，减少字段数量
# 3. renameColumn - 重命名字段
# 4. convertType - 类型转换
# 5. maskData - 脱敏处理（最后进行，避免重复计算）
```

### 2. 批量处理优化
```yaml
# 使用批量配置减少处理器数量
类型: convertType
参数:
  - key: columns
    value: |
      [
        {"column": "id", "type": "string"},
        {"column": "age", "type": "integer"},
        {"column": "score", "type": "float"}
      ]
# 比使用3个单独的convertType处理器更高效
```

### 3. 条件优化
```yaml
# 将最可能过滤掉的条件放在前面
类型: filterRows
参数:
  - key: condition
    value: |
      is_deleted == false          # 80%的数据满足，先判断
      AND status == 'active'       # 50%的数据满足
      AND created_at > '2024-01-01' # 30%的数据满足
```

## 错误处理

### 1. 处理器错误配置
```yaml
# 使用try-catch模式处理处理器错误
数据处理:
  - 类型: convertType
    参数:
      - key: column
        value: "price"
      - key: type
        value: "float"
      - key: on_error
        value: "skip"  # 转换失败时跳过该行，而不是整个任务失败
```

### 2. 数据验证
```yaml
# 在处理器前后添加验证
数据处理:
  # 验证前：检查必要字段是否存在
  - 类型: filterRows
    参数:
      - key: condition
        value: "id IS NOT NULL AND name IS NOT NULL"
  
  # 主处理逻辑...
  
  # 验证后：检查处理结果
  - 类型: filterRows
    参数:
      - key: condition
        value: "LENGTH(name) > 0 AND price > 0"
```

## API 参考

### 在任务中使用处理器
```http
POST /api/task
Content-Type: application/json

{
  "mission_name": "数据处理示例",
  "cron": "0 2 * * *",
  "params": {
    "source": {
      // ... 数据输入配置 ...
    },
    "processors": [
      {
        "type": "selectColumns",
        "params": [
          {"key": "columns", "value": "id,name,email,age,created_at"}
        ]
      },
      {
        "type": "filterRows",
        "params": [
          {"key": "condition", "value": "age >= 18 AND email IS NOT NULL"}
        ]
      },
      {
        "type": "convertType",
        "params": [
          {"key": "columns", "value": "[{\"column\":\"age\",\"type\":\"integer\"},{\"column\":\"created_at\",\"type\":\"datetime\"}]"}
        ]
      },
      {
        "type": "maskData",
        "params": [
          {"key": "columns", "value": "[{\"column\":\"email\",\"algorithm\":\"md5\"}]"}
        ]
      }
    ],
    "sink": {
      // ... 数据输出配置 ...
    }
  }
}
```

## 下一步

配置好数据处理后，您可以：
1. [配置数据输出](/task-sink) - 将处理后的数据写入目标
2. [查看任务执行情况](/task-record) - 监控数据处理效果
3. [分析任务日志](/task-log) - 排查数据处理问题
4. [配置任务调度](/task-schedule) - 自动化执行数据处理任务