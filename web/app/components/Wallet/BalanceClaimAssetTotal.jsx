import React, {Component, PropTypes} from "react";
import { connect } from "alt-react";
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import FormattedAsset from "components/Utility/FormattedAsset";
import Translate from "react-translate-component";

class BalanceClaimAssetTotals extends Component {
    render() {

        if( this.props.balances === undefined )
            return <div><Translate content="wallet.loading_balances"/>&hellip;</div>;

        var total_by_asset = this.props.balances
            .groupBy( v => v.balance.asset_id )
            .map( l => l.reduce( (r,v) => r + Number(v.balance.amount), 0 ));

        if( ! total_by_asset.size)
            return <div>None</div>;

        return <div>
            {total_by_asset.map( (total, asset_id) =>
                <div key={asset_id}>
                    <FormattedAsset color="info" amount={total} asset={asset_id} />
                </div>
            ).toArray()}
        </div>;
    }
}

BalanceClaimAssetTotals = connect(BalanceClaimAssetTotals, {
    listenTo() {
        return [BalanceClaimActiveStore];
    },
    getProps() {
        return BalanceClaimActiveStore.getState();
    }
});

export default BalanceClaimAssetTotals;
