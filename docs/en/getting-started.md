# Getting Started

Welcome to ETL-GO! This guide will help you quickly understand and start using ETL-GO for data integration and ETL task management.

## What is ETL-GO?

ETL-GO is an open-source data integration tool focused on automating and simplifying the Extract, Transform, Load (ETL) process. It provides a visual configuration interface that allows you to quickly create and manage complex data processing tasks.

### Core Features

- **Out-of-the-box**: No complex configuration required, download and use
- **Visual Interface**: Web interface for task configuration and monitoring
- **Multiple Data Source Support**: MySQL, PostgreSQL, SQLite, Doris, CSV, JSON, etc.
- **Plugin Architecture**: Easy to extend, supports custom components
- **Task Scheduling**: Supports scheduled tasks and manual triggering
- **File Management**: Built-in file upload and management functionality

## System Requirements

### Hardware Requirements
- **Memory**: Minimum 512MB RAM (recommended 1GB)
- **Storage**: Minimum 100MB available disk space
- **Network**: Network connectivity to data sources and targets

### Software Requirements
- **Operating System**: Windows, Linux, macOS
- **Runtime Environment**: Go 1.18+ (only required for compilation)
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+

### Data Source Requirements
- MySQL 5.7+
- PostgreSQL 10+
- SQLite 3.x
- Doris 1.x

## Installation Methods

### Method 1: Using Pre-compiled Packages (Recommended)

