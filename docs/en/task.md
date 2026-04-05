# Task Configuration

An ETL-GO task consists of the following modules:

- `Before Executor`: Pre-task SQL execution
- `Source`: Read data source
- `Processors`: Data processing chain
- `Sink`: Data output
- `After Executor`: Post-task SQL execution

The execution order is fixed:

`Before Executor -> Source -> Processors -> Sink -> After Executor`

## Creating a Task

1. Log in to the Web console
2. Go to "Task Management"
3. Click "New Task"
4. Fill in task name, type, and Cron configuration
5. Select Source / Processor / Sink / Executor

## Task Parameter Structure (Core)

The core structure of task `params` is as follows:

```json
{
  "before_execute": {"type":"mysql","data_source":"<id>","params":[{"key":"sql","value":"..."}]},
  "source": {"type":"mysql","data_source":"<id>","params":[{"key":"query","value":"SELECT ..."}]},
  "processors": [{"type":"filterRows","params":[{"key":"column","value":"id"},{"key":"operator","value":">"},{"key":"value","value":"0"}]}],
  "sink": {"type":"mysql","data_source":"<id>","params":[{"key":"table","value":"target_table"}]},
  "after_execute": {"type":"mysql","data_source":"<id>","params":[{"key":"sql","value":"..."}]}
}
```

API field mapping:

- `mission_name`: Task name (displayed as "Task Name" in UI)
- `tasktypes`: Task type filter field (used for `manual/scheduled` queries)
- `params`: Structured task configuration (contains `source/processors/sink/...`)

## Task Templates

Tasks can be saved as templates for easy reuse of existing configurations.

## Task Status

Tasks support the following execution modes:

- `manual`: Manually triggered
- Cron expression: Scheduled execution

## Recommended Task Creation Order

- First verify that Source reads data correctly
- Then add Processors for data cleansing
- Finally confirm Sink output target is writable

## Status Reference

- Task status:
  - `0` Draft
  - `1` Scheduled
  - `2` Error or paused
- Task record status:
  - `0` Running
  - `1` Success
  - `2` Failed/aborted

## Common Errors

### 1. `factory error: no ... registered with name`

- The `type` field does not match a registered component name.

### 2. Task saves but fails immediately on run

- A required parameter of some component is missing, or the bound data source type is wrong.
- It is recommended to call `/api/v1/components` first to verify parameter keys.
