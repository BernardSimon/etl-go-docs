# Variable Component Development

Variable components read dynamic parameters from a data source.

## Directory Structure

Located in `components/variable/<type>/`.

## Interface Definition

```go
type Variable interface {
    Get(ctx context.Context, config map[string]string, datasource datasource.Datasource) (string, error)
}
```

## Use Cases

- Dynamically query dates, batch numbers, cursors, and other runtime parameters before task execution.
- Referenced in the task JSON using variable syntax; replaced with actual values at runtime.

## Development Key Points

- `Get` must fail fast and support cancellation.
- Return values are unified as strings to avoid disrupting the task parameter structure.
- SQL Variables should only allow `SELECT`; dangerous statements are forbidden.
- If using a data source, the component must internally handle connection availability and closure.

## Development Steps

1. Define parameters in `VariableCreator` (commonly `query`).
2. Validate parameter legality in `Get`.
3. Execute the query and convert the result to a string to return.
4. Handle empty results and SQL errors.
5. Register in `etl/init.go`.

## Example

```go
func VariableCreatorMysql() (name string, variable Variable, datasource *string, params []params.Params) {
    return "mysql", &Variable{}, strPtr("mysql"), []params.Params{
        {Key: "query", Required: true},
    }
}
```

## Registration

```go
factory.RegisterVariable(sqlVariable.VariableCreatorMysql)
```

## Common Error Troubleshooting

### 1. `variable query is required`

- Cause: The `query` parameter is missing from the variable config.

### 2. `variable Should Has SELECT Prefix`

- Cause: The query does not start with `SELECT`.
- Fix: Change to a read-only query; avoid side effects.

### 3. `variable Should Not Contains Dangerous Keywords`

- Cause: The statement contains `INSERT/UPDATE/DELETE/...`.
- Fix: Split the logic; do not perform write operations in the variable stage.

### 4. Variable replacement still causes task failure

- Investigation:
  - Check the replaced parameter value in the task record to see if it matches the target component's format.
  - Check whether the returned string is correctly parsed by the downstream component (e.g. number, JSON string).
