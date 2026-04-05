
# 前后端分离开发

本项目支持后端 API 与前端 UI 分离开发，便于独立调试与快速迭代。

## 1. 启动后端

修改 `config.yaml`：

```yaml
runWeb: false
serverUrl: 0.0.0.0:8080
corsOrigins:
  - http://localhost:5173
```

然后启动后端：

```bash
go build -o etl-go .
./etl-go
```

## 2. 启动前端

```bash
cd web
pnpm install
pnpm dev -- --host 0.0.0.0
```

前端默认监听 `http://localhost:5173`。

## 3. 调试流程

- 后端 API 地址：`http://127.0.0.1:8080`
- 前端开发地址：`http://127.0.0.1:5173`

如果出现跨域问题，请确认 `corsOrigins` 已包含前端地址。

## 4. 推荐联调检查项

1. 浏览器打开前端后，先测试登录接口。
2. 检查 Network 请求是否都走到 `serverUrl`。
3. 访问 `/api/v1/components`，确认后端组件元数据返回正常。

## 5. 常见问题

### 1. 前端能打开但所有接口 404

- 原因：前端代理地址配置错误或后端未启动。
- 处理：确认前端 API base URL 指向 `http://127.0.0.1:8080/api/v1`。

### 2. 登录请求被浏览器拦截（CORS）

- 原因：`corsOrigins` 缺失当前前端地址。
- 处理：补充 `http://localhost:5173` 或你的实际域名。

### 3. Cookie/Token 行为异常

- 原因：跨域下凭据策略与 CORS 设置不一致。
- 处理：确保请求头包含 `Authorization`，并检查后端允许的 header 列表。
