import React,{Component} from "react"

import PrivateKey from "ecc/key_private"
import ImportKeys from "components/Wallet/ImportKeys"
import FormattedAsset from "components/Utility/FormattedAsset"
import Apis from "rpc_api/ApiInstances"

//import ImportAccountSelect,{ accountSelectStore, accountSelectActions }
//  from "components/Wallet/ImportAccountSelect"

import cname from "classnames"
import lookup from "chain/lookup"
import v from "chain/serializer_validation"

var api = Apis.instance()

class ExistingAccount extends Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            keys:{
                wif_count:0
            },
            balance_by_asset:null
        }
    }
    
    render() {
        var has_keys = this.state.keys.wif_count ? true : false
        
        var balance_rows = null
        if(this.state.balance_by_asset) {
            balance_rows = []
            for(let asset_balance of this.state.balance_by_asset) {
                var {symbol, balance, precision} =asset_balance
                balance_rows.push(
                    <div>
                        <FormattedAsset amount={balance} asset={{symbol, precision}}/>
                    </div>
                )
            }
        }
        return <div className="grid-block page-layout">
            <div className="grid-block vertical medium-9 medium-offset-2">
                <h4>Existing Accounts</h4>
                
                <hr/>
                <ImportKeys onChange={this._importKeysChange.bind(this)}/>
                
                <hr/>
                <h4>Balances</h4>
                {balance_rows ? <div>
                    <div>
                        <label>Asset</label>
                        {balance_rows.length ? balance_rows : "No Balances"}
                    </div>
                </div>:""}
                
                <hr/>
                <div>
                    <a className={
                        cname("button", {disabled:!has_keys})}
                        onClick={this._lookupBalances.bind(this)} >
                        Say Something...
                    </a>
                </div>

            </div>
        </div>
    }
    
    _importKeysChange(keys) {
        this.setState({keys})
        this._lookupBalances(Object.keys(keys.wifs_to_account)).then( 
        wifs_to_balances => {
            var assetid_balance = this.balanceByAsset(wifs_to_balances)
            var asset_ids = Object.keys(assetid_balance)
            var asset_symbol_precisions = []
            for(let asset_id of asset_ids) {
                asset_symbol_precisions.push(
                    lookup.asset_symbol_precision(asset_id)
                )
            }
            lookup.resolve().then(()=> {
                var balance_by_asset = []
                for(let i = 0; i < asset_ids.length; i++) {
                    var symbol = asset_symbol_precisions[i].resolve[0]
                    var precision = asset_symbol_precisions[i].resolve[1]
                    var asset_id = asset_ids[i]
                    var balance = assetid_balance[asset_id]
                    balance_by_asset.push({symbol, balance, precision})
                }
                this.setState({balance_by_asset})
            })
        })
    }
    
    _lookupBalances(wif_keys) {
        return new Promise((resolve, reject)=> {
            var address_params = []
            for(let wif of wif_keys) {
                var private_key = PrivateKey.fromWif(wif)
                var public_key = private_key.toPublicKey()
                var address_str = public_key.toBtsAddy()
                address_params.push( [address_str] )
            }
            //DEBUG  console.log('... get_balance_objects', address_params)
            var db = api.db_api()
            var p = db.exec("get_balance_objects", address_params).then( result => {
                //DEBUG  console.log('... result',result)
                var wifs_to_balances = {}
                for(let i = 0; i < result.length; i++) {
                    var balance = result[i]
                    var wif = wif_keys[i]
                    var balances = wifs_to_balances[wif] || []
                    balances.push(balance)
                    wifs_to_balances[wif] = balances
                }
                return wifs_to_balances
                //    if(b.vesting_policy)
                //        continue //todo
                //    //var total_claimed = "0"
                //    //if( ! b.vesting_policy)
                //    //    total_claimed = b.balance
                //    ////'else' Zero total_claimed is understood to mean that your
                //    ////claiming the vesting balance on vesting terms.
                //    
                //    balance_claims.push({
                //        //fee: { amount: "100000", asset_id: 0},
                //        deposit_to_account: account.id,
                //        balance_to_claim: b.id, //"1.15.0"
                //        balance_owner_key: address_publickey_map[b.owner],
                //        total_claimed: {
                //            amount: b.balance,
                //            asset_id: b.balance.asset_id
                //        }
                //    })
                //}
                //DEBUG 
            })
            resolve(p)
        })
    }
    
    balanceByAsset(wifs_to_balances) {
        var asset_balance = {}
        for(let wif of Object.keys(wifs_to_balances))
        for(let b of wifs_to_balances[wif]) {
            var total = asset_balance[b.balance.asset_id] || 0
            total += v.to_number(b.balance.amount)
            asset_balance[b.balance.asset_id] = total 
        }
        return asset_balance
    }
    

//                <ImportAccountSelect
//                    account_names={this.getAccountNames()}
//                    placeholder="Select Primary Account"
//                    selectStyle={{height: '100px'}}
//                    list_size="5"
//                />    

}

export default ExistingAccount
