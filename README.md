BitShares-UI
============

This is a light wallet that connects to a BitShares API provided by the *witness_node* executable.

It *stores all keys locally* in the browser, *never exposing your keys to anyone* as it signs transactions locally before transmitting them to the API server which then broadcasts them to the blockchain network. The wallet is encrypted with a password of your choosing and encrypted in a browser database.

### Getting started

BitShares-UI depends node Node.js, and version 6+ is required. It has not yet been tested with v7.

On Ubuntu and OSX, the easiest way to install Node is to use the [Node Version Manager](https://github.com/creationix/nvm).

To install NVM for Linux/OSX, simply copy paste the following in a terminal:
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v6
nvm use v6
```

Once you have Node installed, you can clone the repo:
```
git clone https://github.com/bitshares/bitshares-ui.git
cd bitshares-ui
```

Before launching the GUI you will need to install the npm packages for each subdirectory:
```
cd web
npm install
```

### Running the dev server

The dev server uses Express in combination with Webpack 2.

Once all the packages have been installed you can start the development server by going to the `web` folder and running:
```
npm start
```

Once the compilation is done the GUI will be available in your browser at: `localhost:8080` or `127.0.0.1:8080`. Hot Reloading is enabled so the browser will live update as you edit the source files.

### Testnet
By default bitshares-ui connects to the live BitShares network, but it's very easy to switch it to the testnet run by Xeroc. To do so, open the UI in a browser, go to Settings, then under Access, select the *Public Testnet Server* in the dropdown menu. You should also change the faucet if you need to create an account, the testnet faucet address is https://testnet.bitshares.eu.

The UI will reload and connect to the testnet, where you can use the faucet to create an account and receive an initial sum of test BTS.

![image](https://cloud.githubusercontent.com/assets/6890015/22055747/f8e15e68-dd5c-11e6-84cd-692749b578d8.png)

## Production
If you'd like to host your own wallet somewhere, you should create a production build and host it using NGINX or Apache. In order to create a prod bundle, simply run the following command:
```
npm run build
```
This will create a bundle in the /dist folder that can be hosted with the web server of your choice.

### Installable wallets
We use Electron to provide installable wallets, available for Windows, OSX and Linux Debian platforms such as Ubuntu. First, install the required packages in the `electron` folder. Then go to the `web` folder and run `npm run electron`. This will compile the UI with some special modifications for use with Electron, and copy the result to the root `electron/build` folder. Now go back to the `electron` folder and run `npm run release` in order to build a wallet for your platform.

## Contributing

The Bitshares UI team is supported by this [worker proposal](http://www.bitshares.foundation/workers/2017-08-bill-butler). It provides the funds needed to pay the coordinator and the bounties and the Bitshares Foundation. 

If you would like to get involved, we have a [Telegram chatroom](https://t.me/BitSharesDEX) where you can ask questions and get help.

- Coordinator: Bill Butler, @billbutler
- Lead Developer: Sigve Kvalsvik, @sigvek
- Developer: Calvin Froedge, @calvin
- Code Review: Fabian Schuh, @xeroc

## Development process

- Milestones are numbered YYMMDD and refer to the **anticipated release date**.
- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue `git checkout -b 123`
- We pay **bounties** for issues that have been estimated. An estimated issue is prefixed with a number in brackets like this: `[2] An nasty bug`. In this example, the bug is valued at two hours ($125 per hour). If you fix this issue according to these guidelines and your PR is accepted, this will earn you $250 bitUSD. You must have a Bitshares wallet and a Bitshares account to receive payment.
- If an issue is already claimed (assigned), do not attempt to claim it. Issues claimed by outside developers will indicate an assignment to wmbutler, but will mention the developer's github account in this the comments.
- To claim an issue, simply leave a comment with your request to claim.
- Do not claim an issue if you will be unable to complete it by the date indicated on the Milestone name. Milestone 170901 will be pushed on September 1, 2017.

### Coding style guideline

Our style guideline is based on 'Airbnb JavaScript Style Guide' (https://github.com/airbnb/javascript), with few exceptions:

- Strings are double quoted
- Additional trailing comma (in arrays and objects declaration) is optional
- 4 spaces tabs
- Spaces inside curly braces are optional

We strongly encourage to use _eslint_ to make sure the code adhere to our style guidelines.
