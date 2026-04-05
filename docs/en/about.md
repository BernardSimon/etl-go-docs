# About ETL-GO

ETL-GO is an extensible ETL platform built in Go, aiming to provide developers with a lightweight, configurable, and extensible data integration tool.

## Design Goals

- Simplify data integration workflows
- Reduce the cost of secondary development
- Support common databases + file + HTTP data sources
- Provide a visual Web management interface

## Core Design Principles

### 1. Componentization

The platform divides ETL capabilities into six component types: `Datasource / Source / Processor / Sink / Executor / Variable`, managed uniformly through factory registration.

### 2. Pipeline Concurrent Execution

The execution chain runs using goroutines + channels, supporting batch processing, cancellation propagation, and fast failure.

### 3. Web + API Dual Channels

- Provides a Web management console for visual configuration
- Provides `/api/v1` endpoints for platform integration and automation

## Main Capabilities

- Data source management
- Task configuration
- Data input/processing/output
- Task scheduling and manual execution
- Task records and log analysis
- File asset management
- Component factory extension mechanism

## Applicable Scenarios

- Database synchronization (database to database)
- File import/export (CSV/JSON)
- HTTP API pull or push
- Scheduled data processing tasks
- Building an in-house data automation platform

## Project Status

- The project has completed core pipeline refactoring; documentation is being continuously updated.
- Chinese documentation is maintained with priority; English content can be updated as needed.
