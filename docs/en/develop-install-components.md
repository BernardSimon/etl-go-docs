# Register Components

ETL-GO uses a factory pattern for unified component registration. The registration entry point is `etl/init.go`.

## Component Registration Order

1. Data source components
2. Variable components
3. Executor components
4. Source components
5. Sink components
6. Processor components

Reason for this order:

- Source/Sink/Executor/Variable may depend on DataSource.
- Registering DataSource first avoids dependency-not-ready errors.

## Typical Registration Code

```go
func RegisterComponents() error {
    var errs []error
    errs = append(errs, factory.RegisterDataSource(dorisDatasource.DatasourceCreator))
    errs = append(errs, factory.RegisterDataSource(mysqlDatasource.DatasourceCreator))
    // ...
    return errors.Join(errs...)
}
```

## Failure Modes and Error Meanings

- `xxx is already registered`
  - Component name is duplicated; check whether `Creator` return values conflict.
- `datasource 'xxx' required by source/sink/executor/variable 'yyy' has not been registered`
  - The dependent data source is not registered or its name does not match.
- `no source/sink/... registered with name: xxx`
  - The `type` in the task config does not match the registered name.

## Post-Registration Verification

### 1. Startup check

- If registration fails during service startup, it triggers a fatal.
- Locally, run `go build ./...` before starting to detect compilation and registration issues early.

### 2. API check

After logging in:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/components
```

Confirm the new component type appears in the response.

### 3. Minimal task check

- Create a minimal task chain containing only that component (e.g. Source -> Sink).
- Execute a manual task once.
- Check the run record for parameters and errors to confirm they match expectations.

## Version Iteration Recommendations

- Prefer adding new components over directly modifying an existing component's `type` name.
- If replacing an implementation, maintain parameter compatibility or provide a migration guide in the documentation.
- Add a documentation page for each new component: parameters, examples, and error troubleshooting.

## Notes

- All components are registered via `factory.Register*`
- Errors returned during registration trigger a fatal at startup
- After registration, the Web console retrieves available component types via `/api/v1/components`
