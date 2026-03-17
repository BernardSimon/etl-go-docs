---
outline: deep
---

# Getting Main Program Code

This document explains how to obtain the etl-go main program code, including cloning the repository, setting up the development environment, understanding the code structure, and how to start contributing code.

## Code Repository

### Official Repository
The main etl-go code repository is on GitHub:

- **Repository Address**: https://github.com/BernardSimon/etl-go
- **License**: Apache License 2.0
- **Main Branch**: `main`
- **Latest Version**: Check [Releases](https://github.com/BernardSimon/etl-go/releases)

### Mirror Repository
If needed, you can also access via these mirrors:
- **Gitee**: https://gitee.com/BernardSimon/etl-go (China acceleration)

## Getting the Code

### 1. Clone Repository

#### Using HTTPS (Recommended)
```bash
# Clone main repository
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# Or use China mirror (if GitHub is slow)
git clone https://gitee.com/BernardSimon/etl-go.git
cd etl-go
git remote set-url origin https://github.com/BernardSimon/etl-go.git
```

#### Using SSH (requires SSH key configuration)
```bash
# Clone main repository
git clone git@github.com:BernardSimon/etl-go.git
cd etl-go
```

### 2. Select Branch

```bash
# View all branches
git branch -a

# Switch to main branch
git checkout main

# Pull latest code
git pull origin main

# Create development branch
git checkout -b feature/your-feature-name
```

### 3. Submodule Initialization (if any)
```bash
# If project contains submodules, initialize and update
git submodule init
git submodule update
```

## Project Structure Overview

After cloning, you'll see the following project structure:

```
etl-go/
├── README.md            # Project documentation
├── main.go              # Program entry file
├── config.yaml          # Configuration file template
├── go.mod              # Go module definition
├── go.sum              # Dependency lock file
├── LICENSE             # License file
├── NOTICE              # Notice file
├── .gitignore          # Git ignore configuration
├── etl/                # ETL engine core
│   ├── core/           # Core interface definitions
│   ├── factory/        # Factory pattern implementation
│   ├── pipeline/       # Pipeline execution engine
│   └── init.go         # Initialization function
├── components/         # Component implementations
│   ├── datasource/     # Data source components
│   ├── sources/        # Data extraction components
│   ├── processors/     # Data processing components
│   ├── sinks/          # Data loading components
│   ├── executor/       # Executor components
│   └── variable/       # Variable components
├── server/             # Backend API service
│   ├── api/           # API handlers
│   ├── model/         # Data models
│   ├── type/          # Type definitions
│   ├── config/        # Configuration management
│   ├── router/        # Route definitions
│   ├── task/          # Task scheduling
│   └── utils/         # Utility functions
└── web/               # Frontend interface
    ├── src/           # Frontend source code
    ├── package.json   # Frontend dependency configuration
    ├── vite.config.ts # Build configuration
    └── index.html     # Entry HTML
```

## Setting Up Development Environment

### 1. Dependency Installation

#### Go Dependencies
```bash
# Download all Go dependencies
go mod download

# Verify dependency integrity
go mod verify

# Clean unnecessary dependencies
go mod tidy
```

#### Frontend Dependencies (optional, if frontend development is needed)
```bash
# Navigate to frontend directory
cd web

# Install dependencies (using pnpm)
pnpm install

# Or use npm
npm install
```

### 2. Development Configuration

#### Create Local Configuration File
```bash
# Copy configuration file template
cp config.yaml config.local.yaml

# Edit local configuration
# Modify username, password, port, etc.
```

#### Configuration Example (`config.local.yaml`)
```yaml
username: admin
password: your-secure-password
jwtSecret: your-jwt-secret-key
aesKey: your-aes-encryption-key
initDb: true  # Set to true for first run
logLevel: dev
serverUrl: localhost:8080
runWeb: true  # Set to true if frontend is compiled
webUrl: localhost:8081
```

### 3. Database Initialization

First run requires database initialization:
```bash
# Ensure initDb: true in config.local.yaml
go run main.go --config config.local.yaml
```

After initialization, change `initDb` back to `false`.

## Verification

### 1. Compilation Verification
```bash
# Compile project
go build -o etl-go .

# Check executable
./etl-go --version
```

### 2. Run Tests
```bash
# Run all tests
go test ./...

# Run specific module tests
go test ./etl/core/...

# Run tests with coverage
go test -cover ./...
```

### 3. Start Service
```bash
# Start with local configuration
./etl-go --config config.local.yaml

# Or run directly
go run main.go --config config.local.yaml
```

Access Web Interface: http://localhost:8081

## Code Contribution

### 1. Contribution Process

#### Standard GitHub Process
1. **Fork Repository**: Fork etl-go repository on GitHub
2. **Clone Fork**: `git clone https://github.com/your-username/etl-go.git`
3. **Add Upstream**: `git remote add upstream https://github.com/BernardSimon/etl-go.git`
4. **Create Branch**: `git checkout -b feature/your-feature`
5. **Commit Changes**: `git commit -m "feat: description"`
6. **Push to Fork**: `git push origin feature/your-feature`
7. **Create PR**: Create Pull Request on GitHub

#### Simplified Process (direct contribution)
If you're a project member, you can create branches directly in the main repository:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
# Development...
git push origin feature/your-feature
```

### 2. Commit Convention

Follow Conventional Commits specification:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code formatting changes
- `refactor:` Code refactoring
- `test:` Test related
- `chore:` Build process or auxiliary tools

Example:
```bash
git commit -m "feat: add MySQL data source component"
git commit -m "fix: fix null pointer error in data conversion"
git commit -m "docs: update component development guide"
```

### 3. Code Review

Before submitting PR, ensure:
- [ ] Code passes all tests
- [ ] Added necessary test cases
- [ ] Updated relevant documentation
- [ ] Follows project code standards
- [ ] Commit messages are clear and explicit

## Version Management

### 1. Version Number Convention
Follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- `MAJOR`: Incompatible API changes
- `MINOR`: Backward-compatible functionality additions
- `PATCH`: Backward-compatible bug fixes

### 2. Release Process
1. **Create Release Branch**: `git checkout -b release/v1.2.3`
2. **Update Version Number**: Modify version information in relevant files
3. **Update CHANGELOG**: Record changes for this release
4. **Commit and Push**: `git commit -m "chore: release v1.2.3"`
5. **Create Tag**: `git tag -a v1.2.3 -m "Release v1.2.3"`
6. **Push Tag**: `git push origin v1.2.3`
7. **Create GitHub Release**

## Troubleshooting

### Common Issues

#### 1. Dependency Download Failure
```bash
# Set Go proxy (for users in China)
go env -w GOPROXY=https://goproxy.cn,direct

# Or use Alibaba Cloud proxy
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
```

#### 2. Compilation Errors
```bash
# Clean build cache
go clean -cache

# Redownload dependencies
go mod download
```

#### 3. Frontend Build Failure
```bash
# Clean node_modules
cd web
rm -rf node_modules
rm -rf pnpm-lock.yaml

# Reinstall
pnpm install
```

#### 4. Database Connection Issues
- Check if database service is running
- Verify connection parameters are correct
- Check log files for detailed error information

## Getting Help

### 1. Documentation Resources
- **Project Documentation**: https://etl.ziyi.chat/
- **API Documentation**: Access http://localhost:8080/swagger/index.html after running service
- **Development Guide**: This documentation

### 2. Community Support
- **GitHub Issues**: https://github.com/BernardSimon/etl-go/issues
- **Discussion Board**: GitHub Discussions
- **Mailing List**: (if available)

### 3. Emergency Contact
For critical issues, contact maintainers directly.

## Next Steps

After obtaining code and setting up environment, you can:
1. **[Learn Code Architecture](./develop-architecture.md)** - Deeply understand project design
2. **[Develop Custom Components](./develop-component-architecture.md)** - Start extending functionality
3. **[Participate in Code Contribution](#code-contribution)** - Contribute to the project

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*