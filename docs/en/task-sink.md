# Data Output

ETL-GO supports the following output components:

- SQL Sink (MySQL / PostgreSQL / SQLite)
- CSV Sink
- JSON Sink
- Doris Sink
- HTTP Sink

## SQL Sink

Writes processed results to a database table. Suitable for data synchronization and data warehouse loading.

Parameters:

- `table` (required): Target table name

## CSV Sink / JSON Sink

Exports results as files. Suitable for data backup, download, or handoff to downstream systems.

Parameters:

- `file_name` (required)
- `file_ext` (CSV default `csv`, JSON default `json`)

## Doris Sink

Writes data to Apache Doris. Typical use case is loading into a target analytics warehouse.

Parameters:

- `table` (required)
- `host/port/user/password/database` must be provided in the data source

## HTTP Sink

Pushes results to an external HTTP endpoint. Suitable for real-time API integration.

Common parameters:

- `url` (required)
- `method` (default `POST`)
- `headers` (JSON string)
- `auth_type` (`none|bearer|basic|api_key`)
- `auth_value`
- `api_key_name` (default `X-API-Key`)
- `body_template`
- `send_mode` (`batch|single`)

## Selection Recommendations

- Target is a database: prefer SQL Sink
- Target is file storage: use CSV / JSON Sink
- Target is an analytics system: use Doris Sink
- Target is an API: use HTTP Sink

## Common Error Troubleshooting

### 1. `column_mapping cannot be empty`

- Upstream field info is empty. Check Source/Processor column handling logic.

### 2. `config is missing required key 'table'`

- SQL/Doris Sink table name is not configured.

### 3. HTTP Sink reports template parsing error

- `body_template` syntax is invalid. Start with the smallest template to validate.

### 4. File output succeeds but no results

- Upstream may have filtered all records. Check Processor configuration.
