# Data Source Component Development

Data source components describe connection information and provide connection entry points for other components.

## Directory Structure

Each data source component is located in `components/datasource/<type>/`.

## Interface Definition

```go
type Datasource interface {
    Init(map[string]string) error
    Close() error
}
```

For database-type data sources, it is recommended to also implement:

```go
type SQLDBProvider interface {
    DB() *sql.DB
}
```

This allows Source/Sink/Executor/Variable to obtain connection pools via a unified helper method.

## Development Steps

1. Create directory `components/datasource/<name>/`.
2. Define a `DataSource` struct holding a connection object (e.g. `*sql.DB`).
3. Implement `DatasourceCreator` to return the type name and parameter definitions.
4. In `Init`, parse parameters and establish the connection; always run a health check (e.g. `Ping`).
5. In `Close`, release resources.
6. Register in `etl/init.go`.

## Example: MySQL Data Source

```go
func DatasourceCreator() (name string, datasource Datasource, params []params.Params) {
    return "mysql", &DataSource{}, []params.Params{
        {Key: "host", Required: true},
        {Key: "port", Required: true, DefaultValue: "3306"},
        {Key: "user", Required: true},
        {Key: "password", Required: true},
        {Key: "database", Required: true},
    }
}
```

## Parameter Design Recommendations

- Use lowercase keys consistently: `host/port/user/password/database`.
- Provide a default value for `port` to avoid empty values from the frontend.
- Parameter keys containing `password` allow the frontend to infer them as password inputs.
- Include context in error messages, e.g. `sql executor: failed to connect to database`.

## Registration

In `etl/init.go`:

```go
factory.RegisterDataSource(mysqlDatasource.DatasourceCreator)
```

## Common Error Troubleshooting

### 1. `Data source type mismatch`

- Trigger point: task assembly stage (`server/task/component.go`).
- Cause: The `type` of the data source referenced by the task does not match the component declaration.

### 2. `datasource 'xxx' ... has not been registered`

- Trigger point: startup registration stage.
- Cause: Incorrect registration order, or the Source/Sink dependency name is misspelled.

### 3. Connection initializes successfully but fails at runtime

- Investigation:
  - Check whether `Init` only called `sql.Open` without `Ping`.
  - Check whether connection parameters were overridden with invalid values by variable replacement.
