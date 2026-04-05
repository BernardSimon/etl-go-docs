# Data Processing

ETL-GO provides built-in data processing components for cleansing and transforming data.

## Supported Processors

- `convertType`: Column type conversion
- `filterRows`: Row filtering
- `maskData`: Data masking
- `renameColumn`: Column renaming
- `selectColumns`: Column selection

## Processor Parameter Reference

### convertType
Converts a specified column to a target type.

- `column`: Target column
- `type`: Target type (`int|float|string|bool`)

### filterRows
Filters rows based on a condition. Commonly used to remove blank rows or apply business rules.

- `column`
- `operator` (`= != > >= < <=`)
- `value`

### maskData
Masks sensitive fields, e.g. via hashing or partial redaction.

- `column`
- `method` (`md5|sha256`)

### renameColumn
Renames a column to prepare for Sink writing to a target field.

- `mapping`: JSON object string, e.g. `{"old":"new"}`

### selectColumns
Selects only the specified columns from the dataset to reduce transfer and write cost.

- `columns`: JSON array string, e.g. `["id","name"]`

## Combination Recommendations

- Use `selectColumns` first to reduce fields
- Then use `convertType` to normalize types
- Finally use `maskData` or `renameColumn` to complete cleansing

## Common Error Troubleshooting

### 1. `selectColumns processor: 'columns' must be an array of strings`

- `columns` is not a valid JSON array string.

### 2. `renameColumn processor: 'mapping' must be a map`

- `mapping` is not a valid JSON object string.

### 3. `unsupported target type` / `failed to convert value`

- The `convertType` target type is not supported, or the source value cannot be converted.

### 4. Processor causes entire task to fail

- Any Processor returning an error triggers full-pipeline cancellation.
- If the intent is to "skip abnormal records", return `(nil, nil)` instead of an error.
