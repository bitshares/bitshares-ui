BitShares-UI
============

这是一个连接 BitShares API 的轻钱包。BitShares API 由 *witness_node* 程序提供。

这个钱包*将所有的密钥存储在本地浏览器上*，*不会把你的密钥暴露给任何人*，因为它会先在本地对交易签名，再传输到 API 服务器上，由服务器广播至区块链网络。钱包由用户选择的密码加密并储存在浏览器数据库中。

## 项目依赖

BitShares-UI 依赖于 Node.js v6 以上版本。

在 Linux 和 macOS 上，安装 Node 最简单的方式是用 [NVM](https://github.com/creationix/nvm)。

将以下命令复制到终端中执行即可安装 NVM。

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v6
nvm use v6
```

Node 安装完成后，获取项目的源代码：

```
git clone https://github.com/bitshares/bitshares-ui.git
cd bitshares-ui
```

在启动之前，需要先安装 npm 软件包：

```
npm install
```

## 运行开发服务器

开发服务器使用 Express 和 Webpack。

所有软件包安装好后，可以使用以下命令启动开发服务器：

```
npm start
```

编译完成后，即可通过浏览器访问 `localhost:8080` 或 `127.0.0.1:8080` 打开钱包。服务器启用了热加载功能，在编辑源文件后，浏览器中的内容会实时更新。

## 测试网络

默认情况下，bitshares-ui 会连接到正常比特股网络。切换到 Xeroc 运行的测试网络也很容易，在设置页面的接入点设置中选择 *Public Testnet Server* 即可。如果你需要创建帐号，你同时需要修改水龙头设置。测试网络的水龙头地址是 https://testnet.bitshares.eu 。

UI 会刷新并连接到测试网络，你可以通过水龙头创建账户并收到一些用于测试的 BTS。

![image](https://cloud.githubusercontent.com/assets/6890015/22055747/f8e15e68-dd5c-11e6-84cd-692749b578d8.png)

## 生产环境
如果你想自己架设钱包，你应该进行生产环境构建，并使用 NGINX 或 Apache 托管。只需要运行以下命令构建生产环境应用包：

```
npm run build
```


应用包会创建在 `/dist` 目录下，可以使用网站服务器进行托管。

## 可安装钱包
我们使用 Electron 提供可安装钱包，支持 Windows, macOS 和 Debian 系 Linux 系统，如 Ubuntu。首先确保你安装的 python 版本为 2.7.x，因为一个依赖要求此版本。

在 Linux 上，你需要安装以下软件包来生成图标：

`sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils`

每个目标平台都有自己的脚本用来构建项目：

__Linux__
`npm run package-deb`  
__Windows__
`npm run package-win`  
__Mac__
`npm run package-mac`

编译 UI 时将会针对 Electron 做出一些特殊修改，之后生成可安装的二进制文件，并将文件复制到 `build/binaries` 文件夹中。

## 贡献

请在 staging 分支上进行工作，并将 PR 提交到该分支中。master 分支只在发布新版本时进行更新。

Bitshares UI 团队由[这个工作提案](http://www.bitshares.foundation/workers/2017-08-bill-butler)支持。此提案提供用来支付协调者、赏金和比特股基金的资金。

如果你想参与贡献，可以加入 [Telegram 群组](https://t.me/BitSharesDEX)进行提问并获取帮助。你也可以加入 [Discord 服务器](https://discord.gg/GsjQfAJ)。

- 协调者: Bill Butler, @billbutler
- 主开发者: Sigve Kvalsvik, @sigvek
- 开发者: Calvin Froedge, @calvin
- 代码审核: Fabian Schuh, @xeroc

## 开发流程

- 开发目标使用 YYMMDD 格式进行标记，为**预计发布日期**。
- Bug 修复优先于项目改进
- 开发者应在对应 issue 编号的分支中分别进行工作，如 `git checkout -b 123`
- 我们对估算好的 issue 进行**悬赏**。估算好的 issue 拥有数字前缀，如 `[2] An nasty bug`。在这个例子中，bug 价值两个工时（每个工时价值 125 美元）。如果你按照指南修复了这个问题，PR 被接受后，就可以得到 250 bitUSD。你需要拥有比特股钱包和账户进行收款。
- 如果一个 issue 已经被认领（指派）了，不要去再次认领。外部开发者认领的 issue 将指派给 wmbutler，但是会在评论中写出开发者的 github 帐号。
- 在评论中留下认领请求即可认领 issue。
- 不要认领你无法在开发目标指明的日期之前完成的 issue。如，开发目标 170901 应在 2017 年 9 月 1 日前完成。


## 代码风格指南

我们使用 [Airbnb JavaScript 风格指南](https://github.com/airbnb/javascript)，但有以下例外：

- 字符串使用双引号 (6.1)
- 数组和对象声明时的末尾多余逗号不作要求 (20.2)
- 使用四个空格缩进 (19.1)
- 大括号中的空格不作要求 (19.11)

我们强烈鼓励使用 _eslint_ 来保证代码符合风格指南。
