import React, {Component, PropTypes} from "react";
import connectToStores from "alt/utils/connectToStores"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore"

import FormattedAsset from "components/Utility/FormattedAsset";

@connectToStores
export default class BalanceClaimAssetTotals extends Component {
    
    static getStores() {
        return [BalanceClaimActiveStore]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        return props
    }
    
    render() {
        
        var total_by_asset = this.props.balances
            .groupBy( v => v.balance.asset_id )
            .map( l => l.reduce( (r,v) => r + Number(v.balance.amount), 0 ))

        if( ! total_by_asset.size)
            return <div>No Balances</div>
        
        return <div>
            {total_by_asset.map( (total, asset_id) =>
                <div key={asset_id}>
                    <FormattedAsset color="info" amount={total} asset={asset_id} />
                </div>
            ).toArray()}
        </div>
    }
}

