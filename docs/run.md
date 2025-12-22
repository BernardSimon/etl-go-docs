# 运行程序

ETL-GO的运行十分简单，您只需要简单的操作或者几行简单的代码即可完成运行。

## Linux/Macos

当您下载或者编译，得到了一个ETL-GO的运行目录，请打开终端或者ssh进入该目录

```bash
cd /path/to/your/bin
./etl-go
```
建议您使用tmux类型的应用，持久化终端以保护etl-go的进程，确保定时任务能按时执行。

## Windows
您只需要双击目录内的etl-go.exe即可启动应用，请保持命令行窗口的开启状态。
您也可以通过cmd来运行本应用。
```bash
cd \path\to\your\bin
etl-go.exe
```
## 程序运行之后

当应用启动后，若这是第一次运行，应用会自动初始化本地sqlite数据库，您可以访问您的前端地址（默认为：http://localhost:8081）开始使用本工具。
::: warning 注意！
默认的登陆账号为：admin，密码为：password123。我们强烈建议您修改默认的账户密码，修改后您需要重启应用才会生效。
:::
当您想重新初始化数据库，请参考[config](./config)章节，修改配置项，并重启应用。