# Data Input Component Development

Data input components read raw data from external sources and send it to the pipeline.

## Directory Structure

Located in `components/sources/<type>/`.

## Interface Definition

```go
type Source interface {
    Column() map[string]string
    Open(ctx context.Context, config map[string]string, dataSource datasource.Datasource) error
    Read(ctx context.Context) (record.Record, error)
    Close() error
}
```

## Development Key Points

- `Open` handles config parsing and connection preparation; it does not perform infinite-loop reading.
- `Read` returns one `record.Record` per call; returns `io.EOF` when done.
- `Column` returns the initial mapping from source fields to output fields.
- Use `ctx` to support cancellation; avoid long queries or requests that cannot be terminated.
- If there is a data source dependency, return the `datasource` name in the Creator; otherwise return `nil`.

## Development Steps

1. Create a `Source` struct to hold connection state and intermediate buffers.
2. Define parameter metadata in `SourceCreator`.
3. Validate required parameters and initialize state in `Open`.
4. Implement row-by-row reading and EOF semantics in `Read`.
5. Release resources in `Close`.
6. Complete registration in `etl/init.go`.

## Example: CSV Source

```go
func SourceCreator() (name string, source Source, datasource *string, params []params.Params) {
    return "csv", &Source{}, nil, []params.Params{
        {Key: "file_id", Required: true},
        {Key: "delimiter", Required: false, DefaultValue: ","},
    }
}
```

## Parameter Specification Recommendations

- SQL Source: use `query` as the query statement parameter name.
- HTTP Source: recommended `url/method/headers/body/pagination_type/page_size/data_path`.
- File Source: recommended `file_id` (single file) or `file_ids` (multiple files).
- Keep parameter names stable to avoid breaking historical task configurations.

## Registration

```go
factory.RegisterSource(csvSource.SourceCreator)
```

## Common Error Troubleshooting

### 1. `factory error: no source registered with name: xxx`

- Cause: The `source.type` in the task does not match the registered name, or registration was missed.

### 2. `config is missing required key 'query'/'url'`

- Cause: Parameter key does not match the key the component reads, or the frontend did not submit the parameter.

### 3. Execution cannot be stopped

- Cause: `Read` does not check `ctx.Err()` internally; blocking calls do not use the context-aware API version.

### 4. Field mapping anomaly

- Cause: `Column()` returns empty or field names are unstable.
- Recommendation: Determine the field set during the `Open` phase and return a stable mapping from `Column`.
