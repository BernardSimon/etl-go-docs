---
outline: deep
---

# 获取组件开发包

本文档介绍如何获取和使用 etl-go 的开发组件包，包括预构建的组件库、示例代码、开发工具和依赖管理。

## 概述

### 什么是组件开发包

组件开发包是 etl-go 提供的完整开发资源集合，包含：
- **核心组件库**: MySQL、PostgreSQL、SQLite、Doris 等数据源组件
- **处理器组件**: 类型转换、数据过滤、脱敏等处理组件
- **输出组件**: SQL、CSV、JSON、Doris 加载等输出组件
- **执行器组件**: SQL 执行器、系统命令执行器等
- **变量组件**: SQL 查询变量组件
- **示例代码**: 完整可运行的示例项目
- **开发工具**: 脚手架、模板和插件

### 为什么需要开发包

使用组件开发包的好处：
1. **快速开始**: 开箱即用，节省配置时间
2. **质量保证**: 经过充分测试的成熟组件
3. **最佳实践**: 遵循 etl-go 规范和标准
4. **技术支持**: 官方维护和社区支持
5. **持续更新**: 定期获得功能更新和 bug 修复

## 获取方式

### 方式一：从 GitHub 克隆主仓库（推荐）

这是最完整的获取方式，包含所有组件源码和文档：

```bash
# 克隆主仓库
git clone https://github.com/BernardSimon/etl-go.git

# 或者使用 Gitee 镜像（国内访问更快）
git clone https://gitee.com/BernardSimon/etl-go.git

# 进入项目目录
cd etl-go

# 查看项目结构
tree -L 3
```

**项目结构说明**:
```
etl-go/
├── components/         # 所有组件源码
│   ├── datasource/    # 数据源组件
│   ├── executor/      # 执行器组件
│   ├── processors/    # 处理器组件
│   ├── sinks/         # 输出组件
│   ├── sources/       # 输入组件
│   └── variable/      # 变量组件
├── etl/               # 核心引擎
├── server/            # 后端服务
├── web/               # Web 界面
├── go.mod             # Go 模块定义
└── README.md          # 项目说明
```

### 方式二：通过 Go Modules 获取

如果您只需要特定的组件模块：

```bash
# 获取单个组件模块
go get github.com/BernardSimon/etl-go/components/datasource/mysql@latest
go get github.com/BernardSimon/etl-go/components/processors/convertType@latest
go get github.com/BernardSimon/etl-go/components/sinks/sql@latest
```

### 方式三：下载预编译二进制文件

适用于只运行 ETL 任务而不进行开发的场景：

```bash
# 从 Release 页面下载
curl -LO https://github.com/BernardSimon/etl-go/releases/download/v1.0.0/etl-go-linux-amd64.zip

# 解压
unzip etl-go-linux-amd64.zip

# 查看版本
./etl-go version
```

## 组件目录详解

### 数据源组件 (components/datasource/)

| 组件名称 | 描述 | 路径 |
|---------|------|------|
| Doris | Apache Doris 数据源 | `components/datasource/doris/` |
| MySQL | MySQL 数据库连接 | `components/datasource/mysql/` |
| PostgreSQL | PostgreSQL 数据库连接 | `components/datasource/postgre/` |
| SQLite | SQLite 嵌入式数据库 | `components/datasource/sqlite/` |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/datasource/mysql"
)

// 注册 MySQL 数据源
name, sink, dsName, params := mysql.DatasourceCreatorMysql()
// name = "mysql"
// dsName = "mysql"
```

### 输入组件 (components/sources/)

| 组件名称 | 描述 | 路径 |
|---------|------|------|
| CSV | 从 CSV 文件读取 | `components/sources/csv/` |
| JSON | 从 JSON 文件读取 | `components/sources/json/` |
| SQL | 从 SQL 查询读取 | `components/sources/sql/` |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/sources/csv"
)

// 创建 CSV 数据输入
name, source, _, params := csv.SourceCreatorCSV()
```

### 处理器组件 (components/processors/)

| 组件名称 | 描述 | 功能 |
|---------|------|------|
| convertType | 类型转换 | 将字段转换为指定类型 |
| filterRows | 行过滤 | 根据条件过滤记录 |
| maskData | 数据脱敏 | 对敏感数据进行脱敏 |
| renameColumn | 重命名列 | 修改列名 |
| selectColumns | 选择列 | 只保留指定列 |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/processors/convertType"
)

// 创建类型转换处理器
name, processor, params := convertType.ProcessorCreator()
```

### 输出组件 (components/sinks/)

| 组件名称 | 描述 | 路径 |
|---------|------|------|
| SQL | 写入 SQL 数据库 | `components/sinks/sql/` |
| CSV | 写入 CSV 文件 | `components/sinks/csv/` |
| JSON | 写入 JSON 文件 | `components/sinks/json/` |
| Doris | 写入 Apache Doris | `components/sinks/doris/` |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/sinks/csv"
)

// 创建 CSV 数据输出
name, sink, _, params := csv.SinkCreatorCSV()
```

### 执行器组件 (components/executor/)

| 组件名称 | 描述 | 路径 |
|---------|------|------|
| SQL | 执行 SQL 语句 | `components/executor/sql/` |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/executor/sql"
)

// 创建 SQL 执行器
name, executor, dsName, params := sql.ExecutorCreatorMysql()
```

### 变量组件 (components/variable/)

| 组件名称 | 描述 | 路径 |
|---------|------|------|
| SQL | 从 SQL 查询获取变量 | `components/variable/sql/` |

**使用方法**:
```go
import (
    "github.com/BernardSimon/etl-go/components/variable/sql"
)

