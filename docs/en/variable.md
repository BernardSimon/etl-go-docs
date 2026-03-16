# Variable Configuration

Variables are components in ETL-GO used to store dynamic values and query results. Variables can dynamically obtain values during task execution, enabling flexible configuration and data processing.

## Purpose of Variables

Variables are primarily used in ETL tasks for:

1. **Dynamic Parameters** - Using variables as parameters in SQL queries
2. **Intermediate Results** - Storing query results for use in subsequent steps
3. **Conditional Logic** - Determining task execution logic based on variable values
4. **Configuration Reuse** - Defining commonly used configurations as variables for reuse across multiple places

## Supported Variable Types

### SQL Query Variables
Obtain variable values by executing SQL queries, supporting the following data sources:
- MySQL
- PostgreSQL
- SQLite

## Creating Variables

### Creating via Web Interface

1. Log in to the ETL-GO Web interface
2. Click "Variable Management" in the left navigation bar
3. Click the "New Variable" button
4. Select variable type and fill in configuration information
5. Click "Test" to verify variable configuration
6. Click "Save"

### SQL Query Variable Configuration

#### Basic Configuration
```yaml
# Variable basic information
name: Total Users           # Variable name
description: Count total records in user table  # Variable description
type: sql                  # Variable type

# Data source configuration
datasource_id: datasource_mysql_prod  # Associated data source ID

# SQL query configuration
sql: SELECT COUNT(*) as count FROM users  # Query SQL
```

#### SQL Query with Parameters
```yaml
name: Today's New Users
description: Query the number of new users added today
type: sql
datasource_id: datasource_mysql_prod
sql: |
  SELECT COUNT(*) as count 
  FROM users 
  WHERE DATE(created_at) = CURDATE()
```

#### Multi-Result SQL Query
```yaml
name: User Statistics
description: Get user statistical data
type: sql
datasource_id: datasource_mysql_prod
sql: |
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    AVG(age) as avg_age
  FROM users
```

## Using Variables

### Referencing Variables in Tasks

Variables can be used in various task components:

#### 1. Using in Data Input (Source)
```sql
-- Using variables in SQL queries
SELECT * FROM orders 
WHERE order_date >= '{{开始日期}}' 
  AND order_date <= '{{结束日期}}'
  AND user_id IN ({{用户ID列表}})
```

#### 2. Using in Data Processing (Processor)
```yaml
# Using variables in filters
filter_condition: "age > {{最小年龄}} AND age < {{最大年龄}}"

# Using variables in data type conversion
target_type: "{{目标数据类型}}"
```

#### 3. Using in Data Output (Sink)
```sql
-- Using variables in target table names
INSERT INTO {{目标表名}}_backup (column1, column2) VALUES (?, ?)

-- Using variables in insert values
INSERT INTO log_table (event_type, event_time, user_count) 
VALUES ('daily_report', NOW(), {{用户总数}})
```

#### 4. Using in Executor (Executor)
```sql
-- Using variables in execution SQL
UPDATE config_table 
SET value = '{{新配置值}}' 
WHERE key = '{{配置键}}'
```

### Variable Value Formats

#### Single Value Variables
If the SQL query returns a single row and single column, the variable value is that cell's value:

```yaml
# Query: SELECT COUNT(*) FROM users
# Result: 150
variable_value: 150  # Integer value
```

#### Single Row, Multiple Columns
If the SQL query returns a single row with multiple columns, the variable value is a JSON object:

```yaml
# Query: SELECT COUNT(*) as total, AVG(age) as avg_age FROM users
# Result: {"total": 150, "avg_age": 28.5}
variable_value: {"total": 150, "avg_age": 28.5}  # JSON object
```

#### Multiple Rows
If the SQL query returns multiple rows, the variable value is a JSON array:

```yaml
# Query: SELECT id, name FROM users LIMIT 3
# Result: [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}, {"id": 3, "name": "Charlie"}]
variable_value: [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}, {"id": 3, "name": "Charlie"}]  # JSON array
```

## Variable Lifecycle

### 1. Variable Value Update Timing

#### Task Start Time Update
Configure variables to update values when the task starts:
```yaml
update_timing: task_start  # Values updated when task starts
```

#### Periodic Update
Configure variables to update values periodically:
```yaml
update_timing: periodic    # Periodically update
update_interval: 300      # Update every 300 seconds (5 minutes)
```

#### Manual Update
Only update when manually triggered:
```yaml
update_timing: manual     # Manual update only
```

### 2. Variable Caching

#### Enable Caching
```yaml
cache_enabled: true       # Enable caching
cache_ttl: 600           # Cache validity period: 600 seconds (10 minutes)
```

#### Disable Caching
```yaml
cache_enabled: false      # Disable caching, always query database
```

## Advanced Variable Usage

### 1. Variable Nesting
Variables can reference other variables:

```yaml
# Base variable: Current date
name: current_date
sql: SELECT CURDATE() as date

# Derived variable: Yesterday's date
name: yesterday_date  
sql: SELECT DATE_SUB('{{current_date}}', INTERVAL 1 DAY) as date
```

### 2. Variable Combination
Combine multiple variables into a new variable:

