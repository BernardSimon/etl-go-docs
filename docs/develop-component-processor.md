---
outline: deep
---

# 数据处理组件开发

数据处理组件（Processor）是 etl-go 中负责数据转换、清洗和加工的核心组件。本文档详细介绍如何开发自定义数据处理组件，包括接口实现、数据处理逻辑、错误处理和性能优化。

## 数据处理组件概述

### 作用与职责
数据处理组件负责：
- **数据转换**: 类型转换、格式转换、编码转换等
- **数据清洗**: 去除重复、修正错误、补全缺失值
- **数据加工**: 计算衍生字段、聚合统计、数据脱敏
- **数据过滤**: 条件筛选、抽样、分片
- **质量控制**: 数据验证、质量检查、异常检测

### 核心接口
在 `etl/core/processor` 中定义：
```go
// 数据处理接口
type Processor interface {
    // 打开处理器，加载配置
    Open(config map[string]string) error
    
    // 处理单条记录
    Process(record Record) (Record, error)
    
    // 处理列信息
    HandleColumns(columns *map[string]string)
    
    // 关闭处理器
    Close() error
}
```

## 开发步骤

### 1. 创建组件目录结构

```
components/processors/
└── your-processor/       # 自定义处理器名称
    ├── main.go          # 主实现文件
    ├── go.mod          # 模块定义
    ├── README.md       # 组件说明
    └── test/           # 测试文件
        └── main_test.go
```

### 2. 定义组件元数据

每个数据处理组件需要导出一个创建器函数：

```go
package yourprocessor

import (
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
)

// 组件名称
var name = "your-processor"

// 设置自定义名称（可选）
func SetCustomName(customName string) {
    name = customName
}

// ProcessorCreator 创建器函数 - 必须导出
func ProcessorCreator() (string, processor.Processor, []params.Params) {
    paramList := []params.Params{
        {
            Key:          "column",
            DefaultValue: "",
            Required:     true,
            Description:  "要处理的列名",
        },
        {
            Key:          "type",
            DefaultValue: "string",
            Required:     false,
            Description:  "目标数据类型",
        },
        // 更多参数...
    }
    
    return name, &Processor{}, paramList
}
```

### 3. 实现数据处理接口

#### 基础实现模板
```go
package convertType

import (
    "fmt"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "convertType"

func SetCustomName(customName string) {
    name = customName
}

type Processor struct {
    column string // 要转换的列名
    toType string // 目标数据类型
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to convert",
        },
        {
            Key:          "type",
            Required:     true,
            DefaultValue: "",
            Description:  "type to convert to",
        },
    }
}
```

#### Open 方法实现
```go
func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("convertType processor: config is missing or has invalid 'column'")
    }
    p.column = column

    toType, ok := config["type"]
    if !ok || toType == "" {
        return fmt.Errorf("convertType processor: config is missing or has invalid 'type'")
    }
    p.toType = toType

    return nil
}
```

#### Process 方法实现
```go
// Process 对记录进行处理，转换指定列的类型
func (p *Processor) Process(record record.Record) (record.Record, error) {
    originalValue, ok := record[p.column]
    if !ok {
        // 如果列不存在，静默忽略
        return record, nil
    }

    if originalValue == nil {
        // 不对 nil 值进行转换
        return record, nil
    }

    var convertedValue interface{}
    var err error

    // 统一转换为字符串，再进行解析，以获得最大的兼容性
    valStr := fmt.Sprintf("%v", originalValue)

    switch p.toType {
    case "integer", "int":
        convertedValue, err = strconv.ParseInt(valStr, 10, 64)
    case "float", "double":
        convertedValue, err = strconv.ParseFloat(valStr, 64)
    case "string":
        convertedValue = valStr
    case "boolean", "bool":
        // strconv.ParseBool 能很好地处理 "1", "t", "T", "TRUE", "true", "True" 等情况
        convertedValue, err = strconv.ParseBool(valStr)
    default:
        return nil, fmt.Errorf("convertType processor: unsupported target type: '%s'", p.toType)
    }

    if err != nil {
        // 如果转换失败，返回一个清晰的错误，这将导致整个管道停止
        return nil, fmt.Errorf("convertType processor: failed to convert value '%v' to type '%s' for column '%s': %w", 
            originalValue, p.toType, p.column, err)
    }

    // 使用转换后的新值更新记录
    record[p.column] = convertedValue
    return record, nil
}
```

