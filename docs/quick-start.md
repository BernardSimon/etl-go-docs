
# 快速开始

本页面介绍如何快速运行 ETL-GO 并打开 Web 管理界面。建议先完成 `config.yaml` 的基本配置，再启动服务。

## 1. 克隆仓库

```bash
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go
```

## 2. 安装后端依赖

```bash
go mod download
```

## 3. 安装前端依赖

```bash
cd web
pnpm install
cd ..
```

## 4. 编辑配置文件

根目录下使用 `config.yaml` 管理运行参数。

默认配置文件包含：

- `serverUrl`：后端 API 地址，例如 `0.0.0.0:8080`
- `runWeb`：是否启动内置静态前端服务
- `webUrl`：内置前端服务地址，例如 `0.0.0.0:8081`
- `database.path`：SQLite 存储文件位置
- `pipeline.batchSize`：批量写入大小

建议至少修改 `username`、`password` 和 `jwtSecret`。

## 5. 启动后端服务

```bash
go build -o etl-go .
./etl-go
```

如果配置中 `runWeb: true`，后端会同时启动静态 Web 控制台；否则只启动 API 服务。

## 6. 访问 Web 管理界面

默认访问：

- 后端 API：`http://127.0.0.1:8080`
- 前端控制台：`http://127.0.0.1:8081`

如果 `runWeb: true`，后端启动时会自动尝试打开 Web 地址。

## 7. 运行一个任务

1. 登录 Web 控制台
2. 配置数据源
3. 创建任务并选择 Source/Processor/Sink
4. 手动执行或设置 Cron 定时调度

## 8. 用 API 做最小自检

登录获取 token：

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

查看组件元数据（验证工厂注册是否正常）：

```bash
curl -H "Authorization: Bearer <token>" \
  http://127.0.0.1:8080/api/v1/components
```

## 9. 常见问题

- 无法访问前端：请确认 `runWeb`、`webUrl` 和 `corsOrigins` 配置正确。
- 后端启动失败：请检查 `config.yaml` 语法和 SQLite 文件访问权限。
- 登录失败：默认用户名为 `admin`，默认密码为 `password123`，建议修改为强密码。
