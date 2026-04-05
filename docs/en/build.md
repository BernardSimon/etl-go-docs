# Build from Source

It is recommended to build both the backend and frontend from source to ensure the runtime matches the current code.

## 1. Prerequisites

- Go 1.24+ installed
- Node.js 18+
- pnpm installed

## 2. Fetch Dependencies

```bash
go mod download
cd web
pnpm install
cd ..
```

## 3. Build the Backend

```bash
go build -o etl-go .
```

## 4. Build the Frontend

```bash
cd web
pnpm build
cd ..
```

> After the build completes, `web/dist` will contain the static files. The backend program has built-in support for embedding static web pages.

## 5. Run the Program

```bash
./etl-go
```

## 6. Common Makefile Commands

```bash
make build   # Generate bin/etl-go
make test    # Run tests
make race    # Enable race detector
make vet     # Run go vet
```

## 7. Build Output Verification

- Backend binary: `./etl-go` or `./bin/etl-go`
- Frontend artifacts: `./web/dist`
- Confirm API is accessible after startup: `/api/v1/login`

## Common Issues

### 1. `go: module ... not found`

- Check proxy settings and network connectivity.
- Re-run `go mod download`.

### 2. `pnpm: command not found`

- Install pnpm first: `npm i -g pnpm`.

### 3. Build succeeds but page returns 404

- Frontend may not have been built, or `runWeb=false`.
- Check that `web/dist` exists and confirm the run mode.
