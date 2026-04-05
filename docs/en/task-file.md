# File Management

ETL-GO treats files as platform assets that can be reused in task configurations.

## File Upload

Go to the File Management page to upload CSV / JSON and other task files.

## File Usage

In task configuration, file-type parameters can reference uploaded files without manually entering file IDs.

Typical parameters:

- `file_id`: Single file input
- `file_ids`: Multi-file input

## File Types

- CSV files
- JSON files
- SQLite database files
- Other text files

## Runtime Behavior

- File-type parameters are resolved to `file_path` before the task runs.
- Source/Sink actually reads the resolved absolute file path.
- Output files are linked to the task record for downloading and auditing.

## Usage Recommendations

- After uploading a data file, first test whether Source parses it correctly
- Use file assets to reduce repeated uploads and path management overhead

## Common Error Troubleshooting

### 1. `config is missing required key 'file_path'`

- `file_id` is invalid or the file has been deleted, causing runtime resolution failure.

### 2. CSV/JSON Source read failure

- File content format is invalid (inconsistent column counts, JSON top-level is not an array, etc.).

### 3. Output file not found

- Check whether the task record shows an execution failure; failed tasks may only retain the error context.