#### HandleColumns 方法实现
```go
func (p *Processor) HandleColumns(columns *map[string]string) {
    // 对于类型转换处理器，通常不需要修改列信息
    return
}
```

#### Close 方法实现
```go
func (p *Processor) Close() error {
    // convertType 处理器是无状态的，不需要清理资源
    return nil
}
```

## 实际示例

### FilterRows 数据过滤组件
```go
package filterRows

import (
    "encoding/json"
    "fmt"
    "strconv"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "filterRows"

func SetCustomName(customName string) {
    name = customName
}

type Processor struct {
    column   string      // 要进行比较列名
    operator string      // 比较操作符
    value    interface{} // 用于比较的配置值
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to filter on",
        },
        {
            Key:          "operator",
            Required:     true,
            DefaultValue: "",
            Description:  "comparison operator",
        },
        {
            Key:          "value",
            Required:     true,
            DefaultValue: "",
            Description:  "value to compare against",
        },
    }
}

func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("filterRows processor: config is missing or has invalid 'column'")
    }
    p.column = column

    operator, ok := config["operator"]
    if !ok || operator == "" {
        return fmt.Errorf("filterRows processor: config is missing or has invalid 'operator'")
    }
    p.operator = operator

    value, ok := config["value"]
    if !ok {
        return fmt.Errorf("filterRows processor: config is missing 'value'")
    }
    p.value = value

    return nil
}

func (p *Processor) Process(record record.Record) (record.Record, error) {
    recordVal, ok := record[p.column]
    if !ok {
        // 如果记录中不存在要比较列，直接过滤掉
        return nil, nil
    }

    match, err := p.compare(recordVal, p.value)
    if err != nil {
        return nil, fmt.Errorf("filterRows processor: error comparing values for column '%s': %w", p.column, err)
    }

    if match {
        return record, nil // 条件满足，保留该记录
    }

    return nil, nil // 条件不满足，过滤掉该记录
}

// compare 实现智能比较逻辑，优先尝试进行数字比较
func (p *Processor) compare(recordValue, configValue interface{}) (bool, error) {
    val1Float, err1 := p.toFloat(recordValue)
    val2Float, err2 := p.toFloat(configValue)

    // 如果两个值都能成功转换为数字，则进行数字比较
    if err1 == nil && err2 == nil {
        switch p.operator {
        case "=", "==":
            return val1Float == val2Float, nil
        case "!=", "<>":
            return val1Float != val2Float, nil
        case ">":
            return val1Float > val2Float, nil
        case ">=":
            return val1Float >= val2Float, nil
        case "<":
            return val1Float < val2Float, nil
        case "<=":
            return val1Float <= val2Float, nil
        default:
            return false, fmt.Errorf("unsupported numeric operator: '%s'", p.operator)
        }
    }

    // 如果无法进行数字比较，则进行字符串比较
    val1Str := fmt.Sprintf("%v", recordValue)
    val2Str := fmt.Sprintf("%v", configValue)

    switch p.operator {
    case "=", "==":
        return val1Str == val2Str, nil
    case "!=", "<>":
        return val1Str != val2Str, nil
    default:
        // 对于字符串，只支持等于和不等于操作
        return false, fmt.Errorf("unsupported string operator: '%s' (only '=', '==', '!=', '<>' are supported for non-numeric comparisons)", p.operator)
    }
}

func (p *Processor) toFloat(v interface{}) (float64, error) {
    switch i := v.(type) {
    case float64:
        return i, nil
    case float32:
        return float64(i), nil
    case int:
        return float64(i), nil
    case int64:
        return float64(i), nil
    case json.Number: // 来自 JSON source 的数字可能是这个类型
        return i.Float64()
    case string:
        return strconv.ParseFloat(i, 64)
    default:
        return 0, fmt.Errorf("cannot convert type %T to float64", v)
    }
}

func (p *Processor) HandleColumns(_ *map[string]string) {
    return
}

func (p *Processor) Close() error {
    return nil
}
```

