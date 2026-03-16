# Data Source Configuration

Data sources are configurations in ETL-GO used to connect to external databases or file systems. You can configure multiple data sources in the system and reference them in tasks.

## Supported Data Source Types

ETL-GO currently supports the following data source types:

| Type | Description | Use Cases |
|------|-------------|-----------|
| **MySQL** | MySQL database connection | Relational database data extraction and loading |
| **PostgreSQL** | PostgreSQL database connection | Relational database data extraction and loading |
| **SQLite** | SQLite database connection | Lightweight local database |
| **Doris** | Apache Doris database connection | Large-scale data analytics scenarios |

## Creating Data Sources

### Creating via Web Interface

1. Log in to the ETL-GO Web interface (default address: `http://localhost:8081`)
2. Click "Data Source Management" in the left navigation bar
3. Click the "New Data Source" button
4. Select the data source type and fill in configuration information
5. Click "Test Connection" to verify the configuration is correct
6. Click "Save"

### Configuration Parameters

#### MySQL Data Source Configuration

```yaml
# Basic configuration
host: localhost      # Database host address
port: 3306          # Database port
user: root          # Database username
password: password  # Database password
database: test_db   # Database name

# Advanced configuration (optional)
charset: utf8mb4    # Character set
timeout: 10s        # Connection timeout
max_open_conns: 10  # Maximum number of connections
max_idle_conns: 5   # Maximum number of idle connections
```

#### PostgreSQL Data Source Configuration

```yaml
host: localhost
port: 5432
user: postgres
password: password
database: test_db
sslmode: disable    # SSL mode (disable/require/verify-full)
```

#### SQLite Data Source Configuration

```yaml
path: /path/to/database.db  # Database file path
```

#### Doris Data Source Configuration

```yaml
host: localhost
port: 9030
user: admin
password: password
database: test_db
```

## Data Source Management

### Viewing Data Source List
On the "Data Source Management" page, you can view all configured data sources, including:
- Data source name
- Data source type
- Connection status
- Last modified time

### Editing Data Sources
Click the "Edit" button in the data source list to modify data source configuration.

### Deleting Data Sources
Click the "Delete" button in the data source list to delete data sources that are no longer needed.

**Note**: When deleting a data source, make sure no tasks are currently referencing it.

### Testing Connections
When creating or editing a data source, you can click the "Test Connection" button to verify the configuration.

## Using Data Sources in Tasks

Configured data sources can be used in the following task components:

### 1. Data Input (Source)
In SQL query type data input, you can select configured data sources:
```sql
SELECT * FROM users WHERE created_at > '2024-01-01'
```

### 2. Data Output (Sink)
In SQL table type data output, you can select target data sources:
```sql
INSERT INTO target_table (column1, column2) VALUES (?, ?)
```

### 3. Executor (Executor)
When executing SQL scripts, you can select the data source to execute on.

### 4. Variables (Variable)
In SQL query variables, you can select the data source to query.

## Best Practices

### 1. Naming Conventions
It is recommended to use meaningful names for data sources, such as:
- `prod_mysql_order_db` - Production environment order database
- `dev_postgres_log_db` - Development environment log database

### 2. Environment Isolation
It is recommended to configure different data sources for different environments:
- Development environment
- Test environment  
- Production environment

### 3. Permission Control
- Production environment databases should use read-only accounts as data sources
- Use accounts with write permissions when outputting data to production environments

### 4. Connection Pool Optimization
- Adjust maximum connections based on business load
- Set reasonable connection timeout values

## Troubleshooting

### Common Issues

#### 1. Connection Failure
**Possible causes**:
- Network unreachable
- Database service not started
- Incorrect username/password
- Firewall restrictions

**Solutions**:
- Check network connectivity
- Confirm database service status
- Verify login credentials
- Check firewall configuration

#### 2. Connection Timeout
**Possible causes**:
- High network latency
- Database overload
- Improper connection pool configuration

**Solutions**:
- Increase connection timeout
- Optimize database performance
- Adjust connection pool parameters

#### 3. Insufficient Permissions
**Possible causes**:
- Account lacks necessary permissions
- IP address not authorized

**Solutions**:
- Check database account permissions
- Configure IP whitelist

## API Reference

### Create Data Source
```http
POST /api/dataSource
Content-Type: application/json

{
  "name": "Production MySQL",
  "type": "mysql",
  "data": {
    "host": "localhost",
    "port": "3306",
    "user": "etl_user",
    "password": "secure_password",
    "database": "production_db"
  },
  "edit": "true"
}
```

### Get Data Source List
```http
GET /api/dataSource/list
```

### Delete Data Source
```http
DELETE /api/dataSource
Content-Type: application/json

{
  "id": "datasource_123"
}
```

## Next Steps

After configuring data sources, you can:
1. [Create Variable Configuration](/variable) - Define dynamic query parameters
2. [Create Tasks](/task) - Configure complete data processing workflows
3. [Set Task Scheduling](/task-schedule) - Automate task execution