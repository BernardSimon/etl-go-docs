---
layout: home

hero:
  name: ETL-GO
  text: Out-of-the-box Open Source ETL
  tagline: Built on Go + Vue, supports SQL / File / HTTP data pipelines
  image:
    src: /logo.png
    alt: ETL-GO
  actions:
    - theme: brand
      text: Quick Start
      link: /en/quick-start
    - theme: alt
      text: Getting Started
      link: /en/getting-started
    - theme: alt
      text: Dev Docs
      link: /en/develop-prepare

features:
  - title: Production-Ready ETL Platform
    details: Includes task scheduling, execution records, file assets, visual task configuration, and backend API.
  - title: Built-in Extensible Components
    details: Supports multiple common data sources, SQL/CSV/JSON/HTTP input and output, and Doris Stream Load output.
  - title: Plugin-style Development
    details: Components are registered through a factory. Users can quickly add custom components and data sources via standard interfaces.
  - title: Production Ready
    details: Supports database migration, log management, task run records, manual execution, and Cron scheduling.
---

## Why ETL-GO

ETL-GO is a lightweight ETL framework oriented toward engineering practice, suitable for quickly building data synchronization, cleansing, masking, file import/export, and other business scenarios.

- Run the backend to immediately enable the built-in Web console
- Supports task templates, task records, and log tracing
- Data input/output/processing components are fully customizable
- Designed for database and file data sources, suitable for various data pipeline scenarios

## Recommended Reading Path

If you are new to ETL-GO, it is recommended to read in this order:

1. [Quick Start](/en/quick-start)
2. [Configuration File](/en/config)
3. [Getting Started Guide](/en/getting-started)
4. [Task Configuration](/en/task)
5. [Task Scheduling & Execution](/en/task-schedule)

If you are a developer doing secondary development, go directly to the development track:

1. [Development Preparation](/en/develop-prepare)
2. [Code Architecture](/en/develop-architecture)
3. [Component Development Overview](/en/develop-component-architecture)
4. [Register Components](/en/develop-install-components)

## Core Capabilities

- `Source`: SQL / CSV / JSON / HTTP
- `Processor`: Type conversion, row filtering, masking, column selection, column renaming
- `Sink`: SQL / CSV / JSON / Doris / HTTP
- `Executor`: Pre/post task SQL execution
- `Variable`: SQL query variables

## Main Scenarios

- Database-to-database synchronization and migration
- File-to-database data import
- SQL query result export to CSV/JSON
- Scheduled data updates via task scheduling
- Visual task management and error troubleshooting

## Target Users

- Data engineers
- Backend developers
- Platform operations and data platform teams