1. **Download Latest Version**
   - Visit [GitHub Releases](https://github.com/BernardSimon/etl-go/releases)
   - Download the pre-compiled package for your operating system

2. **Installation Steps for Different Systems**

**Linux/macOS:**
```bash
# Download
wget https://github.com/BernardSimon/etl-go/releases/download/v1.0.0/etl-go-linux-amd64.tar.gz

# Extract
tar -zxvf etl-go-linux-amd64.tar.gz

# Enter directory
cd etl-go-linux-amd64

# Run
./etl-go
```

**Windows:**
1. Download `etl-go-windows-amd64.zip`
2. Extract to any directory
3. Double-click `etl-go.exe` to run

### Method 2: Compile from Source

If you need specific features or custom modifications, you can compile from source:

```bash
# Clone repository
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# Install dependencies
go mod download

# Build
go build -o etl-go main.go

# Run
./etl-go
```

### Method 3: Docker Run

```bash
# Pull image
docker pull bernardsimon/etl-go:latest

# Run container
docker run -d \
  --name etl-go \
  -p 8081:8081 \
  -v /path/to/config:/app/config \
  -v /path/to/data:/app/data \
  bernardsimon/etl-go:latest
```

## First Launch

### Start Application
1. **Linux/macOS:**
   ```bash
   ./etl-go
   ```

2. **Windows:**
   - Double-click `etl-go.exe`
   - Or run `etl-go.exe` in command line

### Verify Running
After starting, you will see output similar to:
```
[INFO] ETL-GO service is starting...
[INFO] Database connection successful
[INFO] Router initialization complete
[INFO] Task scheduler started
[INFO] Service started successfully, listening address: http://localhost:8081
[INFO] Service started successfully, server address: http://localhost:8081
```

### Access Management Interface
Open in browser: `http://localhost:8081`

## Directory Structure

After successful running, the following directory structure will be created:

```
etl-go/
├── etl-go                # Executable file (etl-go.exe on Windows)
├── config.yaml           # Configuration file
├── data.db               # SQLite database file
├── log/                  # Log directory
│   └── app.log          # Application log
├── file/                 # File management directory
│   ├── input/           # Upload file directory
│   └── output/          # Output file directory
└── components/          # Components directory (if custom components exist)
```

## Basic Concepts

### Task
A task is the basic execution unit in ETL-GO, consisting of the following components:

1. **Data Source (Source)**: Data input, such as database queries, file reading
2. **Processor**: Data transformation and processing logic
3. **Data Destination (Sink)**: Data output location, such as database tables, files
4. **Schedule Configuration**: Task execution timing rules

### Component Types

| Component Type | Description | Examples |
|---------------|-------------|----------|
| **Data Source** | Data input components | MySQL query, CSV file reading |
| **Processor** | Data transformation components | Type conversion, data filtering, column renaming |
| **Data Destination** | Data output components | Database writing, file output |
| **Executor** | Execute SQL statements | Data cleanup, table creation |

### Variable System
Supports dynamic variables that can be used in task configuration:
- **System Variables**: Globally available variables
- **SQL Variables**: Variables obtained through SQL queries
- **Task Variables**: Variables generated during task execution

## Create Your First Task

Let's create a simple task that reads data from a CSV file, processes it, and writes it to a database.

### Step 1: Upload Data File

1. Log in to ETL-GO management interface
2. Click left menu "File Management"
3. Click "Upload File" button
4. Select your CSV file (example content below):

**users.csv:**
```csv
id,name,email,status,created_at
1,张三,zhangsan@example.com,active,2024-01-01
2,李四,lisi@example.com,inactive,2024-01-02
3,王五,wangwu@example.com,active,2024-01-03
```

### Step 2: Create Task

1. Click left menu "Task Management"
2. Click "New Task" button
3. Fill in task information:

```yaml
Task Name: "User Data Import"
Task Description: "Import user data from CSV file to database"
Schedule Method: "Manual Execution"
```

### Step 3: Configure Data Source

In task configuration, set up data source:

```yaml
Data Source Type: "CSV File"
File Path: "Select the CSV file uploaded earlier"
Encoding Format: "UTF-8"
Delimiter: ","
Contains Header: "Yes"
```

### Step 4: Add Processor

Add data processing steps:

1. **Data Type Conversion**:
   ```yaml
   Processor Type: "convertType"
   Conversion Rules:
     - Field: "id", Type: "integer"
     - Field: "created_at", Type: "datetime", Format: "yyyy-MM-dd"
   ```

2. **Data Filtering**:
   ```yaml
   Processor Type: "filterRows"
   Filter Condition: "status = 'active'"
   ```

### Step 5: Configure Data Destination

Set up data output:

```yaml
Destination Type: "SQL Table"
Database Connection: "Select your MySQL connection"
Table Name: "users"
Write Mode: "Insert"
Batch Size: "1000"
```

### Step 6: Save and Execute

1. Click "Save" button
2. Return to task list
3. Find the newly created task, click "Execute" button
4. View execution results in "Task Records"

## Configure Data Source Connections

Before starting more tasks, you need to configure data source connections.

### MySQL Connection Configuration

1. Click left menu "Data Source Management"
2. Click "New Data Source"
3. Fill in connection information:

```yaml
Data Source Type: "MySQL"
Connection Name: "Production Database"
Host Address: "localhost"
Port: "3306"
Database Name: "mydb"
Username: "root"
Password: "********"
```

### Test Connection
After configuration, click "Test Connection" to verify the configuration is correct.

## Task Scheduling

ETL-GO supports multiple scheduling methods:

### Scheduled Tasks
Use Cron expressions to configure regular execution:
```yaml
Schedule Method: "Scheduled Task"
Cron Expression: "0 2 * * *"  # Execute daily at 2 AM
```

### Interval Scheduling
Execute at fixed time intervals:
```yaml
Schedule Method: "Interval Scheduling"
Interval Time: "1h"  # Execute every hour
```

### Manual Execution
Execute only when manually triggered:
```yaml
Schedule Method: "Manual Execution"
```

## Monitoring and Logging

### Task Monitoring
- **Real-time Status**: View task execution status
- **Execution History**: View historical execution records
- **Performance Metrics**: View execution time and data processing volume

### Log Viewing
- **Application Logs**: `log/app.log`
- **Task Logs**: Detailed logs for each task execution
- **Error Logs**: Error and exception records

## Common Usage Scenarios

### Scenario 1: Database-to-Database Data Synchronization
```yaml
Task Name: "MySQL to PostgreSQL User Data Sync"
Data Source: MySQL query
Processor: Data cleaning and transformation
Data Destination: PostgreSQL table writing
Schedule: Execute every hour
```

### Scenario 2: File Data Processing
```yaml
Task Name: "CSV File Cleaning and Database Import"
Data Source: CSV file reading
Processor: Data validation, format conversion
Data Destination: SQLite database
Schedule: Trigger on file upload
```

### Scenario 3: Data Report Generation
```yaml
Task Name: "Daily Sales Report"
Data Source: Multiple database joint queries
Processor: Data aggregation, calculations
Data Destination: Excel file generation
Schedule: Execute daily at 1 AM
```

## Troubleshooting

### Common Issues

#### 1. Service Cannot Start
**Possible Causes**:
- Port is occupied
- Configuration file error
- Database connection failure

**Solutions**:
```bash
# Check port occupancy
netstat -tlnp | grep 8081

# Check configuration file
cat config.yaml

# Check logs
tail -f log/app.log
```

#### 2. Task Execution Failure
**Possible Causes**:
- Data source connection failure
- SQL statement error
- File permission issues

**Solutions**:
1. Check data source connection configuration
2. View task execution logs
3. Verify file paths and permissions

#### 3. Performance Issues
**Possible Causes**:
- Too much data volume
- Network latency
- Database performance bottlenecks

**Optimization Suggestions**:
1. Enable batch processing
2. Increase timeout settings
3. Optimize SQL queries

## Next Steps

After successfully creating and running your first task, you can:

1. **Deepen Learning**:
   - [Task Configuration Details](./task.md)
   - [Processor Usage Guide](./task-processor.md)
   - [Schedule Configuration](./task-schedule.md)

2. **Advanced Features**:
   - [Variable System](./variable.md)
   - [File Management](./task-file.md)
   - [Log Analysis](./task-log.md)

3. **Performance Optimization**:
   - [Task Optimization Guide](./task-optimization.md)
   - [Dependency Management](./task-dependency.md)

4. **Extension Development**:
   - [Custom Component Development](./build.md)
   - [API Interface Documentation](./api-reference.md)

## Getting Help

- **Documentation**: View complete [official documentation](https://etl-go.org/docs)
- **GitHub**: [Issue Reporting and Feature Requests](https://github.com/BernardSimon/etl-go/issues)
- **Community**: Join our [Discord Community](https://discord.gg/etl-go)

## Version Compatibility

| ETL-GO Version | Go Version Requirement | Database Compatibility | Main Features |
|---------------|----------------------|----------------------|--------------|
| v1.0.x | Go 1.18+ | MySQL 5.7+, PostgreSQL 10+ | Basic ETL functionality |
| v1.1.x | Go 1.19+ | Added Doris support | Performance optimization |
| v1.2.x | Go 1.20+ | Enhanced SQLite support | Plugin system |

---

**Congratulations!** You have successfully started using ETL-GO. As you become more familiar with the tool, you can explore more advanced features and customization options to build more complex data processing workflows.