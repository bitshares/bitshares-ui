Graphene GUI
============

## Install

```
cd cli; npm install
cd ../dl; npm install
cd ../ios; npm install
cd ../web; npm install
```

## Run it

Go to cli or web dir and run:

```
npm start
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


