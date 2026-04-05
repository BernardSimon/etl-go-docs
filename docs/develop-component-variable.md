
# 变量组件开发

Variable 组件用于从数据源读取动态参数。

## 目录结构

位于 `components/variable/<type>/`。

## 接口定义

```go
type Variable interface {
    Get(ctx context.Context, config map[string]string, datasource datasource.Datasource) (string, error)
}
```

## 使用场景

- 任务执行前动态查询日期、批次号、游标等运行参数。
- 在任务 JSON 中以变量语法引用，运行时替换为实际值。

## 开发要点

- `Get` 必须快速失败并支持取消。
- 返回值统一为字符串，避免任务参数结构破坏。
- SQL Variable 建议仅允许 `SELECT`，禁止危险语句。
- 如果使用数据源，组件内部必须处理连接可用性和关闭逻辑。

## 开发步骤

1. 在 `VariableCreator` 定义参数（常见为 `query`）。
2. 在 `Get` 中校验参数合法性。
3. 执行查询并转换为字符串返回。
4. 处理空结果与 SQL 错误。
5. 注册到 `etl/init.go`。

## 示例

```go
func VariableCreatorMysql() (name string, variable Variable, datasource *string, params []params.Params) {
    return "mysql", &Variable{}, strPtr("mysql"), []params.Params{
        {Key: "query", Required: true},
    }
}
```

## 注册

```go
factory.RegisterVariable(sqlVariable.VariableCreatorMysql)
```

## 常见错误排查

### 1. `variable query is required`

- 原因：变量配置中缺少 `query` 参数。

### 2. `variable Should Has SELECT Prefix`

- 原因：查询不是 `SELECT` 开头。
- 处理：改为只读查询，避免副作用。

### 3. `variable Should Not Contains Dangerous Keywords`

- 原因：语句包含 `INSERT/UPDATE/DELETE/...`。
- 处理：拆分逻辑，不要在变量阶段执行写操作。

### 4. 变量替换后任务仍失败

- 排查：
- 查看任务记录里替换后的参数值是否符合目标组件格式。
- 检查返回字符串是否被下游组件正确解析（例如数字、JSON 字符串）。
