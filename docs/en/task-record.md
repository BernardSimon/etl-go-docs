# View Task Execution Status

Task execution records contain run status, start/end time, messages, and output files.

## Record Contents

- Task name
- Execution status: `running` / `success` / `failed`
- Start time / End time
- Run log excerpt
- Associated output files

Status code reference:

- `0`: Running
- `1`: Execution successful
- `2`: Execution failed or aborted

## Common Operations

- View execution details
- Cancel a running task
- Download task output files
- View run parameters

## Recommended Troubleshooting Path

1. Check the record status and message first.
2. Review the parameter snapshot for that record (to confirm variable replacement results).
3. Finally, check detailed logs to locate component-level errors.

## Common Issues

### 1. Record status stays at "Running"

- Possible cause: Source/HTTP request has not ended.
- Try manually canceling and check where the logs last stopped.

### 2. Status shows failed but message is not detailed enough

- Open the task log details to view the full error stack.

### 3. Still shows "Running" after cancellation

- Cancellation takes effect asynchronously; wait and refresh the status.
