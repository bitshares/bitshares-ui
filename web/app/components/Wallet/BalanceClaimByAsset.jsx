import React, {Component} from "react";
import { connect } from "alt-react";
import LoadingIndicator from "components/LoadingIndicator";
import PrivateKeyStore from "stores/PrivateKeyStore";
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions";
import FormattedAsset from "components/Utility/FormattedAsset";
import Translate from "react-translate-component";

class BalanceClaimByAsset extends Component {

    constructor() {
        super()
    }

    static getStores() {

    }

    static getPropsFromStores() {

    }

    componentWillMount() {
        var keys = PrivateKeyStore.getState().keys
        var keySeq = keys.keySeq()
        BalanceClaimActiveActions.setPubkeys( keySeq )
        this.existing_keys = keySeq
    }

    componentWillReceiveProps(nextProps) {
        var keys = PrivateKeyStore.getState().keys
        var keySeq = keys.keySeq()
        if( ! keySeq.equals(this.existing_keys)) {
            this.existing_keys = keySeq
            BalanceClaimActiveActions.setPubkeys( keySeq )
        }
    }

    render() {
        if( this.props.loading || this.props.balances === undefined)
            return <div className="center-content">
                <p></p>
                <h5><Translate content="wallet.loading_balances"/>&hellip;</h5>
                <LoadingIndicator type="circle"/>
            </div>

        var content
        if( ! this.props.total_by_asset.size)
            content = <h5><Translate content="wallet.no_balance" /></h5>

        else {
            var key = 0
            content = <span>
                <label>Unclaimed Balances</label>
                {this.props.total_by_asset.map( (r, asset) =>
                        <div key={key++}>
                            <FormattedAsset color="info"
                                amount={r.unclaimed + r.vesting.unclaimed}
                                asset={asset}/>
                        </div>
                ).toArray()}
                {this.props.children}
            </span>
        }
        return <div className="card">
            <div className="card-content">
                {content}
            </div>
        </div>
    }
}

BalanceClaimByAsset = connect(BalanceClaimByAsset, {
    listenTo() {
        return [BalanceClaimActiveStore, PrivateKeyStore];
    },
    getProps() {
        let props = BalanceClaimActiveStore.getState();
        let { balances } = props;
        if( balances !== undefined ) props.total_by_asset = balances
            .groupBy( v => {
                // K E Y S
                return v.balance.asset_id;
            })
            .map( l => l.reduce( (r,v) => {
                // V A L U E S
                if(v.vested_balance != undefined) {
                    r.vesting.unclaimed += Number(v.vested_balance.amount);
                    r.vesting.total += Number(v.balance.amount);
                } else {
                    r.unclaimed += Number(v.balance.amount);
                }
                return r;
            }, {unclaimed:0, vesting: {unclaimed:0, total:0} }))
            .sortBy( k => k );
        return props;
    }
});

export default BalanceClaimByAsset;
