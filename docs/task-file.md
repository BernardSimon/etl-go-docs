# 快速文件上传

快速文件上传是 ETL-GO 的一个便捷功能，允许用户快速上传文件并在任务中直接使用。与标准文件管理不同，快速文件上传专注于任务执行过程中的临时文件处理。

## 功能概述

### 主要特性
- **一键上传**：简单的界面直接上传文件
- **任务关联**：上传的文件可直接关联到特定任务
- **临时存储**：任务执行后自动清理（可配置）
- **多格式支持**：支持 CSV、Excel、JSON、文本文件等
- **自动解析**：自动检测文件格式并解析内容

### 使用场景
1. **临时数据导入**：快速导入小批量数据执行任务
2. **配置文件上传**：上传任务配置文件
3. **模板文件**：上传数据处理模板
4. **测试数据**：上传测试用数据文件

## 上传方式

### 1. Web 界面上传
通过 ETL-GO 管理界面的"快速上传"按钮：

```yaml
# 上传界面配置示例
上传选项:
  - 文件类型: CSV/Excel/JSON/文本
  - 编码格式: UTF-8/GBK/GB2312
  - 分隔符: 自动检测/自定义
  - 表头行: 自动检测/指定行数
```

### 2. API 上传
通过 REST API 上传文件：

```bash
# 使用 curl 上传文件
curl -X POST http://localhost:8081/api/file/quick-upload \
  -H "Authorization: Bearer {{访问令牌}}" \
  -F "file=@/path/to/data.csv" \
  -F "task_id={{任务ID}}" \
  -F "description=测试数据文件"
```

### 3. 任务配置中上传
在任务配置时直接上传文件：

```yaml
任务配置:
  数据输入:
    - 类型: file_upload
      参数:
        - key: file_path
          value: "{{上传的文件路径}}"
        - key: auto_parse
          value: "true"
        - key: format
          value: "csv"
```

## 文件处理流程

### 上传阶段
1. **文件验证**：检查文件大小、格式、安全性
2. **临时存储**：存储到临时目录
3. **元数据记录**：记录文件信息到数据库
4. **关联任务**：将文件与任务关联

### 使用阶段
1. **任务引用**：任务配置中引用上传的文件
2. **自动加载**：任务执行时自动加载文件内容
3. **格式转换**：根据配置进行数据格式转换
4. **数据验证**：验证数据完整性和有效性

### 清理阶段
1. **任务完成后清理**：默认任务完成后删除临时文件
2. **保留选项**：可配置保留时间
3. **手动清理**：通过管理界面手动清理

## 配置参数

### 基本配置
```yaml
快速文件上传配置:
  最大文件大小: "10MB"           # 单个文件最大大小
  允许的文件类型:               # 允许上传的文件类型
    - ".csv"
    - ".xlsx"
    - ".xls"
    - ".json"
    - ".txt"
    - ".xml"
  临时目录: "/tmp/etl-uploads"  # 临时存储目录
  保留时间: "24h"              # 文件保留时间
  自动清理: "true"             # 是否自动清理过期文件
```

### 安全配置
```yaml
安全设置:
  文件类型验证: "true"         # 验证文件真实类型
  病毒扫描: "false"           # 是否进行病毒扫描
  文件大小限制: "10MB"        # 防止大文件攻击
  上传频率限制: "10/min"      # 防止频繁上传
  文件内容检查: "basic"       # 基础内容检查
```

### 性能配置
```yaml
性能优化:
  分片上传: "true"           # 支持大文件分片上传
  并发上传数: "3"            # 同时上传的文件数
  内存缓冲区: "16MB"         # 上传缓冲区大小
  磁盘缓存: "100MB"          # 磁盘缓存大小
  超时设置: "300s"           # 上传超时时间
```

## 与任务集成

### 任务中引用上传文件
```yaml
任务配置示例:
  名称: "处理上传的用户数据"
  数据输入:
    - 类型: uploaded_file
      参数:
        - key: file_id
          value: "{{上传的文件ID}}"
        - key: format
          value: "csv"
        - key: has_header
          value: "true"
        - key: encoding
          value: "utf-8"
  数据处理:
    - 类型: filterRows
      参数:
        - key: condition
          value: "status = 'active'"
  数据输出:
    - 类型: sql
      参数:
        - key: table
          value: "users"
        - key: mode
          value: "insert"
```

