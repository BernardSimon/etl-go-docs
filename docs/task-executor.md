# 前后置处理器

前后置处理器是 ETL 任务中的特殊组件，用于在数据处理的开始和结束时执行额外操作。它们可以帮助您实现更复杂的数据处理逻辑和工作流控制。

## 什么是前后置处理器？

### 前置处理器（Before Execute）
在数据输入**之前**执行的组件，通常用于：
- **数据预处理**：清理临时表、准备数据
- **环境检查**：验证数据源状态、检查资源
- **条件判断**：根据条件决定是否执行主任务
- **参数准备**：设置任务执行所需的参数

### 后置处理器（After Execute）
在数据输出**之后**执行的组件，通常用于：
- **数据清理**：删除临时表、释放资源
- **结果验证**：检查数据处理结果是否正确
- **通知发送**：发送任务执行结果通知
- **日志记录**：记录任务执行详情

## 支持的处理器类型

目前 ETL-GO 支持以下处理器类型：

### SQL 执行器
通过执行 SQL 语句实现前后置处理，支持所有 SQL 数据源：
- MySQL
- PostgreSQL
- SQLite

## 配置前后置处理器

### 前置处理器配置

```yaml
类型: sql                # 处理器类型
数据源: 生产数据库         # 执行 SQL 的数据源
参数:
  - key: sql            # SQL 语句参数
    value: |
      -- 清理上周的临时数据
      DELETE FROM temp_processing_data 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
      
      -- 检查数据源是否就绪
      SELECT COUNT(*) as ready_count 
      FROM data_source_status 
      WHERE status = 'ready';
```

### 后置处理器配置

```yaml
类型: sql
数据源: 日志数据库
参数:
  - key: sql
    value: |
      -- 记录任务执行结果
      INSERT INTO task_execution_log 
      (task_name, execution_time, record_count, status)
      VALUES (
        '{{任务名称}}',
        NOW(),
        {{处理记录数}},
        '{{执行状态}}'
      );
      
      -- 发送成功通知
      UPDATE notification_queue 
      SET status = 'pending'
      WHERE notification_type = 'task_completed'
        AND task_id = '{{任务ID}}';
```

## 使用场景示例

### 场景1：数据质量检查

**前置处理器** - 检查源数据质量：
```sql
-- 检查数据完整性
SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN required_field IS NULL THEN 1 END) as null_count,
  MIN(created_at) as min_date,
  MAX(created_at) as max_date
FROM source_table
WHERE processing_date = '{{处理日期}}';
```

**后置处理器** - 验证处理结果：
```sql
-- 比较源数据和目标数据
SELECT 
  (SELECT COUNT(*) FROM source_table WHERE processing_date = '{{处理日期}}') as source_count,
  (SELECT COUNT(*) FROM target_table WHERE batch_id = '{{批次ID}}') as target_count,
  (SELECT COUNT(DISTINCT id) FROM source_table s 
   JOIN target_table t ON s.id = t.id 
   WHERE s.processing_date = '{{处理日期}}') as matched_count;
```

### 场景2：资源管理

**前置处理器** - 准备处理环境：
```sql
-- 创建临时表
CREATE TABLE IF NOT EXISTS temp_processed_data (
  id INT PRIMARY KEY,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 清理旧临时数据
DELETE FROM temp_processed_data 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
```

**后置处理器** - 清理资源：
```sql
-- 归档处理数据
INSERT INTO data_archive 
SELECT * FROM temp_processed_data 
WHERE created_at >= '{{任务开始时间}}';

-- 清理临时表
DROP TABLE IF EXISTS temp_processed_data;
```

### 场景3：条件执行控制

**前置处理器** - 检查执行条件：
```sql
-- 检查是否已执行过
SELECT COUNT(*) as already_executed
FROM task_history
WHERE task_name = '{{任务名称}}'
  AND execution_date = CURDATE();

-- 检查数据是否就绪  
SELECT COUNT(*) as data_ready
FROM data_availability
WHERE table_name = '{{表名}}'
  AND data_date = '{{数据日期}}'
  AND status = 'ready';
```

**后置处理器** - 更新执行状态：
```sql
-- 记录执行历史
INSERT INTO task_history 
(task_name, execution_date, start_time, end_time, status)
VALUES (
  '{{任务名称}}',
  CURDATE(),
  '{{开始时间}}',
  NOW(),
  '{{执行状态}}'
);
```

## 高级用法

### 使用变量动态控制

前后置处理器可以结合变量实现动态逻辑：

```yaml
# 变量：获取上次执行时间
变量名: last_execution_time
SQL: SELECT MAX(execution_time) as time FROM task_log WHERE task_name = '{{任务名称}}'

# 前置处理器：只处理新数据
前置处理器:
  类型: sql
  数据源: 生产数据库
  SQL: |
    -- 设置本次处理的起始时间
    SET @start_time = '{{last_execution_time}}';
    
    -- 如果没有上次执行时间，则处理所有数据
    IF @start_time IS NULL THEN
      SET @start_time = '1970-01-01';
    END IF;
    
    -- 记录本次处理范围
    INSERT INTO processing_range 
    (task_name, start_time, batch_id)
    VALUES ('{{任务名称}}', @start_time, '{{批次ID}}');
```

