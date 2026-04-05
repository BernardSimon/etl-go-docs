---
layout: home


hero:
  name: ETL-GO
  text: 开箱即用的开源ETL
  tagline: 基于 Go + Vue 构建，支持 SQL / 文件 / HTTP 数据流
  image:
    src: /logo.png
    alt: ETL-GO
  actions:
    - theme: brand
      text: 快速开始
      link: /quick-start
    - theme: alt
      text: 入门指南
      link: /getting-started
    - theme: alt
      text: 开发文档
      link: /develop-prepare

features:
  - title: 真实可用的 ETL 平台
    details: 含任务调度、执行记录、文件资产、可视化任务配置和后端 API。
  - title: 内置可扩展组件
    details: 支持多个常用数据源，SQL/CSV/JSON/HTTP输入输出，支持Doris Stream Load输出。
  - title: 插件式开发体验
    details: 组件通过工厂注册，用户可按标准接口快速追加自定义组件与数据源。
  - title: 生产就绪
    details: 支持数据库迁移、日志管理、任务运行记录、手动执行与 Cron 调度。
---

## 为什么选择 ETL-GO

ETL-GO 是一个面向工程实践的轻量级 ETL 框架，适合快速搭建数据同步、清洗、脱敏、文件导入导出等业务场景。

- 直接运行后端即可启用内置 Web 控制台
- 支持任务模板、任务记录和日志追踪
- 数据输入/输出/处理组件可自定义扩展
- 面向数据库与文件数据源，适用多种数据管道场景

## 文档阅读路径（中文）

如果你是首次接触 ETL-GO，建议按下面顺序阅读：

1. [快速开始](/quick-start)
2. [配置文件](/config)
3. [入门指南](/getting-started)
4. [任务配置](/task)
5. [任务调度与执行](/task-schedule)

如果你是二开开发者，建议直接走开发主线：

1. [开发准备](/develop-prepare)
2. [代码架构](/develop-architecture)
3. [组件开发总览](/develop-component-architecture)
4. [注册组件](/develop-install-components)

## 核心能力

- `Source`：SQL / CSV / JSON / HTTP
- `Processor`：类型转换、行过滤、脱敏、列选择、列重命名
- `Sink`：SQL / CSV / JSON / Doris / HTTP
- `Executor`：任务前后 SQL 执行
- `Variable`：SQL 查询变量

## 主要场景

- 数据库到数据库的同步与迁移
- 文件到数据库的数据导入
- SQL 查询结果导出为 CSV/JSON
- 基于任务调度的定时数据更新
- 可视化任务管理与错误排查

## 适用人群

- 数据工程师
- 后端开发者
- 平台运维与数据中台团队
- 希望以Go为基础打造可扩展ETL团队

## 常用入口

- [下载与安装](/download)
- [从源码构建](/build)
- [运行程序](/run)
- [前后端分离开发](/front-back-separate)
