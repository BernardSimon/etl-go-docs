# Building from Source

ETL-GO adopts a front-end and back-end separation architecture design. To simplify the deployment process, the back-end program embeds a set of front-end static resources to simulate nginx starting the front-end service. When you need to build from source, please follow the steps below.

## Getting the Source Code

::: tip Tip
Please install Git, Go, NodeJS, and pnpm environments first
:::

Execute the following command to get all the source code of this project from GitHub:

```bash
cd /path/to/your/project
git clone https://github.com/BernardSimon/etl-go.git
```


## Compiling Front-end Source Code

By default, the front-end application will connect to the back-end service at `http://localhost:8080`. If you need to change this address, please modify the `VITE_API_BASE_URL` field in the `web/.env.production` file.

If you need to run the front-end program in development mode, please also modify the `VITE_API_BASE_URL` field in the `web/.env.development` file.

```yaml
VITE_API_BASE_URL=http://your.api.url
```


After completing the front-end source code preparation, execute the following command to compile the front-end source code:

```bash
cd /path/to/your/project/etl-go/web
pnpm install
pnpm build
```


## Compiling Back-end Source Code

If you need to cross-compile executable programs for other operating systems or architectures, please set the corresponding environment variables:

```bash
export GOOS=yourOS GOARCH=yourArch
```


Common `GOOS` and `GOARCH` combinations include:

| GOOS    | GOARCH |
|---------|--------|
| linux   | amd64  |
| linux   | arm64  |
| windows | amd64  |
| darwin  | amd64  |
| darwin  | arm64  |

After completing the above configuration, execute the following command to compile the back-end source code:

```bash
cd /path/to/your/project/etl-go/
go build -o etl-go
```


## Creating a New Runtime Directory
You need to create a new project runtime root directory according to the following directory structure, and place the built executable file in this directory:
 ```
|-- etl-go                  # Executable program directory
|   |-- etl-go.exe          # Executable file, etl-go on Linux/macOS systems
|   |-- data.db             # SQLite database
|   |-- config.yaml         # Configuration file
|   |-- log                 # Log directory
|   |-- file                # File directory
|       |-- input           # Upload file directory
|       |-- output          # Download file directory

 ```
For generating the config.yaml file, please refer to the [Configuration File](./en/config) chapter