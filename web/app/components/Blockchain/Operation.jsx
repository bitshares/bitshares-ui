import React from "react";
import {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import WitnessActions from "actions/WitnessActions";
import {operations} from "chain/chain_types";
import market_utils from "common/market_utils";
import utils from "common/utils";
import BlockTime from "./BlockTime";
import Aes from "ecc/aes";
import PublicKey from "ecc/key_public";
import PrivateKeyStore from "stores/PrivateKeyStore";
import WalletDb from "stores/WalletDb";
import LinkToAccountById from "../Account/LinkToAccountById";

require("./operations.scss");

let ops = Object.keys(operations);

class TransactionLabel extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.color !== this.props.color ||
            nextProps.type !== this.props.type
        );
    }
    render() {
        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("label", this.props.color);
        return (
            <span className={labelClass}>
                {trxTypes[ops[this.props.type]]}    
            </span>
        );
    }
}

class Row extends React.Component {
    render() {
        let {block, fee, color, type} = this.props;
        fee.amount = parseInt(fee.amount, 10);
        return (
                <tr>
                    <td><BlockTime block_number={block}/></td>
                    <td className="left-td"><TransactionLabel color={color} type={type} /></td>
                    {this.props.children}   
                    <td style={{paddingRight: "1.5rem"}} className="text-right"><FormattedAsset color="fee" style={{fontWeight: "bold"}} amount={fee.amount} asset={fee.asset_id} /></td>
                </tr>
            );
    }
}

class Operation extends React.Component {

    static defaultProps = {
        op: [],
        current: "",
        assets: null,
        block: false,
        witnesses: {},
        witness_id_to_name: {}
    }

    static propTypes = {
        op: PropTypes.array.isRequired,
        current: PropTypes.string.isRequired,
        assets: PropTypes.object.isRequired,
        block: PropTypes.number,
        witnesses: PropTypes.object,
        witness_id_to_name: PropTypes.object
    }

    getAssets(ids) {

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let missing = new Array(ids.length);
        
        ids.forEach((id, index) => {
            //if (id && !this.props.assets.get(id)) {
                AssetActions.getAsset(id);
                missing[index] = true;
            //}
        });
        
        return missing;
    }

    fetchWitnesses(witnessIds, witnesses, witness_id_to_name) {
        if (!Array.isArray(witnessIds)) {
            witnessIds = [witnessIds];
        }
        let missing = new Array(witnessIds.length);
        let missingWitnessIds = new Array(witnessIds.length);

        let missingAccounts = [];
        witnessIds.forEach((id, index) => {
            // Check for missing witness data
            if (id && !witnesses.get(id)) {
                missingWitnessIds.push(id);
                missing[index] = true;
            // Check for missing witness account data
            } else if (id && !witness_id_to_name.get(id)) {
                missingAccounts.push(witnesses.get(id).witness_account);
                missing[index] = true;
            }
        });

        if (missingWitnessIds.length > 0) {
            WitnessActions.getWitnesses(missingWitnessIds);
        } 

        if (missingAccounts.length > 0) {
            WitnessActions.getWitnessAccounts(missingAccounts);
        }

        return missing;
    }

    linkToAccount(name_or_id) {
        if(!name) return <span>-</span>;
        if(utils.is_object_id(name_or_id))
            return <LinkToAccountById account="name_or_id"/>
        return <Link to="account" params={{account_name: name_or_id}}>{name_or_id}</Link>;
    }