```yaml
# Combined variable: Date range
name: date_range
sql: |
  SELECT 
    '{{开始日期}}' as start_date,
    '{{结束日期}}' as end_date,
    DATEDIFF('{{结束日期}}', '{{开始日期}}') as day_count
```

### 3. Conditional Variables
Execute different SQL based on conditions:

```yaml
name: dynamic_query
sql: |
  {% if 环境 == 'prod' %}
    SELECT * FROM prod_users
  {% else %}
    SELECT * FROM dev_users  
  {% endif %}
```

### 4. Variable Validation
Validate variable values:

```yaml
validation_rules:
  - rule: "value > 0"                # Value must be greater than 0
    error_message: "Value must be positive"
  
  - rule: "LENGTH(value) <= 100"     # String length must be ≤ 100
    error_message: "String too long"
```

## Practical Application Examples

### Example 1: Daily Report Task
```yaml
# 1. Define date variable
name: report_date
sql: SELECT CURDATE() as date

# 2. Define user count variable  
name: daily_users
sql: |
  SELECT COUNT(*) as count
  FROM users
  WHERE DATE(created_at) = '{{report_date}}'

# 3. Task configuration
任务:
  数据输入:
    sql: |
      SELECT * FROM orders
      WHERE order_date = '{{report_date}}'
      
  数据处理:
    - 过滤条件: "status = 'completed'"
    
  数据输出:
    sql: |
      INSERT INTO daily_report 
      (report_date, user_count, order_count) 
      VALUES ('{{report_date}}', {{daily_users}}, {{订单总数}})
```

### Example 2: Dynamic Data Synchronization
```yaml
# 1. Define synchronization range
name: sync_start_time
sql: SELECT MAX(updated_at) FROM target_table

# 2. Define batch size
name: batch_size
sql: SELECT 1000 as size

# 3. Task configuration
任务:
  数据输入:
    sql: |
      SELECT * FROM source_table
      WHERE updated_at > '{{sync_start_time}}'
      LIMIT {{batch_size}}
      
  数据输出:
    table: target_table
    mode: upsert
    key_columns: id
```

### Example 3: Monitoring Alert Task
```yaml
# 1. Define alert threshold
name: error_threshold
sql: SELECT 10 as threshold

# 2. Define current error count  
name: current_errors
sql: |
  SELECT COUNT(*) as count
  FROM app_logs
  WHERE log_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    AND level = 'ERROR'

# 3. Task configuration
任务:
  执行器:
    sql: |
      -- Check if exceeding threshold
      {% if current_errors > error_threshold %}
        INSERT INTO alerts (type, message, level)
        VALUES ('error_rate_high', 
                'Error count {{current_errors}} exceeds threshold {{error_threshold}}', 
                'critical')
      {% endif %}
```

## Best Practices

### 1. Naming Conventions
- Use meaningful names: `total_users`, `yesterday_date`, `error_count`
- Add prefixes/suffixes: `var_`, `cfg_`, `stat_`
- Consistent naming style: snake_case recommended

### 2. Performance Optimization
- Enable caching for infrequently changed variables
- Avoid complex queries in frequently updated variables
- Use simple queries for base variables, complex queries for derived variables

### 3. Error Handling
- Set default values: `default_value: 0`
- Configure error handling strategies: `on_error: skip|fail|use_default`
- Add logging for variable value changes

### 4. Security Considerations
- Avoid using sensitive information in variable names
- Validate variable values to prevent SQL injection
- Set appropriate data source permissions

## API Reference

### Create Variable
```http
POST /api/variable
Content-Type: application/json

{
  "name": "total_users",
  "description": "Total user count",
  "type": "sql",
  "datasource_id": "datasource_mysql_prod",
  "sql": "SELECT COUNT(*) as count FROM users",
  "cache_enabled": true,
  "cache_ttl": 600
}
```

### Get Variable Value
```http
GET /api/variable/value
Content-Type: application/json

{
  "id": "variable_123"
}
```

### Update Variable Value
```http
PUT /api/variable/value
Content-Type: application/json

{
  "id": "variable_123",
  "force": true  # Force update, ignore cache
}
```

### List Variables
```http
GET /api/variable/list
```

## Troubleshooting

### Common Issues

#### 1. Variable Value Not Updating
**Possible causes**:
- Caching enabled, TTL not expired
- Database query failed
- Variable dependency loop

**Solutions**:
- Check cache configuration
- Verify database connectivity
- Check variable dependency relationships

#### 2. SQL Query Error
**Possible causes**:
- SQL syntax error
- Database permissions insufficient
- Table/column does not exist

**Solutions**:
- Test SQL query separately
- Check database account permissions
- Verify table/column names

#### 3. Variable Reference Error
**Possible causes**:
- Referenced variable does not exist
- Variable value format mismatch
- Circular dependency

**Solutions**:
- Check variable name spelling
- Verify variable value format
- Check variable dependency graph

## Next Steps

After configuring variables, you can:
1. [Create Task](/task) - Use variables in task configurations
2. [Configure Data Processing](/task-processor) - Use variables in data processing
3. [Configure Data Output](/task-sink) - Use variables in data output
4. [Set Task Scheduling](/task-schedule) - Automate variable-based tasks