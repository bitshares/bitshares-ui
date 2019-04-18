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
        asset: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
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
            BTS: {
                template: "{address}",
                params: []
            },
            BTC: {
                template: "bitcoin:{address}", // template of the link with optional variables - {address} or other component's properties names in curly braces
                params: [
                    // list of parameters appended to link above in the manner of HTTP GET query parameters : ?name=value&name2=value2
                    {
                        // parameters now supports two props: optional `name` - parameter's name (if its not equal to bound property name) and `bind` - actual property of the component
                        // name: "value"
                        bind: "amount" // components property name, value of which would be assigned to this parameter. In this particullary case we would get &amount=<component's `amount` property value>
                    },
                    {
                        // message=<message>
                        bind: "message"
                    }
                ]
            },
            LTC: {
                template: "litecoin:{address}",
                params: [
                    {
                        // &amount=<amount>
                        bind: "amount"
                    },
                    {
                        // &message=<message>
                        bind: "message"
                    }
                ]
            },
            ETH: {
                template: "ethereum:{address}",
                params: [
                    {
                        // &value=<amount>
                        name: "value", // name of the parameter. if not provided - bind param name would be set as name
                        bind: "amount" // actual param value got from components props
                    },
                    {
                        // &message=<message>
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
        if (typeof assetTemplate != "undefined") {
            // template handling
            let link = assetTemplate.template.replace(
                /{([a-zA-Z0-9]+)}/g,
                function(match, tokenName) {
                    if (tokenName in conf) {
                        return conf[tokenName];
                    } else {
                        // some variable required by template was not found  - can't proceed next
                        error = true;
                        return true;
                    }
                }
            );

            // if error encountered - its better not to show any broken qr
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

                    if (typeof conf[parameter["bind"]] !== "undefined") {
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
        } else {
            return "";
        }
    }
}

export default CryptoLinkFormatter;
