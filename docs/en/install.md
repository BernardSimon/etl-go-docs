# Using Pre-built Installation Packages
ETL-GO has good compatibility, supporting multiple architectures and operating systems. Official pre-compiled packages are provided for common systems and architectures.

| System        |      Platform      |  Compatibility |   Pre-compiled Package |
| ------------- | :-----------: | ----: | ----: |
| windows      | X86 |   ✅   |   ❌ | 
| windows      | AMD64 |   ✅   |   ✅ |
| windows      | ARM |   ✅   |   ❌ |
| linux      | X86 |   ✅   |   ❌ |
| linux      | AMD64 |   ✅   |   ✅ |
| linux      | ARM |   ✅   |   ✅ |
| macOS      | AMD64 |   ✅   |   ✅ |
| macOS      | ARM |   ✅   |   ✅ |

## How to Download Pre-compiled Packages
- Method 1: Go to the [Download Program](./en/download.html) page to download the latest version of the pre-compiled package for your system and architecture.
- Method 2: Go to the [github-release](https://github.com/BernardSimon/etl-go/releases) page to download pre-compiled packages of all versions.

## Directory Structure of Compiled Packages
 ```
|-- etl-go                  # Executable program directory
|   |-- etl-go.exe          # Executable file, etl-go on Linux/macOS systems
|   |-- data.db             # SQLite database
|   |-- config.yaml         # Configuration file
|   |-- log                 # Log directory
|   |   |-- app.log         # Log file
|   |-- file                # File directory
|       |-- input           # Upload file directory
|       |-- output          # Download file directory

 ```

## Suitable Pre-compiled Package Not Found
Don't worry, ETL-GO supports custom compilation. With Go language's excellent cross-platform compatibility and cross-compilation support, you can build executable programs suitable for your device with just a few commands. For details, please refer to [Build from Source](./en/build.html).