### MaskData 数据脱敏组件
```go
package maskData

import (
    "fmt"
    "strings"
    
    "github.com/BernardSimon/etl-go/etl/core/params"
    "github.com/BernardSimon/etl-go/etl/core/processor"
    "github.com/BernardSimon/etl-go/etl/core/record"
)

var name = "maskData"

type Processor struct {
    column string
    mask   string
    keep   int
}

func ProcessorCreator() (string, processor.Processor, []params.Params) {
    return name, &Processor{}, []params.Params{
        {
            Key:          "column",
            Required:     true,
            DefaultValue: "",
            Description:  "column to mask",
        },
        {
            Key:          "mask",
            DefaultValue: "*",
            Required:     false,
            Description:  "mask character",
        },
        {
            Key:          "keep",
            DefaultValue: "0",
            Required:     false,
            Description:  "number of characters to keep at end",
        },
    }
}

func (p *Processor) Open(config map[string]string) error {
    column, ok := config["column"]
    if !ok || column == "" {
        return fmt.Errorf("maskData processor: config is missing or has invalid 'column'")
    }
    p.column = column

    mask, ok := config["mask"]
    if !ok || mask == "" {
        p.mask = "*"
    } else {
        p.mask = mask
    }

    keepStr, ok := config["keep"]
    if !ok || keepStr == "" {
        p.keep = 0
    } else {
        if keep, err := strconv.Atoi(keepStr); err == nil && keep >= 0 {
            p.keep = keep
        } else {
            return fmt.Errorf("maskData processor: invalid 'keep' value: %s", keepStr)
        }
    }

    return nil
}

func (p *Processor) Process(record record.Record) (record.Record, error) {
    value, ok := record[p.column]
    if !ok {
        return record, nil
    }

    if value == nil {
        return record, nil
    }

    strValue := fmt.Sprintf("%v", value)
    
    // 计算需要脱敏的长度
    maskLength := len(strValue) - p.keep
    if maskLength <= 0 {
        maskLength = len(strValue)
    }
    
    // 构建脱敏后的字符串
    masked := strings.Repeat(p.mask, maskLength)
    if p.keep > 0 && p.keep < len(strValue) {
        masked += strValue[len(strValue)-p.keep:]
    }
    
    record[p.column] = masked
    return record, nil
}

func (p *Processor) HandleColumns(_ *map[string]string) {
    return
}

func (p *Processor) Close() error {
    return nil
}
```

## 高级功能实现

### 1. 批量处理优化

```go
// BatchProcessor 支持批量处理的增强处理器
type BatchProcessor struct {
    baseProcessor processor.Processor
    batchSize     int
    batchBuffer   []record.Record
}

func (b *BatchProcessor) ProcessBatch(records []record.Record) ([]record.Record, error) {
    var results []record.Record
    
    for _, record := range records {
        processed, err := b.baseProcessor.Process(record)
        if err != nil {
            return nil, err
        }
        if processed != nil {
            results = append(results, processed)
        }
    }
    
    return results, nil
}
```

### 2. 链式处理器

```go
// PipelineProcessor 链式处理器
type PipelineProcessor struct {
    processors []processor.Processor
}

func (p *PipelineProcessor) Process(record record.Record) (record.Record, error) {
    var err error
    current := record
    
    for _, proc := range p.processors {
        current, err = proc.Process(current)
        if err != nil {
            return nil, err
        }
        if current == nil {
            return nil, nil // 记录被过滤
        }
    }
    
    return current, nil
}
```

### 3. 状态管理处理器

