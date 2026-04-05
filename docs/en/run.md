# Running the Program

This chapter describes how to start ETL-GO and debugging approaches at runtime.

## Startup Methods

### Method 1: Run Directly from Source

```bash
go run main.go
```

### Method 2: Use the Built Binary

```bash
go build -o etl-go .
./etl-go
```

## Run Modes

- `runWeb: true`
  - Starts API + built-in static Web service
- `runWeb: false`
  - Starts API service only (recommended for frontend-backend separated development)

## Configuration Loading Rules

- By default reads `./config.yaml` from the current working directory.
- The current version does not support specifying a config file path via command line.
- Environment variables can override certain config values (e.g. `ETL_SERVER_URL`).

## Post-Startup Checks

Port check:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Login endpoint check:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## Default Access Addresses

- Backend API: `http://127.0.0.1:8080`
- Built-in Web: `http://127.0.0.1:8081`

## Logs and Runtime Information

- Default application log file: `./log/app.log`
- Log level: `logLevel=dev|prod`
- Task execution logs can be viewed under "Task Records -> Log Details"

## Graceful Shutdown

The program supports `SIGINT` / `SIGTERM`. Press `Ctrl+C` to trigger a graceful shutdown; the service will attempt to close the HTTP server within the configured timeout.

## Common Troubleshooting

### 1. `address already in use`

- Cause: Port is already occupied.
- Fix: Modify `serverUrl` / `webUrl`, or release the occupied port.

### 2. Frontend opens but API returns CORS errors

- Cause: `corsOrigins` does not include the current frontend address.
- Fix: Add the actual frontend domain to `corsOrigins`.

### 3. Browser auto-open fails on macOS at startup

- Cause: System environment restrictions or the address is not accessible.
- Impact: Does not affect API or task execution; can be ignored.
