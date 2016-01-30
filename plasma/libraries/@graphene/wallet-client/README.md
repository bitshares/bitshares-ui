# Setup
```bash
npm install
```

# Configure
For the unit tests, you will need to `npm start` a programs/wallet-server configured with the same secret (@graphene/local-secret:secret = 'test').
```sh
# Sample ./.npmrc
@graphene/wallet-client:remote_url = ws://localhost:9080/wallet_v1
@graphene/local-secret:secret = 'test'
```

# Confidential Wallet Usage
* [Usage (unit test)](./test/confidential_wallet.js)
* [API](./src/ConfidentialWallet.js)

# Commands
Example: `npm run [test|test:watch]`
