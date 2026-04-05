
# 运行程序

本章介绍如何启动 ETL-GO 以及运行时调试方式。

## 启动方式

### 方式一：源码直接运行

```bash
go run main.go
```

### 方式二：使用构建产物

```bash
go build -o etl-go .
./etl-go
```

## 运行模式

- `runWeb: true`
- 启动 API + 内建静态 Web 服务
- `runWeb: false`
- 仅启动 API 服务（推荐前后端分离开发）

## 配置加载规则

- 默认从当前工作目录读取 `./config.yaml`。
- 当前版本不支持命令行指定配置文件路径。
- 环境变量会覆盖部分配置（如 `ETL_SERVER_URL`）。

## 启动后检查

端口检查：

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

登录接口检查：

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## 默认访问地址

- 后端 API：`http://127.0.0.1:8080`
- 内建 Web：`http://127.0.0.1:8081`

## 日志与运行信息

- 应用日志默认文件：`./log/app.log`
- 日志级别：`logLevel=dev|prod`
- 任务执行日志可在“任务记录 -> 日志详情”中查看

## 优雅停机

程序支持 `SIGINT` / `SIGTERM`，按 `Ctrl+C` 即可触发优雅关机，服务会尝试在超时时间内关闭 HTTP Server。

## 常见问题排查

### 1. `address already in use`

- 原因：端口已被占用。
- 处理：修改 `serverUrl` / `webUrl`，或释放占用端口。

### 2. 浏览器可打开前端但接口报跨域

- 原因：`corsOrigins` 未包含当前前端地址。
- 处理：把实际前端域名加入 `corsOrigins`。

### 3. macOS 启动时自动打开浏览器失败

- 原因：系统环境限制或地址不可访问。
- 影响：不影响 API 和任务执行，可忽略。
