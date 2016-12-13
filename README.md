Graphene-UI
============

### Getting started

Graphene-UI depends on Node.js. While it should work using versions as old as 0.12.x, it is recommended to use v5.x.

On Ubuntu and OSX, the easiest way to install Node is to use the [Node Version Manager](https://github.com/creationix/nvm).
For Windows users there is [NVM-Windows](https://github.com/coreybutler/nvm-windows).

To install NVM for Linux/OSX, simply copy paste the following in a terminal:
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v5
nvm use v5
```

On windows NVM (support node version 4 and up) work from here: https://github.com/coreybutler/nvm-windows
```
nvm install v5.11.1 32
nvm use v5.11.1
```
Once you have Node installed, you can clone the repo:
```
git clone https://github.com/cryptonomex/graphene-ui.git
cd graphene-ui
```

Before launching the GUI you will need to install the npm packages for each subdirectory:
```
cd dl; npm install
cd ../web; npm install
```

There is an optional bloom filter that will greatly reduce the size of BTS 0.9.x wallet imports.  Go to the ./web folder and run:
```
wget https://github.com/bitshares/bitshares-js/releases/download/vBTS2_bloom_filter/bts_genesiskeys_bloom.dat -O app/assets/bts_genesiskeys_bloom.dat
```

## Running the dev server

Once all the packages have been installed you can start the development server by going to the ./web folder and running:
```
npm start
```

Once the compilation is done the GUI will be available in your browser at: localhost:8080. Hot Reloading is enabled so the browser will live update as you edit the source files.

### Testnet
By default graphene-ui connects to the live Bitshares network, but it's very easy to switch it to the testnet run by Xeroc. To do so, open the UI in a browser, go to Settings, then under Api Connection, click the + button to add an api server. Enter the following address in the popup: ws://testnet.bitshares.eu:11011. From the dropdown, select the newly added server then click confirm. The UI will reload and connect to the testnet, where you can use the faucet to create an account and receive an initial sum of test BTS.

## Production
If you'd like to host your own wallet somewhere, you should create a production build and host it using NGINX or Apache. In order to create a prod bundle, simply run the following command:
```
npm run build
```
This will create a bundle in the /dist folder that can be hosted with the web server of your choice.

## Contributing
Graphene-UI is open source and anyone is free to contribute. PR's are welcomed and will be reviewed in a timely manner, and long-term contributors will be given access to the repo.

If you would like to get involved, we have a Slack channel where you can ask questions and get help.

For more info, please contact one of the following people:

- fabian@bitshares.org
- cass@bitshares.org
- bitsharesblocks@gmail.com
- valentine@cryptonomex.com

There's also a very active [Telegram chatroom](https://web.telegram.org/#/im?p=g33416306)

## Development process

- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue `git checkout -b 123`

### Github issues are being used to track bugs and feature requests. 

- Project Coordinator (@wmbutler) reads through new issues and requests clarification if needed
- Issues get assigned to Milestones
- Milestones are typically 1 week long ending on Wednesday
- All devs are expected to install zenhub. Zenhub creates viewable pipelines and allows for issue estimation. Estimates are based on anticipated hours to complete.

`http://zenhub.io`

- New issues have not been categorized yet or are tagged as question when seeking clarification
- Backlog issues have been assigned to a Milestone and are waiting for a dev to estimate and claim
- In Progress issues are being actively worked
- Testing issues are waiting for independent tests. (Methodology fully defined as of yet, so devs test their own work for now)
- Closed issues are complete

### When a new Milestone is about to start

- Project Coordinator announces the number of issues and requests them to be claimed and estimated
- Presents a burndown chart for the week

### Sunday

- Project Coordinator summarizes progress with burndown chart
- Ensures that all items are claimed and estimated
- Escalates to @valzav for unestimated and/or unclaimed items

### Wednesday

- Testing is completed
- Release notes completed by @valzav
- Project Coordinator announces release on bitsharestalk and provides link to release notes

### Thursday

- Incomplete items are moved to new Milestone
- Old Milestone is closed
- New Milestone is activated (rinse lather repeat)

### Coding style guideline

Our style guideline is based on 'Airbnb JavaScript Style Guide' (https://github.com/airbnb/javascript), with few exceptions:

- Strings are double quoted
- Additional trailing comma (in arrays and objects declaration) is optional
- 4 spaces tabs
- Spaces inside curly braces are optional

We strongly encourage to use _eslint_ to make sure the code adhere to our style guidelines.

To install eslint and its dependencies, run:

```
npm install -g eslint-config-airbnb eslint-plugin-react eslint babel-eslint
```

## Testing
Jest currently doesn't work with node (see https://github.com/facebook/jest/issues/243), so in order to run the tests you need to install iojs. Under Ubuntu instructions can be found here:

[Nodesource Ubuntu io.js installation](https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories "Nodesource iojs")

In order for jest to correctly follow paths it is necessary to add a local path to your NODE_PATH variable. Under Ubuntu, you can do so by running the following from the web directory:
```
export NODE_PATH=$NODE_PATH:.
```

Tests are then run using 
```
npm test
```
