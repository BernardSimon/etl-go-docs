# Executor Component Development

Executor components run SQL statements or other preparation/cleanup logic before and after a task.

## Directory Structure

Located in `components/executor/<type>/`.

## Interface Definition

```go
type Executor interface {
    Open(ctx context.Context, config map[string]string, dataSource datasource.Datasource) error
    Close() error
}
```

## Execution Timing

- `Before Executor`: Runs before Source opens; commonly used for temporary table preparation and session parameter setup.
- `After Executor`: Runs after data writing completes; commonly used for cleanup or summary SQL.

## Development Key Points

- Must support `context` cancellation.
- For SQL executors, it is recommended to perform security validation to restrict dangerous statements.
- `Close` should be safe to call multiple times.
- Error messages should include execution stage information (before/after).

## Development Steps

1. Implement `ExecutorCreator` and declare parameters.
2. Parse SQL/script parameters in `Open`.
3. Obtain a connection from `datasource` and execute.
4. Release resources in `Close`.
5. Register in `etl/init.go`.

## Example

```go
func ExecutorCreatorMysql() (name string, executor Executor, datasource *string, params []params.Params) {
    return "mysql", &Executor{}, strPtr("mysql"), []params.Params{
        {Key: "sql", Required: true},
    }
}
```

## Registration

```go
factory.RegisterExecutor(sqlExecutor.ExecutorCreatorMysql)
```

## Parameter Recommendations

- `sql`: The statement to execute; required.
- `allow_dangerous`: Whether to allow dangerous statements (boolean string, default `false`).

## Common Error Troubleshooting

### 1. `config is missing or has invalid 'sql'`

- Cause: Task parameter is missing or the key is misspelled.

### 2. SQL security validation failure

- Cause: The statement is deemed a dangerous operation.
- Fix: Adjust the SQL, or explicitly allow dangerous statements (recommended only in test environments).

### 3. `datasource is required`

- Cause: This executor requires a database connection, but the task config does not bind a data source.
