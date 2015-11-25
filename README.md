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

There is optional bloom filter that will greatly reduce the size of BTS 0.9.x wallet imports.  Go to the ./web folder and run:
```
wget https://github.com/bitshares/bitshares-js/releases/download/vBTS2_bloom_filter/bts_genesiskeys_bloom.dat -O app/assets/bts_genesiskeys_bloom.dat
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