### 变量中使用上传文件
```yaml
变量配置:
  - 名称: "uploaded_user_data"
    类型: "file_query"
    参数:
      - key: file_id
        value: "{{上传的文件ID}}"
      - key: query
        value: "SELECT * FROM users WHERE department = '销售部'"
      - key: format
        value: "csv"
```

## API 参考

### 上传文件
```http
POST /api/file/quick-upload
Content-Type: multipart/form-data

参数:
- file: 文件内容 (必填)
- task_id: 关联任务ID (可选)
- description: 文件描述 (可选)
- retain_hours: 保留小时数 (可选，默认24)
- auto_parse: 是否自动解析 (可选，默认true)

返回:
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "file_id": "file_123456",
    "filename": "users.csv",
    "size": 10240,
    "uploaded_at": "2024-01-01T12:00:00Z",
    "expires_at": "2024-01-02T12:00:00Z",
    "download_url": "/api/file/download/file_123456"
  }
}
```

### 获取上传文件列表
```http
GET /api/file/uploads
查询参数:
- task_id: 过滤特定任务的文件
- status: 文件状态 (active/expired/deleted)
- page: 页码 (默认1)
- page_size: 每页数量 (默认20)

返回:
{
  "code": 200,
  "message": "成功",
  "data": {
    "files": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 删除上传文件
```http
DELETE /api/file/upload/{file_id}
```

### 下载上传文件
```http
GET /api/file/download/{file_id}
```

## 最佳实践

### 1. 文件命名规范
```yaml
文件命名建议:
  格式: "{任务名称}_{数据类型}_{时间戳}.{扩展名}"
  示例:
    - "用户导入_user_data_202401011200.csv"
    - "订单报表_order_report_20240101.xlsx"
    - "配置_config_20240101.json"
```

### 2. 文件大小控制
```yaml
文件大小建议:
  小文件: < 1MB (快速处理)
  中等文件: 1-10MB (适合大多数场景)
  大文件: > 10MB (建议分片或使用标准文件管理)
```

### 3. 安全建议
```yaml
安全配置:
  - 限制可上传文件类型
  - 设置合理的文件大小限制
  - 定期清理过期文件
  - 记录文件上传日志
  - 验证文件内容安全性
```

### 4. 性能优化
```yaml
性能优化:
  - 对小文件使用内存缓存
  - 对大文件启用分片上传
  - 配置合理的并发数
  - 监控磁盘空间使用
```

## 故障排除

### 常见问题

#### 1. 上传失败
**问题**: 文件上传失败，返回错误
**可能原因**:
- 文件大小超过限制
- 文件类型不被支持
- 磁盘空间不足
- 网络连接问题

**解决方案**:
```yaml
检查项:
  - 确认文件大小是否在限制内
  - 检查文件扩展名是否被允许
  - 查看服务器磁盘空间
  - 检查网络连接状态
```

#### 2. 文件解析错误
**问题**: 上传的文件无法正确解析
**可能原因**:
- 文件编码不匹配
- 文件格式错误
- 分隔符设置错误
- 表头行设置错误

**解决方案**:
```yaml
调试步骤:
  1. 检查文件编码设置
  2. 验证文件格式是否正确
  3. 尝试不同的分隔符
  4. 手动指定表头行
  5. 查看文件原始内容
```

#### 3. 文件关联失败
**问题**: 上传的文件无法与任务关联
**可能原因**:
- 任务ID不存在
- 文件已过期
- 权限不足
- 数据库连接问题

**解决方案**:
```yaml
处理步骤:
  1. 验证任务ID是否存在
  2. 检查文件状态是否有效
  3. 确认用户权限
  4. 检查数据库连接
```

## 高级功能

### 1. 文件预览
上传前或上传后预览文件内容：

```yaml
预览配置:
  启用预览: "true"
  预览行数: "10"
  预览编码: "utf-8"
  自动检测格式: "true"
```

### 2. 批量上传
支持一次上传多个文件：

```yaml
批量上传:
  最大文件数: "10"
  总大小限制: "50MB"
  并发上传: "3"
  进度跟踪: "true"
```

### 3. 文件转换
上传时自动进行文件格式转换：

```yaml
文件转换:
  CSV转JSON: "true"
  Excel转CSV: "true"
  编码转换: "auto"
  日期格式标准化: "true"
