import React, {Component, PropTypes} from "react";
import AltContainer from "alt/AltContainer"

import {ImportKeysStore} from "components/Wallet/ImportKeys"
import WalletDb from "stores/WalletDb";
import PrivateKeyStore from "stores/PrivateKeyStore";
import AccountStore from "stores/AccountStore";
import BalanceClaimStore from "stores/BalanceClaimStore";
import FormattedAsset from "components/Utility/FormattedAsset";
import LoadingIndicator from "components/LoadingIndicator";
import ExistingAccountsAccountSelect from "components/Forms/ExistingAccountsAccountSelect";
import WalletActions from "actions/WalletActions";
import ApplicationApi from "rpc_api/ApplicationApi";
import notify from "actions/NotificationActions";
import cname from "classnames";
import lookup from "chain/lookup";
import v from "chain/serializer_validation";

import chain_api from "api/chain"

var application_api = new ApplicationApi()

class BalanceClaim extends Component {

    constructor() {
        super();
        this.state = this._getInitialState();
    }
    
    _getInitialState() {
        return {
            claim_account_name: null,
            balance_claims: [],
            balance_by_asset: [],
            my_accounts: [],
            my_accounts_loading: false
        };
    }
    
    componentWillMount() {
        //DEBUG console.log('... BalanceClaim componentWillMount')
        this.loadBalances()
        this.loadMyAccounts()
    }
    
    render() {
        //DEBUG  console.log('... render balance_by_asset',this.state.balance_by_asset.length)
        if( ! this.state.balance_by_asset.length)
            return <div/>
        
        var unclaimed_balance_rows = [], claimed_balance_rows = []
        var unclaimed_account_balances = {};
        let index = 0;
        for(let asset_balance of this.state.balance_by_asset) {
            var {accounts, asset_id, symbol, precision, balance, balance_claims} =
                asset_balance
            
            if(balance.unvested.unclaimed || balance.vesting.unclaimed) {
                var account_names = accounts.join(", ")
                unclaimed_balance_rows.push(
                    <tr key={index}>
                        <td> <FormattedAsset color="info" amount={balance.unvested.unclaimed} asset={asset_id}/></td>
                        <td> <FormattedAsset amount={balance.vesting.unclaimed} asset={asset_id}/></td>
                        <td> {account_names} </td>
                    </tr>
                );
                
                unclaimed_account_balances[account_names] = balance_claims

                index++;
            }
            
            if(balance.unvested.claimed || balance.vesting.claimed) {
                claimed_balance_rows.push(
                    <tr key={index}>
                        <td> <FormattedAsset amount={balance.unvested.claimed} asset={asset_id}/></td>
                        <td> <FormattedAsset amount={balance.vesting.claimed} asset={asset_id}/></td>
                        <td> {accounts.join(", ")} </td>
                    </tr>
                );
                index++;
            }
        }
        
        var claim_account_name = this.state.claim_account_name
        var has_account = claim_account_name ? true : false
        var has_unclaimed = unclaimed_balance_rows.length > 0
        var import_ready = has_account && has_unclaimed
        var claim_balance_label = import_ready ?
                `Claim Balance to account: ${claim_account_name}` :
                "Claim Balance"

        return (
            <div>
                <hr/>
                <div className="content-block">
                    <h3 className="no-border-bottom">Claim balances</h3>
                </div>
                <div>
                    {unclaimed_balance_rows.length ? <div>
                        <table className="table"><thead><tr>
                            <th style={{textAlign: "center"}}>Unclaimed</th>
                            <th style={{textAlign: "center"}}>Unclaimed (vesting)</th>
                            <th style={{textAlign: "center"}}>Account</th>
                        </tr></thead><tbody>
                            {unclaimed_balance_rows}
                        </tbody></table>
                    
                    <br/>
                    <div>
                        <ExistingAccountsAccountSelect
                            account_names={this.state.my_accounts}
                            onChange={this._claimAccountSelect.bind(this)}
                            list_size={5}
                        />
                        {this.state.my_accounts_loading ? 
                            <LoadingIndicator type="circle"/> : <div/>}
                        <br></br>
                        <div className="button-group">
                            <div className={ cname("button success", {disabled: !import_ready}) }
                                onClick={this._importBalances.bind(this,
                                    claim_account_name,
                                    unclaimed_account_balances[claim_account_name]
                                )}
                            >
                                {claim_balance_label}
                            </div>
                        </div>
                    </div>
                    
                    </div> : "No Unclaimed Balances"}
                    
                </div>
                    
            </div>
        );
    }
    
    loadBalances() {
        BalanceClaimStore.getBalanceClaims().then( balance_claims => {
            this.balanceByAssetName(balance_claims).then( balance_by_asset => {
                //DEBUG console.log('... setState balance_claims',balance_claims.length)
                this.setState({balance_claims, balance_by_asset})
            })
        }).catch( error => {
            notify.error(error.message || error)
        })
    }
    
