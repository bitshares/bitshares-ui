BitShares-UI
============

这是一个连接 BitShares API 的轻钱包。BitShares API 由 *witness_node* 程序提供。

这个钱包**将所有的密钥存储在本地浏览器上**，**不会把你的密钥上传到网络**，因为它会先在本地对交易签名，再传输到 API 服务器上，由服务器广播至区块链网络。钱包由用户选择的密码加密并储存在浏览器数据库中。

## 项目依赖

BitShares-UI 依赖于 Node.js v16 以上版本。

在 Linux 和 macOS 上，安装 Node 最简单的方式是用 [NVM](https://github.com/creationix/nvm)。

安装 NVM 并根据您的平台推荐设置版本。

```
nvm install v16
nvm use v16
```

Node 安装完成后，获取项目的源代码：

```
git clone https://github.com/bitshares/bitshares-ui.git
cd bitshares-ui
```

在启动之前，需要先安装 yarn 软件包：

```
yarn install
```

## 运行开发服务器

所有软件包安装好后，可以使用以下命令启动开发服务器：

```
yarn start
```

编译完成后，即可通过浏览器访问 `localhost:8080` 或 `127.0.0.1:8080` 打开钱包。服务器启用了热加载功能，在编辑源文件后，浏览器中的内容会实时更新。

## 测试网络

默认情况下，bitshares-ui 将连接到 BitShares 主网。 通过在节点设置中选择 *Testnet* 也可以轻松切换到 testnet。 UI 将刷新并连接到测试网络。

还有一个现成的直接连接到测试网的部署（包括创建测试帐户的功能） [在此](https://test.xbts.io/)。

![image](https://user-images.githubusercontent.com/33128181/175760811-736c9b21-9122-4160-bd30-465bb755a3a3.png)

## 生产环境
如果你想自己架设钱包，你应该进行生产环境构建，并使用 NGINX 或 Apache 托管。只需要运行以下命令构建生产环境应用包：

```
yarn run build
```


应用包会创建在 `/dist` 目录下，可以使用网站服务器进行托管。

## 可安装钱包
我们使用 Electron 提供可安装的钱包，支持 Windows、macOS 和基于 Debian 的 Linux 系统，例如 Ubuntu。

有一个 [GitHub Action](https://github.com/bitshares/bitshares-ui/blob/master/.github/workflows/build-release-binaries.yml#L18) 可用，它显示了构建的所有必要步骤。

编译 UI 时将会针对 Electron 做出一些特殊修改，之后生成可安装的二进制文件，并将文件复制到 `build/binaries` 文件夹中。

## 发布分支

当前的发布流程由三个分支构成。

### develop（开发版本）

开发期间所有 PR 都应该推送到 `develop` 分支。
新提交会自动部署到此分支并发布以供审核。

可在 https://develop.bitshares.org 浏览

### staging（当前候选发布版本）

在每个里程碑结束时， `develop` 分支被推送到 `staging` 分支并形成候选发布版，版本号为“主版本号.日期-rc序号”格式，如 `5.0.220214-rc1` 。

如果发现问题或错误，应提交给问题跟踪器，PR 应推送到 `staging` 分支。

可在 https://staging.bitshares.org 浏览

### master（稳定版本）

当前候选发布版本的所有重大问题都修复后， `staging` 分支被发布到稳定的 `master` 分支。

可在 https://wallet.bitshares.org 浏览，这是 BitShares 的官方参考钱包。
