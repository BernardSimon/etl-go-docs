# Log Analysis

Task logs help locate failure causes, execution duration, and data errors.

## How to View Logs

1. Open the task record page
2. Select an execution record
3. Click "View Logs"

## Log Sources

- Task run logs: Aggregated by task record, for locating issues in a single execution
- System logs: `config.log.filename` (default `./log/app.log`)

## Common Troubleshooting Directions

- SQL syntax errors
- Data type conversion failures
- Output target connection anomalies
- Network / HTTP request timeouts

## Recommended Troubleshooting Order

1. Identify the failing component (Source/Processor/Sink/Executor).
2. Find the last successful log entry before the error.
3. Cross-reference the task parameter snapshot to confirm whether variable replacement is abnormal.
4. If necessary, reduce data volume for minimal reproduction.

## Optimization Suggestions

- Write error information to task logs whenever possible
- Use `filterRows` and `convertType` to validate data early
- Set reasonable timeouts for HTTP sources and sinks

## Common Issues

### 1. Logs are empty or very sparse

- Task may have failed during the assembly stage. Check the task record message and system logs.

### 2. Only shows `context canceled`

- An upstream component failed first, causing full-pipeline cancellation. Look for the earliest real error.
