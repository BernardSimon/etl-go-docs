
# 下载

当前项目主要推荐从源码构建并运行。若您希望使用预编译版本，请先检查项目 Release 页面是否存在可用发行包。

## 获取方式

建议访问 GitHub 仓库 Release 页面获取最新发布版本。

- https://github.com/BernardSimon/etl-go/releases

## 方式一：使用预编译包

1. 从 Release 页面下载对应系统的压缩包。
2. 解压后确认包含 `etl-go` 和 `config.yaml`。
3. 修改配置后直接运行 `./etl-go`。

## 方式二：从源码构建（推荐）

推荐使用以下方式构建可执行文件：

```bash
go mod download
go build -o etl-go .
```

前端静态资源构建：

```bash
cd web
pnpm install
pnpm build
cd ..
```

## 配置文件要求

运行前请准备好 `config.yaml`，该文件需要与可执行文件同级。

关键字段至少包括：

- `username`
- `password`
- `jwtSecret`
- `aesKey`
- `serverUrl`

## 启动后验证

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## 常见问题

### 1. Release 没有可用包

- 直接走源码构建流程，通常更稳定也更适合二开。

### 2. 二进制能启动但页面打不开

- 检查 `runWeb` 是否启用。
- 检查前端资源是否构建并随包发布。
