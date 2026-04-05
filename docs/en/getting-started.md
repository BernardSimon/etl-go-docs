# Getting Started Guide

ETL-GO is suitable for quickly launching data synchronization and data cleansing tasks.

## 10-Minute Main Workflow

1. Configure system runtime parameters
2. Configure data sources
3. Create a task and select Source / Processor / Sink
4. Execute manually or set up a scheduled task
5. View run results through task records and logs

## Detailed Steps

### 1. Start the Service

```bash
go build -o etl-go .
./etl-go
```

### 2. Log In

- Default username: `admin`
- Default password: `password123`
- It is recommended to change the password immediately after the first login

### 3. Create a Data Source

First create data sources for the source and target databases (e.g., MySQL / PostgreSQL / SQLite).

### 4. Create a Task

Minimum recommended runnable task:

- Source: `sql`, parameter `query=SELECT ...`
- Processors: can be empty initially
- Sink: `sql`, parameter `table=...`
- Cron: `manual`

### 5. Execute Manually and Verify

- Trigger "Run Now"
- Open task records to view status and messages
- Open task logs to view detailed execution

## First Example Task

Source table `users` -> Target table `users_copy`:

1. Source query: `SELECT id,name,email FROM users`
2. Processor (optional): `maskData` to mask `email`
3. Sink write: `users_copy`

## Common Errors

### 1. Task created successfully but execution fails

- Check that the data source bound to Source/Sink is correct.
- Check that parameter keys match the component definition (see `/api/v1/components`).

### 2. Task stays in "Running" state

- Check if Source is not correctly returning EOF.
- Check if external data source requests are blocking (SQL/HTTP timeout).

### 3. Scheduled task not triggering

- Check that the `cron` expression is in standard format.
- Check that the task has entered "Scheduled" status.
