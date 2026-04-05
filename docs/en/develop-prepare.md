---
outline: deep
---

# Development Preparation

`etl-go` has undergone significant refactoring. It is recommended to set up the development environment in the order: "environment setup -> startup verification -> joint debugging -> troubleshooting". This guide is for local secondary development, component development, and problem investigation.

## Environment Requirements

- Go 1.24+
- Node.js 18+
- pnpm
- Git
- SQLite (default metadata database; no separate installation required)

## Recommended Dev Machine Specs

- macOS / Linux / Windows WSL2 all work
- Memory >= 8GB recommended (more stable for full-stack debugging + large-volume tasks)
- At least 2GB of writable disk space (logs, uploaded files, temporary build artifacts)

## Code Repository

```bash
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go
```

## Install Dependencies

```bash
go mod download
cd web
pnpm install
cd ..
```

## Startup Methods

### Method 1: Backend only (API debugging)

```bash
go build -o etl-go .
./etl-go
```

Default address: `http://localhost:8080`

### Method 2: Frontend-backend separated development (recommended)

Terminal 1 (backend):

```bash
go build -o etl-go .
./etl-go
```

Terminal 2 (frontend):

```bash
cd web
pnpm dev
```

Default addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

### Method 3: Backend serving frontend static files

```bash
cd web
pnpm build
cd ..
go build -o etl-go .
./etl-go
```

Requires `runWeb: true` in `config.yaml`.

## First-Time Startup Checklist

1. Confirm `config.yaml` exists in the repository root directory.
2. Confirm `serverUrl` is consistent with frontend proxy and CORS configuration.
3. On the first initialization, set `initDb: true`; it will automatically write back `false` after a successful startup.
4. Log in with the default account and immediately change the weak password (default: `admin/password123`).

## Key Configuration Parameters (Post-Refactor)

| Parameter | Description | Default |
| --- | --- | --- |
| `serverUrl` | API listen address | `0.0.0.0:8080` |
| `runWeb` | Whether backend serves static frontend | `false` |
| `webUrl` | Static frontend serve address | `0.0.0.0:8081` |
| `pipeline.batchSize` | Sink batch write size | `1000` |
| `pipeline.channelSize` | Pipeline channel buffer | `10000` |
| `database.path` | Platform metadata SQLite file | `./data.db` |
| `corsOrigins` | Allowed CORS origins | Local frontend address |

## Environment Variable Overrides

The following variables override the same-name configuration in `config.yaml`:

- `ETL_USERNAME`
- `ETL_PASSWORD`
- `ETL_JWT_SECRET`
- `ETL_AES_KEY`
- `ETL_SERVER_URL`
- `ETL_LOG_LEVEL`

## Local Verification Commands

```bash
# Backend build
go build -o bin/etl-go .

# Run all tests
go test ./...

# Frontend build
cd web && pnpm build
```

## Common Troubleshooting

### 1. `Failed To Read Config File`

- Symptom: Exits immediately on startup with a log indicating config cannot be read.
- Investigation:
  - Confirm the current directory is the project root (containing `config.yaml`).
  - Confirm the file name is `config.yaml`, not `config.yml`.

### 2. Frontend login returns `401` or CORS failure

- Symptom: Browser console shows CORS or unauthorized errors.
- Investigation:
  - `config.yaml` `corsOrigins` must include the frontend address (e.g. `http://localhost:5173`).
  - Check that the frontend request address points to the correct `serverUrl`.

### 3. Slow task execution or rising memory

- Symptom: Task throughput drops, machine memory increases.
- Investigation:
  - Reduce `pipeline.channelSize`.
  - Lower `pipeline.batchSize` (e.g. `1000 -> 200`) to observe write stability.
  - Check if Source is pulling a very large dataset at once; consider pagination or sharding.
