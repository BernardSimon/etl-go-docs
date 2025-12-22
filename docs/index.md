---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: ETL-GO
  text: 开箱即用的开源ETL
  tagline: 基于 Go 语言开发, Apache License 2.0 协议
  image:
    src: /public/logo.png
    alt: ETL-GO
  actions:
    - theme: brand
      text: 快速开始
      link: /quick-start
    - theme: alt
      text: 开发文档
      link: /develop-prepare      
    - theme: alt
      text: 直接下载
      link: /download

features:
  - title: 多数据源支持
    details: 支持多种数据源，如 MySQL, PostgreSQL, SQLite, Doris, CSV, JSON。开箱即用，无需复杂配置。
  - title: 定时任务/手动任务
    details: 可配置的任务执行计划，支持从多种数据源读取变量，任务前后置处理器，解放双手。
  - title: 开发友好
    details: 轻松定制属于自己的数据源、数据转换等组件，满足你的个性化需求。
---

