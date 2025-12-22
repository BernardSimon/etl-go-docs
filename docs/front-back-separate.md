# 前后端分离
::: tip 提示
ETL-GO原生即为前后端分离的架构，为了保持用户本地运行的便利性，在后端构建之时即将前端封装在打包的可执行文件之中，并且通过静态模拟转发的形式在后端内构建了http服务。
:::
当您需要在服务器进行部署，或者需要以dev模式运行前端或者需要修改后端运行端口之时，您需要参考本文档进行前后端分离部署。


## 编译前端
- 请参考上一章节[从源码构建](./build)获取到本项目的全部源代码并修改前端环境配置中的后端地址为您的后端地址
- 本项目后端通过http头信息的形式允许全部来源，默认允许跨域请求
完成上述工作后，您需要进入前端工程目录，安装所有前端依赖：
```bash
cd /path/to/your/project/etl-go/web
pnpm install
```

当您需要以dev形式允许前端之时，请在前端工程目录下执行以下命令，前端项目将默认在http://localhost:5244部署运行，当端口被占用时，请查看命令行提示找到运行的端口地址：

```bash
cd /path/to/your/project/etl-go/web
pnpm dev
```


当您需要打包前端项目为静态资源之时，请执行以下命令编译前端源代码：

```bash
cd /path/to/your/project/etl-go/web
pnpm build
```
编译完成后，您可以在/path/to/your/project/etl-go/web/dist目录下找到编译后的前端构建文件，并将其打包上传至您的http服务之中。

## 编译后端源代码
::: tip 提示
请注意，无论您是否进行前后端分离，在后端默认工程之中都会内建一个http服务并且内置所需要的前端构建后文件，所以您需要按照上述步骤完成前端构建（pnpm build）后，确保dist目录内有构建好的前端文件，才能开始进行后端构建。当您完全不需要该服务时，您可以编辑后端工程的main.go文件，去除掉相关服务代码。
:::

如果您需要交叉编译适用于其他操作系统或架构的可执行程序，请设置相应的环境变量：

```bash
export GOOS=yourOS GOARCH=yourArch
```


常用的 `GOOS` 和 `GOARCH` 组合包括：

| GOOS    | GOARCH |
|---------|--------|
| linux   | amd64  |
| linux   | arm64  |
| windows | amd64  |
| darwin  | amd64  |
| darwin  | arm64  |

完成上述配置后，执行以下命令编译后端源代码：

```bash
cd /path/to/your/project/etl-go/
go build -o etl-go
```
这样您就已经可以在该目录下找到etl-go可执行文件了

## 新建运行目录
您需要按照如下目录结构，新建项目的运行根目录，并将构建好的可执行文件放置在该目录下：
 ```
|-- etl-go                  # 可执行程序目录
|   |-- etl-go.exe          # 可执行文件，在 Linux/macOS 系统中为 etl-go
|   |-- data.db             # SQLite 数据库
|   |-- config.yaml         # 配置文件
|   |-- log                 # 日志目录
|   |-- file                # 文件目录
|       |-- input           # 上传文件目录
|       |-- output          # 下载文件目录

 ```
config.yaml文件的生成请参考[配置文件](./config)章节，
在前后端分离的情况下您需要设置config中的runWeb为false。