```go
// StatefulProcessor 有状态处理器
type StatefulProcessor struct {
    column      string
    state       map[string]interface{}
    windowSize  int
    recentValues []interface{}
}

func (s *StatefulProcessor) Process(record record.Record) (record.Record, error) {
    value, ok := record[s.column]
    if !ok {
        return record, nil
    }
    
    // 更新状态
    s.updateState(value)
    
    // 基于状态计算结果
    result := s.calculateResult()
    record[s.column+"_avg"] = result
    
    return record, nil
}

func (s *StatefulProcessor) updateState(value interface{}) {
    s.recentValues = append(s.recentValues, value)
    if len(s.recentValues) > s.windowSize {
        s.recentValues = s.recentValues[1:]
    }
}

func (s *StatefulProcessor) calculateResult() float64 {
    if len(s.recentValues) == 0 {
        return 0
    }
    
    // 计算移动平均值
    sum := 0.0
    count := 0
    for _, val := range s.recentValues {
        if f, err := strconv.ParseFloat(fmt.Sprintf("%v", val), 64); err == nil {
            sum += f
            count++
        }
    }
    
    if count == 0 {
        return 0
    }
    return sum / float64(count)
}
```

## 性能优化指南

### 1. 内存优化
```go
// 使用对象池减少GC压力
var recordPool = sync.Pool{
    New: func() interface{} {
        return make(record.Record, 10)
    },
}

func (p *Processor) processWithPool(r record.Record) (record.Record, error) {
    // 从池中获取记录
    processed := recordPool.Get().(record.Record)
    
    // 处理逻辑...
    
    // 处理完成后放回池中
    defer func() {
        // 清空记录内容
        for k := range processed {
            delete(processed, k)
        }
        recordPool.Put(processed)
    }()
    
    return processed, nil
}
```

### 2. 并发处理
```go
// ConcurrentProcessor 并发处理器
type ConcurrentProcessor struct {
    processor    processor.Processor
    workerCount  int
    bufferSize   int
    inputCh      chan record.Record
    outputCh     chan record.Record
    errorCh      chan error
}

func (c *ConcurrentProcessor) Start() {
    c.inputCh = make(chan record.Record, c.bufferSize)
    c.outputCh = make(chan record.Record, c.bufferSize)
    c.errorCh = make(chan error, 1)
    
    // 启动多个工作goroutine
    for i := 0; i < c.workerCount; i++ {
        go c.worker(i)
    }
}

func (c *ConcurrentProcessor) worker(id int) {
    for record := range c.inputCh {
        processed, err := c.processor.Process(record)
        if err != nil {
            select {
            case c.errorCh <- err:
            default:
            }
            break
        }
        
        if processed != nil {
            select {
            case c.outputCh <- processed:
            case <-time.After(1 * time.Second):
                break
            }
        }
    }
}
```

### 3. 缓存优化
```go
// CachedProcessor 带缓存的处理器
type CachedProcessor struct {
    processor processor.Processor
    cache     map[string]interface{}
    cacheSize int
    cacheKeys []string
}

func (c *CachedProcessor) Process(record record.Record) (record.Record, error) {
    // 生成缓存键
    cacheKey := c.generateCacheKey(record)
    
    // 检查缓存
    if cachedResult, ok := c.cache[cacheKey]; ok {
        // 更新缓存访问时间
        c.updateCacheAccess(cacheKey)
        record["processed_value"] = cachedResult
        return record, nil
    }
    
    // 处理记录
    processed, err := c.processor.Process(record)
    if err != nil {
        return nil, err
    }
    
    // 更新缓存
    if processed != nil {
        c.updateCache(cacheKey, processed["processed_value"])
    }
    
    return processed, nil
}

func (c *CachedProcessor) generateCacheKey(record record.Record) string {
    // 基于记录内容生成缓存键
    var builder strings.Builder
    for k, v := range record {
        builder.WriteString(k)
        builder.WriteString("=")
        builder.WriteString(fmt.Sprintf("%v", v))
        builder.WriteString("|")
    }
    return builder.String()
}

func (c *CachedProcessor) updateCache(key string, value interface{}) {
    if len(c.cache) >= c.cacheSize {
        // 移除最久未使用的缓存项
        oldestKey := c.cacheKeys[0]
        delete(c.cache, oldestKey)
        c.cacheKeys = c.cacheKeys[1:]
    }
    
    c.cache[key] = value
    c.cacheKeys = append(c.cacheKeys, key)
}

func (c *CachedProcessor) updateCacheAccess(key string) {
    // 将最近访问的键移动到列表末尾
    for i, k := range c.cacheKeys {
        if k == key {
            c.cacheKeys = append(c.cacheKeys[:i], c.cacheKeys[i+1:]...)
            c.cacheKeys = append(c.cacheKeys, key)
            break
        }
    }
}
```

