# Frontend-Backend Separation
::: tip Tip
ETL-GO is natively a frontend-backend separated architecture. To maintain the convenience of local user operation, the frontend is packaged within the executable file during backend construction, and an HTTP service is built within the backend through static simulation forwarding.
:::
When you need to deploy on a server, or need to run the frontend in dev mode, or need to modify the backend running port, you need to refer to this document for frontend-backend separation deployment.

## Compiling Frontend
- Please refer to the previous chapter [Building from Source](./en/build) to obtain all the source code of this project and modify the backend address in the frontend environment configuration to your backend address
- The project backend allows all sources through HTTP header information and defaults to allowing cross-domain requests

After completing the above work, you need to enter the frontend project directory and install all frontend dependencies:
```bash
cd /path/to/your/project/etl-go/web
pnpm install
```

When you need to run the frontend in dev mode, please execute the following command in the frontend project directory. The frontend project will be deployed and run at http://localhost:5244 by default. When the port is occupied, please check the command line prompt to find the running port address:

```bash
cd /path/to/your/project/etl-go/web
pnpm dev
```

When you need to package the frontend project as static resources, please execute the following command to compile the frontend source code:

```bash
cd /path/to/your/project/etl-go/web
pnpm build
```
After compilation is complete, you can find the compiled frontend build files in the /path/to/your/project/etl-go/web/dist directory, and package and upload them to your HTTP service.

## Compiling Backend Source Code
::: tip Tip
Please note that regardless of whether you perform frontend-backend separation, a built-in HTTP service and the required frontend build files will be included in the default backend project. Therefore, you need to complete the frontend build (pnpm build) according to the above steps and ensure that the dist directory contains the built frontend files before starting backend build. When you completely don't need this service, you can edit the main.go file of the backend project to remove the related service code.
:::

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

After completing the above configuration, execute the following command to compile the backend source code:

```bash
cd /path/to/your/project/etl-go/
go build -o etl-go
```
Now you can find the etl-go executable file in this directory.

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
For generating the config.yaml file, please refer to the [Configuration File](./en/config) chapter.
In the case of frontend-backend separation, you need to set runWeb to false in the config.