    /** Populate this.state.my_accounts with only account where the wallet
    has full transaction signing authority. */
    loadMyAccounts() {
        this.setState({my_accounts_loading:true})
        var account_names = AccountStore.getState().linkedAccounts.toArray()
        var store = AccountStore.getState()
        var promises = []
        for(let account_name of account_names) {
            var p = chain_api.lookupAccountByName(account_name).then ( account => {
                // the fake transfer will check for required auths
                return application_api.transfer(
                    account.get("id"),
                    account.get("id"),
                    1,//amount
                    0,//asset
                    null,//memo
                    false,//broadcast
                    false//encrypt_memo
                ).then( fake_transfer => {
                    //DEBUG console.log('... my account',account.get("name"))
                    return account.get("name")
                }).catch( error => {
                    //DEBUG console.log('... NOT my account',account.get("name"),error)
                    return null
                })
            })
            promises.push(p)
        }
        Promise.all(promises).then( account_names => {
            var my_accounts = []
            for(let account_name of account_names) {
                if( ! account_name) continue
                my_accounts.push(account_name)
            }
            return my_accounts
        }).then( my_accounts => {
            //DEBUG console.log('... my_accounts',my_accounts)    
            this.setState({my_accounts, my_accounts_loading:false})
        })
    }

    /** group things for reporting purposes */
    balanceByAssetName(balance_claims) {
        return new Promise((resolve, reject)=> {
            var asset_totals = {}
            //DEBUG console.log("... balance_claims",balance_claims)
            for(let balance_claim of balance_claims) {
                var b = balance_claim.chain_balance_record
                
                var private_key_id = balance_claim.private_key_id
                var private_key_tcomb =
                    PrivateKeyStore.getState().keys.get(private_key_id)
                var import_account_names =
                    private_key_tcomb.import_account_names
                
                var group_by =
                    import_account_names.join("\t") +
                    b.balance.asset_id + "\t"
                
                var total =
                    asset_totals[group_by] || (
                    asset_totals[group_by] = 
                {
                    vesting: {claimed:0, unclaimed:0},
                    unvested: {claimed:0, unclaimed:0},
                    account_names: import_account_names,
                    balance_claims: [],
                    asset_id: b.balance.asset_id,
                    asset_symbol_precisions:
                        lookup.asset_symbol_precision(b.balance.asset_id)
                })
                if(b.vesting) {
                    if(balance_claim.is_claimed)
                        total.vesting.claimed += v.to_number(b.balance.amount)
                    else
                        total.vesting.unclaimed += v.to_number(b.balance.amount)
                } else {
                    if(balance_claim.is_claimed)
                        total.unvested.claimed += v.to_number(b.balance.amount)
                    else
                        total.unvested.unclaimed += v.to_number(b.balance.amount)
                }
                total.balance_claims.push(balance_claim)
            }
            lookup.resolve().then(()=> {
                var balance_by_asset = []
                for(let key of Object.keys(asset_totals).sort()) {
                    var total_record = asset_totals[key]
                    var accounts = total_record.account_names
                    var symbol = total_record.asset_symbol_precisions.resolve[0]
                    var precision = total_record.asset_symbol_precisions.resolve[1]
                    var balance = {
                        vesting: total_record.vesting,
                        unvested: total_record.unvested
                    }
                    var balance_claims = total_record.balance_claims
                    balance_by_asset.push({
                        accounts, asset_id:total_record.asset_id,
                        symbol, precision, balance, balance_claims})
                }
                resolve(balance_by_asset)
            })
        })
    }
    
    _setClaimActive(active) {
        if(!active) {
            // this.reset();
            this.props.exportState({balance_claim_active: active, import_active: true});
        }
    }
    
    _claimAccountSelect(claim_account_name) {
        this.setState({claim_account_name})
    }
    
    _importBalances(claim_account_name, balance_claims) {
        var {unvested_balance_claims, wif_to_balances} =
            this.getWifToBalance(balance_claims)
        
        //return
        WalletActions.importBalance(
            claim_account_name,
            wif_to_balances,
            true //broadcast
        ).then((result)=> {
            
            notify.success("Balance claimed to account: " + this.state.claim_account_name)
            if(result) {
                //DEBUG console.log("ExistingAccount._importBalances", result, JSON.stringify(result));
            }
            this.context.router.transitionTo("account", {account_name: this.state.claim_account_name});
                
        }).catch((error)=> {
            console.log("_importBalances", error)
            var message = error
            try { message = error.data.message } catch(e) {}
            notify.error("Error claiming balance: " + message)
            throw error
        })
    }
    
    getWifToBalance(balance_claims) {
        var unvested_balance_claims = []
        var privateid_to_balances = {}
        for(let balance_claim of balance_claims) {
            if(balance_claim.is_claimed) continue
            var chain_balance_record = balance_claim.chain_balance_record
            if(chain_balance_record.vesting)
                continue
            unvested_balance_claims.push(balance_claim)
            var balences =
                privateid_to_balances[balance_claim.private_key_id] || []
            balences.push(chain_balance_record)
            privateid_to_balances[balance_claim.private_key_id] = balences
        }
        var wif_to_balances = {}
        var keys = PrivateKeyStore.getState().keys
        for(let private_key_id of Object.keys(privateid_to_balances)) {
            var balances = privateid_to_balances[private_key_id]
            var private_key_tcomb = keys.get(parseInt(private_key_id))
            var private_key = WalletDb.decryptTcomb_PrivateKey(private_key_tcomb)
            wif_to_balances[private_key.toWif()] = balances
        }
        return {unvested_balance_claims, wif_to_balances}
    }
}

BalanceClaim.contextTypes = {router: React.PropTypes.func.isRequired};

BalanceClaim.propTypes = {
    exportState: PropTypes.func.isRequired
}

class BalanceClaimContainer extends React.Component {
    render() {
        this.seq = 0 //re-render on every store change
        return (
            <AltContainer stores={[AccountStore, ImportKeysStore]}
                render={()=> <BalanceClaim key={this.seq++}/>}
            >
            </AltContainer>
        )
    }
}
export default BalanceClaimContainer