## 测试开发

### 单元测试示例
```go
package convertType

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestConvertTypeProcessor_Open(t *testing.T) {
    tests := []struct {
        name        string
        config      map[string]string
        expectError bool
        errorMsg    string
    }{
        {
            name: "有效配置",
            config: map[string]string{
                "column": "age",
                "type":   "integer",
            },
            expectError: false,
        },
        {
            name: "缺少列名",
            config: map[string]string{
                "type": "integer",
            },
            expectError: true,
            errorMsg:    "column",
        },
        {
            name: "无效类型",
            config: map[string]string{
                "column": "age",
                "type":   "invalid_type",
            },
            expectError: true,
            errorMsg:    "unsupported",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            processor := &Processor{}
            err := processor.Open(tt.config)
            
            if tt.expectError {
                require.Error(t, err)
                if tt.errorMsg != "" {
                    assert.Contains(t, err.Error(), tt.errorMsg)
                }
            } else {
                require.NoError(t, err)
                assert.Equal(t, tt.config["column"], processor.column)
                assert.Equal(t, tt.config["type"], processor.toType)
            }
        })
    }
}

func TestConvertTypeProcessor_Process(t *testing.T) {
    processor := &Processor{
        column: "age",
        toType: "integer",
    }
    
    tests := []struct {
        name     string
        input    record.Record
        expected record.Record
        expectError bool
    }{
        {
            name: "字符串转整数",
            input: record.Record{"age": "25", "name": "张三"},
            expected: record.Record{"age": int64(25), "name": "张三"},
        },
        {
            name: "浮点数转整数",
            input: record.Record{"age": 25.5, "name": "李四"},
            expected: record.Record{"age": int64(25), "name": "李四"},
        },
        {
            name: "列不存在",
            input: record.Record{"name": "王五"},
            expected: record.Record{"name": "王五"},
        },
        {
            name: "无效值转换",
            input: record.Record{"age": "abc", "name": "赵六"},
            expectError: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := processor.Process(tt.input)
            
            if tt.expectError {
                require.Error(t, err)
            } else {
                require.NoError(t, err)
                assert.Equal(t, tt.expected, result)
            }
        })
    }
}
```

### 集成测试示例
```go
func TestProcessorIntegration(t *testing.T) {
    // 创建处理器管道
    processors := []processor.Processor{
        &convertType.Processor{column: "age", toType: "integer"},
        &filterRows.Processor{column: "age", operator: ">", value: "18"},
        &maskData.Processor{column: "name", mask: "*", keep: 1},
    }
    
    pipeline := &PipelineProcessor{processors: processors}
    
    // 测试数据
    testRecords := []record.Record{
        {"name": "张三", "age": "20"},
        {"name": "李四", "age": "16"},
        {"name": "王五", "age": "25"},
    }
    
    var results []record.Record
    for _, record := range testRecords {
        processed, err := pipeline.Process(record)
        if err != nil {
            t.Fatalf("处理失败: %v", err)
        }
        if processed != nil {
            results = append(results, processed)
        }
    }
    
    // 验证结果
    assert.Equal(t, 2, len(results)) // 年龄大于18的记录
    for _, result := range results {
        // 验证年龄是整数类型
        age, ok := result["age"].(int64)
        assert.True(t, ok)
        assert.Greater(t, age, int64(18))
        
        // 验证姓名被脱敏
        name, ok := result["name"].(string)
        assert.True(t, ok)
        assert.True(t, strings.HasSuffix(name, "*"))
    }
}
```

