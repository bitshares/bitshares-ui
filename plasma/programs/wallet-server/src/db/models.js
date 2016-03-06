var Sequelize = require("sequelize");
var connection = require("./connection");

// !! Use Sequelize.STRING.BINARY for case in-sensitive columns

// Don't use an ID sequence for Wallet and Account .. The records should not be linkable by the server (makes brute-forcing harder)

export var Wallet = connection.define('wallets', {
    public_key: { type: Sequelize.STRING(50), allowNull: false, primaryKey: true },// 50 base58 chars ( prefix removed )
    signature: { type: Sequelize.STRING(88), allowNull: false },// 4*Math.ceil( 65 / 3 ) === 88
    local_hash: { type: Sequelize.STRING(44), allowNull: false },// 4*Math.ceil( (256/8) / 3 ) === 44
    encrypted_data: { type: Sequelize.BLOB, allowNull: false }
});

export var Account = connection.define('accounts', {
    email_sha1: { type: Sequelize.STRING(28), allowNull: false, primaryKey: true }, // 4*Math.ceil( (160/8) / 3 ) === 28
}, {
     // keep "accounts" and "wallets" unassociated (makes brute-forcing harder)
    timestamps: false,
});

// recreate dabase when running locally, example: node src/db/models.js
if (require.main === module) {
    console.log("Updating database, this may take a minute...");
    console.log();
    Wallet.sync({force: true}).then((res) => console.log("-- table created -->", res));
    Account.sync({force: true}).then((res) => console.log("-- table created -->", res));
}
