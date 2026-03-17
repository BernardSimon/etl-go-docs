---
outline: deep
---

# About etl-go

This document introduces the background, vision, team, and community information of the etl-go project.

## Project Introduction

### What is etl-go

etl-go is a modern, high-performance, and easy-to-use open-source ETL (Extract, Transform, Load) tool designed to help developers and data engineers easily build and manage data processing workflows.

**Core Features**:
- 🚀 **Out of the Box**: Built-in various commonly used data sources, processors, and target components
- 🔧 **Highly Extensible**: Plugin architecture supporting custom component development
- 🎨 **Visual Configuration**: Provides web interface for task configuration and monitoring
- 🗄️ **Multi-Data Source Support**: MySQL, PostgreSQL, SQLite, Doris, CSV, JSON, etc.
- 🔄 **Rich Processors**: Data type conversion, row filtering, data masking, column renaming, etc.
- ⏰ **Task Scheduling**: Supports scheduled tasks and manual triggers
- 📊 **Variable Management**: Dynamic configuration and SQL variable support
- 📁 **File Management**: Built-in file upload and management functionality
- 📝 **Logging & Monitoring**: Comprehensive logging and task execution monitoring

### Design Philosophy

1. **Simplicity First**: Simplify complex ETL workflow configurations
2. **Performance Priority**: Leverage Go's concurrent advantages
3. **Extensibility**: Modular design, easy to add new features
4. **User Friendly**: Intuitive web management interface
5. **Production Ready**: Stable and reliable after thorough testing

## Technology Stack

### Backend Technology
- **Language**: Go 1.24.4
- **Database**: SQLite (metadata storage)
- **ORM**: GORM
- **Web Framework**: Gin
- **Configuration**: Viper

### Frontend Technology
- **Framework**: Vue 3 + TypeScript
- **UI Library**: Element Plus
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Axios

### Dependency Management
- Go Modules
- npm/pnpm

## Project Structure

```
etl-go/
├── components/              # All component implementations
│   ├── datasource/         # DataSource components
│   │   ├── doris/          # Apache Doris
│   │   ├── mysql/          # MySQL
│   │   ├── postgre/        # PostgreSQL
│   │   └── sqlite/         # SQLite
│   ├── sources/            # Data Input Components
│   │   ├── csv/            # CSV files
│   │   ├── json/           # JSON files
│   │   └── sql/            # SQL queries
│   ├── processors/         # Data Processing Components
│   │   ├── convertType/    # Type conversion
│   │   ├── filterRows/     # Row filtering
│   │   ├── maskData/       # Data masking
│   │   ├── renameColumn/   # Rename columns
│   │   └── selectColumns/  # Select columns
│   ├── sinks/              # Data Output Components
│   │   ├── csv/            # CSV files
│   │   ├── json/           # JSON files
│   │   ├── sql/            # SQL databases
│   │   └── doris/          # Apache Doris
│   ├── executor/           # Executor Components
│   │   └── sql/            # SQL executor
│   └── variable/           # Variable Components
│       └── sql/            # SQL variables
├── etl/                     # Core Engine
│   ├── core/               # Core interface definitions
│   ├── factory/            # Factory pattern implementation
│   └── pipeline/           # Pipeline execution
├── server/                  # Backend Service
│   ├── api/                # RESTful API
│   ├── config/             # Configuration management
│   ├── model/              # Data models
│   ├── router/             # Routing configuration
│   ├── task/               # Task scheduling
│   └── utils/              # Utility functions
├── web/                     # Web Frontend Interface
│   ├── src/
│   │   ├── api/            # API calls
│   │   ├── assets/         # Static resources
│   │   ├── components/     # Vue components
│   │   ├── layouts/        # Layout components
│   │   ├── router/         # Router configuration
│   │   ├── stores/         # State management
│   │   ├── types/          # TypeScript types
│   │   └── views/          # Page views
│   └── package.json        # Frontend dependencies
├── main.go                  # Program entry point
├── config.yaml.example      # Configuration example
├── go.mod                   # Go dependencies
└── README.md                # Project documentation
```

