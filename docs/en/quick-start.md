# Quick Start
ETL-GO is an out-of-the-box open-source data integration tool designed to help users quickly integrate data, achieve offline data synchronization, and provide scheduled tasks, system variables, and pre/post scripts to help users automate data integration.

## Features
- **Out-of-the-box**: Built-in multiple commonly used data sources, processors, and target components
- **Highly Extensible**: Plugin architecture, supports custom component development
- **Visual Configuration**: Provides a Web interface for task configuration and monitoring
- **Multi-Data Source Support**: MySQL, PostgreSQL, SQLite, Doris, CSV, JSON, etc.
- **Rich Processors**: Data type conversion, row filtering, data masking, column renaming, etc.
- **Task Scheduling**: Supports scheduled tasks and manual triggering
- **Variable Management**: Dynamic configuration and SQL variable support
- **File Management**: Built-in file upload and management functions
- **Log Monitoring**: Comprehensive log recording and task execution monitoring

## Main Functions

## Current Official Plugins

### Data Source (DataSource)
- MySQL
- PostgreSQL
- SQLite
- Doris

### Data Input (Source)
- SQL Query (MySQL, PostgreSQL, SQLite)
- CSV Files
- JSON Files

### Data Processing (Processor)
- convertType: Data Type Conversion
- filterRows: Row Filtering
- maskData: Data Masking (MD5, SHA256)
- renameColumn: Column Renaming
- selectColumns: Column Selection

### Data Output (Sink)
- SQL Tables (MySQL, PostgreSQL, SQLite)
- CSV Files
- JSON Files
- Doris Fast Output (stream_load)

### Executor (Executor)
- SQL Execution (MySQL, PostgreSQL, SQLite)

### Variable (Variable)
- SQL Query Variables (MySQL, PostgreSQL, SQLite)

::: warning Attention!
If the plugins provided by the official cannot meet your needs, please carefully verify the plugin information before using third-party plugins to avoid database sensitive information leakage or data corruption.
:::

## Tech Stack
This project is developed based on the [go-pocket-etl](https://github.com/changhe626/go-pocket-etl) core code, with the backend developed using Gin, GORM, Sqlite, and Zap, and the frontend developed using Vue3 and Antdv.