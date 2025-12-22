---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: ETL-GO
  text: Out-of-the-box Open Source ETL
  tagline: Developed in Go language, Apache License 2.0
  image:
    src: /public/logo.png
    alt: ETL-GO
  actions:
    - theme: brand
      text: Quick Start
      link: /en/quick-start
    - theme: alt
      text: Development Documentation
      link: /en/develop-prepare      
    - theme: alt
      text: Direct Download
      link: /en/download

features:
  - title: Multi-Data Source Support
    details: Supports multiple data sources such as MySQL, PostgreSQL, SQLite, Doris, CSV, JSON. Ready to use out of the box without complex configuration.
  - title: Scheduled/Manual Tasks
    details: Configurable task execution plans, supports reading variables from multiple data sources, pre/post-task processors to free your hands.
  - title: Developer Friendly
    details: Easily customize your own data sources, data transformation components, and meet your personalized needs.
---