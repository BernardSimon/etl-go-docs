# File Management

File management is an essential feature of ETL-GO that allows users to upload, manage, and use files in ETL tasks. The system provides a comprehensive file management solution supporting temporary file uploads for task execution and permanent file storage for long-term data management.

## Feature Overview

### Core Features
- **Quick Upload**: Simple interface for fast file uploads
- **Task Association**: Directly associate files with specific tasks
- **Multiple Format Support**: CSV, Excel, JSON, text files, and more
- **Automatic Parsing**: Automatic format detection and content parsing
- **File Metadata Management**: Store file information, size, and metadata
- **Security Features**: File validation and security checks

### Use Cases
1. **Temporary Data Import**: Quickly import small batches of data for task execution
2. **Configuration Files**: Upload task configuration files
3. **Template Files**: Upload data processing templates
4. **Test Data**: Upload test data files
5. **Reference Data**: Upload reference datasets for data enrichment

## Upload Methods

### 1. Web Interface Upload
Through the ETL-GO management interface:

```yaml
# Upload Interface Configuration Example
Upload Options:
  - File Types: CSV/Excel/JSON/Text
  - Encoding Formats: UTF-8/GBK/GB2312
  - Delimiter: Auto-detect/Custom
  - Header Row: Auto-detect/Specified row number
```

### 2. API Upload
Upload files via REST API:

```bash
# Upload file using curl
curl -X POST http://localhost:8081/api/file/upload \
  -H "Authorization: Bearer {{access_token}}" \
  -F "file=@/path/to/data.csv"
```

### 3. Task Configuration Upload
Upload files directly during task configuration:

```yaml
Task Configuration:
  Data Input:
    - Type: file_upload
      Parameters:
        - key: file_path
          value: "{{uploaded_file_path}}"
        - key: auto_parse
          value: "true"
        - key: format
          value: "csv"
```

## File Processing Flow

### Upload Phase
1. **File Validation**: Check file size, format, security
2. **Temporary Storage**: Store to temporary directory (`./file/input/`)
3. **Metadata Recording**: Record file information to database
4. **Task Association**: Associate file with specific task

### Usage Phase
1. **Task Reference**: Reference uploaded file in task configuration
2. **Automatic Loading**: Automatically load file content during task execution
3. **Format Conversion**: Data format conversion based on configuration
4. **Data Validation**: Verify data integrity and validity

### Cleanup Phase
1. **Post-task Cleanup**: Delete temporary files after task completion (configurable)
2. **Retention Options**: Configurable retention period
3. **Manual Cleanup**: Manual cleanup through management interface

## Configuration Parameters

### Basic Configuration
```yaml
File Management Configuration:
  Max File Size: "10MB"           # Maximum size per file
  Allowed File Types:             # Allowed file types
    - ".csv"
    - ".xlsx"
    - ".xls"
    - ".json"
    - ".txt"
    - ".xml"
  Storage Directory: "./file/input"  # File storage directory
  Retention Period: "24h"          # File retention time
  Auto Cleanup: "true"            # Whether to auto-clean expired files
```

### Security Configuration
```yaml
Security Settings:
  File Type Validation: "true"    # Validate actual file type
  Virus Scanning: "false"         # Whether to perform virus scanning
  File Size Limitation: "10MB"    # Prevent large file attacks
  Upload Rate Limitation: "10/min" # Prevent frequent uploads
  File Content Check: "basic"     # Basic content checking
```

### Performance Configuration
```yaml
Performance Optimization:
  Chunked Upload: "true"         # Support chunked upload for large files
  Concurrent Uploads: "3"        # Number of concurrent uploads
  Memory Buffer: "16MB"          # Upload buffer size
  Disk Cache: "100MB"            # Disk cache size
  Timeout Setting: "300s"        # Upload timeout
```

## Integration with Tasks

### Referencing Uploaded Files in Tasks
```yaml
Task Configuration Example:
  Name: "Process Uploaded User Data"
  Data Input:
    - Type: uploaded_file
      Parameters:
        - key: file_id
          value: "{{uploaded_file_id}}"
        - key: format
          value: "csv"
        - key: has_header
          value: "true"
        - key: encoding
          value: "utf-8"
  Data Processing:
    - Type: filterRows
      Parameters:
        - key: condition
          value: "status = 'active'"
  Data Output:
    - Type: sql
      Parameters:
        - key: table
          value: "users"
        - key: mode
          value: "insert"
```

