# Get Main Program Code

If you are doing secondary development or investigating post-refactor behavior, it is recommended to read the code in the following order rather than reverse-engineering from page functionality.

## Recommended Reading Path (30-Minute Introduction)

1. `main.go`: Startup entry; handles config loading, log initialization, database initialization, router startup, and scheduler startup.
2. `etl/init.go`: Built-in component unified registration; quickly shows the full set of components supported by the platform.
3. `server/router/router.go`: Full REST API route definitions (`/api/v1/*`).
4. `server/task/task.go`: Task assembly and execution main flow.
5. `etl/pipeline/engine.go`: Concurrent pipeline orchestration, error propagation, and resource cleanup.
6. `server/task/component.go`: Component parameter construction and data source initialization (including shared lease).

## Repository Directory Responsibilities

- `main.go`: Service entry point; handles config loading, log/DB/router/scheduler initialization
- `etl/`: Core engine, including component factory and pipeline execution logic
- `components/`: Built-in component implementations
- `server/`: Backend API, models, routing, and task scheduling
- `web/`: Frontend console source code

## Task Execution Call Chain (Post-Refactor)

`RunTask -> Create* (factory) -> initDatasource -> pipeline.NewEngine -> engine.Run`

Key points:

- Variable replacement is performed before task startup (only replaces parameter values, without breaking the JSON structure).
- Components are created by the factory via `type`, avoiding large `switch` blocks.
- The same data source connection can be reused within a single task (shared lease).
- The entire execution chain uses `context.Context` for cancellation propagation.
- Source / Processor / Sink run in a goroutine + channel pipeline.

## Quick File Index for Problem Location

- Component not recognized: `etl/init.go`, `etl/factory/factory.go`
- Task startup failure: `server/task/task.go`
- Data source type error: `server/task/component.go`
- Parameter validity error: Corresponding component implementation directory (e.g. `components/sources/http/source.go`)
- SQL security validation error: `etl/core/security/sql_validator.go`
- Runtime interruption or cancellation: `server/task/runstate.go`, `etl/pipeline/engine.go`

## Pre-Development Self-Check Commands

```bash
# View core directory structure
find . -maxdepth 2 -type d | sort

# Check for local changes (avoid false debugging conclusions)
git status --short

# Run backend tests
go test ./...
```
