
# 配置文件

ETL-GO 使用根目录下的 `config.yaml` 进行运行时配置。当前版本不会自动创建样板配置，请从仓库根目录直接编辑该文件。

## 关键配置项

```yaml
username: admin
password: password123
jwtSecret: <your-secret>
apiSecret: <your-api-secret>
aesKey: <your-aes-key>
initDb: false
logLevel: dev
log:
  filename: ./log/app.log
  maxSize: 20
  maxBackups: 3
  maxAge: 7
  compress: true
database:
  path: ./data.db
  maxOpenConns: 10
  maxIdleConns: 5
  connMaxLifetime: 300
pipeline:
  batchSize: 1000
  channelSize: 10000
serverUrl: 0.0.0.0:8080
runWeb: false
webUrl: 0.0.0.0:8081
corsOrigins:
  - http://localhost:8081
  - http://localhost:5173
```

## 参数说明

- `username` / `password`：Web 登录账号。
- `jwtSecret`：JWT 认证签名密钥。
- `apiSecret`：API 认证签名密钥。
- `aesKey`：AES 加解密密钥，用于敏感字段加密。
- `initDb`：首次运行时设为 `true` 可自动执行数据库迁移。
- `logLevel`：`dev` 或 `prod`。
- `log`：日志滚动配置（文件名、大小、保留份数、压缩等）。
- `database`：平台元数据库（SQLite）连接配置。
- `pipeline.batchSize`：Sink 批量写入记录数。
- `pipeline.channelSize`：Pipeline 阶段通道缓冲大小。
- `serverUrl`：后端 API 监听地址。
- `runWeb`：是否启动嵌入式静态 Web 服务。
- `webUrl`：内置静态 Web 服务监听地址。
- `corsOrigins`：允许跨域的前端地址列表。

术语区分：

- `username/password`：平台管理员登录账号（`config.yaml` 顶层）
- `user/password`：数据库数据源连接账号（数据源组件参数）

## 环境变量覆盖

以下环境变量可以覆盖 `config.yaml` 设置：

- `ETL_USERNAME`
- `ETL_PASSWORD`
- `ETL_JWT_SECRET`
- `ETL_API_SECRET`
- `ETL_AES_KEY`
- `ETL_SERVER_URL`
- `ETL_LOG_LEVEL`

## 生产环境建议

1. 修改默认账号密码，避免弱口令。
2. 为 `jwtSecret`、`apiSecret` 和 `aesKey` 使用高强度随机值。
3. `corsOrigins` 仅保留真实前端域名，不要放开 `*`（除非明确需要）。
4. 调整日志路径到持久化目录，避免容器重启丢失。
5. 根据任务量调优 `pipeline.batchSize/channelSize`。

## 常见错误排查

### 1. 启动报配置文件读取失败

- 检查 `config.yaml` 是否在当前运行目录。

### 2. 启动后登录失败

- 检查是否被 `ETL_USERNAME/ETL_PASSWORD` 环境变量覆盖。

### 3. 跨域报错

- 检查 `corsOrigins` 是否包含当前前端地址（协议、端口需完全一致）。

### 4. 大任务运行内存偏高

- 适当降低 `pipeline.channelSize` 与 `pipeline.batchSize`。
