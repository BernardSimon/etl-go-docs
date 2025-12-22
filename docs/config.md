# 配置项
配置项存储于项目可执行文件的根目录内的`config.yaml`。
## 标准配置文件
```yaml
# ./config.yaml
username: admin                    # 管理员用户名
password: password123             # 管理员密码
jwtSecret: <your-jwt-secret>      # JWT密钥
aesKey: <your-aes-key>            # AES加密密钥
initDb: false                     # 是否初始化数据库
logLevel: prod                     # 日志级别 (dev|prod)
serverUrl: localhost:8080         # API服务地址
runWeb: true                     # 是否启动Web界面
webUrl: localhost:8081            # Web界面地址
```
## 主要配置项
### 登陆信息
- username: 管理员用户名
- password: 管理员密码
- jwtSecret: JWT密钥
  ::: tip 提示
  - 管理员登陆为项目前端进入面板时的账户密码，登陆成功后会根据密钥生成JWT令牌。
  - JWT令牌是一种无状态的认证方式，用户登陆成功后，服务端会返回一个Token，用户后续的请求中会携带这个Token，服务端会根据Token验证用户身份，这是目前的主流认证方式。
  - 建议在配置文件中更改默认的密码和密钥。
  - 如果您在服务器上部署项目，请必须修改默认的密钥，防止被攻击。
  :::

### AES 加密
- aesKey: AES加密密钥
  ::: tip 提示
    我们会在存储敏感信息时使用AES加密，这将有效保护Sqlite内敏感信息的安全性，您存储的数据源相关配置信息将会加密存储，即便相关数据库信息被泄露，数据仍然安全。
  :::
### 前后端地址
项目在运行时，会占用2个端口，分别用于API服务、Web服务。
- serverUrl: API服务地址
- webUrl: Web服务地址
  ::: tip 提示
  - API服务地址和Web服务地址不能相同，否则将无法启动。
  - 如果您修改了serverUrl，那么您将无法使用内建的Web服务，请参考[前后端分离]()说明，重新打包前端项目，并且设置runWeb为false，使用nginx或其他程序运行Web服务。
  - 服务地址请不要加http://前缀。
  :::
### 其他配置项
- initDb: 是否初始化数据库
- logLevel: 日志级别 (dev|prod)
- runWeb: 是否启动Web界面
  ::: tip 提示
    - 系统第一次运行时将默认initDB为true，等待初始化完成后，系统将自动设置initDB为false。
    - 如果您需要使用内建的Web服务，请将runWeb设置为true，并设置webUrl为本机可用端口，但请不要修改serverUrl。
    - 当您设置的logLevel为dev时，系统将在控制台输出日志。
  :::
