---
outline: deep
---

# Getting Component Development Package

This document explains how to obtain and use etl-go's development component package, including pre-built component libraries, sample code, development tools, and dependency management.

## Overview

### What is the Component Development Package

The component development package is a complete set of development resources provided by etl-go, containing:
- **Core Component Libraries**: MySQL, PostgreSQL, SQLite, Doris, and other data source components
- **Processor Components**: Type conversion, data filtering, masking, and other processing components
- **Output Components**: SQL, CSV, JSON, Doris loading, and other output components
- **Executor Components**: SQL executor, system command executors, etc.
- **Variable Components**: SQL query variable components
- **Sample Code**: Complete runnable example projects
- **Development Tools**: Scaffolding, templates, and plugins

### Why Need Development Package

Benefits of using the component development package:
1. **Quick Start**: Ready to use out of the box, saving configuration time
2. **Quality Assurance**: Mature components that have been thoroughly tested
3. **Best Practices**: Following etl-go standards and specifications
4. **Technical Support**: Official maintenance and community support
5. **Continuous Updates**: Regular feature updates and bug fixes

## Acquisition Methods

### Method 1: Clone Main Repository from GitHub (Recommended)

This is the most complete acquisition method, containing all component source code and documentation:

```bash
# Clone main repository
git clone https://github.com/BernardSimon/etl-go.git

# Or use Gitee mirror (faster for domestic access)
git clone https://gitee.com/BernardSimon/etl-go.git

# Enter project directory
cd etl-go

# View project structure
tree -L 3
```

**Project Structure Explanation**:
```
etl-go/
├── components/         # All component source code
│   ├── datasource/    # DataSource components
│   ├── executor/      # Executor components
│   ├── processors/    # Processor components
│   ├── sinks/         # Output components
│   ├── sources/       # Input components
│   └── variable/      # Variable components
├── etl/               # Core engine
├── server/            # Backend service
├── web/               # Web interface
├── go.mod             # Go module definition
└── README.md          # Project description
```

### Method 2: Get via Go Modules

If you only need specific component modules:

```bash
# Get single component module
go get github.com/BernardSimon/etl-go/components/datasource/mysql@latest
go get github.com/BernardSimon/etl-go/components/processors/convertType@latest
go get github.com/BernardSimon/etl-go/components/sinks/sql@latest
```

### Method 3: Download Pre-compiled Binary Files

Suitable for scenarios where you only run ETL tasks without development:

```bash
# Download from Release page
curl -LO https://github.com/BernardSimon/etl-go/releases/download/v1.0.0/etl-go-linux-amd64.zip

# Unzip
unzip etl-go-linux-amd64.zip

# Check version
./etl-go version
```

## Component Directory Details

### DataSource Components (components/datasource/)

| Component Name | Description | Path |
|---------------|-------------|------|
| Doris | Apache Doris data source | `components/datasource/doris/` |
| MySQL | MySQL database connection | `components/datasource/mysql/` |
| PostgreSQL | PostgreSQL database connection | `components/datasource/postgre/` |
| SQLite | SQLite embedded database | `components/datasource/sqlite/` |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/datasource/mysql"
)

// Register MySQL datasource
name, ds, dsName, params := mysql.DatasourceCreatorMysql()
// name = "mysql"
// dsName = "mysql"
```

### Source Components (components/sources/)

| Component Name | Description | Path |
|---------------|-------------|------|
| CSV | Read from CSV file | `components/sources/csv/` |
| JSON | Read from JSON file | `components/sources/json/` |
| SQL | Read from SQL query | `components/sources/sql/` |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/sources/csv"
)

// Create CSV data input
name, source, _, params := csv.SourceCreatorCSV()
```

### Processor Components (components/processors/)

| Component Name | Description | Function |
|---------------|-------------|----------|
| convertType | Type conversion | Convert fields to specified type |
| filterRows | Row filtering | Filter records based on conditions |
| maskData | Data masking | Mask sensitive data |
| renameColumn | Rename column | Modify column names |
| selectColumns | Select columns | Keep only specified columns |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/processors/convertType"
)

// Create type conversion processor
name, processor, params := convertType.ProcessorCreator()
```

### Sink Components (components/sinks/)

| Component Name | Description | Path |
|---------------|-------------|------|
| SQL | Write to SQL database | `components/sinks/sql/` |
| CSV | Write to CSV file | `components/sinks/csv/` |
| JSON | Write to JSON file | `components/sinks/json/` |
| Doris | Write to Apache Doris | `components/sinks/doris/` |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/sinks/csv"
)

// Create CSV data output
name, sink, _, params := csv.SinkCreatorCSV()
```

### Executor Components (components/executor/)

| Component Name | Description | Path |
|---------------|-------------|------|
| SQL | Execute SQL statements | `components/executor/sql/` |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/executor/sql"
)

// Create SQL executor
name, executor, dsName, params := sql.ExecutorCreatorMysql()
```

### Variable Components (components/variable/)

| Component Name | Description | Path |
|---------------|-------------|------|
| SQL | Get variables from SQL query | `components/variable/sql/` |

**Usage Example**:
```go
import (
    "github.com/BernardSimon/etl-go/components/variable/sql"
)

// Create SQL variable
name, variable, dsName, params := sql.VariableCreatorMysql()
```

## Development Environment Setup

### Prerequisites

Install the following tools:
```bash
# Go runtime environment (need 1.21 or higher)
go version

# Git
git --version

# Optional: Code generator
golang.org/x/tools/cmd/stringer@latest
```

### Set Up Workspace

```bash
# Create workspace directory
mkdir -p ~/projects/go && cd ~/projects/go

# Clone etl-go project
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# Check dependencies
go mod download

