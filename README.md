BitShares-UI
============

This is a light wallet that connects to a BitShares API provided by the *witness_node* executable.


It *stores all keys locally* in the browser, *never exposing your keys to anyone* as it signs transactions locally before transmitting them to the API server which then broadcasts them to the blockchain network. The wallet is encrypted with a password of your choosing and encrypted in a browser database.

>这是一个链接BitShares API的轻钱包，而BitShares API由可执行的 *witness_node*  提供

>它把*所有的密钥存储在本地浏览器上*，*绝对不要把你的密钥暴露给任何人*，因为它会先在本地签署交易，再传到API服务器上，最后广播至区块链网络。这个钱包被一个你选择的密码加密，也会被浏览器数据库加密。

## Getting started&emsp;项目部署

BitShares-UI depends node Node.js, and version 6+ is required.

On Ubuntu and OSX, the easiest way to install Node is to use the [Node Version Manager](https://github.com/creationix/nvm).

To install NVM for Linux/OSX, simply copy paste the following in a terminal:

>BitShares-UI依赖于Node.js, 需要版本号v6以上。目前还没有被版本号v7测试。

>在Ubuntu和OSX，安装Node最简单的方式是用[NVM](https://github.com/creationix/nvm)。

>为了安装Linux/OSX的NVM，只需要简单地把下列的代码复制粘贴进命令控制终端:
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v6
nvm use v6
```

Once you have Node installed, you can clone the repo:

>一旦你把节点安装完毕，你就可以克隆这一版本库:
```
git clone https://github.com/bitshares/bitshares-ui.git
cd bitshares-ui
```

Before launching the GUI you will need to install the npm packages:

>在装载GUI前，你需要为每一子目录安装npm包:
```
npm install
```

## Running the dev server&emsp;运行开发服务器

The dev server uses Express in combination with Webpack.

<<<<<<< fcd7d7a6e6b91ecd0695bdac7368ef9dbaaec712
Once all the packages have been installed you can start the development server by running:

>开发服务器使用了EXPRESS和Webpack.

>一旦所有的封包被安装了，你就可以通过'web'文件夹并且输入下列代码，开始启动开发服务器
```
npm start
```

Once the compilation is done the GUI will be available in your browser at: `localhost:8080` or `127.0.0.1:8080`. Hot Reloading is enabled so the browser will live update as you edit the source files.

>一旦编译成功，GUI会在你的浏览器上成功部署，链接是`localhost:8080` 或者`127.0.0.1:8080`。我们加载了热重载机制，只要你编辑源文件，浏览器便会实时更新。

## Testnet&emsp;测试网络
By default bitshares-ui connects to the live BitShares network, but it's very easy to switch it to the testnet run by Xeroc. To do so, open the UI in a browser, go to Settings, then under Access, select the *Public Testnet Server* in the dropdown menu. You should also change the faucet if you need to create an account, the testnet faucet address is https://testnet.bitshares.eu.

The UI will reload and connect to the testnet, where you can use the faucet to create an account and receive an initial sum of test BTS.

>通过默认设置，bitshares-ui会连接到实时比特股网络，但要想切换到由Xeroc创建的测试网络也很容易。步骤是，在浏览器中打开UI，到设置（Settings）界面，在出入口(Access)下面，在下拉条里选择公共测试网络服务器。如果你想要建立一个账户，你也需要切换水龙头，测试网络的水龙头地址https://testnet.bitshares.eu 。

>UI就会重载并连接至测试网络。在这里你就可以用水龙头创建一个账户并收到一些用于测试的BTS。

![image](https://cloud.githubusercontent.com/assets/6890015/22055747/f8e15e68-dd5c-11e6-84cd-692749b578d8.png)

## Production&emsp;产品
If you'd like to host your own wallet somewhere, you should create a production build and host it using NGINX or Apache. In order to create a prod bundle, simply run the following command:

>如果你想要做主机来持有你自己的钱包，你需要建立一个生产构件，并通过NGINX或者Apache做主机。为了建立一个bundle，只用简单地运行下列命令:
```
npm run build
```
This will create a bundle in the /dist folder that can be hosted with the web server of your choice.


>这样就能在建立一个/dist目录下建立一个bundle,让你选择的网络服务器来主持它。

### Installable wallets
We use Electron to provide installable wallets, available for Windows, OSX and Linux Debian platforms such as Ubuntu. First, make sure your local python version is 2.7.x, as a dependency requires this.

On Linux you will need to install the following packages to handle icon generation:

`sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils`

For building, each architecture has it's own script that you can use to build your native binary:

__Linux__
`npm run package-deb`
__Windows__
`npm run package-win`
__Mac__
`npm run package-mac`

This will compile the UI with some special modifications for use with Electron, generate installable binaries with Electron and copy the result to the root `build/binaries` folder.

## 可安装钱包
我们使用Electron来提供可安装钱包，Windows, OSX 和Linux平台如Ubuntu都可以使用。首先，在'electron'文件夹里安装需要的封包。然后到'web'文件夹里运行`npm run electron`。这样就会在编译UI的同时针对Electron做一些特殊的改进，并将结果粘贴至根文件夹 `electron/build`。现在，为了创建一个钱包到你的平台上，回到`electron`文件夹并运行`npm run release`。


## Contributing
Please work off the staging branch and make pull requests to that branch. The master branch will only be updated for new releases.

The Bitshares UI team is supported by this [worker proposal](http://www.bitshares.foundation/workers/2017-08-bill-butler). It provides the funds needed to pay the coordinator and the bounties and the Bitshares Foundation.

If you would like to get involved, we have a [Telegram chatroom](https://t.me/BitSharesDEX) where you can ask questions and get help. You may also join [BitShares on Discord](https://discord.gg/GsjQfAJ)

- Coordinator: Bill Butler, @billbutler
- Lead Developer: Sigve Kvalsvik, @sigvek
- Developer: Calvin Froedge, @calvin
- Code Review: Fabian Schuh, @xeroc

## 贡献

Bitshares UI团队被这一[工作提案](https://steemit.com/bitshares/@billbutler/translated-by-zhaomu-l)支持。它提供用来支付协调者，悬赏金和比特股基金的资金。

如果你想参与贡献，我们有一个[Telegram 聊天室](https://t.me/BitSharesDEX)，在这里你可以问问题并得到帮助。

- 协调者: Bill Butler, @billbutler
- 主程序员: Sigve Kvalsvik, @sigvek
- 程序员: Calvin Froedge, @calvin
- 代码审核: Fabian Schuh, @xeroc

## Development process

- Milestones are numbered YYMMDD and refer to the **anticipated release date**.
- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue `git checkout -b 123`
- We pay **bounties** for issues that have been estimated. An estimated issue is prefixed with a number in brackets like this: `[2] An nasty bug`. In this example, the bug is valued at two hours ($125 per hour). If you fix this issue according to these guidelines and your PR is accepted, this will earn you $250 bitUSD. You must have a Bitshares wallet and a Bitshares account to receive payment.
- If an issue is already claimed (assigned), do not attempt to claim it. Issues claimed by outside developers will indicate an assignment to wmbutler, but will mention the developer's github account in this the comments.
- To claim an issue, simply leave a comment with your request to claim.
- Do not claim an issue if you will be unable to complete it by the date indicated on the Milestone name. Milestone 170901 will be pushed on September 1, 2017.

## 开发流程

- 开发目标上标记的日期，是预计发表时间
- 修补漏洞优先于项目改进
- 开发者需要根据一个被标好数字（这个数字对应一个问题`git checkout -b 123`）的分叉（branch），对每个问题进行开发。
- 我们对已经被预算好的问题进行**悬赏**。一个被预算好的问题会被标记上前缀，像这样`[2] An nasty bug`。在这一例子中，这个问题被视作价值两个小时的工作时间（125美刀一小时）。如果你能通过这些指南修改这一问题，并且你的修改要求（Pull Request）被接受，你便会得到250 bitUSD。你必须拥有一个比特股钱包和比特股账号用来接收这一支付。
- 如果问题已经被认领（指派），不要尝试认领它。外部开发者认领问题意味着 wmbutler的指派，但是我会在评论里提及这一开发者的github账户。
- 简单地留下一条你要求认领的评论（comment），便能认领问题。
- 不要认领一个在开发目标上所写规定时间内完成不了的问题。列如 开发目标170901 需要在2017年9月1日前被推进完成.

## Coding style guideline

Our style guideline is based on 'Airbnb JavaScript Style Guide' (https://github.com/airbnb/javascript), with few exceptions:

- Strings are double quoted
- Additional trailing comma (in arrays and objects declaration) is optional
- 4 spaces tabs
- Spaces inside curly braces are optional

We strongly encourage to use _eslint_ to make sure the code adhere to our style guidelines.

## 代码风格
我们的代码指南基于[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript),不过有一些例外：

 - 字符串需要被双引
 - 额外的尾随逗号（在定义数组和对象时）是随意的
 - 四个空格的缩进
 - 在花括号里的空格是随意的

我们强烈鼓励用  _eslint_ 确保代码依附于我们的代码风格指南
