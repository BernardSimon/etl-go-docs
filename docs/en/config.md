# Configuration File

ETL-GO uses `config.yaml` in the root directory for runtime configuration. The current version does not auto-create a template config — please edit the file directly from the repository root.

## Key Configuration Options

```yaml
username: admin
password: password123
jwtSecret: <your-secret>
apiSecret: <your-api-secret>
aesKey: <your-aes-key>
initDb: false
logLevel: dev
log:
  filename: ./log/app.log
  maxSize: 20
  maxBackups: 3
  maxAge: 7
  compress: true
database:
  path: ./data.db
  maxOpenConns: 10
  maxIdleConns: 5
  connMaxLifetime: 300
pipeline:
  batchSize: 1000
  channelSize: 10000
serverUrl: 0.0.0.0:8080
runWeb: false
webUrl: 0.0.0.0:8081
corsOrigins:
  - http://localhost:8081
  - http://localhost:5173
```

## Parameter Reference

- `username` / `password`: Web login credentials.
- `jwtSecret`: JWT authentication signing key.
- `apiSecret`: API authentication signing key.
- `aesKey`: AES encryption/decryption key for sensitive field encryption.
- `initDb`: Set to `true` on first run to automatically execute database migration.
- `logLevel`: `dev` or `prod`.
- `log`: Log rotation config (filename, max size, backup count, compression, etc.).
- `database`: Platform metadata database (SQLite) connection config.
- `pipeline.batchSize`: Number of records per Sink batch write.
- `pipeline.channelSize`: Pipeline stage channel buffer size.
- `serverUrl`: Backend API listen address.
- `runWeb`: Whether to start the embedded static Web service.
- `webUrl`: Embedded static Web service listen address.
- `corsOrigins`: List of allowed frontend CORS origins.

Terminology distinction:

- `username/password`: Platform admin login credentials (top-level in `config.yaml`)
- `user/password`: Database data source connection credentials (data source component parameters)

## Environment Variable Overrides

The following environment variables can override `config.yaml` settings:

- `ETL_USERNAME`
- `ETL_PASSWORD`
- `ETL_JWT_SECRET`
- `ETL_API_SECRET`
- `ETL_AES_KEY`
- `ETL_SERVER_URL`
- `ETL_LOG_LEVEL`

## Production Recommendations

1. Change the default credentials to avoid weak passwords.
2. Use high-entropy random values for `jwtSecret`, `apiSecret`, and `aesKey`.
3. Only include actual frontend domains in `corsOrigins`; do not use `*` (unless explicitly required).
4. Adjust the log path to a persistent directory to avoid losing logs on container restart.
5. Tune `pipeline.batchSize/channelSize` based on task throughput.

## Common Error Troubleshooting

### 1. Startup reports config file read failure

- Check that `config.yaml` exists in the current working directory.

### 2. Login fails after startup

- Check whether `ETL_USERNAME/ETL_PASSWORD` environment variables are overriding the config.

### 3. CORS errors

- Check that `corsOrigins` includes the current frontend address (protocol and port must match exactly).

### 4. High memory usage during large tasks

- Reduce `pipeline.channelSize` and `pipeline.batchSize` appropriately.