// 创建 SQL 变量
name, variable, dsName, params := sql.VariableCreatorMysql()
```

## 开发环境配置

###  prerequisites

安装以下工具：
```bash
# Go 语言环境 (需要 1.21 或更高版本)
go version

# Git
git --version

# 可选：Code generator
golang.org/x/tools/cmd/stringer@latest
```

### 设置工作空间

```bash
# 创建工作空间目录
mkdir -p ~/projects/go && cd ~/projects/go

# 克隆 etl-go 项目
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# 查看依赖
go mod download

# 运行测试验证安装
go test ./...
```

### 开发工具推荐

1. **IDE**: VS Code、GoLand、Vim/Nvim
2. **格式化**: `gofmt`, `golangci-lint`
3. **调试**: Delve (`dlv`)
4. **测试**: `gotestsum`, `testify`

## 构建和部署

### 本地构建

```bash
# 进入项目根目录
cd /path/to/etl-go

# 构建命令行工具
go build -o bin/etl-go main.go

# 构建 Web + API 分离版本
go build -o bin/etl-go-server ./server/main.go
go build -o bin/etl-go-web ./web/main.go

# 运行单元测试
go test -v ./...

# 运行集成测试
go test -v -tags=integration ./...
```

### Docker 构建

```bash
# 从 Docker Hub 拉取镜像
docker pull bernardsimon/etl-go:latest

# 或使用本地 Dockerfile 构建
docker build -t etl-go:local .

# 运行容器
docker run -it \
  -v $(pwd)/config.yaml:/etc/etl-go/config.yaml \
  -p 8080:8080 \
  -p 8081:8081 \
  etl-go:local
```

## 自定义组件开发

### 创建新项目结构

```bash
# 创建自定义组件目录
mkdir -p components/custom/my-source/{src,test}

# 初始化 Go 模块
cd components/custom/my-source
go mod init github.com/BernardSimon/etl-go/components/custom/my-source

# 添加依赖
go get github.com/BernardSimon/etl-go/etl/core/source
```

### 使用模板快速开始

```bash
# 复制组件模板
cp -r components/templates/source-tpl my-source

# 修改源代码
cd my-source/src
# 编辑 main.go 实现你的逻辑

# 编写测试
cd test
# 编辑 source_test.go
```

### 注册到主模块

在主模块的 `components/register.go` 中添加：

```go
import (
    _ "your-module/my-source"
)
```

## 依赖管理

### Go Modules

```bash
# 查看所有依赖
go list -m all

# 查看特定依赖详情
go list -m -json github.com/BernardSimon/etl-go/components/datasource/mysql

# 更新依赖
go get -u ./...

# 清理未使用的依赖
go mod tidy

# 查看依赖漏洞
govulncheck ./...
```

### vendor 模式（可选）

```bash
# 将依赖复制到 vendor 目录
go mod vendor

# 使用 vendor 模式构建
go build -mod=vendor
```

## 示例代码

### 完整 ETL 流程示例

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
    // 1. 创建数据源
    dsName, ds, params := mysql.DatasourceCreatorMysql()
    
    // 2. 创建输入组件
    srcName, source, _, srcParams := sql.SourceCreatorMysql()
    
    // 3. 创建处理器
    procName, processor, procParams := convertType.ProcessorCreator()
    
    // 4. 创建输出组件
    sinkName, sink, _, sinkParams := sqlSink.SinkCreatorMysql()
    
    // 5. 构建管道
    pipe := pipeline.NewPipeline()
    pipe.AddSource(source, ds, srcParams)
    pipe.AddProcessor(processor, procParams)
    pipe.AddSink(sink, sinkParams)
    
    // 6. 运行管道
    err := pipe.Run()
    if err != nil {
        log.Fatal(err)
    }
}
```

### 配置文件示例

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

## 常见问题

### 1. 找不到组件模块

**问题**: `go get` 时提示找不到模块
**解决方案**:
```bash
# 检查网络是否可访问 GitHub
ping github.com

# 使用GOPROXY
export GOPROXY=https://goproxy.cn,direct

# 或者使用 Gitee
export GOPROXY=https://gitee.com/proxy,direct
```

### 2. 版本兼容性问题

**问题**: 组件与主程序版本不匹配
**解决方案**:
```bash
# 确保所有依赖版本一致
go mod graph | grep BernardSimon/etl-go

# 升级所有依赖到最新
go get -u ./...
go mod tidy

# 或者锁定特定版本
go get github.com/BernardSimon/etl-go/components@v1.0.0
```

### 3. 跨平台编译问题

**问题**: 在不同操作系统上构建失败
**解决方案**:
```bash
# 交叉编译
GOOS=linux GOARCH=amd64 go build -o etl-go-linux
GOOS=darwin GOARCH=amd64 go build -o etl-go-macos
GOOS=windows GOARCH=amd64 go build -o etl-go-windows.exe

# 使用 docker 构建
docker buildx build --platform linux/amd64,linux/arm64 -t etl-go .
```

## 下一步

完成组件开发包了解后，您可以：
1. **[关于我们](./about.md)** - 了解 etl-go 项目背景和社区
2. **[快速开始](./quick-start.md)** - 实际运行一个 ETL 任务
3. **[深入学习](./develop-architecture.md)** - 研究架构设计

---

*文档版本: 1.0.0*  
*最后更新：2026-03-17*  
*作者：etl-go 开发团队*