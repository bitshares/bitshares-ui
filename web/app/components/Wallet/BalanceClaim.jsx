import React, {Component, PropTypes} from "react";

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

var application_api = new ApplicationApi()

export default class BalanceClaim extends Component {

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
        this.loadBalances()
        this.loadMyAccounts()
    }
    
    render() {
        if( ! this.state.balance_claims.length)
            return <div/>
        
        var unclaimed_balance_rows = [], claimed_balance_rows = []
        var unclaimed_account_balances = {};
        let index = 0;
        for(let asset_balance of this.state.balance_by_asset) {
            var {accounts, symbol, precision, balance, balance_claims} =
                asset_balance
            
            if(balance.unvested.unclaimed || balance.vesting.unclaimed) {
                var account_names = accounts.join(", ")
                unclaimed_balance_rows.push(
                    <tr key={index}>
                        <td> <FormattedAsset color="info" amount={balance.unvested.unclaimed} asset={{symbol, precision}}/></td>
                        <td> <FormattedAsset amount={balance.vesting.unclaimed} asset={{symbol, precision}}/></td>
                        <td> {account_names} </td>
                    </tr>
                );
                
                unclaimed_account_balances[account_names] = balance_claims

                index++;
            }
            
            if(balance.unvested.claimed || balance.vesting.claimed) {
                claimed_balance_rows.push(
                    <tr key={index}>
                        <td> <FormattedAsset amount={balance.unvested.claimed} asset={{symbol, precision}}/></td>
                        <td> <FormattedAsset amount={balance.vesting.claimed} asset={{symbol, precision}}/></td>
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
                <div className="content-block">
                    <h3>Claim balances:</h3>
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
                    </div> : "No Unclaimed Balances"}
                    
                </div>
                <br/>
                
                {claimed_balance_rows.length ? (
                    <div>
                        <h3>Claimed Balance</h3>
                        <div>
                        
                            <table className="table"><thead><tr>
                                <th>Claimed</th>
                                <th>Claimed (vesting)</th>
                                <th>Account</th>
                            </tr></thead><tbody>
                                {claimed_balance_rows}
                            </tbody></table>
                        </div>
                    </div>) : null}
                <br/>
                
                    <div>
                        <h3>Claim balance to account:</h3>
                        <ExistingAccountsAccountSelect
                            account_names={this.state.my_accounts}
                            onChange={this._claimAccountSelect.bind(this)}
                            list_size={5}
                        />
                        {this.state.my_accounts_loading ? 
                            <LoadingIndicator type="circle"/> : <div/>}
                        <br>
                        <div className="button-group">
                            <div className={ cname("button success", {disabled: !import_ready}) }
                                onClick={this._importBalances.bind(this,
                                    claim_account_name,
                                    unclaimed_account_balances[claim_account_name]
                                )}
                            >
                                {claim_balance_label}
                            </div>
                            <div className="button secondary"
                                    onClick={this._setClaimActive.bind(this, false)}
                                    >Cancel
                            </div>
                        </div>
                        </br>
                
                    </div>
            
                <br/>
            </div>
        );
    }
    
    loadBalances() {
        BalanceClaimStore.getBalanceClaims().then( balance_claims => {
            this.balanceByAssetName(balance_claims).then( balance_by_asset => {
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
        var account_name_to_id = AccountStore.getState().account_name_to_id
        console.log('... account_names',account_names)
        var promises = []
        for(let account_name of account_names) {
            var account_id = account_name_to_id[account_name]
            if( ! account_id)
                throw new Error("Missing account id for name "+account_name)
            
            account_name => {
                // the fake transfer will check for required auths
                //var tr = new ops.signed_transaction()
                //tr.add_type_operation("transfer", {
                //    fee: { amount: 0, asset_id },
                //    from: account_id, to: account_id,
                //    amount: { 0, 0},
                //    null//memo
                //})
                var p = application_api.transfer(account_id,account_id,
                    1,//amount
                    0,//asset
                    null,//memo
                    false,//broadcast
                    false//encrypt_memo
                ).then( fake_transfer => {
                    console.log('... my account',account_name)
                    return account_name
                }).catch( error => {
                    console.log('... NOT my account',account_name,error)
                    return null
                })
                promises.push(p)
            }(account_name)//ensure correct account_name is returned in callback
        }
        Promise.all(promises).then( account_names => {
            var my_accounts = []
            for(let account_name of account_names) {
                if( ! account_name) continue
                my_accounts.push(account_name)
            }
            return my_accounts
        }).then( my_accounts => {
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
                        accounts, symbol, precision, balance, balance_claims})
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
                console.log("ExistingAccount._importBalances", result, JSON.stringify(result));
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

