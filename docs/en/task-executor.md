# Before and After Processors

Before and after processors are special components in ETL tasks, used to execute additional operations at the beginning and end of data processing. They help you implement more complex data processing logic and workflow control.

## What are Before and After Processors?

### Before Processor (Before Execute)
Components executed **before** data input, typically used for:
- **Data Preprocessing**: Cleaning temporary tables, preparing data
- **Environment Checks**: Verifying data source status, checking resources
- **Conditional Logic**: Determining whether to execute the main task based on conditions
- **Parameter Preparation**: Setting parameters required for task execution

### After Processor (After Execute)
Components executed **after** data output, typically used for:
- **Data Cleanup**: Deleting temporary tables, releasing resources
- **Result Verification**: Checking if data processing results are correct
- **Notification Sending**: Sending task execution result notifications
- **Log Recording**: Recording task execution details

## Supported Processor Types

ETL-GO currently supports the following processor types:

### SQL Executor
Implements before and after processing by executing SQL statements, supports all SQL data sources:
- MySQL
- PostgreSQL
- SQLite

## Configuring Before and After Processors

### Before Processor Configuration

```yaml
Type: sql                # Processor type
Data Source: Production Database  # Data source for executing SQL
Parameters:
  - key: sql            # SQL statement parameter
    value: |
      -- Clean up temporary data from last week
      DELETE FROM temp_processing_data 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
      
      -- Check if data source is ready
      SELECT COUNT(*) as ready_count 
      FROM data_source_status 
      WHERE status = 'ready';
```

### After Processor Configuration

```yaml
Type: sql
Data Source: Log Database
Parameters:
  - key: sql
    value: |
      -- Record task execution results
      INSERT INTO task_execution_log 
      (task_name, execution_time, record_count, status)
      VALUES (
        '{{任务名称}}',
        NOW(),
        {{处理记录数}},
        '{{执行状态}}'
      );
      
      -- Send success notification
      UPDATE notification_queue 
      SET status = 'pending'
      WHERE notification_type = 'task_completed'
        AND task_id = '{{任务ID}}';
```

## Usage Scenario Examples

### Scenario 1: Data Quality Check

**Before Processor** - Check source data quality:
```sql
-- Check data integrity
SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN required_field IS NULL THEN 1 END) as null_count,
  MIN(created_at) as min_date,
  MAX(created_at) as max_date
FROM source_table
WHERE processing_date = '{{处理日期}}';
```

**After Processor** - Verify processing results:
```sql
-- Compare source and target data
SELECT 
  (SELECT COUNT(*) FROM source_table WHERE processing_date = '{{处理日期}}') as source_count,
  (SELECT COUNT(*) FROM target_table WHERE batch_id = '{{批次ID}}') as target_count,
  (SELECT COUNT(DISTINCT id) FROM source_table s 
   JOIN target_table t ON s.id = t.id 
   WHERE s.processing_date = '{{处理日期}}') as matched_count;
```

### Scenario 2: Resource Management

**Before Processor** - Prepare processing environment:
```sql
-- Create temporary table
CREATE TABLE IF NOT EXISTS temp_processed_data (
  id INT PRIMARY KEY,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clean up old temporary data
DELETE FROM temp_processed_data 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
```

**After Processor** - Clean up resources:
```sql
-- Archive processed data
INSERT INTO data_archive
SELECT * FROM temp_processed_data 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Clean up temporary table
DROP TABLE IF EXISTS temp_processed_data;

-- Release processing locks
UPDATE processing_locks 
SET locked = FALSE, lock_time = NULL
WHERE task_name = '{{任务名称}}';
```

### Scenario 3: Conditional Task Execution

**Before Processor** - Determine whether to execute task:
```sql
-- Check business date
SELECT 
  CASE 
    WHEN is_holiday = 1 THEN 'skip'
    WHEN is_weekend = 1 THEN 'reduce_volume'
    ELSE 'full_execution'
  END as execution_mode
FROM business_calendar
WHERE business_date = '{{业务日期}}';

-- Check data volume
SELECT COUNT(*) as data_volume
FROM source_data
WHERE processing_date = '{{处理日期}}';

-- Set task parameters based on conditions
SET @execution_mode = '{{execution_mode}}';
SET @batch_size = CASE 
  WHEN @execution_mode = 'reduce_volume' THEN 1000 
  ELSE 10000 
END;
```

