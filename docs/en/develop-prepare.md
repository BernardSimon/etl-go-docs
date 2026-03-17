---
outline: deep
---

# Development Preparation

Before starting development on etl-go, ensure your development environment meets the following requirements and prepare the necessary tools and dependencies.

## Environment Requirements

### Operating System
- **Windows 10+** (recommended Windows 11)
- **macOS 12+** (recommended macOS 14+)
- **Linux** (Ubuntu 22.04+, CentOS 8+, or other mainstream distributions)

### Development Tools

#### 1. Go Language Environment
- **Go Version**: 1.24.4 or higher
- **Installation**:
  ```bash
  # macOS (using Homebrew)
  brew install go@1.24
  
  # Ubuntu/Debian
  wget https://go.dev/dl/go1.24.4.linux-amd64.tar.gz
  sudo tar -C /usr/local -xzf go1.24.4.linux-amd64.tar.gz
  echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
  source ~/.bashrc
  
  # Windows
  # Download installer from https://go.dev/dl/ and install
  ```

- **Verify Installation**:
  ```bash
  go version
  # Should output: go version go1.24.4 linux/amd64
  ```

#### 2. Node.js Environment (for frontend development)
- **Node.js Version**: 18.0.0 or higher
- **npm Version**: 9.0.0 or higher
- **Recommended to use pnpm** (project uses pnpm):
  ```bash
  # Install pnpm
  npm install -g pnpm
  
  # Verify
  pnpm --version
  ```

#### 3. Git Version Control
- **Git Version**: 2.30.0 or higher
- **Installation**:
  ```bash
  # Ubuntu/Debian
  sudo apt install git
  
  # macOS
  brew install git
  
  # Windows
  # Download from https://git-scm.com/
  ```

### Database (for testing)

#### 4. SQLite (default database)
etl-go uses SQLite as the default metadata storage, no additional installation required.

#### 5. MySQL (optional, for testing)
```bash
# Ubuntu/Debian
sudo apt install mysql-server mysql-client

# macOS
brew install mysql

# Start service
sudo systemctl start mysql  # Linux
brew services start mysql   # macOS
```

#### 6. PostgreSQL (optional, for testing)
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

## Recommended Development Tools

### IDE/Editors
1. **Visual Studio Code** (recommended)
   - Install Go extension
   - Install Vue extension
   - Install ESLint extension

2. **Goland** (JetBrains)
   - Professional Go IDE
   - Built-in powerful debugging and analysis tools

3. **Vim/Neovim** (for advanced users)
   - Configure Go development environment
   - Use coc.nvim or LSP support

### Command Line Tools
```bash
# Build tools
go build    # Go compilation
pnpm build  # Frontend build

# Code quality
gofmt       # Go code formatting
golint      # Go code linting
eslint      # JavaScript/TypeScript code linting

# Dependency management
go mod tidy # Clean Go dependencies
pnpm install # Install frontend dependencies
```

## Project Setup

### 1. Workspace Structure
Recommended workspace structure:
```
~/projects/
├── etl-go/           # Main project
├── etl-go-docs/      # Documentation project
└── etl-go-examples/  # Example code
```

### 2. Environment Variables
Add to `~/.bashrc` or `~/.zshrc`:
```bash
# Go environment variables
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export PATH=$PATH:/usr/local/go/bin

# Project aliases
alias etl-go="cd ~/projects/etl-go"
alias etl-docs="cd ~/projects/etl-go-docs"
```

### 3. Git Configuration
```bash
# Set user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default editor
git config --global core.editor "code --wait"

# Set line ending conversion (Windows users need this)
git config --global core.autocrlf true
```

## Getting the Code

### 1. Clone Main Project
```bash
# Clone etl-go main project
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# View project structure
ls -la
```

### 2. Clone Documentation Project
```bash
# Clone documentation project
git clone https://github.com/BernardSimon/etl-go-docs.git
cd etl-go-docs
```

### 3. Verify Project Integrity
```bash
# Navigate to etl-go directory
cd etl-go

# Check Go modules
go mod download
go mod verify

# Check frontend dependencies (if frontend development is needed)
cd web
pnpm install
```

## Development Workflow

### 1. Branch Strategy
```bash
# Create development branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/your-feature-name
```

### 2. Code Standards

#### Go Code Standards
- Use `gofmt` for code formatting
- Follow official Go code standards
- Use meaningful variable and function names
- Add necessary comments

#### Frontend Code Standards
- Use ESLint for code checking
- Follow Vue.js best practices
- Use TypeScript type definitions

### 3. Testing Process
```bash
# Run unit tests
go test ./...

# Run specific tests
go test ./etl/core/...

# Test coverage
go test -cover ./...
```

## Troubleshooting Common Issues

### 1. Go Module Issues
```bash
# Clean module cache
go clean -modcache

# Redownload dependencies
go mod tidy
```

### 2. Frontend Build Issues
```bash
# Clear node_modules
rm -rf node_modules
rm -rf pnpm-lock.yaml

# Reinstall
pnpm install
```

### 3. Database Connection Issues
- Check if database service is running
- Verify connection parameters are correct
- Check log files for detailed error information

## Next Steps

After environment preparation, you can:
1. **[Get Main Program Code](./develop-source.md)** - Learn how to get and set up code
2. **[Learn Code Architecture](./develop-architecture.md)** - Understand project overall architecture
3. **[Start Component Development](./develop-component-architecture.md)** - Learn how to develop custom components

## Getting Help

If you encounter issues during environment preparation:
1. Check project [GitHub Issues](https://github.com/BernardSimon/etl-go/issues)
2. Review existing documentation
3. Ask questions in the community forum

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*