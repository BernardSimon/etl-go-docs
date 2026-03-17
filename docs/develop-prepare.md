---
outline: deep
---

# 开发准备

在开始开发 etl-go 之前，请确保您的开发环境满足以下要求，并准备好必要的工具和依赖。

## 环境要求

### 操作系统
- **Windows 10+** (推荐 Windows 11)
- **macOS 12+** (推荐 macOS 14+)
- **Linux** (Ubuntu 22.04+, CentOS 8+, 或其他主流发行版)

### 开发工具

#### 1. Go 语言环境
- **Go 版本**: 1.24.4 或更高版本
- **安装方式**:
  ```bash
  # macOS (使用 Homebrew)
  brew install go@1.24
  
  # Ubuntu/Debian
  wget https://go.dev/dl/go1.24.4.linux-amd64.tar.gz
  sudo tar -C /usr/local -xzf go1.24.4.linux-amd64.tar.gz
  echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
  source ~/.bashrc
  
  # Windows
  # 从 https://go.dev/dl/ 下载安装包并安装
  ```

- **验证安装**:
  ```bash
  go version
  # 应输出: go version go1.24.4 linux/amd64
  ```

#### 2. Node.js 环境 (前端开发需要)
- **Node.js 版本**: 18.0.0 或更高版本
- **npm 版本**: 9.0.0 或更高版本
- **推荐使用 pnpm** (项目使用 pnpm):
  ```bash
  # 安装 pnpm
  npm install -g pnpm
  
  # 验证
  pnpm --version
  ```

#### 3. Git 版本控制
- **Git 版本**: 2.30.0 或更高版本
- **安装方式**:
  ```bash
  # Ubuntu/Debian
  sudo apt install git
  
  # macOS
  brew install git
  
  # Windows
  # 从 https://git-scm.com/ 下载安装
  ```

### 数据库 (测试需要)

#### 4. SQLite (默认数据库)
etl-go 默认使用 SQLite 作为元数据存储，无需额外安装。

#### 5. MySQL (可选，用于测试)
```bash
# Ubuntu/Debian
sudo apt install mysql-server mysql-client

# macOS
brew install mysql

# 启动服务
sudo systemctl start mysql  # Linux
brew services start mysql   # macOS
```

#### 6. PostgreSQL (可选，用于测试)
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# 启动服务
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

## 开发工具推荐

### IDE/编辑器
1. **Visual Studio Code** (推荐)
   - 安装 Go 扩展
   - 安装 Vue 扩展
   - 安装 ESLint 扩展

2. **Goland** (JetBrains)
   - 专业的 Go IDE
   - 内置强大的调试和分析工具

3. **Vim/Neovim** (高级用户)
   - 配置 Go 开发环境
   - 使用 coc.nvim 或 LSP 支持

### 命令行工具
```bash
# 构建工具
go build    # Go 编译
pnpm build  # 前端构建

# 代码质量
gofmt       # Go 代码格式化
golint      # Go 代码检查
eslint      # JavaScript/TypeScript 代码检查

# 依赖管理
go mod tidy # 清理 Go 依赖
pnpm install # 安装前端依赖
```

## 项目设置

### 1. 工作目录结构
建议按以下结构组织开发环境：
```
~/projects/
├── etl-go/           # 主项目
├── etl-go-docs/      # 文档项目
└── etl-go-examples/  # 示例代码
```

### 2. 环境变量配置
在 `~/.bashrc` 或 `~/.zshrc` 中添加：
```bash
# Go 环境变量
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export PATH=$PATH:/usr/local/go/bin

# 项目别名
alias etl-go="cd ~/projects/etl-go"
alias etl-docs="cd ~/projects/etl-go-docs"
```

### 3. Git 配置
```bash
# 设置用户信息
git config --global user.name "您的姓名"
git config --global user.email "您的邮箱"

# 设置默认编辑器
git config --global core.editor "code --wait"

# 设置行尾转换 (Windows 用户需要)
git config --global core.autocrlf true
```

## 获取代码

### 1. 克隆主项目
```bash
# 克隆 etl-go 主项目
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# 查看项目结构
ls -la
```

### 2. 克隆文档项目
```bash
# 克隆文档项目
git clone https://github.com/BernardSimon/etl-go-docs.git
cd etl-go-docs
```

### 3. 验证项目完整性
```bash
# 进入 etl-go 目录
cd etl-go

# 检查 Go 模块
go mod download
go mod verify

# 检查前端依赖 (如果需要前端开发)
cd web
pnpm install
```

## 开发工作流

### 1. 分支策略
```bash
# 从主分支创建开发分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送分支
git push origin feature/your-feature-name
```

### 2. 代码规范

#### Go 代码规范
- 使用 `gofmt` 格式化代码
- 遵循 Go 官方代码规范
- 使用有意义的变量和函数名
- 添加必要的注释

#### 前端代码规范
- 使用 ESLint 检查代码
- 遵循 Vue.js 最佳实践
- 使用 TypeScript 类型定义

### 3. 测试流程
```bash
# 运行单元测试
go test ./...

# 运行特定测试
go test ./etl/core/...

# 测试覆盖率
go test -cover ./...
```

## 常见问题排查

### 1. Go 模块问题
```bash
# 清理模块缓存
go clean -modcache

# 重新下载依赖
go mod tidy
```

### 2. 前端构建问题
```bash
# 清除 node_modules
rm -rf node_modules
rm -rf pnpm-lock.yaml

# 重新安装
pnpm install
```

### 3. 数据库连接问题
- 检查数据库服务是否运行
- 验证连接参数是否正确
- 查看日志文件获取详细错误信息

## 下一步

环境准备完成后，您可以：
1. **[获取主程序代码](./develop-source.md)** - 了解如何获取和设置代码
2. **[学习代码架构](./develop-architecture.md)** - 理解项目整体架构
3. **[开始组件开发](./develop-component-architecture.md)** - 学习如何开发自定义组件

## 获取帮助

如果在环境准备过程中遇到问题：
1. 查看项目 [GitHub Issues](https://github.com/BernardSimon/etl-go/issues)
2. 查阅现有文档
3. 在社区论坛提问

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*