## 最佳实践

### 1. 错误处理
- **详细错误信息**: 包含上下文信息，便于调试
- **错误分类**: 区分配置错误、处理错误、数据错误等
- **优雅降级**: 部分记录处理失败时继续处理其他记录
- **错误恢复**: 提供恢复机制和重试逻辑

### 2. 性能优化
- **批量处理**: 支持批量处理以提高吞吐量
- **内存管理**: 使用对象池和缓存减少GC压力
- **并发处理**: 支持并发处理以提高性能
- **懒加载**: 延迟初始化资源，减少启动时间

### 3. 可维护性
- **清晰接口**: 定义明确的接口和契约
- **模块化设计**: 组件之间松耦合
- **配置驱动**: 通过配置控制行为，便于调试
- **详细日志**: 记录关键操作和性能指标

### 4. 可测试性
- **依赖注入**: 通过接口依赖而非具体实现
- **模拟支持**: 提供测试用的模拟实现
- **配置灵活**: 支持测试环境特殊配置
- **覆盖率**: 确保足够的测试覆盖率

## 常见问题

### 1. 内存泄漏
**问题**: 长时间运行后内存持续增长
**解决方案**:
- 使用对象池管理记录对象
- 及时释放不再使用的资源
- 定期清理缓存和状态
- 监控内存使用情况

### 2. 性能瓶颈
**问题**: 处理器成为ETL管道性能瓶颈
**解决方案**:
- 实现批量处理接口
- 使用并发处理提高吞吐量
- 优化算法和数据结构
- 添加缓存减少重复计算

### 3. 数据质量问题
**问题**: 输入数据格式不一致导致处理失败
**解决方案**:
- 实现灵活的数据验证
- 提供数据清洗和转换功能
- 记录数据质量指标
- 支持多种输入格式

### 4. 配置复杂性
**问题**: 处理器配置过于复杂难以使用
**解决方案**:
- 提供合理的默认值
- 实现配置验证和错误提示
- 提供配置模板和示例
- 支持配置热更新

## 调试技巧

### 1. 启用详细日志
```go
func (p *Processor) debugLog(message string, fields map[string]interface{}) {
    if p.config["debug"] == "true" {
        log := logrus.WithField("component", name)
        for k, v := range fields {
            log = log.WithField(k, v)
        }
        log.Debug(message)
    }
}

// 在处理过程中添加调试日志
p.debugLog("开始处理记录", map[string]interface{}{
    "record_id": record["id"],
    "column":    p.column,
    "value":     record[p.column],
})
```

### 2. 性能监控
```go
func (p *Processor) enableMonitoring() {
    if p.config["monitor"] == "true" {
        go func() {
            ticker := time.NewTicker(30 * time.Second)
            defer ticker.Stop()
            
            for range ticker.C {
                var m runtime.MemStats
                runtime.ReadMemStats(&m)
                
                logrus.WithFields(logrus.Fields{
                    "alloc":       m.Alloc,
                    "total_alloc": m.TotalAlloc,
                    "sys":         m.Sys,
                    "num_gc":      m.NumGC,
                    "records_processed": p.stats.RecordsProcessed,
                    "processing_time":   p.stats.TotalProcessingTime,
                }).Info("处理器性能统计")
            }
        }()
    }
}
```

### 3. 数据采样
```go
func (p *Processor) sampleData(record record.Record, sampleRate float64) {
    if rand.Float64() < sampleRate {
        logrus.WithFields(logrus.Fields{
            "sample_record": record,
            "processor_state": p.getState(),
        }).Info("数据采样")
    }
}
```

## 下一步

完成数据处理组件开发后，您可以：
1. **[开发数据输出组件](./develop-component-sink.md)** - 学习如何开发数据写入组件
2. **[集成测试](#测试开发)** - 确保组件与其他组件协同工作
3. **[性能调优](#性能优化指南)** - 优化组件性能
4. **[监控部署](#调试技巧)** - 添加监控和告警功能

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-17*  
*作者: etl-go 开发团队*