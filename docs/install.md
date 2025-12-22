# 使用已构建的安装包
ETL-GO具有良好的兼容性，支持多种架构和操作系统，官方提供常用系统与架构的预编译包。
| 系统        |      平台      |  兼容性 |   预编译包 |
| ------------- | :-----------: | ----: | ----: |
| windows      | X86 |   ✅   |   ❌ | 
| windows      | AMD64 |   ✅   |   ✅ |
| windows      | ARM |   ✅   |   ❌ |
| linux      | X86 |   ✅   |   ❌ |
| linux      | AMD64 |   ✅   |   ✅ |
| linux      | ARM |   ✅   |   ✅ |
| macOS      | AMD64 |   ✅   |   ✅ |
| macOS      | ARM |   ✅   |   ✅ |

## 如何下载预编译包
- 方式一：进入[下载程序](./download.html)页面下载最新版本对应系统与架构的预编译包。
- 方式二：进入[github-release](https://github.com/BernardSimon/etl-go/releases)页面下载所有版本的预编译包。
## 编译包的目录结构
 ```
|-- etl-go                  # 可执行程序目录
|   |-- etl-go.exe          # 可执行文件，在 Linux/macOS 系统中为 etl-go
|   |-- data.db             # SQLite 数据库
|   |-- config.yaml         # 配置文件
|   |-- log                 # 日志目录
|   |   |-- app.log         # 日志文件
|   |-- file                # 文件目录
|       |-- input           # 上传文件目录
|       |-- output          # 下载文件目录

 ```

## 未找到合适的预编译包
不用担心，ETL-GO支持自定义编译，在Go语言良好的跨平台兼容性和交叉编译支持的情况下，只需要几行命令就可以构建适用于您设备的可执行程序，具体请参考[从源码构建](./build.html)。