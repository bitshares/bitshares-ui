import alt from "alt-instance"
import React, {Component, PropTypes} from "react";
import connectToStores from "alt/utils/connectToStores"
import Immutable from "immutable"

import PrivateKeyStore from "stores/PrivateKeyStore";
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import FormattedAsset from "components/Utility/FormattedAsset";

@connectToStores
export default class BalanceClaimSelector extends Component {
    
    constructor() {
        super()
    }
    
    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");
        if(nextProps.claim_account_name)
            this.onClaimAccount(nextProps.claim_account_name, nextProps.checked)
    }
    
    static getStores() {
        return [BalanceClaimActiveStore]
    }
    
    static getPropsFromStores() {
        console.log("getPropsFromStores");
        var props = BalanceClaimActiveStore.getState()
        var { balances, address_to_pubkey } = props
        var private_keys = PrivateKeyStore.getState().keys
        props.total_by_account_asset = balances
            .groupBy( v => {
                // K E Y S
                var names = ""
                var pubkey = address_to_pubkey.get(v.owner)
                var private_key_object = private_keys.get(pubkey)
                if(private_key_object && private_key_object.import_account_names)
                    // Imported Account Names (just a visual aid, helps to auto select a real account)
                    names = private_key_object.import_account_names.join(', ')
                var name_asset_key = Immutable.List([names, v.balance.asset_id])
                return name_asset_key
            })
            .map( l => l.reduce( (r,v) => {
                // V A L U E S
                v.public_key_string = address_to_pubkey.get(v.owner)
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
        return props
    }
    
    render() {
        if( ! this.props.total_by_account_asset.size) return <div></div>
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
                {this.props.total_by_account_asset.map( (r, name_asset) =>
                    <tr key={++index}>
                        <td>
                            <input type="checkbox"
                                checked={!!this.props.checked.get(index)}
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
        var checked = this.props.checked
        if(checked.get(index))
            checked = checked.delete(index)
        else
            checked = checked.set(index, balances)
        
        BalanceClaimActiveActions.setSelectedBalanceClaims(checked)
    }
    
    onClaimAccount(claim_account_name, checked) {
        // A U T O  S E L E C T  A C C O U N T S
        // only if nothing is selected (play it safe)
        if(checked.size) return
        var index = -1
        this.props.total_by_account_asset.forEach( (v,k) => {
            index++
            var name = k.get(0)
            if(name === claim_account_name) {
                if(v.unclaimed || v.vesting.unclaimed)
                    checked = checked.set(index, v.balances)
            }
        })
        if(checked.size) BalanceClaimActiveActions.setSelectedBalanceClaims(checked)
    }
    
}
