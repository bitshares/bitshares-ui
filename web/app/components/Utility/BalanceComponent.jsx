import React from "react";
import ChainComponent from "./ChainComponent"
import FormattedAsset from "./FormattedAsset";
import {ObjectIdType} from "./CustomTypes";

/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */

export default class BalanceComponent extends ChainComponent {

    static propTypes = {
        balance: ObjectIdType
    }

    render() {
        if (!this.state.balance) return null;
        let amount = Number(this.state.balance.get('balance'));
        let type = this.state.balance.get('asset_type');
        return (<FormattedAsset amount={amount} asset={type}/>);
    }
}
