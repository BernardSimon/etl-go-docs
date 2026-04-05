# Data Output Component Development

Sink components handle the final write to the target data storage.

## Directory Structure

Located in `components/sinks/<type>/`.

## Interface Definition

```go
type Sink interface {
    Open(ctx context.Context, config map[string]string, columnMapping map[string]string, dataSource datasource.Datasource) error
    Write(ctx context.Context, id string, records []record.Record) error
    Close() error
}
```

## Development Key Points

- `Open` handles parameter validation, data source binding, and pre-building write context.
- `Write` receives a batch of records and ensures batch writing is idempotent and cancellable.
- `columnMapping` is the field mapping computed by the Source/Processor chain; Sink must write according to the mapping.
- When processing an empty batch, return `nil` directly to avoid unnecessary requests/transactions.

## Development Steps

1. Define `SinkCreator`, declaring parameters and dependent data source.
2. In `Open`, parse the config and check required fields (e.g. table name, URL).
3. In `Write`, implement batch write logic.
4. On error, prefix with `sink type` for easier log location.
5. In `Close`, release connection or client resources.
6. Register in `etl/init.go`.

## Example: SQL Sink

```go
func SinkCreatorMysql() (name string, sink Sink, datasource *string, params []params.Params) {
    return "mysql", &Sink{}, strPtr("mysql"), []params.Params{
        {Key: "table", Required: true},
    }
}
```

## Parameter Specification Recommendations

- SQL Sink: `table` is required.
- HTTP Sink: recommended `url/method/headers/auth_type/auth_value/body_template/send_mode`.
- File output Sink: recommended explicit parameters like `file_name`, `delimiter`, `encoding`.

## Registration

```go
factory.RegisterSink(sqlSink.SinkCreatorMysql)
```

## Common Error Troubleshooting

### 1. `column_mapping cannot be empty`

- Cause: Source returned no columns or Processor column handling is abnormal.
- Fix: Check Source `Column` and Processor `HandleColumns`.

### 2. `database connection is not available`

- Cause: Datasource not correctly bound, or datasource initialization failed.
- Fix: Check the `data_source` in the task config and the component's dependency type.

### 3. Batch write failure

- SQL scenario: Check that target table fields match `column_mapping`.
- HTTP scenario: Check that the request body template can correctly render JSON.