# Run tests to verify installation
go test ./...
```

### Recommended Development Tools

1. **IDE**: VS Code, GoLand, Vim/Nvim
2. **Formatting**: `gofmt`, `golangci-lint`
3. **Debugging**: Delve (`dlv`)
4. **Testing**: `gotestsum`, `testify`

## Build and Deploy

### Local Build

```bash
# Enter project root directory
cd /path/to/etl-go

# Build command-line tool
go build -o bin/etl-go main.go

# Build web + API separation version
go build -o bin/etl-go-server ./server/main.go
go build -o bin/etl-go-web ./web/main.go

# Run unit tests
go test -v ./...

# Run integration tests
go test -v -tags=integration ./...
```

### Docker Build

```bash
# Pull image from Docker Hub
docker pull bernardsimon/etl-go:latest

# Or build locally using Dockerfile
docker build -t etl-go:local .

# Run container
docker run -it \
  -v $(pwd)/config.yaml:/etc/etl-go/config.yaml \
  -p 8080:8080 \
  -p 8081:8081 \
  etl-go:local
```

## Custom Component Development

### Create New Project Structure

```bash
# Create custom component directory
mkdir -p components/custom/my-source/{src,test}

# Initialize Go module
cd components/custom/my-source
go mod init github.com/BernardSimon/etl-go/components/custom/my-source

# Add dependencies
go get github.com/BernardSimon/etl-go/etl/core/source
```

### Use Template to Get Started Quickly

```bash
# Copy component template
cp -r components/templates/source-tpl my-source

# Modify source code
cd my-source/src
# Edit main.go to implement your logic

# Write tests
cd test
# Edit source_test.go
```

### Register to Main Module

In the main module's `components/register.go`:

```go
import (
    _ "your-module/my-source"
)
```

## Dependency Management

### Go Modules

```bash
# View all dependencies
go list -m all

# View specific dependency details
go list -m -json github.com/BernardSimon/etl-go/components/datasource/mysql

# Update dependencies
go get -u ./...

# Clean unused dependencies
go mod tidy

# Check dependency vulnerabilities
govulncheck ./...
```

### Vendor Mode (Optional)

```bash
# Copy dependencies to vendor directory
go mod vendor

# Build using vendor mode
go build -mod=vendor
```

## Sample Code

### Complete ETL Flow Example

```go
package main

import (
    "log"
    
    "github.com/BernardSimon/etl-go/etl/core/pipeline"
    "github.com/BernardSimon/etl-go/components/datasource/mysql"
    "github.com/BernardSimon/etl-go/components/sources/sql"
    "github.com/BernardSimon/etl-go/components/processors/convertType"
    "github.com/BernardSimon/etl-go/components/sinks/sql"
)

func main() {
    // 1. Create datasource
    dsName, ds, params := mysql.DatasourceCreatorMysql()
    
    // 2. Create input component
    srcName, source, _, srcParams := sql.SourceCreatorMysql()
    
    // 3. Create processor
    procName, processor, procParams := convertType.ProcessorCreator()
    
    // 4. Create output component
    sinkName, sink, _, sinkParams := sqlSink.SinkCreatorMysql()
    
    // 5. Build pipeline
    pipe := pipeline.NewPipeline()
    pipe.AddSource(source, ds, srcParams)
    pipe.AddProcessor(processor, procParams)
    pipe.AddSink(sink, sinkParams)
    
    // 6. Run pipeline
    err := pipe.Run()
    if err != nil {
        log.Fatal(err)
    }
}
```

### Configuration File Example

```yaml
# config.yaml
dataSources:
  - name: source_db
    type: mysql
    connection: "user:pass@tcp(host:port)/database"
  
  - name: target_db
    type: mysql
    connection: "user:pass@tcp(host:port)/target_db"

tasks:
  - name: sync_users
    source:
      type: sql
      datasource: source_db
      query: "SELECT * FROM users WHERE updated_at > ?"
      params: ["{{last_sync_time}}"]
    
    processors:
      - type: convertType
        config:
          column: age
          type: integer
      
      - type: maskData
        config:
          column: email
          mask: "*"
          keep: 3
    
    sink:
      type: sql
      datasource: target_db
      table: users_synced
      column_mapping:
        id: id
        name: user_name
        email: masked_email
        age: user_age
```

## Common Issues

### 1. Cannot Find Component Module

**Issue**: `go get` shows module not found error
**Solution**:
```bash
# Check network accessibility to GitHub
ping github.com

# Use GOPROXY
export GOPROXY=https://goproxy.cn,direct

# Or use Gitee
export GOPROXY=https://gitee.com/proxy,direct
```

### 2. Version Compatibility Issues

**Issue**: Component doesn't match main program version
**Solution**:
```bash
# Ensure all dependency versions are consistent
go mod graph | grep BernardSimon/etl-go

# Update all dependencies to latest
go get -u ./...
go mod tidy

# Or lock to specific version
go get github.com/BernardSimon/etl-go/components@v1.0.0
```

### 3. Cross-platform Compilation Issues

**Issue**: Build fails on different operating systems
**Solution**:
```bash
# Cross-compilation
GOOS=linux GOARCH=amd64 go build -o etl-go-linux
GOOS=darwin GOARCH=amd64 go build -o etl-go-macos
GOOS=windows GOARCH=amd64 go build -o etl-go-windows.exe

# Build using docker
docker buildx build --platform linux/amd64,linux/arm64 -t etl-go .
```

## Next Steps

After understanding the component development package, you can:
1. **[About etl-go](./about.md)** - Learn about etl-go project background and community
2. **[Quick Start](../quick-start.md)** - Actually run an ETL task
3. **[Deep Learning](../develop-architecture.md)** - Study architecture design

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*