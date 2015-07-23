import React, {Component, PropTypes} from 'react'

import AccountStore from "stores/AccountStore"
import PrivateKeyStore from "stores/PrivateKeyStore"
import FormattedAsset from "components/Utility/FormattedAsset"
import AccountSelect from "components/Forms/AccountSelect"
import WalletActions from "actions/WalletActions"

import notify from 'actions/NotificationActions'
import cname from "classnames"
import lookup from "chain/lookup"
import v from "chain/serializer_validation"

export default class BalanceClaim extends Component {

    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            claim_account_name: null
        }
    }
    
    reset() {
        this.setState(this._getInitialState())
    }
    
    componentWillMount() {
        this.loadBalances()
    }
    
    render() {
        var balance_rows = []
        if(this.state.balance_by_asset) {
            for(let asset_balance of this.state.balance_by_asset) {
                var {symbol, balance, precision} = asset_balance
                balance_rows.push(
                    <div>
                        <FormattedAsset amount={balance} asset={{symbol, precision}}/>
                    </div>
                )
            }
        }
        
        //var has_balance_results = this.state.balance_by_asset ? true : false
        var has_account = this.state.claim_account_name ? true : false
        var claim_balance_label = "Claim Balance"
        if(has_account)
            claim_balance_label = `Claim Balance to ${this.state.claim_account_name}...`
        
        var import_ready = has_account
        
        return <div>
            {balance_rows ? <div>
                <hr/>
                <h3>Unclaimed Balance</h3>
                
                <div>
                    <label>Assets</label>
                    {balance_rows.length ? balance_rows : "No Balances"}
                </div>
                <br/>
                
                { this.props.claimActive ? <div>
                    <h3>Balance Claim Account</h3>
                    <AccountSelect
                        account_names={this.getAccountNames()}
                        onChange={this._claimAccountSelect.bind(this)}
                        list_size="5"
                    />
                    <br>
                    <div>
                        <div className={ cname("button", {disabled:!import_ready}) }
                            onClick={this._importBalances.bind(this)}
                        >
                            {claim_balance_label}
                        </div>
                    </div>
                    </br>
                    
                </div>:""}
                
                <br/>
                { balance_rows.length ? <div>
                    { this.state.balance_claim_active ? "":<div>
                        <div className="button"
                            onClick={this._setClaimActive.bind(this, true)}
                        >Claim Balance</div>
                    </div>}
                    
                    { this.state.balance_claim_active ? <div>
                        <div className="button"
                            onClick={this._setClaimActive.bind(this, false)}
                        >Cancel</div>
                    </div>:""}
                </div>:""}
                
            </div>:""}
        </div>
    }
    
    _setClaimActive(active) {
        this.setState({balance_claim_active: active})
        if(! active) this.reset()
        this.props.onActive(active)
    }
    
    _claimAccountSelect(claim_account_name) {
        this.setState({claim_account_name})
    }
    
    getAccountNames() {
        //DEBUG return ["nathan"]
        var accounts = AccountStore.getState().linkedAccounts.toArray()
        return accounts.sort()
    }
        
    _importBalances() {
        //return
        WalletActions.importBalance(
            this.state.claim_account_name,
            this.state.wif_to_balances,
            true //broadcast
        ).then((result)=> {
            notify.success("Balance claimed to account: " + this.state.claim_account_name)
            this.reset()
            if(result)
                console.log("ExistingAccount._importBalances",
                    result, JSON.stringify(result))
        }).catch((error)=> {
            console.log(error)
            notify.error("Error claiming balance.\n" + error)
            throw error
        })
    }
    
    loadBalances() {
        PrivateKeyStore.getBalanceRecords().then( balances => {
            this.balanceByAssetName(balances).then( balance_by_asset => {
                this.setState({balance_by_asset})
            })
        })
    }
    
    balanceByAssetName(balances) {
        return new Promise((resolve, reject)=> {
            var assetid_balance = {}
            for(let b of balances) {
                var total = assetid_balance[b.balance.asset_id] || 0
                total += v.to_number(b.balance.amount)
                assetid_balance[b.balance.asset_id] = total
            }
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
                resolve(balance_by_asset)
            })
        })
    }
    

}

BalanceClaim.propTypes = {
    onActive: PropTypes.func.isRequired
}

