# Component Development Conventions

ETL-GO component development uses unified interfaces and a factory registration mechanism.

## Component Types

- `Datasource`: Provides database or connection information
- `Source`: Reads data
- `Processor`: Processes data rows
- `Sink`: Writes results
- `Executor`: Executes pre/post SQL
- `Variable`: Reads task parameters

## Interface Contracts

All component interfaces are defined in `etl/core`. When developing a new component, you must implement the corresponding interface and provide a `Creator` function that returns component metadata.

## Creator Pattern

Creator functions return:

- `name`: Component type name (the `type` field in the task JSON)
- `instance`: Interface implementation object
- `datasource`: Optional; dependent data source type
- `params`: Parameter definitions (used for frontend automatic form rendering)

```go
type SourceCreator func() (name string, source Source, datasource *string, params []params.Params)
```

Common `params.Params` fields:

- `Key`: Parameter key (used by the component's `Open`/`Get`)
- `Required`: Whether required
- `DefaultValue`: Default value
- `Description`: Parameter description

The server side will infer `Type/Placeholder/Example` to enhance the UI experience.

## Component Naming Conventions

- Type names should be lowercase and semantically clear, e.g. `mysql`, `filterRows`, `http`.
- No duplicate names within the same component type; registration will fail with a duplicate error.
- If you need to reuse an implementation for different dialects, use multiple Creators (e.g. mysql/postgre/sqlite).

## Context Conventions (Refactoring Focus)

- All blocking logic must check `ctx.Err()` first.
- Database requests use `QueryContext` / `ExecContext`.
- HTTP requests use `NewRequestWithContext`.
- On error, return errors with a component-prefix for easier location, e.g. `sql sink: ...`.

## Resource Lifecycle Conventions

- Initialization goes in `Open`.
- Core processing goes in `Read/Process/Write/Get`.
- Resource release goes in `Close` (or `defer`).
- Components should support "safe exit after open failure".

## Parameter Design Recommendations

- Once a parameter key is published, keep it compatible to avoid breaking frontend and historical tasks.
- Numeric parameters are stored as strings; parse and validate them explicitly inside the component.
- File parameters should use `file_id` or `file_ids` naming, so the UI can infer them as file pickers.
- JSON string parameters (e.g. HTTP headers) must return clear parse errors.

## Registration Order

Register components in `etl/init.go` in the recommended order:

1. DataSource
2. Variable
3. Executor
4. Source
5. Sink
6. Processor

Incorrect order may cause components that depend on a DataSource to fail registration (e.g. if the DataSource they depend on is not yet registered).

## Component Definition of Done (DoD)

- Component registers successfully and appears in `/api/v1/components`.
- Parameter definitions are complete with reasonable required fields and default values.
- Critical paths support `context` cancellation.
- At least one successful path and one failure path are tested.
- Error messages can be directly used by operations to locate issues; do not return a generic `internal error`.
