---
outline: deep
---

# 获取主程序代码

本文档介绍如何获取 etl-go 的主程序代码，包括克隆仓库、设置开发环境、理解代码结构以及如何开始贡献代码。

## 代码仓库

### 官方仓库
etl-go 的主代码仓库位于 GitHub：

- **仓库地址**: https://github.com/BernardSimon/etl-go
- **许可证**: Apache License 2.0
- **主分支**: `main`
- **最新版本**: 查看 [Releases](https://github.com/BernardSimon/etl-go/releases)

### 镜像仓库
如有需要，也可以通过以下镜像访问：
- **Gitee**: https://gitee.com/BernardSimon/etl-go (国内加速)

## 获取代码

### 1. 克隆仓库

#### 使用 HTTPS (推荐)
```bash
# 克隆主仓库
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# 或者使用国内镜像 (如果 GitHub 访问慢)
git clone https://gitee.com/BernardSimon/etl-go.git
cd etl-go
git remote set-url origin https://github.com/BernardSimon/etl-go.git
```

#### 使用 SSH (需要配置 SSH 密钥)
```bash
# 克隆主仓库
git clone git@github.com:BernardSimon/etl-go.git
cd etl-go
```

### 2. 选择分支

```bash
# 查看所有分支
git branch -a

# 切换到主分支
git checkout main

# 拉取最新代码
git pull origin main

# 创建开发分支
git checkout -b feature/your-feature-name
```

### 3. 子模块初始化 (如果有)
```bash
# 如果项目包含子模块，初始化并更新
git submodule init
git submodule update
```

## 项目结构概览

克隆后，您将看到以下项目结构：

```
etl-go/
├── README.md            # 项目说明文档
├── main.go              # 程序入口文件
├── config.yaml          # 配置文件模板
├── go.mod              # Go 模块定义
├── go.sum              # 依赖锁定文件
├── LICENSE             # 许可证文件
├── NOTICE              # 声明文件
├── .gitignore          # Git 忽略配置
├── etl/                # ETL 引擎核心
│   ├── core/           # 核心接口定义
│   ├── factory/        # 工厂模式实现
│   ├── pipeline/       # 流水线执行引擎
│   └── init.go         # 初始化函数
├── components/         # 组件实现
│   ├── datasource/     # 数据源组件
│   ├── sources/        # 数据提取组件
│   ├── processors/     # 数据处理组件
│   ├── sinks/          # 数据加载组件
│   ├── executor/       # 执行器组件
│   └── variable/       # 变量组件
├── server/             # 后端 API 服务
│   ├── api/           # API 处理器
│   ├── model/         # 数据模型
│   ├── type/          # 类型定义
│   ├── config/        # 配置管理
│   ├── router/        # 路由定义
│   ├── task/          # 任务调度
│   └── utils/         # 工具函数
└── web/               # 前端界面
    ├── src/           # 前端源代码
    ├── package.json   # 前端依赖配置
    ├── vite.config.ts # 构建配置
    └── index.html     # 入口 HTML
```

## 设置开发环境

### 1. 依赖安装

#### Go 依赖
```bash
# 下载所有 Go 依赖
go mod download

# 验证依赖完整性
go mod verify

# 清理不必要的依赖
go mod tidy
```

#### 前端依赖 (可选，如需前端开发)
```bash
# 进入前端目录
cd web

# 安装依赖 (使用 pnpm)
pnpm install

# 或者使用 npm
npm install
```

### 2. 开发配置

#### 创建本地配置文件
```bash
# 复制配置文件模板
cp config.yaml config.local.yaml

# 编辑本地配置
# 修改用户名、密码、端口等配置
```

#### 配置示例 (`config.local.yaml`)
```yaml
username: admin
password: your-secure-password
jwtSecret: your-jwt-secret-key
aesKey: your-aes-encryption-key
initDb: true  # 首次运行设为 true
logLevel: dev
serverUrl: localhost:8080
runWeb: true  # 如果已编译前端，设为 true
webUrl: localhost:8081
```

### 3. 数据库初始化

首次运行需要初始化数据库：
```bash
# 确保 config.local.yaml 中 initDb: true
go run main.go --config config.local.yaml
```

初始化完成后，将 `initDb` 改回 `false`。

## 验证安装

### 1. 编译验证
```bash
# 编译项目
go build -o etl-go .

# 检查可执行文件
./etl-go --version
```

### 2. 运行测试
```bash
# 运行所有测试
go test ./...

# 运行特定模块测试
go test ./etl/core/...

# 运行带覆盖率的测试
go test -cover ./...
```

### 3. 启动服务
```bash
# 使用本地配置启动
./etl-go --config config.local.yaml

# 或者直接运行
go run main.go --config config.local.yaml
```

访问 Web 界面：http://localhost:8081

## 代码贡献

### 1. 贡献流程

#### 标准 GitHub 流程
1. **Fork 仓库**: 在 GitHub 上 Fork etl-go 仓库
2. **克隆 Fork**: `git clone https://github.com/your-username/etl-go.git`
3. **添加上游**: `git remote add upstream https://github.com/BernardSimon/etl-go.git`
4. **创建分支**: `git checkout -b feature/your-feature`
5. **提交更改**: `git commit -m "feat: description"`
6. **推送到 Fork**: `git push origin feature/your-feature`
7. **创建 PR**: 在 GitHub 上创建 Pull Request

#### 简化流程 (直接贡献)
如果您是项目成员，可以直接在主仓库创建分支：
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
# 开发...
git push origin feature/your-feature
```

### 2. 提交规范

遵循 Conventional Commits 规范：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具

示例：
```bash
git commit -m "feat: 添加 MySQL 数据源组件"
git commit -m "fix: 修复数据转换中的空指针错误"
git commit -m "docs: 更新组件开发指南"
```

### 3. 代码审查

提交 PR 前，请确保：
- [ ] 代码通过所有测试
- [ ] 添加了必要的测试用例
- [ ] 更新了相关文档
- [ ] 遵循项目代码规范
- [ ] 提交信息清晰明确

## 版本管理

### 1. 版本号规范
遵循语义化版本控制 (SemVer):
- `MAJOR.MINOR.PATCH` (例如: `1.2.3`)
- `MAJOR`: 不兼容的 API 更改
- `MINOR`: 向后兼容的功能性新增
- `PATCH`: 向后兼容的问题修复

### 2. 发布流程
1. **创建发布分支**: `git checkout -b release/v1.2.3`
2. **更新版本号**: 修改相关文件中的版本信息
3. **更新 CHANGELOG**: 记录本次发布的变更
4. **提交并推送**: `git commit -m "chore: release v1.2.3"`
5. **创建标签**: `git tag -a v1.2.3 -m "Release v1.2.3"`
6. **推送标签**: `git push origin v1.2.3`
7. **创建 GitHub Release**

## 故障排除

### 常见问题

#### 1. 依赖下载失败
```bash
# 设置 Go 代理 (国内用户)
go env -w GOPROXY=https://goproxy.cn,direct

# 或者使用阿里云代理
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
```

#### 2. 编译错误
```bash
# 清理构建缓存
go clean -cache

# 重新下载依赖
go mod download
```

#### 3. 前端构建失败
```bash
# 清理 node_modules
cd web
rm -rf node_modules
rm -rf pnpm-lock.yaml

# 重新安装
pnpm install
```

#### 4. 数据库连接问题
- 检查数据库服务是否运行
- 验证连接参数是否正确
- 查看日志文件获取详细错误信息

## 获取帮助

### 1. 文档资源
- **项目文档**: https://etl.ziyi.chat/
- **API 文档**: 运行服务后访问 http://localhost:8080/swagger/index.html
- **开发指南**: 本项目文档

### 2. 社区支持
- **GitHub Issues**: https://github.com/BernardSimon/etl-go/issues
- **讨论区**: GitHub Discussions
- **邮件列表**: (如果有)

### 3. 紧急联系
对于关键问题，可以直接联系维护者。

## 下一步

获取代码并设置好环境后，您可以：
1. **[学习代码架构](./develop-architecture.md)** - 深入理解项目设计
2. **[开发自定义组件](./develop-component-architecture.md)** - 开始扩展功能
3. **[参与代码贡献](#代码贡献)** - 为项目做出贡献

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*