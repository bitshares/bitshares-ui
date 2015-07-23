import React,{Component} from "react"

import PrivateKey from "ecc/key_private"

import Wallet from "components/Wallet/Wallet"
import BalanceClaim from "components/Wallet/BalanceClaim"
import ImportKeys from "components/Wallet/ImportKeys"
import FormattedAsset from "components/Utility/FormattedAsset"
import Apis from "rpc_api/ApiInstances"

import WalletActions from "actions/WalletActions"
import AccountStore from "stores/AccountStore"
import WalletDb from "stores/WalletDb"

import notify from 'actions/NotificationActions'
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
                wif_count:0,
                wifs_to_account: null
            },
            balance_by_asset:null,
            balance_claim_active: false,
            claim_account_name:null,
            wif_to_balances: null,
            wif_to_accounts: null,
            blockchain_accounts: null,
            balances_known: false,
            accounts_known: false
        }
    }
    
    reset() {
        this.setState(this._getInitialState())
    }
    
    render() {
        var has_keys = this.state.keys.wif_count ? true : false
        var import_ready = has_keys &&
            this.state.balances_known &&
            this.state.accounts_known
        
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
        
        var account_rows = null
        if(this.state.blockchain_accounts) {
            account_rows = []
            for(let account of this.state.blockchain_accounts) {
                account_rows.push(
                    <div>{account.name}</div>
                )
            }
        }
        
        return <div id="existing-account" className="grid-block page-layout">
            <div className="grid-block vertical medium-9 medium-offset-2">
                <h4>Existing Accounts</h4>
                
                <Wallet>
                    
                    {has_keys ? "" : <div>
                        <BalanceClaim ref="balance_claim"
                            claimActive={this.state.balance_claim_active}
                            onActive={this._setClaimActive.bind(this)}
                        />
                    </div>}
                    
                    { this.state.balance_claim_active ? "" : <div>
                        <hr/>
                        <h3>Import Keys</h3>
                        
                        <ImportKeys onChange={this._importKeysChange.bind(this)}/>
                        
                        {this.state.keys.wif_count ? <div>
                            <h3>Genesis Accounts</h3>
                            {account_rows ? <div>
                                <div>
                                    <label>Accounts</label>
                                    {account_rows.length ? account_rows : "No Accounts"}
                                </div>
                            </div>:""}
                            
                            <br/>
                            <h3>Available Balances</h3>
                            {balance_rows ? <div>
                                <div>
                                    <label>Assets</label>
                                    {balance_rows.length ? balance_rows : "No Balances"}
                                </div>
                            </div>:""}
                            
                            <br/>
                            <div>
                                <a className={
                                    cname("button", {disabled:!import_ready})}
                                    onClick={this._saveImport.bind(this)} >
                                    Save
                                </a>
                            </div>
                        </div>:""}
                    </div>}
                </Wallet>
            </div>
        </div>
    }
    
    _setClaimActive(active) {
        this.setState({balance_claim_active: active})
        if(! active)
            this.refs.balance_claim.reset()
    }
    
    _importKeysChange(keys) {
        this.setState({keys})
        var wifs = Object.keys(keys.wifs_to_account)
        if( ! wifs.length) {
            this.reset()
            return
        }
        this.lookupAccounts(wifs).then( blockchain_accounts => {
            this.setState({blockchain_accounts, accounts_known:true})
        })
                
        this.lookupBalances(wifs).then( wif_to_balances => {
            this.setState({wif_to_balances})
            var assetid_balance = this.balanceByAsset(wif_to_balances)
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
                this.state.keys.wif_to_balances = wif_to_balances
                this.setState({balance_by_asset, balances_known: true})
            })
        })

    }
    
    _saveImport() {
        if( WalletDb.isLocked()) {
            notify.error("Wallet is locked")
            return
        }
        for(let account of this.state.blockchain_accounts) {
            AccountStore.onCreateAccount(account)
        }
        var wifs_to_account = this.state.keys.wifs_to_account
        var wif_to_balances = this.state.wif_to_balances
        var private_key_objs = []
        for(let wif of Object.keys(wifs_to_account)) {
            var import_account_names = wifs_to_account[wif]
            var import_balances = wif_to_balances[wif]
            private_key_objs.push({
                wif,
                import_account_names,
                import_balances
            })
        }
        WalletDb.importKeys( private_key_objs ).then( result => {
            var {import_count, duplicate_count, private_key_ids} = result
            try {
                if( ! import_count && ! duplicate_count) {
                    notify.warning(`There where no keys to import`)
                    return
                }
                if( ! import_count && duplicate_count) {
                    notify.warning(`${duplicate_count} duplicates (Not Imported)`)
                    return
                }
                var message = ""
                if (import_count)
                    message = `Successfully imported ${import_count} keys.`
                if (duplicate_count)
                    message += `  ${duplicate_count} duplicates (Not Imported)`
                
                if(duplicate_count)
                    notify.warning(message)
                else
                    notify.success(message)
                
                //if (import_count)
                //    this.refs.balance_claim.updateBalances()
            
            }finally{this.reset()}
            
        }).catch( error => {
            console.log(error)
            notify.error(`There was an error: ${error}`)
        })
    }

    lookupAccounts(wifs){ 
        return new Promise((resolve, reject)=> {
            var public_key_parms = []
            for(let wif of wifs){
                var private_key = PrivateKey.fromWif(wif)
                var public_key = private_key.toPublicKey()
                public_key_parms.push(public_key.toBtsPublic())
            }
            var db = api.db_api()
            if(db == null) {
                notify.error("No witness node connection.")
                resolve(undefined)
                return
            }
            var p = db.exec("get_key_references", [public_key_parms]).then( result => {
                //DEBUG console.log('... get_key_references',result)
                var blockchain_accounts = []
                for(let i = 0; i < result.length; i++) {
                    for(let account_id of result[i]) {
                        blockchain_accounts.push(lookup.object(account_id))
                    }
                }
                return lookup.resolve().then(()=> {
                    //DEBUG console.log('... blockchain_accounts',blockchain_accounts)
                    for(let i in blockchain_accounts) {
                        blockchain_accounts[i] = blockchain_accounts[i].resolve
                    }
                    return blockchain_accounts
                })
            })
            resolve(p)
        })
    }
    
    lookupBalances(wif_keys) {
        return new Promise((resolve, reject)=> {
            var address_params = [], wif_owner = {}
            for(let wif of wif_keys) {
                var private_key = PrivateKey.fromWif(wif)
                var public_key = private_key.toPublicKey()
                var address_str = public_key.toBtsAddy()
                address_params.push( address_str )
                wif_owner[address_str] = wif
            }
            //DEBUG  console.log('... get_balance_objects', address_params)
            var db = api.db_api()
            if(db == null) {
                notify.error("No witness node connection.")
                resolve(undefined)
                return
            }
            var p = db.exec("get_balance_objects", [address_params]).then( result => {
                //DEBUG  console.log('... get_balance_objects',result)
                var wif_to_balances = {}
                for(let i = 0; i < result.length; i++) {
                    var balance = result[i]
                    var wif = wif_owner[balance.owner]
                    var balances = wif_to_balances[wif] || []
                    balances.push(balance)
                    wif_to_balances[wif] = balances
                }
                //DEBUG console.log('... wif_to_balances',wif_to_balances)
                this.setState({wif_to_balances})
                return wif_to_balances

            })
            resolve(p)
        })
    }
    
    balanceByAsset(wif_to_balances) {
        var asset_balance = {}
        if( ! wif_to_balances)
            return asset_balance
        for(let wif of Object.keys(wif_to_balances))
        for(let b of wif_to_balances[wif]) {
            var total = asset_balance[b.balance.asset_id] || 0
            //    if(b.vesting_policy)
            //        continue //todo
            //    //var total_claimed = "0"
            //    //if( ! b.vesting_policy)
            //    //    total_claimed = b.balance
            //    ////'else' Zero total_claimed is understood to mean that your
            //    ////claiming the vesting balance on vesting terms.
            //DEBUG 
            total += v.to_number(b.balance.amount)
            asset_balance[b.balance.asset_id] = total 
        }
        return asset_balance
    }


}

export default ExistingAccount
