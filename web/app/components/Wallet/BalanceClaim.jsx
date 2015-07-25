import React, {Component, PropTypes} from 'react'

import WalletDb from "stores/WalletDb"
import AccountStore from "stores/AccountStore"
import PrivateKeyStore from "stores/PrivateKeyStore"
import BalanceClaimStore from "stores/BalanceClaimStore"
import FormattedAsset from "components/Utility/FormattedAsset"
import AccountSelect from "components/Forms/AccountSelect"
import WalletActions from "actions/WalletActions"

import Apis from "rpc_api/ApiInstances"

import notify from 'actions/NotificationActions'
import cname from "classnames"
import lookup from "chain/lookup"
import v from "chain/serializer_validation"
import type from "chain/serializer_operation_types"
import hash from "common/hash"

var api = Apis.instance()
            
export default class BalanceClaim extends Component {

    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            claim_account_name: null,
            balance_claims: [],
            balance_by_asset: []
        }
    }
    
    reset() {
        this.setState(this._getInitialState())
        this.loadBalances()
    }
    
    componentWillMount() {
        this.loadBalances()
    }
    
    render() {
        if( ! this.state.balance_claims.length)
            return <div/>
        
        var balance_rows = []
        var has_unclaimed = false
        for(let asset_balance of this.state.balance_by_asset) {
            var {symbol, balance, precision} = asset_balance
            balance_rows.push(<tr>
                <td> <FormattedAsset amount={balance.unvested.unclaimed} asset={{symbol, precision}}/></td>
                <td> <FormattedAsset amount={balance.unvested.claimed} asset={{symbol, precision}}/></td>
                <td> <FormattedAsset amount={balance.vesting.unclaimed} asset={{symbol, precision}}/></td>
                <td> <FormattedAsset amount={balance.vesting.claimed} asset={{symbol, precision}}/></td>
            </tr>)
            if(balance.unvested.unclaimed || balance.vesting.unclaimed)
                has_unclaimed = true
        }
        
        var has_account = this.state.claim_account_name ? true : false
        var import_ready = has_account && has_unclaimed
        
        var claim_balance_label =
            import_ready ?
                `Claim Balance to ${this.state.claim_account_name}...` :
                "Claim Balance"
        
        return <div>
            <hr/>
            <h3>Unclaimed Balance</h3>
            
            <div>
                <label>Assets</label>
                {balance_rows.length ? <div>
                    <table className="table"><thead><tr>
                        <th>Unclaimed</th>
                        <th>Claimed</th>
                        <th>Unclaimed (vesting)</th>
                        <th>Claimed (vesting)</th>
                    </tr></thead><tbody>
                        {balance_rows}
                    </tbody></table>
                </div> : "No Balances"}
                
            </div>
            <br/>
            
            { this.props.claimActive ? <div>
                
                <h3>Balance Claim Account</h3>
                <AccountSelect
                    account_names={this.props.accountNames}
                    onChange={this._claimAccountSelect.bind(this)}
                    list_size={5}
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
                    <div className={ cname("button", {disabled:!has_unclaimed}) }
                        onClick={this._setClaimActive.bind(this, true)}
                        >Claim Balance
                    </div>
                </div>}
                
                { this.state.balance_claim_active ? <div>
                    <div className="button"
                        onClick={this._setClaimActive.bind(this, false)}
                        >Cancel
                    </div>
                </div>:""}
                
            </div>:""}
                
        </div>
    }
    
    loadBalances() {
        BalanceClaimStore.getBalanceClaims().then( balance_claims => {
                this.balanceByAssetName(balance_claims).then( balance_by_asset => {
                this.setState({balance_claims, balance_by_asset})
            })
        })
    }

    balanceByAssetName(balance_claims) {
        return new Promise((resolve, reject)=> {
            var assetid_balance = {}
            //DEBUG console.log('... balance_claims',balance_claims)
            for(let balance_claim of balance_claims) {
                var b = balance_claim.chain_balance_record
                var total = assetid_balance[b.balance.asset_id] || {
                    vesting:{claimed:0, unclaimed:0},
                    unvested:{claimed:0, unclaimed:0}
                }
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
    
    _setClaimActive(active) {
        this.setState({balance_claim_active: active})
        if(! active) this.reset()
        this.props.onActive(active)
    }
    
    _claimAccountSelect(claim_account_name) {
        this.setState({claim_account_name})
    }
    
    _importBalances() {
        var {unvested_balance_claims, wif_to_balances} =
            this.wif_to_balances(this.state.balance_claims)
        
        //return
        WalletActions.importBalance(
            this.state.claim_account_name,
            wif_to_balances,
            false //broadcast
        ).then((tr_object)=> {
            
            // todo: transaction_helper.getDigest_from_trObject
            var tr = type.signed_transaction.fromObject(tr_object)
            var tr_buffer = type.transaction.toBuffer(tr)
            var digest = hash.sha256(tr_buffer).toString('hex')
            return api.network_api().exec("broadcast_transaction",
                [tr_object]).then( ()=> {
                return BalanceClaimStore.setDigest(unvested_balance_claims, digest)
            })
                
        }).then((result)=> {
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
    
    wif_to_balances(balance_claims) {
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
            var private_key = WalletDb.decryptTcomb_private_key(private_key_tcomb)
            wif_to_balances[private_key.toWif()] = balances
        }
        return {unvested_balance_claims, wif_to_balances}
    }
}

BalanceClaim.propTypes = {
    onActive: PropTypes.func.isRequired,
    accountNames: PropTypes.array.isRequired,
    claimActive: PropTypes.bool.isRequired
}

