# 数据源配置

数据源是 ETL-GO 中用于连接外部数据库或文件系统的配置。您可以在系统中配置多个数据源，并在任务中引用它们。

## 支持的数据源类型

ETL-GO 目前支持以下数据源类型：

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| **MySQL** | MySQL 数据库连接 | 关系型数据库数据提取和加载 |
| **PostgreSQL** | PostgreSQL 数据库连接 | 关系型数据库数据提取和加载 |
| **SQLite** | SQLite 数据库连接 | 轻量级本地数据库 |
| **Doris** | Apache Doris 数据库连接 | 大规模数据分析场景 |

## 创建数据源

### 通过 Web 界面创建

1. 登录 ETL-GO Web 界面（默认地址：`http://localhost:8081`）
2. 在左侧导航栏点击「数据源管理」
3. 点击「新建数据源」按钮
4. 选择数据源类型并填写配置信息
5. 点击「测试连接」验证配置是否正确
6. 点击「保存」

### 配置参数说明

#### MySQL 数据源配置

```yaml
# 基础配置
host: localhost      # 数据库主机地址
port: 3306          # 数据库端口
user: root          # 数据库用户名
password: password  # 数据库密码
database: test_db   # 数据库名称

# 高级配置（可选）
charset: utf8mb4    # 字符集
timeout: 10s        # 连接超时时间
max_open_conns: 10  # 最大连接数
max_idle_conns: 5   # 最大空闲连接数
```

#### PostgreSQL 数据源配置

```yaml
host: localhost
port: 5432
user: postgres
password: password
database: test_db
sslmode: disable    # SSL模式（disable/require/verify-full）
```

#### SQLite 数据源配置

```yaml
path: /path/to/database.db  # 数据库文件路径
```

#### Doris 数据源配置

```yaml
host: localhost
port: 9030
user: admin
password: password
database: test_db
```

## 数据源管理

### 查看数据源列表
在「数据源管理」页面可以查看所有已配置的数据源，包括：
- 数据源名称
- 数据源类型
- 连接状态
- 最后修改时间

### 编辑数据源
点击数据源列表中的「编辑」按钮可以修改数据源配置。

### 删除数据源
点击数据源列表中的「删除」按钮可以删除不再需要的数据源。

**注意**：删除数据源时，请确保没有任务正在引用该数据源。

### 测试连接
在创建或编辑数据源时，可以点击「测试连接」按钮验证配置是否正确。

## 在任务中使用数据源

配置好的数据源可以在以下任务组件中使用：

### 1. 数据输入（Source）
在 SQL 查询类型的数据输入中，可以选择已配置的数据源：
```sql
SELECT * FROM users WHERE created_at > '2024-01-01'
```

### 2. 数据输出（Sink）
在 SQL 表类型的数据输出中，可以选择目标数据源：
```sql
INSERT INTO target_table (column1, column2) VALUES (?, ?)
```

### 3. 执行器（Executor）
在执行 SQL 脚本时，可以选择执行的数据源。

### 4. 变量（Variable）
在 SQL 查询变量中，可以选择查询的数据源。

## 最佳实践

### 1. 命名规范
建议使用有意义的名称命名数据源，如：
- `prod_mysql_order_db` - 生产环境订单数据库
- `dev_postgres_log_db` - 开发环境日志数据库

### 2. 环境隔离
建议为不同环境配置不同的数据源：
- 开发环境
- 测试环境  
- 生产环境

### 3. 权限控制
- 生产环境数据库建议使用只读权限账户作为数据源
- 数据输出到生产环境时使用有写入权限的账户

### 4. 连接池优化
- 根据业务负载调整最大连接数
- 设置合理的连接超时时间

## 故障排除

### 常见问题

#### 1. 连接失败
**可能原因**：
- 网络不可达
- 数据库服务未启动
- 用户名/密码错误
- 防火墙限制

**解决方案**：
- 检查网络连通性
- 确认数据库服务状态
- 验证登录凭据
- 检查防火墙配置

#### 2. 连接超时
**可能原因**：
- 网络延迟过高
- 数据库负载过大
- 连接池配置不当

**解决方案**：
- 增加连接超时时间
- 优化数据库性能
- 调整连接池参数

#### 3. 权限不足
**可能原因**：
- 账户缺少必要权限
- IP 地址未授权

**解决方案**：
- 检查数据库账户权限
- 配置 IP 白名单

## API 参考

### 创建数据源
```http
POST /api/dataSource
Content-Type: application/json

{
  "name": "生产MySQL",
  "type": "mysql",
  "data": {
    "host": "localhost",
    "port": "3306",
    "user": "etl_user",
    "password": "secure_password",
    "database": "production_db"
  },
  "edit": "true"
}
```

### 获取数据源列表
```http
GET /api/dataSource/list
```

### 删除数据源
```http
DELETE /api/dataSource
Content-Type: application/json

{
  "id": "datasource_123"
}
```

## 下一步

配置好数据源后，您可以：
1. [创建变量配置](/variable) - 定义动态查询参数
2. [创建任务](/task) - 配置完整的数据处理流程
3. [设置任务调度](/task-schedule) - 自动化执行任务