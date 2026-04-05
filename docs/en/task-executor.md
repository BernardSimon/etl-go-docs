# Pre/Post Processors

Executors run pre-task and post-task SQL statements, typically used to prepare environments or write status information.

## Supported Executors

- MySQL
- PostgreSQL
- SQLite

## Use Cases

- Create temporary tables before a task starts
- Clean up old data before Source runs
- Write execution results, archive data, or notify status after the task completes

## Typical Configuration

- `Before Executor`: SQL to execute before the task starts
- `After Executor`: SQL to execute after the task completes

Parameters:

- `sql` (required)
- `allow_dangerous` (optional, default `false`)

## Notes

- Executors do not directly participate in the data flow of the pipeline
- If the pre-task SQL fails, the task will be aborted
- Post-task SQL is typically used for compensation, statistics, or writing back task status

## Common Errors

### 1. `config is missing or has invalid 'sql'`

- SQL is not configured or the key does not match.

### 2. SQL blocked by security validation

- SQL contains dangerous statements and has not been explicitly allowed.

### 3. Data source not bound

- Executors rely on a database data source; the corresponding data source type must be selected.
