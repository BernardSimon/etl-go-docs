# Using a Pre-built Package

If you already have a pre-compiled `etl-go` package, you can skip the source build and run it directly after extracting.

## Recommended Package Directory Structure

- `etl-go` (executable)
- `config.yaml` (runtime config)
- `README.md` (version notes)
- `web/dist` (optional, if using built-in static frontend)

## 1. Extract and Set Permissions

```bash
tar -xzf etl-go-<version>.tar.gz
cd etl-go-<version>
chmod +x ./etl-go
```

## 2. Check Configuration File

Before starting, make sure `config.yaml` exists in the same directory. At a minimum, confirm the following fields:

- `username`
- `password`
- `jwtSecret`
- `aesKey`
- `serverUrl`
- `runWeb`
- `webUrl`
- `corsOrigins`

## 3. Start the Application

```bash
./etl-go
```

## 4. Verify Successful Startup

Check the port:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Try the login endpoint:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## Common Issues

### 1. Startup reports `Failed To Read Config File`

- Cause: Incorrect working directory or missing `config.yaml`.
- Fix: Switch to the directory containing the executable before starting.

### 2. Cannot access the frontend after startup

- Cause: `runWeb` is `false`, or `web/dist` was not built.
- Fix: Enable `runWeb` and confirm static assets exist.

### 3. Login failure

- Cause: Username/password has been changed, or environment variables override the config file.
- Fix: Check `ETL_USERNAME` / `ETL_PASSWORD`.

## If You Don't Have a Package

Use the source build method instead. See [Build from Source](./build.md).
