
# 入门指南

ETL-GO 适合快速上线数据同步与数据清洗任务。

## 10 分钟主流程

1. 配置系统运行参数
2. 配置数据源
3. 创建任务并选择 Source / Processor / Sink
4. 手动执行或设置定时任务
5. 通过任务记录和日志查看运行结果

## 详细步骤

### 1. 启动服务

```bash
go build -o etl-go .
./etl-go
```

### 2. 登录系统

- 默认账号：`admin`
- 默认密码：`password123`
- 建议首次登录后立即修改密码

### 3. 新建数据源

先创建源库和目标库数据源（如 MySQL / PostgreSQL / SQLite）。

### 4. 创建任务

最小可运行任务建议：

- Source：`sql`，参数 `query=SELECT ...`
- Processors：可先为空
- Sink：`sql`，参数 `table=...`
- Cron：`manual`

### 5. 手动执行并验证

- 触发“立即执行”
- 打开任务记录查看状态和消息
- 打开任务日志查看详细执行过程

## 第一个示例任务建议

源表 `users` -> 目标表 `users_copy`：

1. Source 查询：`SELECT id,name,email FROM users`
2. Processor（可选）：`maskData` 对 `email` 脱敏
3. Sink 写入：`users_copy`

## 常见错误

### 1. 创建任务成功但执行失败

- 检查 Source/Sink 绑定的数据源是否正确。
- 检查参数 key 是否与组件定义一致（建议查看 `/api/v1/components`）。

### 2. 任务一直是运行中

- 检查 Source 是否未正确返回 EOF。
- 检查外部数据源请求是否阻塞（SQL/HTTP 超时）。

### 3. 定时任务不触发

- 检查 `cron` 表达式是否为标准格式。
- 检查任务是否已进入“调度中”状态。
