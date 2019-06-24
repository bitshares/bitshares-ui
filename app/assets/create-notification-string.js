function createNotifcationString() {
    let jsonObject = {
        notifications: [
            {
                type: "info",
                begin_date: "16.05.2019",
                end_date: "31.06.2019",
                content: "This is the headline newsfeed!"
            },
            {
                type: "warning",
                begin_date: "16.05.2019",
                end_date: "01.01.2020",
                content:
                    "This wallet is connected to the testnet of the BitShares Blockchain!"
            }
        ],
        blacklists: {
            assets: [],
            accounts: []
        }
    };
    // has to coincide with branding.js/getConfigurationAsset().explanation
    let explanation =
        "This asset is used for decentralized configuration of the BitShares UI placed under bitshares.org.";
    let assetDescriptionString =
        explanation + "\n" + JSON.stringify(jsonObject, null, 2);
    console.log(assetDescriptionString);
    return assetDescriptionString;
}

createNotifcationString();
