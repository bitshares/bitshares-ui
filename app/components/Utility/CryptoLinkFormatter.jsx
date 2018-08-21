import React from "react";
/**
 *  Given an asset name, amount and label generates uri for its refilling
 *
 */

class CryptoLinkFormatter extends React.Component {
    static params = {};
    static currentAsset = "";

    constructor(params) {
        super(params);

        this.state = {
            assetTemplates: {
                BTC: {
                    query: "bitcoin:{address}?",
                    params: {
                        amount: {
                            bind: "amount",
                            optional: false
                        },
                        message: {
                            bind: "message",
                            optional: true
                        }
                    }
                },
                LTC: {
                    query: "litecoin:{address}?",
                    params: {
                        amount: {
                            bind: "amount",
                            optional: false
                        },
                        message: {
                            bind: "message",
                            optional: true
                        }
                    }
                },
                ETH: {
                    query: "ethereum:{address}?",
                    params: {
                        value: {
                            bind: "amount",
                            optional: false
                        },
                        message: {
                            bind: "message",
                            optional: true
                        }
                    }
                },
                BCH: {
                    query: "bitcoincash:{address}?",
                    params: {
                        amount: {
                            bind: "amount",
                            optional: false
                        },
                        message: {
                            bind: "message",
                            optional: true
                        }
                    }
                }
            }
        };
    }

    static bind(name, value) {
        this.params[name] = value;
    }

    static generate() {
        if (this.currentAsset == "") {
            console.log("cant generate deposit uri: asset not selected");
            return false;
        }

        let assetTemplate = this.assetTemplates[this.currentAsset];

        // generate uri using template above

        return "";
    }
}

export default CryptoLinkFormatter;
