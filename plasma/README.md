Root development and deployment environment Graphene JavaScript libraries and programs.

* [Programs](./programs)
* [Libraries](./libraries)

# Setup

This repository contains several sub-projects (libraries).  For convenience, a root `package.json` is provided that will install all dependencies for all sub-projects.  You can setup your PATH and NODE_PATH so you can use these libraries and avoid the need to install every sub-project.  Should a version conflict come up, it may be necessary to install the subproject or resolve the conflict.

```bash
npm install

# Test then add these paths to `./bashrc`
export PLASMA_HOME=~/graphene-ui/plasma
export NODE_PATH="$PLASMA_HOME/node_modules:$PLASMA_HOME/libraries"
PATH="$PLASMA_HOME/node_modules/.bin:$PATH"
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
