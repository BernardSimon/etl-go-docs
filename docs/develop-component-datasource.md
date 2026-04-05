
# 数据源组件开发

数据源组件用于描述连接信息，并为其他组件提供连接入口。

## 目录结构

每个数据源组件位于 `components/datasource/<type>/`。

## 接口定义

```go
type Datasource interface {
    Init(map[string]string) error
    Close() error
}
```

如果是数据库类数据源，建议额外实现：

```go
type SQLDBProvider interface {
    DB() *sql.DB
}
```

这样 Source/Sink/Executor/Variable 可以通过统一辅助方法获取连接池。

## 开发步骤

1. 新建目录 `components/datasource/<name>/`。
2. 定义 `DataSource` 结构体持有连接对象（如 `*sql.DB`）。
3. 实现 `DatasourceCreator` 返回类型名和参数定义。
4. 在 `Init` 中解析参数并建立连接，务必执行健康检查（如 `Ping`）。
5. 在 `Close` 中释放资源。
6. 在 `etl/init.go` 注册。

## 示例：MySQL 数据源

```go
func DatasourceCreator() (name string, datasource Datasource, params []params.Params) {
    return "mysql", &DataSource{}, []params.Params{
        {Key: "host", Required: true},
        {Key: "port", Required: true, DefaultValue: "3306"},
        {Key: "user", Required: true},
        {Key: "password", Required: true},
        {Key: "database", Required: true},
    }
}
```

## 参数设计建议

- 统一使用小写 key：`host/port/user/password/database`。
- `port` 提供默认值，避免前端空值。
- 敏感参数 key 包含 `password`，便于前端自动推断为密码输入框。
- 错误信息保留上下文，例如 `sql executor: failed to connect to database`。

## 注册

在 `etl/init.go` 中调用：

```go
factory.RegisterDataSource(mysqlDatasource.DatasourceCreator)
```

## 常见错误排查

### 1. `数据源类型错误`

- 触发位置：任务装配阶段（`server/task/component.go`）。
- 原因：任务引用的数据源 `type` 与组件声明不一致。

### 2. `datasource 'xxx' ... has not been registered`

- 触发位置：启动注册阶段。
- 原因：注册顺序错误，或 Source/Sink 依赖名称写错。

### 3. 连接初始化成功但运行时失败

- 排查：
- 检查 `Init` 是否只做了 `sql.Open` 而未 `Ping`。
- 检查连接参数是否被变量替换覆盖为无效值。
