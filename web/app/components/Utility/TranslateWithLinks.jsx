import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import Immutable from "immutable";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToAssetById from "../Blockchain/LinkToAssetById";
import {Link} from "react-router";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";


/**
 *  Given a string and a list of interpolation parameters, this component
 *  will translate that string and replace the following:
 *
 *  account ids/names with links to accounts
 *  asset ids/names with links to assets
 *  amounts with fully formatted amounts with asset symbol
 *  prices with fully formatted prices with symbols
 *
 *  Expected Properties:
 *     string:  translation string key. Objects to interpolate should be wrapped in curly brackets: {amount}
 *     keys: array of objects to interpolate in the string.
 *         lookup goes by arg, which should match the name given inside the curly brackets in the translation string
 *         example:
 *         [{
 *             type: "account"|"amount"|"asset"|"price",
 *             value: "1.2.1"|{amount: 10, asset_id: "1.3.0"}|"1.3.1"|{base: {amount: 1, asset_id: "1.3.0"}, quote: {amount: 100, asset_id: "1.3.20"}}},
 *             arg: "account"|"amount"|"asset"|"price",
 *             decimalOffset: 1 (optional, only used for amounts)
 *         }
 *         ]
 *     params: object contaning simple strings to be interpolated using standard counterpart syntax: %(string)s
 *
 */

export default class TranslateWithLinks extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.keys, this.props.keys)
        );
    }

    linkToAccount(name_or_id) {
        if(!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ?
            <LinkToAccountById account={name_or_id}/> :
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>;
    }

    linkToAsset(symbol_or_id) {
        if(!symbol_or_id) return <span>-</span>;
        return utils.is_object_id(symbol_or_id) ?
            <LinkToAssetById asset={symbol_or_id}/> :
            <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>;
    }

    render() {

        let {string, params, keys} = this.props;

        let text = counterpart.translate(string, params);
        let splitText = utils.get_translation_parts(text);

        keys.forEach(key => {
            if (splitText.indexOf(key.arg)) {
                let value;
                switch (key.type) {
                    case "account":
                        value = this.linkToAccount(key.value);
                        break;

                    case "amount":
                        value = <FormattedAsset amount={key.value.amount} asset={key.value.asset_id} decimalOffset={key.decimalOffset}/>
                        break;

                    case "price":
                        value = <FormattedPrice
                                    base_asset={key.value.base.asset_id}
                                    base_amount={key.value.base.amount}
                                    quote_asset={key.value.quote.asset_id}
                                    quote_amount={key.value.quote.amount}
                                />
                        break;

                    case "asset":
                        value = this.linkToAsset(key.value);
                        break;

                    default:
                        value = key.value;
                        break;
                }
                
                splitText[splitText.indexOf(key.arg)] = value;
            }
        })

        let finalText = splitText.map((text, index) => {
            return <span key={index}>{text}</span>
        });

        return <span>{finalText}</span>
    }

}
