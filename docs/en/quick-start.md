# Quick Start

This page describes how to quickly run ETL-GO and open the Web management interface. It is recommended to complete the basic configuration of `config.yaml` before starting the service.

## 1. Clone the Repository

```bash
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go
```

## 2. Install Backend Dependencies

```bash
go mod download
```

## 3. Install Frontend Dependencies

```bash
cd web
pnpm install
cd ..
```

## 4. Edit the Configuration File

The `config.yaml` in the root directory manages runtime parameters.

The default configuration file contains:

- `serverUrl`: Backend API address, e.g. `0.0.0.0:8080`
- `runWeb`: Whether to start the built-in static frontend service
- `webUrl`: Built-in frontend service address, e.g. `0.0.0.0:8081`
- `database.path`: SQLite storage file location
- `pipeline.batchSize`: Batch write size

It is recommended to at least change `username`, `password`, and `jwtSecret`.

## 5. Start the Backend Service

```bash
go build -o etl-go .
./etl-go
```

If `runWeb: true` is set in the configuration, the backend will also start the static Web console; otherwise only the API service starts.

## 6. Access the Web Management Interface

Default access:

- Backend API: `http://127.0.0.1:8080`
- Frontend console: `http://127.0.0.1:8081`

If `runWeb: true`, the backend will automatically try to open the Web address on startup.

## 7. Run a Task

1. Log in to the Web console
2. Configure a data source
3. Create a task and select Source/Processor/Sink
4. Execute manually or set up a Cron schedule

## 8. Minimal Self-Check via API

Get a token by logging in:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

View component metadata (verify factory registration):

```bash
curl -H "Authorization: Bearer <token>" \
  http://127.0.0.1:8080/api/v1/components
```

## 9. Common Issues

- Cannot access the frontend: confirm that `runWeb`, `webUrl`, and `corsOrigins` are configured correctly.
- Backend fails to start: check `config.yaml` syntax and SQLite file access permissions.
- Login failure: default username is `admin`, default password is `password123`. It is recommended to change to a strong password.
