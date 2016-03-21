var Sequelize = require("sequelize");
var connection = require("./connection");

// !! Use Sequelize.STRING.BINARY for case in-sensitive columns

// Don't use an ID sequence for Wallet and Account .. The records should not be linkable by the server (makes brute-forcing harder)


export var Wallet = connection.define('wallet', {
    public_key: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    signature: { type: Sequelize.STRING(88), allowNull: false },
    local_hash: { type: Sequelize.STRING(44), allowNull: false },
    encrypted_data: { type: Sequelize.BLOB, allowNull: false }
});

// history, TODO default date and compound unique: public_key, updated
//  Ins,Upd trigger INSERT INTO WALLET_HX(PUBLIC_KEY, SIGNATURE, LOCAL_HASH, ENCRYPTED_DATA) VALUES (NEW:PUBLIC_KEY, SIGNATURE, LOCAL_HASH, ENCRYPTED_DATA)
// export var WalletHx = connection.define('wallet_hx', {
//     public_key: { type: Sequelize.STRING(50), allowNull: false, unique: true }, chars ( prefix removed )
//     updated: { type: Sequelize.DATE, allowNull: false, default: CURRENT_DATE },
//     signature: { type: Sequelize.STRING(88), allowNull: false },
//     local_hash: { type: Sequelize.STRING(44), allowNull: false },
//     encrypted_data: { type: Sequelize.BLOB, allowNull: false }
// });

export var Account = connection.define('account', {
    // Don't use an ID primary key (it will make it easier to match the email to the wallets table)
    email_sha1: { type: Sequelize.STRING(28), allowNull: false, primaryKey: true }, 
}, {
     // keep "accounts" and "wallets" unassociated (makes brute-forcing harder)
    timestamps: false,
});

// recreate dabase when running locally, example: node src/db/models.js
if (require.main === module) {
    console.log("Updating database, this may take a minute...");
    console.log();
    Wallet.sync({force: true}).then((res) => console.log("-- table created -->", res));
    // WalletHx.sync({force: true}).then((res) => console.log("-- table created -->", res));
    Account.sync({force: true}).then((res) => console.log("-- table created -->", res));
}

// public_key char(50) base58  ( prefix removed )
// signature base64 *Math.ceil( 65 / 3 ) === char(88)
// local_hash sha256 base64 4*Math.ceil( (256/8) / 3 ) === char(44)
// email_sha1 4*Math.ceil( (160/8) / 3 ) === char(28)