**After Processor** - Send execution result notifications:
```sql
-- Send email notification
INSERT INTO email_notifications 
  (recipient, subject, body, priority)
SELECT 
  'data_team@company.com',
  CONCAT('Task {{任务名称}} - ', 
         CASE WHEN {{成功标志}} THEN 'Completed Successfully' ELSE 'Failed' END),
  CONCAT(
    'Task Name: {{任务名称}}\n',
    'Execution Time: ', NOW(), '\n',
    'Records Processed: {{处理记录数}}\n',
    'Status: ', CASE WHEN {{成功标志}} THEN 'Success' ELSE 'Failed' END, '\n',
    'Error Message: ', COALESCE({{错误信息}}, 'None'), '\n',
    'Next Execution: ', DATE_ADD(NOW(), INTERVAL 1 DAY)
  ),
  CASE WHEN {{成功标志}} THEN 'normal' ELSE 'high' END;
```

## Advanced Usage

### Processor Chain
Multiple processors can be chained together for complex logic:

```yaml
前置处理器:
  - 类型: sql
    数据源: 配置数据库
    参数:
      - key: sql
        value: |
          -- 1. 检查环境
          SELECT check_environment() as env_ok;
          
  - 类型: sql
    数据源: 业务数据库
    参数:
      - key: sql
        value: |
          -- 2. 获取业务参数
          SELECT get_business_params('{{业务日期}}') as params;
          
  - 类型: sql
    数据源: 临时数据库
    参数:
      - key: sql
        value: |
          -- 3. 准备临时存储
          CREATE TABLE temp_data_{{批次号}} (...);

后置处理器:
  - 类型: sql
    数据源: 日志数据库
    参数:
      - key: sql
        value: |
          -- 1. 记录执行日志
          INSERT INTO execution_logs (...);
          
  - 类型: sql
    数据源: 监控数据库
    参数:
      - key: sql
        value: |
          -- 2. 更新监控指标
          UPDATE task_metrics SET ...;
          
  - 类型: sql
    数据源: 通知数据库
    参数:
      - key: sql
        value: |
          -- 3. 发送通知
          INSERT INTO notifications (...);
```

### Dynamic SQL Generation
Generate SQL dynamically based on conditions:

```sql
-- 前置处理器：动态生成处理SQL
SET @table_name = '{{源表名}}';
SET @date_column = '{{日期列名}}';
SET @target_date = '{{目标日期}}';

SET @process_sql = CONCAT(
  'SELECT * FROM ', @table_name,
  ' WHERE ', @date_column, ' = ''', @target_date, '''',
  ' AND status = ''active'''
);

-- 存储生成的SQL到变量
INSERT INTO task_variables (name, value)
VALUES ('process_sql', @process_sql)
ON DUPLICATE KEY UPDATE value = @process_sql;
```

### Error Handling in Processors
Handle errors in processors:

```yaml
前置处理器:
  类型: sql
  数据源: 检查数据库
  参数:
    - key: sql
      value: |
        -- 尝试执行检查
        BEGIN
          DECLARE check_result INT;
          
          -- 执行检查逻辑
          SELECT check_data_quality() INTO check_result;
          
          IF check_result < 0 THEN
            -- 检查失败，抛出异常
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Data quality check failed';
          END IF;
          
          SELECT 'Check passed' as result;
        END
      
  - key: on_error        # 错误处理策略
    value: "fail"        # fail: 失败, skip: 跳过, continue: 继续
  
  - key: max_retries     # 最大重试次数
    value: "3"
```

## Processor Parameters

### Common Parameters

#### 1. SQL Parameters
```yaml
parameters:
  - key: sql            # SQL语句
    value: "SELECT * FROM table"
    
  - key: timeout        # 执行超时时间
    value: "30s"
    
  - key: fetch_size     # 获取大小
    value: "1000"
```

#### 2. Execution Control Parameters
```yaml
parameters:
  - key: enabled        # 是否启用
    value: "true"
    
  - key: execution_order # 执行顺序
    value: "10"         # 数字越小越先执行
    
  - key: fail_on_error  # 错误时是否失败
    value: "true"
```

#### 3. Logging Parameters
```yaml
parameters:
  - key: log_level      # 日志级别
    value: "info"       # debug, info, warn, error
    
  - key: log_details    # 日志详细程度
    value: "summary"    # summary: 摘要, detail: 详细
```

### Parameter Variables
Parameters can reference variables:

```yaml
parameters:
  - key: sql
    value: |
      SELECT * FROM {{源表名}}
      WHERE processing_date = '{{处理日期}}'
      
  - key: table_name
    value: "{{目标表名}}"
    
  - key: batch_size
    value: "{{批次大小}}"
```

## Performance Optimization

### 1. Connection Pool Optimization
```yaml
database_config:
  max_connections: 10     # 最大连接数
  max_idle_connections: 5 # 最大空闲连接数
  connection_timeout: 30s # 连接超时时间
```