    render() {
        let {op, assets, current, block, witnesses, witness_id_to_name, inverted} = this.props;

        let line = null, column = null, color = "info";

        let missingFee = this.getAssets(op[1].fee.asset_id)[0];
        let missingAssets, missingAccounts;

        switch (ops[op[0]]) { // For a list of trx types, see chain_types.coffee

            case "transfer":
                let memo_text = null;
                
                if(op[1].memo) {
                    let memo = op[1].memo;
                    let from_private_key = PrivateKeyStore.getState().keys.get(memo.from)
                    let to_private_key = PrivateKeyStore.getState().keys.get(memo.to)
                    let private_key = from_private_key ? from_private_key : to_private_key;
                    let public_key = from_private_key ? memo.to : memo.from;
                    public_key = PublicKey.fromBtsPublic(public_key)

                    try {
                        private_key = WalletDb.decryptTcomb_PrivateKey(private_key);
                    }
                    catch(e) {
                        private_key = null;
                    }
                    try {
                        memo_text = private_key ? Aes.decrypt_with_checksum(
                            private_key,
                            public_key,
                            memo.nonce,
                            memo.message
                        ) : null;
                    } catch(e) {
                        console.log("transfer memo exception ...", e);
                        memo_text = "*";
                    }
                }

                color = "success";
                missingAssets = this.getAssets([op[1].amount.asset_id]);
                op[1].amount.amount = parseFloat(op[1].amount.amount);

                if (current === op[1].from) {

                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.sent" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" /> <LinkToAccountById account={op[1].to}/>
                            {memo_text ? <div className="memo">{memo_text}</div> : null}
                        </td>
                    );
                } else {//if(current === op[1].to){
                    column = (
                        <td className="right-td"><Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                            &nbsp;<Translate component="span" content="transaction.from" /> <LinkToAccountById account={op[1].from}/>
                            {memo_text ? <div className="memo">{memo_text}</div> : null}
                        </td>
                    );
                }

                break;

            case "limit_order_create": 
                color = "warning";
                console.log( "LIMIT OP", op )
                let isAsk = market_utils.isAskOp(op[1]);
                if (!inverted) {
                    isAsk = !isAsk;
                }
                missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);
                console.log( "PROPS: ", this.props )
                
                column = (
                        isAsk ?
                            <td className="right-td">
                            {!missingAssets[0] && !missingAssets[1] ? <Translate
                                component="span"
                                content="transaction.limit_order_sell" 
                                sell_amount={utils.format_asset(op[1].amount_to_sell.amount, assets.get(op[1].amount_to_sell.asset_id), false, false)}
                                sell_price={utils.format_price(op[1].min_to_receive.amount, assets.get(op[1].min_to_receive.asset_id), 
                                                               op[1].amount_to_sell.amount, assets.get(op[1].amount_to_sell.asset_id), false, inverted, false)}
                                num={this.props.result[1].substring(4)}
                            /> : null}
                        </td>
                        :
                        <td className="right-td">
                            {!missingAssets[0] && !missingAssets[1] ? <Translate
                                component="span"
                                content="transaction.limit_order_buy" 
                                buy_amount={utils.format_asset(op[1].min_to_receive.amount, assets.get(op[1].min_to_receive.asset_id), false, false)}
                                buy_price={utils.format_price(op[1].amount_to_sell.amount, assets.get(op[1].amount_to_sell.asset_id), 
                                                              op[1].min_to_receive.amount, assets.get(op[1].min_to_receive.asset_id), false, inverted, false)}
                                num={this.props.result[1].substring(4)}
                            /> : null}
                        </td>

                );
                break;

