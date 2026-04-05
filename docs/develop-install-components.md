
# 注册组件

ETL-GO 使用工厂模式统一注册组件，注册入口位于 `etl/init.go`。

## 组件注册顺序

1. 数据源组件
2. 变量组件
3. 执行器组件
4. Source 组件
5. Sink 组件
6. Processor 组件

推荐原因：

- Source/Sink/Executor/Variable 可能依赖 DataSource。
- 先注册 DataSource 能避免依赖未就绪错误。

## 典型注册代码

```go
func RegisterComponents() error {
    var errs []error
    errs = append(errs, factory.RegisterDataSource(dorisDatasource.DatasourceCreator))
    errs = append(errs, factory.RegisterDataSource(mysqlDatasource.DatasourceCreator))
    // ...
    return errors.Join(errs...)
}
```

## 失败模式与报错含义

- `xxx is already registered`
- 组件名称重复，检查 `Creator` 返回值是否冲突。
- `datasource 'xxx' required by source/sink/executor/variable 'yyy' has not been registered`
- 依赖数据源未注册或名称不匹配。
- `no source/sink/... registered with name: xxx`
- 任务配置里的 `type` 与注册名不一致。

## 组件注册后验证

### 1. 启动阶段检查

- 服务启动时若注册失败会直接 fatal。
- 本地可先执行 `go build ./...` 再启动，提前发现编译和注册问题。

### 2. API 检查

登录后调用：

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/components
```

确认新增组件类型已出现在返回结果中。

### 3. 最小任务检查

- 创建仅包含该组件的最小任务链路（如 Source -> Sink）。
- 执行一次手动任务。
- 在运行记录查看参数和错误信息是否符合预期。

## 版本迭代建议

- 新增组件优先，不要直接修改旧组件 `type` 名称。
- 如需替换实现，保持参数兼容或在文档中提供迁移说明。
- 每次新增组件都补文档页：参数、示例、错误排查。

## 说明

- 所有组件通过 `factory.Register*` 注册
- 注册过程中返回错误会在启动时触发 fatal
- 注册完成后，Web 控制台通过 `/api/v1/components` 获取可用组件类型