### 2. SQL Optimization
```yaml
sql_config:
  use_prepared_statement: true  # 使用预编译语句
  batch_size: 1000             # 批量处理大小
  query_timeout: 60s          # 查询超时时间
```

### 3. Caching Strategy
```yaml
caching_config:
  enabled: true              # 启用缓存
  ttl: 300                  # 缓存有效期（秒）
  cache_key_prefix: "processor_"  # 缓存键前缀
```

## Error Handling

### Processor Error Types

#### 1. SQL Execution Error
**Causes**:
- SQL syntax error
- Database connection failure
- Table/column does not exist

**Solutions**:
- Validate SQL syntax before execution
- Implement connection retry mechanism
- Check table structure before execution

#### 2. Business Logic Error
**Causes**:
- Business rule violation
- Data quality issues
- Resource constraints

**Solutions**:
- Add business rule validation
- Implement data quality checks
- Monitor resource usage

#### 3. System Error
**Causes**:
- Memory exhaustion
- Disk space insufficient
- System resource constraints

**Solutions**:
- Monitor system resources
- Implement resource limits
- Add graceful degradation

### Error Handling Strategies
```yaml
error_handling:
  strategy: retry_then_fail  # 重试后失败
  max_retries: 3             # 最大重试次数
  retry_delay: 5s           # 重试延迟
  
  fallback_action: skip      # 降级操作：skip跳过, continue继续, alert告警
  
  notification:
    enabled: true
    channels: [email, webhook]
    recipients: [admin@example.com]
```

## Security Considerations

### 1. SQL Injection Prevention
```yaml
security:
  sql_injection_protection: true
  parameter_binding: true    # 使用参数绑定
  input_validation: true     # 输入验证
```

### 2. Permission Control
```yaml
permissions:
  read_only: true           # 只读权限
  allowed_operations: [SELECT, CALL]  # 允许的操作
  restricted_tables: [user_passwords, sensitive_data]  # 受限表
```

### 3. Audit Logging
```yaml
audit:
  enabled: true
  log_sql: true            # 记录SQL
  log_parameters: true     # 记录参数
  retention_days: 90       # 保留天数
```

## Monitoring and Logging

### 1. Performance Monitoring
```yaml
monitoring:
  metrics:
    - execution_time      # 执行时间
    - memory_usage       # 内存使用
    - record_count       # 处理记录数
    - error_count        # 错误数量
  
  alerting:
    - metric: execution_time
      threshold: 30s     # 阈值
      action: alert      # 告警动作
```

### 2. Detailed Logging
```yaml
logging:
  format: json           # 日志格式
  level: info            # 日志级别
  
  fields:
    - timestamp          # 时间戳
    - processor_name     # 处理器名称
    - execution_id       # 执行ID
    - sql_hash           # SQL哈希值
    - result_count       # 结果数量
    - error_message      # 错误信息
```

## Best Practices

### 1. Processor Design Principles
- **Single Responsibility**: Each processor should have a single clear purpose
- **Reusability**: Design processors to be reusable across multiple tasks
- **Testability**: Make processors easy to test independently
- **Idempotency**: Ensure processors can be safely retried

### 2. Configuration Management
- Use environment-specific configurations
- Store sensitive information in environment variables
- Version control all processor configurations

### 3. Performance Optimization
- Use connection pooling for database processors
- Implement caching for frequently executed processors
- Monitor and optimize processor execution time

### 4. Error Recovery
- Implement comprehensive error handling
- Add retry mechanisms with exponential backoff
- Design graceful degradation strategies

## API Reference

### Create Processor
```http
POST /api/processor
Content-Type: application/json

{
  "name": "data_quality_check",
  "type": "sql",
  "data_source_id": "datasource_mysql",
  "params": [
    {"key": "sql", "value": "SELECT COUNT(*) as count FROM source_data"},
    {"key": "timeout", "value": "30s"},
    {"key": "fail_on_error", "value": "true"}
  ]
}
```

### Execute Processor
```http
POST /api/processor/execute
Content-Type: application/json

{
  "processor_id": "processor_123",
  "params": {
    "date": "2024-01-01"
  }
}
```

### Get Processor Execution Logs
```http
GET /api/processor/logs
Content-Type: application/json

{
  "processor_id": "processor_123",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z"
}
```

## Next Steps

After configuring processors, you can:
1. [Integrate Processors into Tasks](/task) - Use processors in complete task configurations
2. [Monitor Processor Execution](/task-record) - Track processor execution status
3. [Optimize Processor Performance](/task-optimization) - Improve processor execution efficiency
4. [Configure Processor Dependencies](/task-dependency) - Set up processor execution dependencies