            case "short_order_create": 
                color = "short";
                missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].collateral.asset_id]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.short_order" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={op[1].amount_to_sell.asset_id} /> : null}
                        &nbsp;<Translate component="span" content="transaction.coll_of" />
                        &nbsp;{!missingAssets[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral.amount} asset={op[1].collateral.asset_id} /> : null}
                    </td>
                );
                break;

            case "limit_order_cancel":  
                color = "cancel";            

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.limit_order_cancel" />
                        &nbsp;#{op[1].order.substring(4)}
                    </td>
                );
                break;

            case "short_order_cancel": 
                color = "cancel";            
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.short_order_cancel" />
                        &nbsp;{op[1].order}
                    </td>
                );
                break;

            case "call_order_update":
                color = "warning";            
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.call_order_update" />
                    </td>
                );
                break;

            case "key_create":
                column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.create_key" />
                        </td>
                );
                break;

            case "account_create":
                if (current === op[1].registrar) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.reg_account" />
                            &nbsp;{this.linkToAccount(op[1].name)}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            {this.linkToAccount(op[1].name)}
                            &nbsp;<Translate component="span" content="transaction.was_reg_account" /> 
                            &nbsp;{this.linkToAccount(op[1].registrar)}
                        </td>
                    );    
                }
                break;

            case "account_update":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.update_account" /> 
                        &nbsp;{this.linkToAccount(op[1].account)}
                    </td>
                );
                break;

            case "account_whitelist":
                if (current === op[1].authorizing_account) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.whitelist_account" />
                            &nbsp;{this.linkToAccount(op[1].account_to_list)}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.whitelisted_by" />
                            &nbsp;{this.linkToAccount(op[1].authorizing_account)}
                        </td>
                    );
                }
                break;

            case "account_upgrade":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.upgrade_account" />
                    </td>
                );
                break;

            case "account_transfer":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.transfer_account" />
                        &nbsp;{this.linkToAccount(op[1].account_id)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].new_owner)}
                    </td>
                );
                break;

            case "asset_create":
                color = "warning"; 
                //let exists = assets.find(v => {
                //    return v.symbol === op[1].symbol;
                //});
                //if (!exists) {
                //    AssetActions.getAsset(op[1].symbol);
                //}
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.create_asset" />
                        &nbsp;<Link to="asset" params={{symbol: op[1].symbol}}>{op[1].symbol}</Link>
                    </td>
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                missingAssets = this.getAssets(op[1].asset_to_update);
                color = "warning";
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.update_asset" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                    </td>
                );
                break;

            case "asset_update_feed_producers":
                color = "warning";
                missingAssets = this.getAssets(op[1].asset_to_update);

                if (current === op[1].issuer) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.update_feed_producers" />
                            &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.feed_producer" />
                            &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                        </td>
                    );
                }
                break;   

            case "asset_issue":
                color = "warning";
                missingAssets = this.getAssets(op[1].asset_to_issue.asset_id);
                op[1].asset_to_issue.amount = parseInt(op[1].asset_to_issue.amount, 10);

                if (current === op[1].issuer) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.asset_issue" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={op[1].asset_to_issue.asset_id} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].issue_to_account)}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.was_issued" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={op[1].asset_to_issue.asset_id} /> : null}
                            &nbsp;<Translate component="span" content="transaction.by" />
                            &nbsp;{this.linkToAccount(op[1].issuer)}
                        </td>
                    );
                }
                break;  

            case "asset_burn":
                color = "cancel";
                missingAssets = this.getAssets(op[1].amount_to_burn.asset_id);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.burn_asset" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_burn.amount} asset={op[1].amount_to_burn.asset_id} /> : null}
                    </td>
                );
                break;   

            case "asset_fund_fee_pool":
                color = "warning";
                missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.fund_pool" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={op[1].asset_id} /> : null}
                    </td>
                );
                break;  

            case "asset_settle":
                color = "warning";
                missingAssets = this.getAssets(op[1].amount.asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.asset_settle" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                    </td>
                );
                break;  

            case "asset_global_settle":
                color = "warning";
                missingAssets = this.getAssets([op[1].asset_to_settle, op[1].price.base.asset_id]);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.asset_global_settle" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_settle).symbol}}>{assets.get(op[1].asset_to_settle).symbol}</Link> : null}
                        &nbsp;<Translate component="span" content="transaction.at" />
                        &nbsp;{!missingAssets[1] && !missingAssets[0] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].price.quote.amount}
                                                    asset={op[1].price.quote.asset_id}
                                                    base={assets.get(op[1].price.base.asset_id)} /> : null}
                    </td>
                );
                break; 

            case "asset_publish_feed":
                color = "warning";
                missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.publish_feed" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_id).symbol}}>{assets.get(op[1].asset_id).symbol}</Link> : null}
                    </td>
                );
                break;

            case "delegate_create":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.delegate_create" /> 
                        &nbsp;{this.linkToAccount(op[1].delegate_account)}
                    </td>
                );
                break;

            case "witness_create":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.witness_create" /> 
                        &nbsp;{this.linkToAccount(op[1].witness_account)}
                    </td>
                );

                break;

            case "witness_withdraw_pay":
                missingAssets = this.getAssets("1.3.0");
                let missingWitnesses = this.fetchWitnesses(op[1].witness_account, witnesses, witness_id_to_name);
                
                if (current === op[1].witness_account) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.witness_pay" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={"1.3.0"} /> : null}
                            <Translate component="span" content="transaction.to" /> 
                            &nbsp;{this.linkToAccount(op[1].witness_account)}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={"1.3.0"} /> : null}
                            <Translate component="span" content="transaction.from" /> 
                            &nbsp;{!missingWitnesses[0] ? this.linkToAccount(witness_id_to_name[op[1].witness_account]) : null}
                        </td>
                    ); 
                }
                break;         

            case "proposal_create":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.proposal_create" />
                    </td>
                );
                break;      

            case "proposal_update":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.proposal_update" />
                    </td>
                );
                break;   

            case "proposal_delete":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.proposal_delete" />
                    </td>
                );
                break;  

            case "withdraw_permission_create":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_create" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </td>
                );
                break; 

            case "withdraw_permission_update":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_update" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </td>
                );
                break; 

            case "withdraw_permission_claim":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_claim" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_to_account)}
                    </td>
                );
                break;                 

            case "withdraw_permission_delete":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_delete" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </td>
                );
                break;      

            case "fill_order":
                color = "success";
                missingAssets = this.getAssets([op[1].pays.asset_id, op[1].receives.asset_id]);

                column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.paid" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].pays.amount} asset={op[1].pays.asset_id} /> : null}
                            &nbsp;<Translate component="span" content="transaction.obtain" />
                            &nbsp;{!missingAssets[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].receives.amount} asset={op[1].receives.asset_id} /> : null}
                        </td>
                );
                break;   

            case "global_parameters_update":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.global_parameters_update" />
                    </td>
                );
                break;      

            case "file_write":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.file_write" />
                    </td>
                );
                break;       

            case "vesting_balance_create":
                missingAssets = this.getAssets([op[1].amount.asset_id]);
                column = (
                    <td className="right-td">
                        &nbsp;{this.linkToAccount(op[1].creator)}
                        <Translate component="span" content="transaction.vesting_balance_create" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                        &nbsp;{this.linkToAccount(op[1].owner)}
                    </td>
                );
                break;                     

            case "vesting_balance_withdraw":
                missingAssets = this.getAssets([op[1].amount.asset_id]);
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.vesting_balance_withdraw" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                    </td>
                );
                break;        

            case "bond_create_offer":
                missingAssets = this.getAssets([op[1].amount.asset_id]);
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.bond_create_offer" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} /> : null}
                    </td>
                );
                break;                     

            case "bond_cancel_offer":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.bond_cancel_offer" />
                        &nbsp;{op[1].offer_id}
                    </td>
                );
                break;  

            case "bond_accept_offer":
                missingAssets = this.getAssets([op[1].amount_borrowed.asset_id]);
                if (current === op[1].lender) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={op[1].amount_borrowed.asset_id} /> : null}
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].borrower)}
                        </td>
                    );
                } else if (current === op[1].borrower) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={op[1].amount_borrowed.asset_id} /> : null}
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].lender)}
                        </td>
                    );
                }
                break;  

            case "bond_claim_collateral":
                missingAssets = this.getAssets([op[1].collateral_claimed.asset_id]);
                if (current === op[1].lender) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_pay_collateral" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={op[1].collateral_claimed.asset_id} /> : null}
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].claimer)}
                        </td>
                    );
                } else if (current === op[1].claimer) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_claim_collateral" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={op[1].collateral_claimed.asset_id} /> : null}
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].lender)}
                        </td>
                    );
                }
                break; 

            case "worker_create":
                missingAssets = this.getAssets("1.3.0");
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.create_worker" /> 
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].daily_pay} asset={"1.3.0"} /> : null}
                    </td>
                );
                break;


            case "balance_claim":
                color = "success";
                missingAssets = this.getAssets(op[1].total_claimed.asset_id);

                op[1].total_claimed.amount = parseInt(op[1].total_claimed.amount, 10);

                column = (
                    <td className="right-td">
                       {!missingAssets[0] ?
                            <Translate
                                component="span"
                                content="transaction.balance_claim" 
                                balance_amount={utils.format_asset(op[1].total_claimed.amount, assets.get(op[1].total_claimed.asset_id))}
                                balance_id={op[1].balance_to_claim.substring(5)}
                            /> : null}
                    </td>
                );
                break;  

            case "custom":
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.custom" /> 
                    </td>
                );
                break;                

            default: 
                column = (
                    <td>
                        <Link to="block" params={{height: block}}>#{block}</Link>
                    </td>

                );
        }

        line = column ? (
            <Row block={block} type={op[0]} color={color} missing={missingFee} fee={op[1].fee} assets={assets}>
                {column}
            </Row>
        ) : null;



        return (
            line ? line : <tr></tr>
        );
    }
}

export default Operation;
