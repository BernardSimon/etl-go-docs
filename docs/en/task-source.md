# Data Input

ETL-GO supports the following data input types:

- SQL Source (MySQL / PostgreSQL / SQLite)
- CSV Source
- JSON Source
- HTTP Source

## SQL Source

SQL Source reads data from a database and passes the results to the processing chain.

Supported database types: MySQL, PostgreSQL, SQLite.

Parameters:

- `query` (required): Only `SELECT` queries are allowed

## CSV Source

CSV Source reads data from an uploaded CSV file.

Parameters:

- `file_id` (required): Uploaded file ID
- `delimiter` (default `,`): Delimiter character
- `has_header` (default `true`): Whether the file has a header row

## JSON Source

JSON Source reads data from an uploaded JSON file.

Parameters:

- `file_id` (required): Uploaded file ID
- `keys_sample_rows` (default `100`): Number of sample rows used to infer the field set

## HTTP Source

HTTP Source pulls data via a REST interface, suitable for remote data sources.

Common parameters:

- `url` (required)
- `method` (default `GET`)
- `headers` (JSON string)
- `body` (POST request body)
- `pagination_type`: `none|offset|page|cursor`
- `page_size` (default `100`)
- `cursor_field` (default `next_cursor`)
- `data_path` (e.g. `data.items`)

## Selection Strategy

- Structured database data: prefer SQL Source
- Bulk file import: use CSV/JSON Source
- Web API data: use HTTP Source

## Common Error Troubleshooting

### 1. `config is missing required key 'query'/'url'`

- The corresponding parameter is not configured or the key is misspelled.

### 2. CSV column count mismatch error

- A row in the file has a different column count than the header. Pre-clean the source file.

### 3. JSON file format error

- JSON Source expects the top-level element to be an array `[]`; JSONL is not supported.

### 4. HTTP Source pagination is incomplete

- Check that `pagination_type` matches the API protocol.
- Check that `data_path` correctly points to the array node.
