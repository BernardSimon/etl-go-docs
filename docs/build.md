
# 从源码构建

本项目推荐通过源码构建后端和前端，确保运行时与当前代码保持一致。

## 1. 准备环境

- Go 1.24+ 安装完成
- Node.js 18+ 或更高
- pnpm 已安装

## 2. 拉取依赖

```bash
go mod download
cd web
pnpm install
cd ..
```

## 3. 构建后端

```bash
go build -o etl-go .
```

## 4. 构建前端

```bash
cd web
pnpm build
cd ..
```

> 构建完成后，`web/dist` 会生成静态文件，后端程序内置了嵌入静态网页能力。

## 5. 运行程序

```bash
./etl-go
```

## 6. Makefile 常用命令

```bash
make build   # 生成 bin/etl-go
make test    # 运行测试
make race    # 启用 race detector
make vet     # 运行 go vet
```

## 7. 构建结果检查

- 后端二进制：`./etl-go` 或 `./bin/etl-go`
- 前端产物：`./web/dist`
- 启动后确认 API 可访问：`/api/v1/login`

## 常见问题

### 1. `go: module ... not found`

- 检查代理设置与网络连通性。
- 重新执行 `go mod download`。

### 2. `pnpm: command not found`

- 先安装 pnpm：`npm i -g pnpm`。

### 3. 构建成功但页面 404

- 可能未构建前端或 `runWeb=false`。
- 检查 `web/dist` 是否存在并确认运行模式。
