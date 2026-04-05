
# 获取主程序代码

如果你要进行二开或排查重构后的行为，建议先按以下顺序阅读代码，而不是从页面功能倒推。

## 建议阅读路径（30 分钟入门）

1. `main.go`：启动入口，负责配置加载、日志初始化、数据库初始化、路由启动、调度启动。
2. `etl/init.go`：内置组件统一注册，能快速看到平台支持的组件全集。
3. `server/router/router.go`：REST API 全量路由定义（`/api/v1/*`）。
4. `server/task/task.go`：任务装配与执行主流程。
5. `etl/pipeline/engine.go`：并发 pipeline 编排、错误传播、资源关闭。
6. `server/task/component.go`：组件参数构建与数据源初始化（含共享租约）。

## 仓库目录职责

- `main.go`：服务入口，负责加载配置、初始化日志、数据库、路由和调度
- `etl/`：核心引擎，包括组件工厂与 pipeline 执行逻辑
- `components/`：内置组件实现
- `server/`：后端 API、模型、路由与任务调度
- `web/`：前端控制台源码

## 任务执行调用链（重构后）

`RunTask -> Create* (factory) -> initDatasource -> pipeline.NewEngine -> engine.Run`

关键点：

- 任务启动前会执行变量替换（只替换参数值，不破坏 JSON 结构）。
- 组件通过工厂按 `type` 创建，不走大量 `switch`。
- 同一任务内可复用同一个数据源连接（共享租约）。
- 执行链路统一使用 `context.Context`，支持取消传播。
- Source / Processor / Sink 采用 goroutine + channel 流水线运行。

## 快速定位问题的文件索引

- 组件未识别：`etl/init.go`、`etl/factory/factory.go`
- 任务启动失败：`server/task/task.go`
- 数据源类型错误：`server/task/component.go`
- 参数合法性错误：对应组件实现目录（如 `components/sources/http/source.go`）
- SQL 安全校验报错：`etl/core/security/sql_validator.go`
- 运行中断或取消：`server/task/runstate.go`、`etl/pipeline/engine.go`

## 开发前自检命令

```bash
# 查看核心目录结构
find . -maxdepth 2 -type d | sort

# 检查是否有本地改动（避免调试时误判）
git status --short

# 跑后端测试
go test ./...
```
