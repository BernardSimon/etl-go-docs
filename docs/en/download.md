# Download

The project primarily recommends building and running from source. If you prefer a pre-compiled version, first check whether a release package is available on the project's Release page.

## How to Get ETL-GO

It is recommended to visit the GitHub repository Release page to get the latest version.

- https://github.com/BernardSimon/etl-go/releases

## Option 1: Use a Pre-built Package

1. Download the archive for your OS from the Release page.
2. After extracting, confirm the package contains `etl-go` and `config.yaml`.
3. Modify the configuration and run `./etl-go` directly.

## Option 2: Build from Source (Recommended)

Recommended way to build the executable:

```bash
go mod download
go build -o etl-go .
```

Build frontend static assets:

```bash
cd web
pnpm install
pnpm build
cd ..
```

## Configuration File Requirements

Prepare `config.yaml` before running. This file must be in the same directory as the executable.

At a minimum, include:

- `username`
- `password`
- `jwtSecret`
- `aesKey`
- `serverUrl`

## Post-Startup Verification

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## Common Issues

### 1. No release package available

- Go directly to the source build process, which is generally more stable and better suited for secondary development.

### 2. Binary starts but page won't open

- Check whether `runWeb` is enabled.
- Check whether the frontend assets were built and included in the package.
