function createNotifcationString() {
    // may contain links, must start with http and be ended with "!"
    var jsonObject = {
        notifications: [
            {
                type: "warning",
                begin_date: "16.05.2019",
                end_date: "31.12.2019",
                content:
                    "Please be aware of scam attempts using Proposed Transactions in your Dashboard. Never approve a proposal if you are not expecting one!"
            },
            {
                type: "info",
                begin_date: "02.07.2019",
                end_date: "09.07.2019",
                content:
                    "2nd Global Graphene Blockchain Developer Conference is happening on 6th-7th July 2019 in Shanghai. Get more information here http://gbacenter.org/event/index_en.html/!"
            }
        ],
        blacklists: {
            assets: [],
            accounts: []
        }
    };
    // has to coincide with branding.js/getConfigurationAsset().explanation
    var explanation =
        "This asset is used for decentralized configuration of the BitShares UI placed under bitshares.org.";
    var assetDescriptionString =
        explanation + "\n" + JSON.stringify(jsonObject, null, 2);
    console.log(assetDescriptionString);
    return assetDescriptionString;
}

createNotifcationString();
