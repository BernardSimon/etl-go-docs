# Task Scheduling and Execution

ETL-GO supports both manual execution and Cron scheduling.

## Task Types

- `manual`: Manually triggered task
- Cron expression: Scheduled task, e.g. `0 0 * * *`.

Note: The backend uses standard Cron parsing (5-segment format).

## Creating a Scheduled Task

1. Go to the task creation page
2. Fill in the `Cron` expression
3. After saving, the task is automatically registered with the scheduler

## Manual Execution

Manual tasks can be triggered directly by clicking "Run Now".

## Canceling Execution

While a task is running, it can be canceled from the task record page.

## Scheduling Status Reference

- `status=1`: Task has been added to the scheduler
- `is_running=true`: Task is currently executing

## Notes

- `manual` tasks cannot be registered as automatic scheduled tasks
- Cron expressions must conform to standard format
- If the same task is still running, the new cycle will be skipped and retried next time

## Common Error Troubleshooting

### 1. `manual task cannot be scheduled`

- Task `cron` is `manual`; the scheduling API cannot be called for it.

### 2. `invalid cron expression`

- Cron format is invalid; fix and save again.

### 3. Task shows as scheduled but not actually executing

- Check if the task is stuck at `is_running=true`.
- Check whether the previous execution is still blocked and not finished.