### 错误处理和重试

```yaml
# 前置处理器：设置重试标记
前置处理器:
  类型: sql
  数据源: 控制数据库
  SQL: |
    -- 检查是否在重试中
    SELECT retry_count, last_error 
    FROM task_retry_status
    WHERE task_id = '{{任务ID}}';
    
    -- 如果是第一次执行或重试次数未超限，则继续
    IF retry_count < 3 THEN
      UPDATE task_retry_status
      SET retry_count = retry_count + 1,
          last_attempt = NOW()
      WHERE task_id = '{{任务ID}}';
    ELSE
      -- 重试次数超限，抛出错误
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = '重试次数超限，任务终止';
    END IF;

# 后置处理器：清理重试状态
后置处理器:
  类型: sql
  数据源: 控制数据库
  SQL: |
    -- 任务成功，清除重试状态
    DELETE FROM task_retry_status
    WHERE task_id = '{{任务ID}}';
    
    -- 如果任务失败，更新错误信息
    IF '{{任务状态}}' = 'failed' THEN
      UPDATE task_retry_status
      SET last_error = '{{错误信息}}',
          last_attempt = NOW()
      WHERE task_id = '{{任务ID}}';
    END IF;
```

### 多步骤工作流

```yaml
# 复杂任务的前后置处理器链
任务配置:
  前置处理器:
    - 步骤1: 检查依赖任务是否完成
      SQL: SELECT status FROM task_dependencies WHERE dependent_task = '{{任务名称}}'
    
    - 步骤2: 锁定资源，防止并发执行
      SQL: INSERT INTO task_locks (task_name, locked_at) VALUES ('{{任务名称}}', NOW())
    
    - 步骤3: 准备临时存储
      SQL: CREATE TEMPORARY TABLE temp_stage_1 AS SELECT * FROM source_1 WHERE condition = 'value'
  
  主任务:
    # ... 主任务配置 ...
  
  后置处理器:
    - 步骤1: 验证处理结果
      SQL: SELECT COUNT(*) as processed_count FROM temp_stage_1
    
    - 步骤2: 释放资源锁
      SQL: DELETE FROM task_locks WHERE task_name = '{{任务名称}}'
    
    - 步骤3: 更新依赖状态
      SQL: UPDATE task_dependencies SET status = 'completed' WHERE task_name = '{{任务名称}}'
```

## 最佳实践

### 1. 处理器设计原则
- **单一职责**：每个处理器只做一件事
- **幂等性**：处理器可以安全地重复执行
- **可观测性**：处理器应该记录执行日志
- **错误处理**：处理器应该妥善处理异常

### 2. 性能考虑
- **最小化数据库操作**：避免不必要的查询
- **使用事务**：确保数据一致性
- **批量操作**：大数据量时使用批量处理
- **索引优化**：为查询条件添加索引

### 3. 安全考虑
- **权限控制**：使用最小必要权限的数据库账户
- **SQL 注入防护**：使用参数化查询或变量
- **敏感信息保护**：不要在 SQL 中硬编码密码等敏感信息

### 4. 监控和调试
```sql
-- 在处理器中添加监控点
INSERT INTO processor_monitor 
(processor_type, task_name, execution_time, parameters, result)
VALUES (
  'before_execute',
  '{{任务名称}}',
  NOW(),
  '{{参数JSON}}',
  '{{结果JSON}}'
);
```

## 故障排除

### 常见问题

#### 1. 处理器执行失败
**可能原因**：
- SQL 语法错误
- 数据源连接失败
- 权限不足
- 资源竞争

**解决方案**：
- 检查 SQL 语法
- 验证数据源连接
- 确认账户权限
- 添加重试机制

#### 2. 处理器超时
**可能原因**：
- 数据量过大
- 查询复杂度高
- 数据库负载重

**解决方案**：
- 优化 SQL 查询
- 添加查询超时限制
- 分批处理大数据

#### 3. 处理器副作用
**可能原因**：
- 非幂等操作
- 缺少事务控制
- 并发冲突

**解决方案**：
- 设计幂等处理器
- 使用数据库事务
- 添加并发控制

## API 参考

### 在任务中使用处理器
```http
POST /api/task
Content-Type: application/json

{
  "mission_name": "带处理器的任务",
  "cron": "0 0 * * *",
  "params": {
    "before_execute": {
      "type": "sql",
      "data_source": "datasource_123",
      "params": [
        {
          "key": "sql",
          "value": "INSERT INTO task_start_log VALUES ('任务开始', NOW());"
        }
      ]
    },
    "source": {
      // ... 数据输入配置 ...
    },
    "sink": {
      // ... 数据输出配置 ...
    },
    "after_execute": {
      "type": "sql",
      "data_source": "datasource_123",
      "params": [
        {
          "key": "sql",
          "value": "INSERT INTO task_end_log VALUES ('任务结束', NOW(), '成功');"
        }
      ]
    }
  }
}
```

## 下一步

配置好前后置处理器后，您可以：
1. [配置数据输入](/task-source) - 了解如何从数据源提取数据
2. [配置数据处理](/task-processor) - 了解如何转换和处理数据
3. [配置数据输出](/task-sink) - 了解如何将数据写入目标
4. [查看任务执行情况](/task-record) - 监控处理器执行效果