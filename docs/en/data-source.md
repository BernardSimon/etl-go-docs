# Data Source Configuration

ETL-GO's built-in database data source types include:

- MySQL
- PostgreSQL
- SQLite
- Doris

## Data Source Role and Boundaries

- Data sources manage connection parameters and provide connections for reuse by `Source/Sink/Executor/Variable`.
- A single task can share the same data source connection, reducing redundant connection creation.
- Data sources do not execute business logic — they only handle connection initialization and lifecycle.

## Common Fields

- `name`: Data source name
- `type`: Data source type, e.g. `mysql`, `postgre`, `sqlite`, `doris`
- `host` / `port`: Service address
- `user` / `password`: Login credentials
- `database`: Database name

## Minimum Configuration per Type

### MySQL

- `host`
- `port` (default `3306`)
- `user`
- `password`
- `database`

### PostgreSQL

- `host`
- `port`
- `user`
- `password`
- `database`

### SQLite

- `path` (file path)

### Doris

- `host`
- `port`
- `user`
- `password`
- `database`

## Use Cases

- SQL Source reads from database
- SQL Sink writes data back to database
- Executor runs pre/post SQL statements
- Variable reads dynamic parameters from database

## Best Practices

- Create separate data sources for "source database" and "target database" to avoid config confusion.
- Name data sources to include environment and purpose, e.g. `prod_mysql_read`.
- When a task uses multiple databases simultaneously, configure different data source names for each.
- `Doris` is primarily used on the Sink side for Stream Load.

## Common Error Troubleshooting

### 1. `Data source does not exist`

- The `data_source` ID referenced in the task is invalid or has been deleted.

### 2. `Data source type mismatch`

- For example, SQL Sink expects `mysql`, but the task is bound to a `postgre` data source.

### 3. Connection failure / timeout

- Check network connectivity, firewall rules, account permissions, and database name spelling.
