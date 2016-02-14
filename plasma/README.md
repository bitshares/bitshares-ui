Root development and deployment environment Graphene JavaScript libraries and programs.

* [Wallet Server](./programs/wallet-server)
* [Libraries](./libraries/@graphene)

# Setup

When using this from the "../web" in the browser, just run `npm install` here and your setup is complete.

The following allows you to run programs or unit tests.

This repository contains several sub-projects (libraries).  For convenience, a root `package.json` is provided that will install all dependencies for all sub-projects.  You can setup your PATH and NODE_PATH so you can use these libraries and avoid the need to install every sub-project.  Should a version conflict come up, it may be necessary to install the subproject or resolve the conflict.

Babel has a bug, this is a work-around.  The "preset" property in `plasma/.bablerc` is required when runing plasma unit tests and programs.  The "web" package however has a bug and will not work if "presets" is found in the file.  The work-around is to change plasma's .bablerc by hand but leave "preset" commented out in the repository (so the web works).


```bash
npm install

# Test then add these paths to `./bashrc`
export PLASMA_HOME=~/graphene-ui/plasma
export NODE_PATH="$PLASMA_HOME/node_modules:$PLASMA_HOME/libraries"
PATH="$PLASMA_HOME/node_modules/.bin:$PATH"
```

Some tests use a witness node and may consume the CORE asset indefinatly.  Setup a [private testnet](https://github.com/cryptonomex/graphene/wiki/private-testnet).  


Add the testing key to the new genesis.json:
```js
"initial_accounts": [
    {
      "name": "nathan",
      "owner_key": "GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
      "active_key": "GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
      "is_lifetime_member": false
    },
```
```js
  "initial_balances": [{
      "owner": "GPHFAbAx7yuxt725qSZvfwWqkdCwp9ZnUama",
      "asset_symbol": "CORE",
      "amount": "1000000000000000"
    },
```
Balance claims in the "web" package:
```js
  "initial_vesting_balances": [ {
      "owner": "GPHFAbAx7yuxt725qSZvfwWqkdCwp9ZnUama",
      "asset_symbol": "BTS",
      "amount": 50000000000,
      "begin_timestamp": "2014-11-06T00:00:00",
      "vesting_duration_seconds": 63072000,
      "begin_balance": 50000000000
    }
  ],
```

Commands for the `cli_wallet` required only once after starting the testnet chain.
```bash
set_password pw
unlock pw

import_key "nathan" 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
import_balance nathan [5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3] true
```


# Wallet Server
```bash
# If you setup dependencies and environment here, you do not need to `npm install` again.
# Look at README.md in `./programs/wallet-server`...
cd programs/wallet-server
```

# ESDoc (beta)
```bash
npm i -g esdoc esdoc-es7-plugin
esdoc -c ./esdoc.json
open out/esdoc/index.html
```
