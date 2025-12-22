# Configuration Items
Configuration items are stored in `config.yaml` in the root directory of the project executable file.

## Standard Configuration File
```yaml
# ./config.yaml
username: admin                    # Administrator username
password: password123             # Administrator password
jwtSecret: <your-jwt-secret>      # JWT secret
aesKey: <your-aes-key>            # AES encryption key
initDb: false                     # Whether to initialize the database
logLevel: prod                     # Log level (dev|prod)
serverUrl: localhost:8080         # API service address
runWeb: true                     # Whether to start the Web interface
webUrl: localhost:8081            # Web interface address
```

## Main Configuration Items

### Login Information
- username: Administrator username
- password: Administrator password
- jwtSecret: JWT secret

  ::: tip Tip
  - Administrator login is the account password when the project frontend enters the panel. After successful login, a JWT token will be generated based on the secret.
  - JWT token is a stateless authentication method. After successful user login, the server will return a Token, which will be carried in subsequent user requests. The server will verify the user's identity based on the Token, which is the current mainstream authentication method.
  - It is recommended to change the default password and secret in the configuration file.
  - If you deploy the project on a server, you must modify the default secret to prevent attacks.
  :::

### AES Encryption
- aesKey: AES encryption key

  ::: tip Tip
    We will use AES encryption when storing sensitive information, which will effectively protect the security of sensitive information in Sqlite. Your stored data source related configuration information will be encrypted and stored. Even if the relevant database information is leaked, the data is still safe.
  :::

### Frontend-Backend Addresses
When the project is running, it will occupy 2 ports, one for API services and one for Web services.
- serverUrl: API service address
- webUrl: Web service address

  ::: tip Tip
  - The API service address and Web service address cannot be the same, otherwise it will not start.
  - If you modify the serverUrl, you will not be able to use the built-in Web service. Please refer to the [Frontend-Backend Separation]() instructions, repack the frontend project, and set runWeb to false, and use nginx or other programs to run the Web service.
  - Please do not add the http:// prefix to the service address.
  :::

### Other Configuration Items
- initDb: Whether to initialize the database
- logLevel: Log level (dev|prod)
- runWeb: Whether to start the Web interface

  ::: tip Tip
    - When the system runs for the first time, initDB will default to true. After waiting for the initialization to complete, the system will automatically set initDB to false.
    - If you need to use the built-in Web service, please set runWeb to true, and set webUrl to a locally available port, but please do not modify serverUrl.
    - When you set logLevel to dev, the system will output logs to the console.
  :::