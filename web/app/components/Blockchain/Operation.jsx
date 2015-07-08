import React from "react";
import {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import AccountActions from "actions/AccountActions";
import WitnessActions from "actions/WitnessActions";
import {operations} from "chain/chain_types";
import market_utils from "common/market_utils";

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
                {trxTypes[this.props.type]}    
            </span>
        );
    }
}

class Row extends React.Component {
    render() {

        let {block, fee, color, type, missing, assets} = this.props;

        return (
                <tr>
                    {block ? <td><Link to="block" params={{height: block}}>#{block}</Link></td> : null}
                    <td className="left-td"><TransactionLabel color={color} type={type} /></td>
                    {this.props.children}   
                    <td>{!missing ? <FormattedAsset style={{fontWeight: "bold"}} amount={fee.amount} asset={assets.get(fee.asset_id)} /> : null}</td>
                </tr>
            );
    }
}

class Operation extends React.Component {

    getAssets(ids) {

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let missing = new Array(ids.length);
        
        ids.forEach((id, index) => {
            if (id && !this.props.assets.get(id)) {
                AssetActions.getAsset(id);
                missing[index] = true;
            }
        });
        
        return missing;
    }

    getAccounts(ids) {

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let missing = new Array(ids.length);

        ids.forEach((id, index) => {
            if (id && !this.props.account_id_to_name[id]) {
                AccountActions.getAccounts(id, 1);
                missing[index] = true;
            }
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

    linkToAccount(name) {
        if(!name) {
            return <span>-</span>;
        }
        return <Link to="account" params={{name: name}}>{name}</Link>;
    }

    render() {
        let {op, account_id_to_name, assets, current, block, witnesses, witness_id_to_name, inverted} = this.props;

        let line = null, column = null, color;

        let missingFee = this.getAssets(op[1].fee.asset_id)[0];

        switch (ops[op[0]]) { // For a list of trx types, see chain_types.coffee

            case "transfer":  
                color = "success";
                let missingAssets = this.getAssets([op[1].amount.asset_id]);
                op[1].amount.amount = parseFloat(op[1].amount.amount);

                if (current === account_id_to_name[op[1].from]) {

                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.sent" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" /> {account_id_to_name[op[1].to] ? this.linkToAccount(account_id_to_name[op[1].to]) : op[1].to}
                        </td>
                    );
                } else if(current === account_id_to_name[op[1].to]){
                    column = (
                        <td className="right-td"><Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.from" /> {account_id_to_name[op[1].from] ? this.linkToAccount(account_id_to_name[op[1].from]) : op[1].from}
                        </td>
                    );
                }

                break;

            case "limit_order_create": 
                color = "warning";
                let isAsk = market_utils.isAskOp(op[1]);
                if (!inverted) {
                    isAsk = !isAsk;
                }
                let missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);
                column = (
                        isAsk ?
                            <td className="right-td">
                            <Translate component="span" content="transaction.limit_order" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.at" />
                            &nbsp;{!missingAssets[1] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].min_to_receive.amount}
                                                    asset={assets.get(op[1].min_to_receive.asset_id)}
                                                    baseamount={op[1].amount_to_sell.amount}
                                                    base={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                        </td>
                        :
                        <td className="right-td">
                            <Translate component="span" content="transaction.limit_order_buy" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].min_to_receive.amount} asset={assets.get(op[1].min_to_receive.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.at" />
                            &nbsp;{!missingAssets[1] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].amount_to_sell.amount}
                                                    asset={assets.get(op[1].amount_to_sell.asset_id)}
                                                    baseamount={op[1].min_to_receive.amount}
                                                    base={assets.get(op[1].min_to_receive.asset_id)} /> : null}
                        </td>

                );
                break;

            case "short_order_create": 
                color = "short";
                let missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].collateral.asset_id]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.short_order" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                        &nbsp;<Translate component="span" content="transaction.coll_of" />
                        &nbsp;{!missingAssets[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral.amount} asset={assets.get(op[1].collateral.asset_id)} /> : null}
                    </td>
                );
                break;

            case "limit_order_cancel":  
                color = "cancel";            
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.limit_order_cancel" />
                        &nbsp;{op[1].order}
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
                let missingAccounts = this.getAccounts(op[1].registrar);

                if (current === account_id_to_name[op[1].registrar]) {
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
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].registrar]) : op[1].registrar}
                        </td>
                    );    
                }
                break;

            case "account_update":
                let missingAccounts = this.getAccounts(op[1].account);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.update_account" /> 
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].account]) : null}
                    </td>
                );

                break;

            case "account_whitelist":
                let missingAccounts = this.getAccounts([op[1].authorizing_account, op[1].account_to_list]);

                if (current === account_id_to_name[op[1].authorizing_account]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.whitelist_account" />
                            &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].account_to_list]) : null}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.whitelisted_by" />
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].authorizing_account]) : null}
                        </td>
                    );
                }

                break;

            case "account_upgrade":
                let missingAccounts = this.getAccounts([op[1].account_to_upgrade]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.upgrade_account" />
                    </td>
                );

                break;

            case "account_transfer":
                let missingAccounts = this.getAccounts([op[1].account_id, op[1].new_owner]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.transfer_account" />
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].account_id]) : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].new_owner]) : null}
                    </td>
                );

                break;

            case "asset_create":
                color = "warning"; 
                let exists = assets.find(v => {
                    return v.symbol === op[1].symbol;
                });
                if (!exists) {
                    AssetActions.getAsset(op[1].symbol);      
                }
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.create_asset" />
                        &nbsp;<Link to="asset" params={{symbol: op[1].symbol}}>{op[1].symbol}</Link>
                    </td>
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                let missingAssets = this.getAssets(op[1].asset_to_update);
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
                let missingAssets = this.getAssets(op[1].asset_to_update);

                if (current === account_id_to_name[op[1].issuer]) {
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
                let missingAssets = this.getAssets(op[1].asset_to_issue.asset_id);
                let missingAccounts = this.getAccounts([op[1].issuer, op[1].issue_to_account]);

                if (current === account_id_to_name[op[1].issuer]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.asset_issue" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={assets.get(op[1].asset_to_issue.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" />
                            &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].issue_to_account]) : null}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.was_issued" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={assets.get(op[1].asset_to_issue.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.by" />
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].issuer]) : null}
                        </td>
                    );
                }

                break;  

            case "asset_burn":
                color = "cancel";
                let missingAssets = this.getAssets(op[1].amount_to_burn.asset_id);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.burn_asset" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_burn.amount} asset={assets.get(op[1].amount_to_burn.asset_id)} /> : null}
                    </td>
                );
                break;   

            case "asset_fund_fee_pool":
                color = "warning";
                let missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.fund_pool" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get(op[1].asset_id)} /> : null}
                    </td>
                );
                break;  

            case "asset_settle":
                color = "warning";
                let missingAssets = this.getAssets(op[1].amount.asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.asset_settle" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                    </td>
                );
                break;  

            case "asset_global_settle":
                color = "warning";
                let missingAssets = this.getAssets([op[1].asset_to_settle, op[1].price.base.asset_id]);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.asset_global_settle" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_settle).symbol}}>{assets.get(op[1].asset_to_settle).symbol}</Link> : null}
                        &nbsp;<Translate component="span" content="transaction.at" />
                        &nbsp;{!missingAssets[1] && !missingAssets[0] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].price.quote.amount}
                                                    asset={assets.get(op[1].price.quote.asset_id)}
                                                    base={assets.get(op[1].price.base.asset_id)} /> : null}
                    </td>
                );
                break; 

            case "asset_publish_feed":
                color = "warning";
                let missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.publish_feed" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_id).symbol}}>{assets.get(op[1].asset_id).symbol}</Link> : null}
                    </td>
                );
                break;

            case "delegate_create":
                let missingAccounts = this.getAccounts(op[1].delegate_account);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.delegate_create" /> 
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].delegate_account]) : null}
                    </td>
                );
                
                break;

            case "witness_create":
                let missingAccounts = this.getAccounts(op[1].witness_account);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.witness_create" /> 
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].witness_account]) : null}
                    </td>
                );

                break;

            case "witness_withdraw_pay":
                let missingAccounts = this.getAccounts(op[1].to_account);
                let missingAssets = this.getAssets("1.3.0");
                let missingWitnesses = this.fetchWitnesses(op[1].witness_account, witnesses, witness_id_to_name);
                
                if (current === account_id_to_name[op[1].witness_account]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.witness_pay" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get("1.3.0")} /> : null}
                            <Translate component="span" content="transaction.to" /> 
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].witness_account]) : null}
                        </td>
                    );
                } else {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get("1.3.0")} /> : null}
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
                let missingAccounts = this.getAccounts([op[1].withdraw_from_account, op[1].authorized_account]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_create" />
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].withdraw_from_account]) : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].authorized_account]) : null}
                    </td>
                );

                break; 

            case "withdraw_permission_update":
                let missingAccounts = this.getAccounts([op[1].withdraw_from_account, op[1].authorized_account]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_update" />
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].withdraw_from_account]) : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].authorized_account]) : null}
                    </td>
                );

                break; 

            case "withdraw_permission_claim":
                let missingAccounts = this.getAccounts([op[1].withdraw_from_account, op[1].withdraw_to_account]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_claim" />
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].withdraw_from_account]) : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].withdraw_to_account]) : null}
                    </td>
                );

                break;                 

            case "withdraw_permission_delete":
                let missingAccounts = this.getAccounts([op[1].withdraw_from_account, op[1].authorized_account]);

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.withdraw_permission_delete" />
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].withdraw_from_account]) : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].authorized_account]) : null}
                    </td>
                );

                break;      

            case "fill_order":
                color = "success";
                let missingAssets = this.getAssets([op[1].pays.asset_id, op[1].receives.asset_id]);

                column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.paid" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].pays.amount} asset={assets.get(op[1].pays.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.obtain" />
                            &nbsp;{!missingAssets[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].receives.amount} asset={assets.get(op[1].receives.asset_id)} /> : null}
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
                let missingAssets = this.getAssets([op[1].amount.asset_id]);
                let missingAccounts = this.getAccounts([op[1].creator, op[1].owner]);
                
                column = (
                    <td className="right-td">
                        &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].creator]) : null}
                        <Translate component="span" content="transaction.vesting_balance_create" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                        &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].owner]) : null}
                    </td>
                );

                break;                     

            case "vesting_balance_withdraw":
                let missingAssets = this.getAssets([op[1].amount.asset_id]);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.vesting_balance_withdraw" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                    </td>
                );

                break;        

            case "bond_create_offer":
                let missingAssets = this.getAssets([op[1].amount.asset_id]);
                
                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.bond_create_offer" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
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
                let missingAssets = this.getAssets([op[1].amount_borrowed.asset_id]);
                let missingAccounts = this.getAccounts([op[1].lender, op[1].borrower]);

                if (current === account_id_to_name[op[1].lender]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={assets.get(op[1].amount_borrowed.asset_id)} /> : null}
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].borrower]) : null}
                        </td>
                    );
                } else if (current === account_id_to_name[op[1].borrower]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={assets.get(op[1].amount_borrowed.asset_id)} /> : null}
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].lender]) : null}
                        </td>
                    );
                }

                break;  

            case "bond_claim_collateral":
                let missingAssets = this.getAssets([op[1].collateral_claimed.asset_id]);
                let missingAccounts = this.getAccounts([op[1].lender, op[1].claimer]);

                if (current === account_id_to_name[op[1].lender]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_pay_collateral" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={assets.get(op[1].collateral_claimed.asset_id)} /> : null}
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{!missingAccounts[1] ? this.linkToAccount(account_id_to_name[op[1].claimer]) : null}
                        </td>
                    );
                } else if (current === account_id_to_name[op[1].claimer]) {
                    column = (
                        <td className="right-td">
                            <Translate component="span" content="transaction.bond_claim_collateral" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={assets.get(op[1].collateral_claimed.asset_id)} /> : null}
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{!missingAccounts[0] ? this.linkToAccount(account_id_to_name[op[1].lender]) : null}
                        </td>
                    );
                }

                break; 

            case "worker_create":
                let missingAssets = this.getAssets("1.3.0");

                column = (
                    <td className="right-td">
                        <Translate component="span" content="transaction.create_worker" /> 
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].daily_pay} asset={assets.get("1.3.0")} /> : null}
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

Operation.defaultProps = {
    op: [],
    current: "",
    account_id_to_name: {},
    assets: {},
    block: false,
    witnesses: {},
    witness_id_to_name: {}
};

Operation.propTypes = {
    op: PropTypes.array.isRequired,
    current: PropTypes.string.isRequired,
    account_id_to_name: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    block: PropTypes.number,
    witnesses: PropTypes.object,
    witness_id_to_name: PropTypes.object
};

export default Operation;
