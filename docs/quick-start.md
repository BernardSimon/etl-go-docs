# 快速开始
ETL-GO是一款开箱即用的开源数据集成工具，旨在帮助用户快速集成数据，实现数据离线同步，并提供计划任务、系统变量、前后置脚本来帮助用户解放双手，实现数据自动集成。
## 特性
- **开箱即用**：内置多种常用的数据源、处理器和目标组件
- **高扩展性**：插件化架构，支持自定义组件开发
- **可视化配置**：提供Web界面进行任务配置和监控
- **多数据源支持**：MySQL、PostgreSQL、SQLite、Doris、CSV、JSON等
- **丰富的处理器**：数据类型转换、行过滤、数据脱敏、列重命名等
- **任务调度**：支持定时任务和手动触发
- **变量管理**：动态配置和SQL变量支持
- **文件管理**：内置文件上传和管理功能
- **日志监控**：完善的日志记录和任务执行监控
## 主要功能
## 目前官方插件
### 数据源 (DataSource)
- MySQL
- PostgreSQL
- SQLite
- Doris
### 数据输入 (Source)
- SQL查询（MySQL、PostgreSQL、SQLite）
- CSV文件
- JSON文件
### 数据处理 (Processor)
- convertType: 数据类型转换
- filterRows: 行过滤
- maskData: 数据脱敏（MD5、SHA256）
- renameColumn: 列重命名
- selectColumns: 列选择
### 数据输出 (Sink)
- SQL表（MySQL、PostgreSQL、SQLite）
- CSV文件
- JSON文件
- Doris快速输出(stream_load)
### 执行器 (Executor)
- SQL执行（MySQL、PostgreSQL、SQLite）
### 变量 (Variable)
- SQL查询变量（MySQL、PostgreSQL、SQLite）
::: warning 注意！
若官方提供的插件无法满足您的需求，在使用第三方插件前请仔细核实插件信息，以免数据库敏感信息泄露，或数据损坏。
:::
## 技术栈
本项目基于 [go-pocket-etl](https://github.com/changhe626/go-pocket-etl) 核心代码进行开发，其中后端基于Gin、GORM、Sqlite、Zap进行开发，前端基于Vue3、Antdv进行开发。
