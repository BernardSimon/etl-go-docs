# 开发准备

`etl-go` 已完成较大重构，建议按“环境准备 -> 启动验证 -> 联调 -> 排错”顺序搭建开发环境。本文面向本地二开、组件开发和问题定位。

## 环境要求

- Go 1.24+
- Node.js 18+
- pnpm
- Git
- SQLite（默认元数据库，无需单独安装）

## 推荐开发机配置

- macOS / Linux / Windows WSL2 均可
- 内存建议 >= 8G（前后端联调 + 大批量任务更稳定）
- 保留至少 2G 可写磁盘空间（日志、上传文件、临时构建产物）

## 代码仓库

```bash
git clone https://github.com/BernardSimon/etl-go.git
cd etl-go
```

## 安装依赖

```bash
go mod download
cd web
pnpm install
cd ..
```

## 启动方式

### 方式一：仅后端（API 调试）

```bash
go build -o etl-go .
./etl-go
```

默认地址：`http://localhost:8080`

### 方式二：前后端分离开发（推荐）

终端 1（后端）：

```bash
go build -o etl-go .
./etl-go
```

终端 2（前端）：

```bash
cd web
pnpm dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`

### 方式三：后端托管前端静态资源

```bash
cd web
pnpm build
cd ..
go build -o etl-go .
./etl-go
```

需要在 `config.yaml` 中开启 `runWeb: true`。

## 首次启动检查清单

1. 确认 `config.yaml` 存在于仓库根目录。
2. 确认 `serverUrl` 与前端代理、CORS 配置一致。
3. 首次初始化可设置 `initDb: true`，启动成功后会自动写回 `false`。
4. 使用默认账号登录后立即修改弱密码（默认 `admin/password123`）。

## 关键配置参数（重构后常用）

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `serverUrl` | API 监听地址 | `0.0.0.0:8080` |
| `runWeb` | 是否由后端托管静态前端 | `false` |
| `webUrl` | 托管静态前端地址 | `0.0.0.0:8081` |
| `pipeline.batchSize` | Sink 批量写入批次大小 | `1000` |
| `pipeline.channelSize` | Pipeline Channel 缓冲 | `10000` |
| `database.path` | 平台元数据库 SQLite 文件 | `./data.db` |
| `corsOrigins` | 允许跨域来源列表 | 本地前端地址 |

## 环境变量覆盖

以下变量会覆盖 `config.yaml` 同名配置：

- `ETL_USERNAME`
- `ETL_PASSWORD`
- `ETL_JWT_SECRET`
- `ETL_AES_KEY`
- `ETL_SERVER_URL`
- `ETL_LOG_LEVEL`

## 本地验证命令

```bash
# 后端编译
go build -o bin/etl-go .

# 运行所有测试
go test ./...

# 前端构建
cd web && pnpm build
```

## 常见问题排查

### 1. `Failed To Read Config File`

- 现象：启动即退出，日志提示无法读取配置。
- 排查：
- 确认当前目录是项目根目录（包含 `config.yaml`）。
- 确认文件名是 `config.yaml`，不是 `config.yml`。

### 2. 前端登录接口 `401` 或跨域失败

- 现象：浏览器控制台报 CORS 或未授权。
- 排查：
- `config.yaml` 中 `corsOrigins` 必须包含前端地址（如 `http://localhost:5173`）。
- 检查前端请求地址是否指向正确 `serverUrl`。

### 3. 任务执行慢或内存升高

- 现象：任务吞吐下降、机器内存升高。
- 排查：
- 适当降低 `pipeline.channelSize`。
- 下调 `pipeline.batchSize`（例如 `1000 -> 200`）观察写入稳定性。
- 检查 Source 是否一次拉取超大数据集，必要时改分页或分片。

### 4. 组件参数看不懂

- 使用接口查看平台归一化后的参数元数据：

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/components
```

接口会返回每个组件的参数定义、默认值、推断类型和示例。

## 推荐工具

- VS Code 或 GoLand
- Go 调试：Delve
- 代码质量：`go test ./...`、`go vet ./...`
- 前端调试：Vite + 浏览器 DevTools
