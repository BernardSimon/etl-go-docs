
# 执行器组件开发

Executor 组件用于任务前后执行 SQL 语句或其他准备/收尾逻辑。

## 目录结构

位于 `components/executor/<type>/`。

## 接口定义

```go
type Executor interface {
    Open(ctx context.Context, config map[string]string, dataSource datasource.Datasource) error
    Close() error
}
```

## 执行时机

- `Before Executor`：在 Source 打开之前执行，常用于临时表准备、会话参数设置。
- `After Executor`：在数据写入完成后执行，常用于清理或汇总 SQL。

## 开发要点

- 必须支持 `context` 取消。
- 对 SQL 类执行器建议做安全校验，限制危险语句。
- `Close` 应能重复调用且安全。
- 错误信息要包含执行阶段信息（before/after）。

## 开发步骤

1. 实现 `ExecutorCreator` 并声明参数。
2. 在 `Open` 中解析 SQL/脚本参数。
3. 从 `datasource` 获取连接并执行。
4. 在 `Close` 中释放资源。
5. 注册到 `etl/init.go`。

## 示例

```go
func ExecutorCreatorMysql() (name string, executor Executor, datasource *string, params []params.Params) {
    return "mysql", &Executor{}, strPtr("mysql"), []params.Params{
        {Key: "sql", Required: true},
    }
}
```

## 注册

```go
factory.RegisterExecutor(sqlExecutor.ExecutorCreatorMysql)
```

## 参数建议

- `sql`：执行语句，必填。
- `allow_dangerous`：是否允许危险语句（布尔字符串，默认 `false`）。

## 常见错误排查

### 1. `config is missing or has invalid 'sql'`

- 原因：任务参数缺失或 key 写错。

### 2. SQL 安全校验失败

- 原因：语句被判定为危险操作。
- 处理：调整 SQL，或显式配置允许危险语句（仅测试环境建议）。

### 3. `datasource is required`

- 原因：该执行器需要数据库连接，但任务配置未绑定数据源。
