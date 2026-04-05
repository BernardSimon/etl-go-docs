# Data Processing Component Development

Processor components process the data stream row by row.

## Directory Structure

Located in `components/processors/<type>/`.

## Interface Definition

```go
type Processor interface {
    Open(ctx context.Context, config map[string]string) error
    Process(ctx context.Context, record record.Record) (record.Record, error)
    Close() error
    HandleColumns(columns *map[string]string)
}
```

## Development Key Points

- `Process` takes one record as input and outputs one record or `nil` (to filter it out).
- `HandleColumns` is used to adjust field mappings before execution.
- Stateless processors can make `Close` a no-op.
- All logic should be cancellable; check `ctx.Err()` first.

## Development Steps

1. Define the type name and parameters in `ProcessorCreator`.
2. Parse parameters and validate operators or rules in `Open`.
3. Process the record in `Process` and return the transformed `record`.
4. If the processor adds, removes, or renames fields, update column info in `HandleColumns` accordingly.
5. Register in `etl/init.go`.

## Example: convertType

```go
func ProcessorCreator() (name string, processor Processor, params []params.Params) {
    return "convertType", &Processor{}, []params.Params{
        {Key: "column", Required: true},
        {Key: "target_type", Required: true},
    }
}
```

## Parameter Design Recommendations

- Filter-type parameters: `column/operator/value`.
- Column selection parameters: `columns`, value as a JSON array string.
- Mapping parameters: `mapping`, value as a JSON object string.
- When JSON parameter parsing fails, return the original error context.

## Registration

```go
factory.RegisterProcessor(convertTypeProcessor.ProcessorCreator)
```

## Common Error Troubleshooting

### 1. Condition filtering anomaly (all pass or all filtered)

- Check whether `operator` supports the current type.
- Check the number/string conversion logic for `value`.

### 2. Processor error causes entire task to fail

- A Processor returning an error triggers engine cancellation.
- If certain abnormal records should be skipped, return `(nil, nil)` instead of an error.

### 3. Sink is missing fields

- Cause: `HandleColumns` did not sync field changes.
- Fix: Update the column mapping in `HandleColumns` to be consistent with `Process`.
