---
outline: deep
---

# 关于 etl-go

本文档介绍 etl-go 项目的背景、愿景、团队和社区信息。

## 项目简介

### 什么是 etl-go

etl-go 是一个现代化、高性能、易于使用的开源 ETL（Extract, Transform, Load）工具，旨在帮助开发者和数据工程师轻松构建和管理数据处理流程。

**核心特性**:
- 🚀 **开箱即用**: 内置多种常用的数据源、处理器和目标组件
- 🔧 **高扩展性**: 插件化架构，支持自定义组件开发
- 🎨 **可视化配置**: 提供 Web 界面进行任务配置和监控
- 🗄️ **多数据源支持**: MySQL、PostgreSQL、SQLite、Doris、CSV、JSON 等
- 🔄 **丰富的处理器**: 数据类型转换、行过滤、数据脱敏、列重命名等
- ⏰ **任务调度**: 支持定时任务和手动触发
- 📊 **变量管理**: 动态配置和 SQL 变量支持
- 📁 **文件管理**: 内置文件上传和管理功能
- 📝 **日志监控**: 完善的日志记录和任务执行监控

### 设计理念

1. **简单至上**: 简化复杂的 ETL 流程配置
2. **性能优先**: 基于 Go 语言的高并发优势
3. **可扩展性**: 模块化设计，易于添加新功能
4. **用户友好**: 提供直观的 Web 管理界面
5. **生产就绪**: 经过充分测试的稳定可靠

## 技术栈

### 后端技术
- **语言**: Go 1.24.4
- **数据库**: SQLite (元数据存储)
- **ORM**: GORM
- **Web 框架**: Gin
- **配置文件**: Viper

### 前端技术
- **框架**: Vue 3 + TypeScript
- **UI 库**: Element Plus
- **构建工具**: Vite
- **状态管理**: Pinia
- **HTTP 客户端**: Axios

### 依赖管理
- Go Modules
- npm/pnpm

## 项目结构

```
etl-go/
├── components/              # 所有组件实现
│   ├── datasource/         # 数据源组件
│   │   ├── doris/          # Apache Doris
│   │   ├── mysql/          # MySQL
│   │   ├── postgre/        # PostgreSQL
│   │   └── sqlite/         # SQLite
│   ├── sources/            # 数据输入组件
│   │   ├── csv/            # CSV 文件
│   │   ├── json/           # JSON 文件
│   │   └── sql/            # SQL 查询
│   ├── processors/         # 数据处理组件
│   │   ├── convertType/    # 类型转换
│   │   ├── filterRows/     # 行过滤
│   │   ├── maskData/       # 数据脱敏
│   │   ├── renameColumn/   # 重命名列
│   │   └── selectColumns/  # 选择列
│   ├── sinks/              # 数据输出组件
│   │   ├── csv/            # CSV 文件
│   │   ├── json/           # JSON 文件
│   │   ├── sql/            # SQL 数据库
│   │   └── doris/          # Apache Doris
│   ├── executor/           # 执行器组件
│   │   └── sql/            # SQL 执行器
│   └── variable/           # 变量组件
│       └── sql/            # SQL 变量
├── etl/                     # 核心引擎
│   ├── core/               # 核心接口定义
│   ├── factory/            # 工厂模式实现
│   └── pipeline/           # 流水线执行
├── server/                  # 后端服务
│   ├── api/                # RESTful API
│   ├── config/             # 配置管理
│   ├── model/              # 数据模型
│   ├── router/             # 路由配置
│   ├── task/               # 任务调度
│   └── utils/              # 工具函数
├── web/                     # Web 前端界面
│   ├── src/
│   │   ├── api/            # API 调用
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # Vue 组件
│   │   ├── layouts/        # 布局组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   ├── types/          # TypeScript 类型
│   │   └── views/          # 页面视图
│   └── package.json        # 前端依赖
├── main.go                  # 程序入口
├── config.yaml.example      # 配置示例
├── go.mod                   # Go 依赖
└── README.md                # 项目说明
```

