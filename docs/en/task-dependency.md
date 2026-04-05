# Task Dependencies

The current version of ETL-GO focuses on task execution and scheduling management, and does not yet provide complex task dependency chains.

## Current Status

- Supports task template reuse
- Supports manual and scheduled execution
- No built-in cross-task dependency scheduling

## Viable Approaches

To implement task dependencies, you can simulate them via:

- After task A succeeds, have an external scheduler trigger task B's run API
- Use the task record table or a business status table as a "dependency signal"
- Use a third-party scheduling system (Airflow/xxl-job/Jenkins) to orchestrate the call order

## Recommended Implementation Pattern

1. Use ETL-GO as the execution engine and hand off dependency relationships to external orchestration.
2. Use "task record status = success" as the downstream trigger condition.
3. Add retry and alerting mechanisms to avoid single-point failures breaking the chain.

## Notes

- It is not recommended to cram too many cross-business steps into a single task to simulate dependencies.
- The longer the dependency chain, the more important it is to have clear timeout, retry, and compensation strategies.
