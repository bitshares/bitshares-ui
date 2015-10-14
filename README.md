Graphene GUI
============

## Prerequisites

BitShares GUI depends on Node.js.

On Ubuntu you can install Node.js via the following command:
```
sudo apt-get install git nodejs-legacy npm
```

In order to use the GUI you will need to have a functioning witness node from the BitShares running with a websocket endpoint at localhost:8090. Instructions for this can be found here: https://github.com/cryptonomex/graphene 

While waiting for the public testnet you may want to run a local chain, to do so add the following to your config.ini in ./witness_node_data_dir :

```
# Endpoint for websocket RPC to listen on
rpc-endpoint = 127.0.0.1:8090

# Enable block production, even if the chain is stale.
enable-stale-production = true

# ID of witness controlled by this node (e.g. "1.6.0", quotes are required, may specify multiple times)
witness-id = "1.6.0"
witness-id = "1.6.1"
witness-id = "1.6.2"
witness-id = "1.6.3"
witness-id = "1.6.4"
witness-id = "1.6.5"
witness-id = "1.6.6"
witness-id = "1.6.7"
witness-id = "1.6.8"
witness-id = "1.6.9"
```

## Install
```
git clone https://github.com/cryptonomex/graphene-ui.git
cd graphene-ui
```

Before launching the GUI you will need to install the npm packages for each subdirectory:
```
cd cli; npm install
cd ../dl; npm install
cd ../ios; npm install
cd ../web; npm install
```

## Run it

Once all the packages have been installed you can launch the web gui by going to the ./web folder and running::

```
npm start
```

Once the compilation is done the GUI will be available in your browser at: localhost:8080

A javascript CLI environment is also available in the ./cli folder. Some example commands:

```
// Transaction template:
$g.wallet.template("account_upgrade")

// Create a transaction:
var tr = $g.wallet.new_transaction()
tr.add_type_operation("account_upgrade", {"account_to_upgrade":"1.2.15","upgrade_to_lifetime_member":true})
$g.wallet.sign_and_broadcast(tr) 
```

## Environment
```
export GRAPHENE_UI_HOME=$HOME/bitshares/graphene-ui
export NODE_PATH="$NODE_PATH:$GRAPHENE_UI_HOME/dl/src:$GRAPHENE_UI_HOME/web/app"
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


