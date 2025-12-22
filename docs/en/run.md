# Running the Program

Running ETL-GO is very simple. You only need simple operations or a few lines of code to complete the run.

## Linux/MacOS

When you have downloaded or compiled to get an ETL-GO runtime directory, please open the terminal or SSH into that directory

```bash
cd /path/to/your/bin
./etl-go
```
It is recommended that you use tmux-like applications to persist the terminal to protect the etl-go process and ensure that scheduled tasks can be executed on time.

## Windows
You only need to double-click etl-go.exe in the directory to start the application. Please keep the command line window open.
You can also run this application through cmd.
```bash
cd \path\to\your\bin
etl-go.exe
```
## After the Program Runs

After the application starts, if this is the first run, the application will automatically initialize the local SQLite database. You can access your frontend address (default: http://localhost:8081) to start using this tool.

::: warning Attention!
The default login account is: admin, password: password123. We strongly recommend that you change the default account password. After modification, you need to restart the application for it to take effect.
:::

When you want to reinitialize the database, please refer to the [config](./en/config) chapter, modify the configuration items, and restart the application.