### Using Uploaded Files in Variables
```yaml
Variable Configuration:
  - Name: "uploaded_user_data"
    Type: "file_query"
    Parameters:
      - key: file_id
        value: "{{uploaded_file_id}}"
      - key: query
        value: "SELECT * FROM users WHERE department = 'Sales'"
      - key: format
        value: "csv"
```

## API Reference

### Upload File
```http
POST /api/file/upload
Content-Type: multipart/form-data

Parameters:
- file: File content (required)

Returns:
{
  "name": "users.csv",
  "path": "input",
  "size": 10240,
  "ex_name": ".csv",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get File List
```http
GET /api/file/list

Query Parameters:
- page_no: Page number (default: 1)
- page_size: Page size (default: 20)

Returns:
{
  "total": 100,
  "list": [
    {
      "id": "file_123456",
      "name": "users.csv",
      "path": "input",
      "size": 10240,
      "ex_name": ".csv",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Delete File
```http
DELETE /api/file/{file_id}
```

## Best Practices

### 1. File Naming Conventions
```yaml
File Naming Suggestions:
  Format: "{task_name}_{data_type}_{timestamp}.{extension}"
  Examples:
    - "user_import_user_data_202401011200.csv"
    - "order_report_order_data_20240101.xlsx"
    - "config_configuration_20240101.json"
```

### 2. File Size Control
```yaml
File Size Recommendations:
  Small Files: < 1MB (fast processing)
  Medium Files: 1-10MB (suitable for most scenarios)
  Large Files: > 10MB (recommend chunked upload or standard file management)
```

### 3. Security Recommendations
```yaml
Security Configuration:
  - Limit allowed file types
  - Set reasonable file size limits
  - Regularly clean expired files
  - Log file upload activities
  - Validate file content security
```

### 4. Performance Optimization
```yaml
Performance Optimization:
  - Use memory cache for small files
  - Enable chunked upload for large files
  - Configure appropriate concurrency levels
  - Monitor disk space usage
```

## Troubleshooting

### Common Issues

#### 1. Upload Failure
**Problem**: File upload fails with error
**Possible Causes**:
- File size exceeds limit
- File type not supported
- Insufficient disk space
- Network connection issues

**Solutions**:
```yaml
Checklist:
  - Verify file size is within limits
  - Check if file extension is allowed
  - Check server disk space
  - Verify network connection status
```

#### 2. File Parsing Error
**Problem**: Uploaded file cannot be parsed correctly
**Possible Causes**:
- File encoding mismatch
- Incorrect file format
- Delimiter setting error
- Header row setting error

**Solutions**:
```yaml
Debugging Steps:
  1. Check file encoding settings
  2. Verify file format is correct
  3. Try different delimiters
  4. Manually specify header row
  5. View raw file content
```

#### 3. File Association Failure
**Problem**: Uploaded file cannot be associated with task
**Possible Causes**:
- Task ID does not exist
- File has expired
- Insufficient permissions
- Database connection issues

**Solutions**:
```yaml
Resolution Steps:
  1. Verify task ID exists
  2. Check if file status is valid
  3. Confirm user permissions
  4. Check database connection
```

## Advanced Features

### 1. File Preview
Preview file content before or after upload:

```yaml
Preview Configuration:
  Enable Preview: "true"
  Preview Lines: "10"
  Preview Encoding: "utf-8"
  Auto Detect Format: "true"
```

### 2. Batch Upload
Support uploading multiple files at once:

```yaml
Batch Upload:
  Max Files: "10"
  Total Size Limit: "50MB"
  Concurrent Uploads: "3"
  Progress Tracking: "true"
```

### 3. File Conversion
Automatic file format conversion during upload:

```yaml
File Conversion:
  CSV to JSON: "true"
  Excel to CSV: "true"
  Encoding Conversion: "auto"
  Date Format Standardization: "true"
```

### 4. Intelligent Parsing
Automatic format recognition based on file content:

```yaml
Intelligent Parsing:
  Auto Detect Delimiter: "true"
  Auto Detect Encoding: "true"
  Auto Identify Header: "true"
  Data Type Inference: "true"
```

## Differences from Standard File Management

| Feature | Quick File Upload | Standard File Management |
|---------|-------------------|--------------------------|
| **Purpose** | Task temporary files | Long-term file storage |
| **Lifecycle** | Task-related, temporary | Long-term preservation |
| **Storage Location** | Temporary directory | Persistent storage |
| **Cleanup Strategy** | Automatic cleanup | Manual management |
| **Association** | Strongly associated with tasks | Independently managed |
| **Access Permissions** | Task-related personnel | Role-based permissions |

## Configuration Examples

### Complete Configuration Example
```yaml
File Management Configuration:
  Basic Settings:
    Max File Size: "10MB"
    Allowed File Types: [".csv", ".xlsx", ".xls", ".json", ".txt"]
    Storage Directory: "./file/input"
    Retention Period: "24h"
  
  Security Settings:
    File Type Validation: "true"
    File Size Limitation: "10MB"
    Upload Rate Limitation: "10/min"
    Content Security Check: "basic"
  
  Performance Settings:
    Chunked Upload: "true"
    Concurrent Uploads: "3"
    Memory Buffer: "16MB"
    Timeout Setting: "300s"
  
  Advanced Features:
    File Preview: "true"
    Batch Upload: "true"
    Intelligent Parsing: "true"
    Auto Conversion: "false"
```

### Task Integration Example
```yaml
Task Configuration:
  Name: "Process Daily Sales Data"
  Description: "Import sales data from uploaded CSV file"
  
  Data Input:
    - Type: uploaded_file
      Parameters:
        - key: file_id
          value: "{{daily_sales_file_id}}"
        - key: format
          value: "csv"
        - key: encoding
          value: "utf-8"
        - key: has_header
          value: "true"
  
  Data Processing:
    - Type: convertType
      Parameters:
        - key: columns
          value: |
            [
              {"column": "sales_date", "type": "datetime", "format": "yyyy-MM-dd"},
              {"column": "amount", "type": "float"},
              {"column": "quantity", "type": "integer"}
            ]
    
    - Type: filterRows
      Parameters:
        - key: condition
          value: "amount > 0 AND quantity > 0"
  
  Data Output:
    - Type: sql
      Parameters:
        - key: table
          value: "daily_sales"
        - key: mode
          value: "insert"
        - key: batch_size
          value: "1000"
```

## Monitoring and Logging

### Upload Monitoring
```yaml
Monitoring Metrics:
  Upload Success Rate: "> 99%"
  Average Upload Time: "< 10s"
  Concurrent Uploads: "Real-time monitoring"
  Disk Usage Rate: "< 80%"
  Error Rate: "< 1%"
```

### Logging Configuration
```yaml
Logging Configuration:
  Access Logs: "true"        # Record all upload requests
  Error Logs: "true"        # Record upload errors
  Security Logs: "true"     # Record security-related events
  Performance Logs: "true"  # Record performance metrics
  Audit Logs: "true"        # Record important operations
```

## Extension and Customization

### Custom File Processors
```go
// Custom file processor example
type CustomFileProcessor struct {
    // Implement file processing interface
}

func (p *CustomFileProcessor) Process(filePath string) ([]map[string]interface{}, error) {
    // Custom processing logic
}
```

### Plugin Extensions
```yaml
Plugin Configuration:
  File Format Plugins:
    - name: "parquet-processor"
      enabled: "true"
    - name: "avro-processor"
      enabled: "false"
  
  Security Plugins:
    - name: "virus-scanner"
      enabled: "true"
    - name: "malware-detector"
      enabled: "false"
```

## Important Notes

1. **Temporary Nature**: Quickly uploaded files are temporary; use standard file management for important data
2. **Security**: Uploaded files are stored on the server - ensure server security
3. **Performance**: Large numbers of file uploads can affect system performance - configure limits appropriately
4. **Compatibility**: Different file formats may require different parsers
5. **Version Compatibility**: File format version changes may affect parsing results

## Next Steps

After configuring file management functionality, you can:
1. [View Task Execution Results](/task-record) - Check task execution results using uploaded files
2. [Configure Task Scheduling](/task-schedule) - Set up scheduled tasks to automatically process uploaded files
3. [Analyze Logs](/task-log) - View file upload and processing logs
4. [Manage Dependencies](/task-dependency) - Configure task dependencies involving file operations