var Sequelize = require("sequelize");
var connection = require("./connection");

// !! Use Sequelize.STRING.BINARY for case in-sensitive columns

var Wallet = connection.define('wallets', {
    public_key: { type: Sequelize.STRING.BINARY, allowNull: false, unique: true },
    email_sha1: { type: Sequelize.STRING.BINARY, allowNull: false, unique: true },
    signature: { type: Sequelize.STRING.BINARY, allowNull: false },
    local_hash: { type: Sequelize.STRING.BINARY, allowNull: false },
    encrypted_data: { type: Sequelize.BLOB, allowNull: false }
});

// recreate dabase when running locally, example: node src/db/models.js
if (require.main === module) {
    console.log("Updating database, this may take a minute...");
    console.log();
    Wallet.sync({force: true}).then(function (res) {
        console.log("-- table wallets created -->", res);
    });
}

module.exports.Wallet = Wallet;
