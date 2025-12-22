# 从源码构建

ETL-GO 采用前后端分离架构设计。为了简化部署流程，后端程序会内嵌一份前端静态资源，从而模拟 nginx 启动前端服务。当您需要从源码构建时，请按照以下步骤操作。

## 获取源码

::: tip 提示
请先安装 Git、Go、NodeJS 和 pnpm 环境
:::

执行以下命令从 GitHub 获取本项目的全部源代码：

```bash
cd /path/to/your/project
git clone https://github.com/BernardSimon/etl-go.git
```


## 编译前端源代码

默认情况下，前端应用会连接到 `http://localhost:8080` 的后端服务。如果您需要更改此地址，请修改 `web/.env.production` 文件中的 `VITE_API_BASE_URL` 字段。

若您需要在开发模式下运行前端程序，请同步修改 `web/.env.development` 文件中的 `VITE_API_BASE_URL` 字段。

```yaml
VITE_API_BASE_URL=http://your.api.url
```


完成前端源代码的准备工作后，执行以下命令编译前端源代码：

```bash
cd /path/to/your/project/etl-go/web
pnpm install
pnpm build
```


## 编译后端源代码

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
config.yaml文件的生成请参考[配置文件](./config)章节

