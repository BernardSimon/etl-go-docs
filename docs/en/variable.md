# Variable Configuration

ETL-GO currently supports SQL variables, which read dynamic parameters from a database.

Supported data source types:

- MySQL
- PostgreSQL
- SQLite

## Variable Use Cases

Variables are resolved before task execution and replace values in task parameters. Common uses:

- Date partition parameters
- Incremental cursors
- Run batch numbers
- Dynamic SQL conditions

## How It Works

1. Select a database data source in the variable configuration
2. Write a SQL query statement
3. The variable executes and returns the result to the task parameters

## Parameter Reference

- `query`: Required; must be a `SELECT` statement

## Examples (Recommended)

Return a single value:

```sql
SELECT max(updated_at) FROM order_table
```

Return a string value:

```sql
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d')
```

## Notes

- Variable SQL should return a single row and single column to avoid ambiguity.
- Write operations (`INSERT/UPDATE/DELETE/...`) are forbidden in the variable stage.
- Slow variable queries will directly increase task startup time.

## Common Error Troubleshooting

### 1. `variable query is required`

- The `query` parameter is not configured.

### 2. `variable Should Has SELECT Prefix`

- The SQL does not start with `SELECT`.

### 3. `variable Should Not Contains Dangerous Keywords`

- The SQL contains dangerous keywords and was blocked by the security check.

### 4. Variable replacement still causes parameter errors

- The replacement value may be empty or in a format that doesn't match the downstream component's requirements. Check the replaced parameter content in the task record.
