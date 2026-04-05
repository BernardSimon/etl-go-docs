
# 任务配置

ETL-GO 的任务由以下模块组成：

- `Before Executor`：任务前置 SQL 执行
- `Source`：读取数据源
- `Processors`：数据处理链
- `Sink`：数据输出
- `After Executor`：任务后置 SQL 执行

执行顺序固定为：

`Before Executor -> Source -> Processors -> Sink -> After Executor`

## 创建任务

1. 登录 Web 控制台
2. 进入“任务管理”
3. 点击“新建任务”
4. 填写任务名称、类型、Cron 配置
5. 选择 Source / Processor / Sink / Executor

## 任务参数结构（核心）

任务 `params` 的核心结构如下：

```json
{
  "before_execute": {"type":"mysql","data_source":"<id>","params":[{"key":"sql","value":"..."}]},
  "source": {"type":"mysql","data_source":"<id>","params":[{"key":"query","value":"SELECT ..."}]},
  "processors": [{"type":"filterRows","params":[{"key":"column","value":"id"},{"key":"operator","value":">"},{"key":"value","value":"0"}]}],
  "sink": {"type":"mysql","data_source":"<id>","params":[{"key":"table","value":"target_table"}]},
  "after_execute": {"type":"mysql","data_source":"<id>","params":[{"key":"sql","value":"..."}]}
}
```

接口字段映射说明：

- `mission_name`：任务名称（UI 中显示“任务名”）
- `tasktypes`：任务类型筛选字段（`manual/scheduled` 查询使用）
- `params`：任务结构化配置（包含 `source/processors/sink/...`）

## 任务模板

任务支持保存为模板，便于复用已有配置。

## 任务状态

任务支持以下执行模式：

- `manual`：手动触发
- Cron 表达式：定时执行

## 创建任务建议顺序

- 先验证 Source 是否能正确读取数据
- 再添加 Processor 进行数据清洗
- 最后确认 Sink 输出目标是否可写

## 状态说明

- 任务状态：
- `0` 暂存
- `1` 调度中
- `2` 错误或暂停
- 任务记录状态：
- `0` 运行中
- `1` 成功
- `2` 失败/中止

## 常见错误

### 1. `factory error: no ... registered with name`

- `type` 字段与注册组件名不一致。

### 2. 任务能保存但一运行就失败

- 某组件必填参数缺失，或绑定数据源类型错误。
- 建议先调用 `/api/v1/components` 核对参数 key。
