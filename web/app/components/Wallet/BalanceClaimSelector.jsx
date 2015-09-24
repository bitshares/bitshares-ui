import WalletDb from "stores/WalletDb";
import FormattedAsset from "components/Utility/FormattedAsset";
import LoadingIndicator from "components/LoadingIndicator";
import ExistingAccountsAccountSelect from "components/Forms/ExistingAccountsAccountSelect";
import notify from "actions/NotificationActions";
import cname from "classnames";
import lookup from "chain/lookup";
import v from "chain/serializer_validation";
import BalanceClaimActions from "actions/BalanceClaimActions"

import alt from "alt-instance"
import React, {Component, PropTypes} from "react";
import connectToStores from "alt/utils/connectToStores"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import PrivateKeyStore from "stores/PrivateKeyStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import Immutable from "immutable"

@connectToStores
export default class BalanceClaimSelector extends Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            checked: new Immutable.Map()
        }
    }
    
    // reset() {
    //     this.setState(this._getInitialState())
    // }
    
    static getStores() {
        return [BalanceClaimActiveStore]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        
        return props
    }
    
    render() {
        if( ! this.props.balances.size) return <div></div>
        var private_keys = PrivateKeyStore.getState().keys
        var total_by_account_asset = this.props.balances
            .groupBy( v => {
                var names = ""
                var pubkey = this.props.address_to_pubkey.get(v.owner)
                var private_key_object = private_keys.get(pubkey)
                if(private_key_object && private_key_object.import_account_names)
                    names = private_key_object.import_account_names.join(', ')
                var name_asset_key = Immutable.List([names, v.balance.asset_id])
                return name_asset_key
            })
            .map( l => l.reduce( (r,v) => {
                r.balances = r.balances.add(v)
                if(v.vested_balance != undefined) {
                    r.vesting.unclaimed += Number(v.vested_balance.amount)
                    r.vesting.total += Number(v.balance.amount)
                } else {
                    r.unclaimed += Number(v.balance.amount)
                }
                return r
            }, {unclaimed:0, vesting: {unclaimed:0, total:0}, balances: Immutable.Set() }))
            .sortBy( k => k )
        var index = -1
        return <div>
            <table className="table">
                <thead>
                <tr>
                    <th>{ /* C H E C K B O X */ }</th>
                    <th style={{textAlign: "center"}}>Unclaimed</th>
                    <th style={{textAlign: "center"}}>Unclaimed (vesting)</th>
                    <th style={{textAlign: "center"}}>Account</th>
                </tr></thead>
                <tbody>
                {total_by_account_asset.map( (r, name_asset) =>
                    <tr key={++index}>
                        <td>
                            <input type="checkbox"
                                checked={!!this.state.checked.get(index)}
                                onChange={this.onCheckbox.bind(this, index, r.balances)} />
                        </td>
                        <td style={{textAlign: "right"}}> 
                        {r.unclaimed ?
                            <FormattedAsset color="info"
                                amount={r.unclaimed}
                                asset={name_asset.get(1)}/>
                        :null}
                        </td>
                        <td style={{textAlign: "right"}}>
                        {r.vesting.unclaimed ? <div>
                            <FormattedAsset color="info"
                                amount={r.vesting.unclaimed}
                                hide_asset={true}
                                asset={name_asset.get(1)}/>
                            <span> of </span>
                            <FormattedAsset color="info"
                                amount={r.vesting.total}
                                asset={name_asset.get(1)}/>
                        </div>:null}
                        </td>
                        <td> {name_asset.get(0)} </td>
                    </tr>
                ).toArray()}
                </tbody>
            </table>
        </div>
    }
    
    onCheckbox(index, balances) {
        var checked = this.state.checked
        if(this.state.checked.get(index))
            checked = checked.delete(index)
        else
            checked = checked.set(index, balances)
        
        this.setState({checked})
        BalanceClaimActiveActions.setSelectedBalanceClaims(
            checked.valueSeq().flatten())
    }
    
}
