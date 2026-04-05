import { defineConfig } from 'vitepress'


export default defineConfig({
  ignoreDeadLinks: true,
  head: [['link', { rel: 'icon', href: '/icon.ico' }]],
  title: "ETL-GO 文档站",
  description: "开箱即用的开源ETL",
  themeConfig: {
    search: {
      provider: 'local'
    },
    logo: '/logo.png',
    lang : 'zh',
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/getting-started' },
      { text: '开发', link: '/develop-prepare' },
      { text: '下载', link: '/download' }
    ],

    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '入门指南', link: '/getting-started' },
          { text: '快速开始', link: '/quick-start' },
          { text: '安装与部署', items: [
              { text: '使用已构建安装包', link: '/install' },
              { text: '从源码构建', link: '/build' },
              { text: '运行程序', link: '/run' },
              { text:'前后端分离', link: '/front-back-separate' }
            ] },
        ]
      },
      {
        text: '运行配置',
        items: [
          { text: '配置文件', link: '/config' },
          { text: 'API 参考', link: '/api-reference' },
          { text: '内置组件', link: '/builtin-components' },
          { text: '数据源配置', link: '/data-source' },
          { text: '变量配置', link: '/variable' },
        ]
      },
      {
        text: '任务使用',
        items: [
          { text: '任务配置' ,items:  [
              { text: '创建任务', link: '/task' },
              { text: '数据输入', link: '/task-source' },
              { text: '数据处理', link: '/task-processor' },
              { text: '数据输出', link: '/task-sink' },
              { text: '前后置处理器', link: '/task-executor' },
            ] },
          { text: '任务调度与执行', link: '/task-schedule' },
          { text: '查看任务执行情况', link: '/task-record' },
          { text: '日志分析', link: '/task-log' },
          { text: '文件管理', link: '/task-file' },
          { text: '任务优化', link: '/task-optimization' },
          { text: '任务依赖', link: '/task-dependency' },
        ]
      },
      {
        text: '开发指南',
        items: [
          { text: '开发准备', link: '/develop-prepare' },
          { text: '主程序开发', items: [
              { text: '获取主程序代码', link: '/develop-source' },
              { text: '代码架构', link:  '/develop-architecture' },
            ] },
          { text: '组件开发', items: [
                { text: '开发组件默认约定', link: '/develop-component-architecture' },
                { text: '数据源组件开发', link: '/develop-component-datasource' },
                { text: '数据输入组件开发', link: '/develop-component-source' },
                { text: '数据处理组件开发', link: '/develop-component-processor' },
                { text: '数据输出组件开发', link: '/develop-component-sink' },
                { text: '执行器组件开发', link: '/develop-component-executor' },
                { text: '变量组件开发', link: '/develop-component-variable' },
            ] }
          ,
          { text: '注册组件', link: '/develop-install-components' },
        ]
      },
      {
        text: '项目信息',
        items: [
          { text: '下载程序', link: '/download' },
          { text: '关于 ETL-GO', link: '/about' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BernardSimon/etl-go' }
    ],
    footer: {
      message: '京ICP备2025150565号-1',
      copyright: 'Copyright © 2025-至今'
    }
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh',
      link: '/'
    },
    en: {
      title: "ETL-GO Docs",
      description: "Out-of-the-box Open Source ETL",
      label: 'English',
      lang: 'en',
      themeConfig : {
        logo: '/logo.png',
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Docs', link: '/en/getting-started' },
          { text: 'Develop', link: '/en/develop-prepare' },
          { text: 'Download', link: '/en/download' }
        ],
        sidebar: [
          {
            text: 'Getting Started',
            items: [
              { text: 'Getting Started Guide', link: '/en/getting-started' },
              { text: 'Quick Start', link: '/en/quick-start' },
              {
                text: 'Installation & Deployment',
                items: [
                  { text: 'Using Pre-built Package', link: '/en/install' },
                  { text: 'Build from Source', link: '/en/build' },
                  { text: 'Run the Program', link: '/en/run' },
                  { text: 'Frontend-Backend Separation', link: '/en/front-back-separate' }
                ]
              }
            ]
          },
          {
            text: 'Runtime Configuration',
            items: [
              { text: 'Configuration File', link: '/en/config' },
              { text: 'Data Source Configuration', link: '/en/data-source' },
              { text: 'Variable Configuration', link: '/en/variable' }
            ]
          },
          {
            text: 'Task Usage',
            items: [
              {
                text: 'Task Configuration',
                items: [
                  { text: 'Create Task', link: '/en/task' },
                  { text: 'Data Input', link: '/en/task-source' },
                  { text: 'Data Processing', link: '/en/task-processor' },
                  { text: 'Data Output', link: '/en/task-sink' },
                  { text: 'Pre/Post Processors', link: '/en/task-executor' }
                ]
              },
              { text: 'Task Scheduling & Execution', link: '/en/task-schedule' },
              { text: 'View Task Execution Status', link: '/en/task-record' },
              { text: 'Log Analysis', link: '/en/task-log' },
              { text: 'File Management', link: '/en/task-file' },
              { text: 'Task Optimization', link: '/en/task-optimization' },
              { text: 'Task Dependencies', link: '/en/task-dependency' }
            ]
          },
          {
            text: 'Development Guide',
            items: [
              { text: 'Development Preparation', link: '/en/develop-prepare' },
              {
                text: 'Main Program Development',
                items: [
                  { text: 'Get Main Program Code', link: '/en/develop-source' },
                  { text: 'Code Architecture', link: '/en/develop-architecture' }
                ]
              },
              {
                text: 'Component Development',
                items: [
                  { text: 'Component Development Conventions', link: '/en/develop-component-architecture' },
                  { text: 'Data Source Component Development', link: '/en/develop-component-datasource' },
                  { text: 'Data Input Component Development', link: '/en/develop-component-source' },
                  { text: 'Data Processing Component Development', link: '/en/develop-component-processor' },
                  { text: 'Data Output Component Development', link: '/en/develop-component-sink' },
                  { text: 'Executor Component Development', link: '/en/develop-component-executor' },
                  { text: 'Variable Component Development', link: '/en/develop-component-variable' }
                ]
              },
              { text: 'Register Components', link: '/en/develop-install-components' }
            ]
          },
          {
            text: 'Project Info',
            items: [
              { text: 'Download', link: '/en/download' },
              { text: 'About ETL-GO', link: '/en/about' }
            ]
          }
        ],
        footer: {
          message: '京ICP备2025150565号-1',
          copyright: 'Copyright © 2025-Present'
        }
      }
    },
  }
  })
