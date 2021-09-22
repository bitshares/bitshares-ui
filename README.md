BitShares-UI
============
[中文版](README_zh.md)

This is the reference wallet of BitShares Blockchain which connects to BitShares Blockchain API provided by *bitshares-core* synced node.

This reference wallet is a browser based wallet, which means *your keys are stored locally* in your browser and *never leaves it* while using the wallet, you should *never expose your keys to anyone* as the reference wallet of BitShares Blockchain signs transactions locally before transmitting them to BitShares Blockchain API which then broadcasts them to BitShares Blockchain nodes.

## Getting started

Building BitShares-UI browser based reference wallet depends on node version 10.

On Ubuntu or OSX, the easiest way to install node is to use [Node Version Manager](https://github.com/creationix/nvm).

To install nvm for Ubuntu or OSX, use following commands in terminal using a non-root user:

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v10
nvm use v10
```

Once you have node installed, clone the repo using the following commands using a non-root user:

```
git clone https://github.com/bitshares/bitshares-ui.git
cd bitshares-ui
```

Before launching the GUI you will need to install the npm packages using a non-root user:

```
npm install
```

## Running the dev server

The dev server uses Express in combination with Webpack.

Once all the packages have been installed you can start the development server by running:

```
npm start
```

Once the compilation is done the GUI will be available in your browser at: `localhost:8080` or `127.0.0.1:8080`. Hot Reloading is enabled so the browser will live update as you edit the source files.

## Testnet

By default bitshares-ui connects to the live BitShares network, but it's very easy to switch it to the testnet run by Xeroc. To do so, open the UI in a browser, go to Settings, then under Access, select the *Public Testnet Server* in the dropdown menu. You should also change the faucet if you need to create an account, the testnet faucet address is https://testnet.bitshares.eu.

The UI will reload and connect to the testnet, where you can use the faucet to create an account and receive an initial sum of test BTS.

![image](https://cloud.githubusercontent.com/assets/6890015/22055747/f8e15e68-dd5c-11e6-84cd-692749b578d8.png)

## Production

If you'd like to host your own wallet somewhere, you should create a production build and host it using NGINX or Apache. In order to create a prod bundle, simply run the following command:

```
npm run build
```

This will create a bundle in the ./build/dist folder that can be hosted with the web server of your choice.

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

### Docker

Clone this repository, run `docker-compose up` and visit localhost:8080


## Contributing & Coding style guideline

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Code of Conduct

This repository has a Code of Conduct that should be followed by everyone. 
Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

**Please keep comments constructive and clean**

## BrowserStack 

The BitShares UI is integrated with BrowserStack (https://www.browserstack.com) to allow manual compatibility testing across devices and browser versions. In the future we will switch to a automated Selenium testing framework.
![image](https://user-images.githubusercontent.com/33128181/48697885-05f8d880-ebe6-11e8-95a2-d87516cbb3d9.png)

## Release Branches

Development is processed through two week milestones.
There are three branches that forms the current release process.

### Develop

All PRs should be pushed to the `develop` branch. At the end of each milestone this branch is pushed to `staging`.
New commits are automatically deployed to this branch and published for review.

Available for browsing on https://develop.bitshares.org

### Staging (Current Release Candidate)

At the end of each milestone, `develop` branch is pushed to staging and forms the Release Candidate. The date of the RC forms the name, ie. 190214-RC*.

Application breaking issues and bugs should be submitted to the issue tracker and PRs should be pushed to `staging`.

Available for browsing on https://staging.bitshares.org

### Master (stable)

When all issues to the current RC are fixed, `staging` branch is released to the stable `master` branch.

Available for browsing on https://wallet.bitshares.org which is the official reference wallet for Bitshares.



