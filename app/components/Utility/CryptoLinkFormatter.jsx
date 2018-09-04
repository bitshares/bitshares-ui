import React from "react";
import PropTypes from "prop-types";
import QRCode from "qrcode.react";

/**
 *  Given an asset name, amount and label generates uri for its refilling
 *
 */

class CryptoLinkFormatter extends React.Component {
    static assetTemplates = {};

    static propTypes = {
        asset: PropTypes.string,
        address: PropTypes.string,
        amount: PropTypes.number,
        message: PropTypes.string,
        size: PropTypes.number
    };

    static defaultProps = {
        size: 140
    };

    constructor(params) {
        super(params);

        this.assetTemplates = {
            BTC: {
                template: "bitcoin:{address}",
                params: [
                    {
                        bind: "amount"
                    },
                    {
                        bind: "message"
                    }
                ]
            },
            LTC: {
                template: "litecoin:{address}",
                params: [
                    {
                        bind: "amount"
                    },
                    {
                        bind: "message"
                    }
                ]
            },
            ETH: {
                template: "ethereum:{address}",
                params: [
                    {
                        name: "value", // name of the parameter. if not provided - bind param name would be set as name
                        bind: "amount" // actual param value got from components props
                    },
                    {
                        bind: "message"
                    }
                ]
            },
            BCH: {
                template: "bitcoincash:{address}",
                params: [
                    {
                        bind: "amount"
                    },
                    {
                        bind: "message"
                    }
                ]
            }
        };
    }

    render() {
        let {size, asset} = this.props;

        let conf = this.props;

        let assetTemplate = this.assetTemplates[asset];

        var error = false;

        // template handling
        let link = assetTemplate.template.replace(/{([a-zA-Z0-9]+)}/g, function(
            match,
            tokenName
        ) {
            if (tokenName in conf) {
                return conf[tokenName];
            } else {
                return true;
            }
        });

        if (error) {
            return "";
        }

        // query param handling
        if (assetTemplate.params.length > 0) {
            let parameters = [];

            assetTemplate.params.forEach(function(parameter) {
                var name = "";

                if (typeof parameter["name"] != "undefined") {
                    name = parameter["name"];
                }

                if (name == "") {
                    name = parameter["bind"];
                }

                if (typeof value != "undefined") {
                    parameters.push(name + "=" + conf[parameter["bind"]]);
                }
            });

            if (parameters.length > 0) {
                link += "?" + parameters.join("&");
            }
        }

        return (
            <div className="QR">
                <QRCode size={size} value={link} />
            </div>
        );
    }
}

export default CryptoLinkFormatter;
