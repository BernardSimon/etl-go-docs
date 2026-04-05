# Code Architecture

ETL-GO's core architecture consists of three layers:

## 1. Component Layer

The `components/` directory contains all built-in components:

- `datasource`: Database connection information
- `sources`: Data reading components
- `processors`: Data transformation components
- `sinks`: Data writing components
- `executor`: Pre/post task SQL execution components
- `variable`: Variable query components

## 2. Engine Layer

The `etl/` directory contains core interfaces and the execution engine:

- `etl/core`: Defines `Source`, `Processor`, `Sink`, `Executor`, `Variable`, `Datasource` interfaces
- `etl/factory`: Component registration and creation factory
- `etl/pipeline`: Concurrent execution engine and message passing

## 3. Service Layer

The `server/` directory implements runtime services:

- `config`: Configuration loading
- `model`: GORM data models
- `api`: REST API handlers
- `router`: Route registration
- `task`: Task scheduling and execution management

## Startup Flow Overview

After `main.go` starts:

1. Load configuration
2. Initialize database
3. Register components
4. Start Web and API servers
5. Start scheduled task scheduler

## Core Runtime Chain (Refactored Version)

### 1. Task Assembly Layer (`server/task`)

- Parses Source / Processors / Sink / Executor configurations from the task JSON structure.
- Uses `factory.Create*` to dynamically create component instances by `type`.
- Converts parameter lists to `map[string]string` via `buildConfig`.
- Initializes data sources on demand with type-matching validation.

### 2. Engine Layer (`etl/pipeline`)

- Sequentially executes `Open`: Before Executor -> Source -> Processors -> Sink.
- Runs concurrently at runtime: Source reads, Processor chain processes, Sink batch writes.
- On error, triggers `context cancel` for fast full-pipeline shutdown.
- On exit, uniformly calls `Close` and handles output file archiving.

### 3. API Layer (`server/api`)

- All routes go through `/api/v1`.
- Parameter validation failures return structured error fields.
- Component metadata endpoint `/api/v1/components` can be used directly for frontend form rendering.

## Key Design Points (Post-Refactor)

- Factory registration is concurrency-safe; type lists are output in stable lexicographic order.
- Source / Processor / Sink / Executor / Variable all support `context.Context`.
- Blocking SQL / HTTP operations support cancellation propagation.
- Data sources support shared leases to prevent early connection closure when reused by multiple components.
- Parameter metadata supports type inference (`text/number/password/file/textarea`).

## Troubleshooting Tips

- "Task can be created but fails at runtime": Check the assembly logic and error returns in `server/task/task.go`.
- "Component parameter set but has no effect": Check whether the component's `Open` reads the same-name key.
- "Concurrent execution anomaly": Check channel size and error propagation in `etl/pipeline/engine.go`.
- "Component list missing": Check whether `etl/init.go` has completed registration and whether a fatal occurred at startup.
