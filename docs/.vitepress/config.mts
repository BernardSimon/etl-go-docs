import { defineConfig } from 'vitepress'


export default defineConfig({
  ignoreDeadLinks: true,
  head: [['link', { rel: 'icon', href: '/public/icon.ico' }]],
  title: "ETL-GO 文档站",
  description: "开箱即用的开源ETL",
  themeConfig: {
    search: {
      provider: 'local'
    },
    logo: '/public/logo.png',
    lang : 'zh',
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/quick-start' },
      { text: '下载', link: '/download' }
    ],

    sidebar: [
      {
        text: '使用文档',
        items: [
          { text: '快速开始', link: '/quick-start' },
          { text: '安装ETL-GO', items: [
              { text: '使用已构建安装包', link: '/install' },
              { text: '从源码构建', link: '/build' },
              {text:'前后端分离',link: '/front-back-separate'}
            ] },
          { text: '配置文件', link: '/config' },
          { text: '运行程序', link: '/run'},
          { text: '数据源配置', link: '/data-source'},
          { text: '变量配置', link: '/variable' },
          { text: '任务配置' ,items:  [
              { text: '创建任务', link: '/task' },
              { text: '前后置处理器', link: '/task-executor' },
              { text: '数据输入', link: '/task-source' },
              { text: '数据处理', link: '/task-processor' },
              { text: '数据输出', link: '/task-sink' },
              { text: '快速文件上传', link: '/task-file' },
            ] },
          { text: '任务调度与执行', link: '/task-schedule' },
          { text: '查看任务执行情况', link: '/task-record' },
          { text: '日志分析', link: '/task-log' },
          { text: '文件管理', link: '/file' },
        ]
      },
      {
        text: '开发指南',
        items: [
          { text: '开发准备', link: '/develop-prepare' },
          { text: '主程序开发', items:[
              { text: '获取主程序代码', link: '/develop-source' },
              { text: '代码架构', link:  '/develop-architecture' },
              { text: '注册组件', link: '/develop-install-components' },
            ] },
          { text: '组件开发', items: [
              { text: '获取组件开发包', link: '/develop-component-source' },
                { text: '开发组件默认约定', link: '/develop-component-architecture' },
                { text: '数据源组件开发', link: '/develop-component-datasource' },
                { text: '数据输入组件', link: '/develop-component-source' },
                { text: '数据处理组件', link: '/develop-component-processor' },
                { text: '数据输出组件', link: '/develop-component-sink' },
                { text: '数据执行组件', link: '/develop-component-executor' },
                { text: '变量获取组件', link: '/develop-component-variable' },
            ] }
        ]
      },
      {
        text: '其他页面',
        items: [
          { text: '下载程序', link: '/download' },
          { text: '关于我们', link: '/about' }
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
          { text: 'Home', link: '/en' },
          { text: 'Docs', link: '/en/quick-start' },
          { text: 'Download', link: '/en/download' }
        ],
        sidebar: [
          {
            text: 'User Guide',
            items: [
              { text: 'Quick Start', link: '/en/quick-start' },
              {
                text: 'Install ETL-GO',
                items: [
                  { text: 'Using Pre-built Package', link: '/en/install' },
                  { text: 'Build from Source', link: '/en/build' },
                  { text: 'Frontend-Backend Separation', link: '/en/front-back-separate' }
                ]
              },
              { text: 'Configuration Files', link: '/en/config' },
              { text: 'Running the Program', link: '/en/run' },
              { text: 'Data Source Configuration', link: '/en/data-source' },
              { text: 'Variable Configuration', link: '/en/variable' },
              {
                text: 'Task Configuration',
                items: [
                  { text: 'Create Task', link: '/en/task' },
                  { text: 'Pre/Post Processors', link: '/en/task-executor' },
                  { text: 'Data Input', link: '/en/task-source' },
                  { text: 'Data Processing', link: '/en/task-processor' },
                  { text: 'Data Output', link: '/en/task-sink' },
                  { text: 'Quick File Upload', link: '/en/task-file' }
                ]
              },
              { text: 'Task Scheduling and Execution', link: '/en/task-schedule' },
              { text: 'View Task Execution Status', link: '/en/task-record' },
              { text: 'Log Analysis', link: '/en/task-log' },
              { text: 'File Management', link: '/en/file' }
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
                  { text: 'Code Architecture', link: '/en/develop-architecture' },
                  { text: 'Register Components', link: '/en/develop-install-components' }
                ]
              },
              {
                text: 'Component Development',
                items: [
                  { text: 'Get Component Development Kit', link: '/en/develop-component-source' },
                  { text: 'Basic Component Structure', link: '/en/develop-component-architecture' },
                  { text: 'Data Source Component Development', link: '/en/develop-component-datasource' },
                  { text: 'Data Input Component Development', link: '/en/develop-component-source' },
                  { text: 'Data Processing Component Development', link: '/en/develop-component-processor' },
                  { text: 'Data Output Component Development', link: '/en/develop-component-sink' },
                  { text: 'Execution Component Development', link: '/en/develop-component-executor' },
                  { text: 'Variable Retrieval Component Development', link: '/en/develop-component-variable' }
                ]
              }
            ]
          },
          {
            text: 'Other Pages',
            items: [
              { text: 'Download', link: '/en/download' },
              { text: 'About Us', link: '/en/about' }
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
