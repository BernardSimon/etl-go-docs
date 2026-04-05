# Task Optimization

ETL-GO execution efficiency is related to task configuration, data source performance, and concurrency parameters.

## Key Configuration Options

- `pipeline.batchSize`: Batch write size
- `pipeline.channelSize`: Internal channel buffer size
- Data source connection pool settings: `maxOpenConns` / `maxIdleConns`

## Tuning Recommendations

### 1. `batchSize`

- Too small: Low throughput, too many write operations.
- Too large: High cost of a single batch failure; significant memory pressure.
- Recommendation: Start between `200~1000` and tune incrementally based on target database capacity.

### 2. `channelSize`

- Too small: Upstream and downstream stages easily block each other.
- Too large: Memory usage increases noticeably.
- Recommendation: Use the default value first; adjust after observing backpressure at specific stages.

### 3. Processor chain complexity

- Use `selectColumns` first to reduce fields, then apply conversions and masking.
- Avoid heavy computation inside Processors.

### 4. Source/Sink strategy

- Source: use page or shard reads for large tables.
- Sink: ensure target database indexes and write strategies are appropriate.

## Optimization Checklist

1. Is the task slow at "reading" or "writing"?
2. Is there a single Processor becoming a bottleneck?
3. Is the data source connection pool exhausted?
4. Are frequent retries dragging down actual throughput?

## Common Scenarios

- When batch writing CSV/JSON files, increase batch size appropriately
- When accessing multiple databases concurrently, increase connection pool capacity
- For non-relational data cleansing, simplify Processor logic as much as possible

## Common Issues

### 1. Throughput suddenly drops

- Check target database lock waits, slow SQL, and network instability.

### 2. Memory keeps increasing

- Reduce `channelSize` and `batchSize`, and check for oversized records.
