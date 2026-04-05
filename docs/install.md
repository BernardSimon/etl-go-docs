
# 使用已构建安装包

如果你已经拿到 `etl-go` 的预编译安装包，可以不走源码构建，直接解压运行。

## 安装包建议目录结构

- `etl-go`（可执行文件）
- `config.yaml`（运行配置）
- `README.md`（版本说明）
- `web/dist`（可选，若使用内建静态前端）

## 1. 解压并授权

```bash
tar -xzf etl-go-<version>.tar.gz
cd etl-go-<version>
chmod +x ./etl-go
```

## 2. 检查配置文件

启动前确保同级目录存在 `config.yaml`，至少确认以下字段：

- `username`
- `password`
- `jwtSecret`
- `aesKey`
- `serverUrl`
- `runWeb`
- `webUrl`
- `corsOrigins`

## 3. 启动应用

```bash
./etl-go
```

## 4. 验证是否启动成功

检查端口：

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

尝试登录接口：

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'
```

## 常见问题

### 1. 启动报 `Failed To Read Config File`

- 原因：运行目录不正确或缺少 `config.yaml`。
- 处理：切换到可执行文件同级目录再启动。

### 2. 启动后无法访问前端

- 原因：`runWeb` 为 `false`，或未构建 `web/dist`。
- 处理：启用 `runWeb` 并确认静态资源已存在。

### 3. 登录失败

- 原因：账号密码已修改，或环境变量覆盖了配置文件。
- 处理：检查 `ETL_USERNAME` / `ETL_PASSWORD`。

## 如果没有安装包

请使用源码构建方式，详见 [从源码构建](./build.md)。