## 版本历史

### v1.0.0 (当前版本) - 2026 年 3 月

**主要功能**:
- ✅ 基础 ETL 流程引擎
- ✅ 数据源管理（MySQL、PostgreSQL、SQLite、Doris）
- ✅ 数据输入组件（SQL、CSV、JSON）
- ✅ 数据处理组件（转换、过滤、脱敏）
- ✅ 数据输出组件（SQL、CSV、JSON、Doris）
- ✅ SQL 执行器和变量组件
- ✅ RESTful API
- ✅ Web 管理界面
- ✅ 任务调度和监控
- ✅ JWT 认证
- ✅ AES 加密存储敏感信息

**已知问题**:
- 性能监控有待加强
- 部分高级功能需要完善
- 文档体系正在建设中

### 未来规划

**v1.1.0** (计划中):
- [ ] 增加更多数据源支持（Kafka、MongoDB 等）
- [ ] 改进性能优化
- [ ] 增强错误处理机制
- [ ] 添加更多的处理器组件

**v1.2.0** (计划中):
- [ ] 机器学习集成
- [ ] 分布式 ETL 支持
- [ ] 更强大的调度系统
- [ ] 社区插件市场

## 贡献指南

### 如何贡献

我们欢迎各种形式的贡献！以下是您可以参与的方式：

#### 1. 提交代码

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的变更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

#### 2. 报告 Bug

如果您发现 Bug，请创建一个 issue，包含：
- 清晰的描述
- 复现步骤
- 期望行为和实际行为
- 相关日志或截图
- 环境信息（Go 版本、操作系统等）

#### 3. 提出新功能

欢迎提出新功能的想法！请包含：
- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案（可选）

#### 4. 改进文档

文档同样重要！您可以：
- 纠正错别字和语法错误
- 补充缺失的说明
- 改善文档结构和可读性
- 添加示例代码

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go

# 安装依赖
go mod download
cd web && pnpm install && cd ..

# 运行测试
go test ./...
cd web && pnpm test && cd ..

# 启动开发服务器
go run main.go &
cd web && pnpm dev
```

### 代码规范

- 遵循 [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- 使用 `gofmt` 格式化代码
- 提交消息遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- 为新功能添加单元测试

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type 可选值**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat(source): 添加 Oracle 数据源支持

新增 Oracle 数据库作为可配置的数据源选项
- 实现了 Oracle 连接管理
- 支持 Oracle 特有数据类型
- 添加相关测试用例

Closes #123
```

## 社区和支持

### 交流渠道

- **GitHub Issues**: 报告和讨论问题
- **GitHub Discussions**: 一般讨论和提问
- **邮件列表**: contact@etl-go.dev (待建立)

### 开源协议

本项目采用 [MIT License](LICENSE)，这意味着您可以：
- ✅ 自由使用
- ✅ 修改代码
- ✅ 分发软件
- ✅ 用于商业目的

仅需：
- ✅ 保留版权通知
- ✅ 包含许可声明

### 致谢

感谢以下开源项目和技术：
- [Go](https://golang.org/) - 高性能编程语言
- [Gin](https://gin-gonic.com/) - Web 框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI 组件库
- [Apache Doris](https://doris.apache.org/) - 实时数据分析平台

## 联系方式

### 项目维护者

- **Author**: Bernard Simon
- **Email**: bernard.simon@example.com
- **GitHub**: [@BernardSimon](https://github.com/BernardSimon)

### 反馈建议

如有任何问题、建议或合作意向，欢迎通过以下方式联系我们：

1. 在 GitHub 上提 Issue 或 Discussion
2. 发送邮件至 contact@etl-go.dev
3. 参与社区讨论

## 许可证

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

*最后更新：2026-03-17*  
*作者：etl-go 开发团队*  
*版本：1.0.0*