## Version History

### v1.0.0 (Current Version) - March 2026

**Major Features**:
- ✅ Basic ETL workflow engine
- ✅ DataSource management (MySQL, PostgreSQL, SQLite, Doris)
- ✅ Data input components (SQL, CSV, JSON)
- ✅ Data processing components (conversion, filtering, masking)
- ✅ Data output components (SQL, CSV, JSON, Doris)
- ✅ SQL executor and variable components
- ✅ RESTful API
- ✅ Web management interface
- ✅ Task scheduling and monitoring
- ✅ JWT authentication
- ✅ AES encryption for sensitive information storage

**Known Issues**:
- Performance monitoring needs improvement
- Some advanced features need refinement
- Documentation system is under construction

### Future Roadmap

**v1.1.0** (Planned):
- [ ] Add more data source support (Kafka, MongoDB, etc.)
- [ ] Improve performance optimization
- [ ] Enhance error handling mechanisms
- [ ] Add more processor components

**v1.2.0** (Planned):
- [ ] Machine learning integration
- [ ] Distributed ETL support
- [ ] More powerful scheduling system
- [ ] Community plugin marketplace

## Contribution Guide

### How to Contribute

We welcome contributions in all forms! Here are ways you can participate:

#### 1. Submit Code

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

#### 2. Report Bugs

If you find a bug, please create an issue containing:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or screenshots
- Environment information (Go version, OS, etc.)

#### 3. Propose New Features

Feel free to propose ideas for new features! Please include:
- Feature description
- Use cases
- Expected outcomes
- Possible implementation approaches (optional)

#### 4. Improve Documentation

Documentation is equally important! You can:
- Correct typos and grammar errors
- Supplement missing explanations
- Improve document structure and readability
- Add code examples

### Development Setup

```bash
# Clone repository
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# Install dependencies
go mod download
cd web && pnpm install && cd ..

# Run tests
go test ./...
cd web && pnpm test && cd ..

# Start development servers
go run main.go &
cd web && pnpm dev
```

### Code Style

- Follow [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` to format code
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- Add unit tests for new features

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type Options**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting (no functional change)
- `refactor`: Code refactoring
- `test`: Testing related
- `chore`: Build/tool related

**Example**:
```
feat(source): Add Oracle data source support

Added Oracle database as a configurable data source option
- Implemented Oracle connection management
- Support Oracle-specific data types
- Added relevant test cases

Closes #123
```

## Community and Support

### Communication Channels

- **GitHub Issues**: Report and discuss problems
- **GitHub Discussions**: General discussion and questions
- **Email List**: contact@etl-go.dev (to be established)

### Open Source License

This project is licensed under [MIT License](LICENSE), which means you can:
- ✅ Use freely
- ✅ Modify code
- ✅ Distribute software
- ✅ Use for commercial purposes

With the requirement to:
- ✅ Retain copyright notice
- ✅ Include license disclaimer

### Acknowledgments

Thanks to the following open-source projects and technologies:
- [Go](https://golang.org/) - High-performance programming language
- [Gin](https://gin-gonic.com/) - Web framework
- [Vue.js](https://vuejs.org/) - Frontend framework
- [Element Plus](https://element-plus.org/) - UI component library
- [Apache Doris](https://doris.apache.org/) - Real-time data analytics platform

## Contact Information

### Project Maintainers

- **Author**: Bernard Simon
- **Email**: bernard.simon@example.com
- **GitHub**: [@BernardSimon](https://github.com/BernardSimon)

### Feedback and Suggestions

If you have any questions, suggestions, or cooperation interests, please feel free to contact us through:

1. Create an Issue or Discussion on GitHub
2. Send email to contact@etl-go.dev
3. Participate in community discussions

## License

Copyright (c) 2026 Bernard Simon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

*Last Updated: 2026-03-17*  
*Author: etl-go Development Team*  
*Version: 1.0.0*