```

### 4. 智能解析
根据文件内容自动识别格式：

```yaml
智能解析:
  自动检测分隔符: "true"
  自动检测编码: "true"
  自动识别表头: "true"
  数据类型推断: "true"
```

## 与标准文件管理的区别

| 特性 | 快速文件上传 | 标准文件管理 |
|------|--------------|--------------|
| **目的** | 任务临时文件 | 长期文件存储 |
| **生命周期** | 任务相关，临时 | 长期保存 |
| **存储位置** | 临时目录 | 持久化存储 |
| **清理策略** | 自动清理 | 手动管理 |
| **关联性** | 与任务强关联 | 独立管理 |
| **访问权限** | 任务相关人员 | 基于角色权限 |

## 配置示例

### 完整配置示例
```yaml
快速文件上传配置:
  基本设置:
    最大文件大小: "10MB"
    允许的文件类型: [".csv", ".xlsx", ".xls", ".json", ".txt"]
    临时目录: "/var/tmp/etl-uploads"
    保留时间: "24h"
  
  安全设置:
    文件类型验证: "true"
    文件大小限制: "10MB"
    上传频率限制: "10/min"
    内容安全检查: "basic"
  
  性能设置:
    分片上传: "true"
    并发上传数: "3"
    内存缓冲区: "16MB"
    超时设置: "300s"
  
  高级功能:
    文件预览: "true"
    批量上传: "true"
    智能解析: "true"
    自动转换: "false"
```

### 任务集成示例
```yaml
任务配置:
  名称: "处理每日销售数据"
  描述: "从上传的CSV文件导入销售数据"
  
  数据输入:
    - 类型: uploaded_file
      参数:
        - key: file_id
          value: "{{每日销售数据文件ID}}"
        - key: format
          value: "csv"
        - key: encoding
          value: "utf-8"
        - key: has_header
          value: "true"
  
  数据处理:
    - 类型: convertType
      参数:
        - key: columns
          value: |
            [
              {"column": "sales_date", "type": "datetime", "format": "yyyy-MM-dd"},
              {"column": "amount", "type": "float"},
              {"column": "quantity", "type": "integer"}
            ]
    
    - 类型: filterRows
      参数:
        - key: condition
          value: "amount > 0 AND quantity > 0"
  
  数据输出:
    - 类型: sql
      参数:
        - key: table
          value: "daily_sales"
        - key: mode
          value: "insert"
        - key: batch_size
          value: "1000"
```

## 监控和日志

### 上传监控
```yaml
监控指标:
  上传成功率: "> 99%"
  平均上传时间: "< 10s"
  并发上传数: "实时监控"
  磁盘使用率: "< 80%"
  错误率: "< 1%"
```

### 日志记录
```yaml
日志配置:
  访问日志: "true"        # 记录所有上传请求
  错误日志: "true"        # 记录上传错误
  安全日志: "true"        # 记录安全相关事件
  性能日志: "true"        # 记录性能指标
  审计日志: "true"        # 记录重要操作
```

## 扩展和自定义

### 自定义文件处理器
```go
// 自定义文件处理器示例
type CustomFileProcessor struct {
    // 实现文件处理接口
}

func (p *CustomFileProcessor) Process(filePath string) ([]map[string]interface{}, error) {
    // 自定义处理逻辑
}
```

### 插件扩展
```yaml
插件配置:
  文件格式插件:
    - name: "parquet-processor"
      enabled: "true"
    - name: "avro-processor"
      enabled: "false"
  
  安全插件:
    - name: "virus-scanner"
      enabled: "true"
    - name: "malware-detector"
      enabled: "false"
```

## 注意事项

1. **临时性**：快速上传的文件是临时的，重要数据请使用标准文件管理
2. **安全性**：上传的文件会存储在服务器上，确保服务器安全
3. **性能**：大量文件上传会影响系统性能，合理配置限制
4. **兼容性**：不同格式的文件可能需要不同的解析器
5. **版本兼容**：文件格式版本变化可能影响解析结果

## 下一步

配置好快速文件上传功能后，您可以：
1. [查看任务执行情况](/task-record) - 查看使用上传文件的任务执行结果
2. [配置任务调度](/task-schedule) - 设置定时任务自动处理上传的文件
3. [分析日志](/task-log) - 查看文件上传和处理日志
4. [管理文件](/file) - 使用完整的文件管理功能