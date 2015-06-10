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

let style = {
    left_td: {
        minWidth: "7em",
        paddingRight: "1em",
        textAlign: "left"
    },
    right_td: {
        textAlign: "left"
    }
};

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
                    <td style={style.left_td}><TransactionLabel color={color} type={type} /></td>
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
            if (!this.props.assets.get(id)) {
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
            if (!this.props.accounts[id]) {
                AccountActions.getAccount(id);
                missing[index] = true;
            }
        });
        
        return missing;
    }

    fetchWitnesses(witnessIds, witnesses, witness_id_to_name) {
        if (!Array.isArray(witnessIds)) {
            witnessIds = [witnessIds];
        }
        let missing = new Array(ids.length);
        let missingWitnessIds = new Array(witnessIds.length);

        let missingAccounts = [];
        witnessIds.forEach((id, index) => {
            // Check for missing witness data
            if (!witnesses.get(id)) {
                missingWitnessIds.push(id);
                missing[index] = true;
            // Check for missing witness account data
            } else if (!witness_id_to_name.get(id)) {
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

    render() {
        let {op, accounts, assets, current, block, witnesses, witness_id_to_name} = this.props;
        
        let line = null, column = null, color;

        let missingFee = this.getAssets(op[1].fee.asset_id)[0];

        switch (op[0]) { // For a list of trx types, see chain_types.coffee

            case 0: // transfer
                color = "success";
                let missingAssets = this.getAssets([op[1].amount.asset_id]);
                op[1].amount.amount = parseFloat(op[1].amount.amount);

                if (current === accounts[op[1].from]) {

                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.sent" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" /> {accounts[op[1].to] ? <Link to="account" params={{name: accounts[op[1].to]}}>{accounts[op[1].to]}</Link> : op[1].to}
                        </td>
                    );
                } else if(current === accounts[op[1].to]){
                    column = (
                        <td style={style.right_td}><Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.from" /> {accounts[op[1].from] ? <Link to="account" params={{name: accounts[op[1].from]}}>{accounts[op[1].from]}</Link> : op[1].from}
                        </td>
                    );
                }

                break;

            case 1: // limit_order
                color = "warning";
                let missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);

                column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.limit_order" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.at" />
                            &nbsp;{!missingAssets[1] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].min_to_receive.amount / op[1].amount_to_sell.amount}
                                                    asset={assets.get(op[1].min_to_receive.asset_id)}
                                                    base={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                        </td>
                );
                break;

            case 2: // short_order
                color = "warning";
                let missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].collateral.asset_id]);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.short_order" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                        &nbsp;<Translate component="span" content="transaction.coll_of" />
                        &nbsp;{!missingAssets[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral.amount} asset={assets.get(op[1].collateral.asset_id)} /> : null}
                    </td>
                );
                break;

            case 3: // limit_order_cancel
                color = "warning";            
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.limit_order_cancel" />
                        &nbsp;{op[1].order}
                    </td>
                );
                break;

            case 4: // short_order_cancel
                color = "warning";            
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.limit_order_cancel" />
                    </td>
                );
                break;

            case 5: // call_order_update
                color = "warning";            
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.call_order_update" />
                    </td>
                );
                break;

            case 6: // key_create
                column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.create_key" />
                        </td>
                );
                break;

            case 7: // account_create
                let missingAccounts = this.getAccounts(op[1].registrar);

                if (current === accounts[op[1].registrar]) {
                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.reg_account" />
                            &nbsp;<Link to="account" params={{name: op[1].name}}>{op[1].name}</Link>
                        </td>
                    );
                } else {
                    column = (
                        <td style={style.right_td}>
                            {!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].registrar]}}>{accounts[op[1].registrar]}</Link> : op[1].registrar}
                            &nbsp;<Translate component="span" content="transaction.reg_account" /> 
                            <Link to="account" params={{name: op[1].name}}>{op[1].name}</Link>
                        </td>
                    );    
                }
                break;

            case 8: // account_update
                let missingAccounts = this.getAccounts(op[1].account);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.update_account" /> 
                        &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].account]}}>{accounts[op[1].account]}</Link> : null}
                    </td>
                );

                break;

            case 9: // account_whitelist
                let missingAccounts = this.getAccounts(op[1].account);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.whitelist_account" />
                        &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].account_to_list]}}>{accounts[op[1].account_to_list]}</Link> : null}
                    </td>
                );

                break;

            case 10: // account_transfer
                let missingAccounts = this.getAccounts([op[1].account_id, op[1].new_owner]);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.transfer_account" />
                        &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].account_id]}}>{accounts[op[1].account_id]}</Link> : null}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{!missingAccounts[1] ? <Link to="account" params={{name: accounts[op[1].new_owner]}}>{accounts[op[1].new_owner]}</Link> : null}
                    </td>
                );

                break;

            case 11: // asset_create
                color = "warning";            
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.create_asset" />
                        &nbsp;<Link to="asset" params={{symbol: op[1].symbol}}>{op[1].symbol}</Link>
                    </td>
                );
                break;

            case 12: // asset_update
                let missingAssets = this.getAssets(op[1].asset_to_update);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.update_asset" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                    </td>
                );
                break;      

            case 13: // asset_update_bitasset
                let missingAssets = this.getAssets(op[1].asset_to_update);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.update_asset" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                    </td>
                );
                break;     

            case 14: // asset_update_feed_producers
                let missingAssets = this.getAssets(op[1].asset_to_update);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.update_asset" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_to_update).symbol}}>{assets.get(op[1].asset_to_update).symbol}</Link> : null}
                    </td>
                );
                break;   

            case 15: // asset_issue
                let missingAssets = this.getAssets(op[1].asset_to_issue.asset_id);
                let missingAccounts = this.getAccounts([op[1].issuer, op[1].issue_to_account]);

                if (current === accounts[op[1].issuer]) {
                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.asset_issue" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={assets.get(op[1].asset_to_issue.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" />
                            &nbsp;{!missingAccounts[1] ? <Link to="account" params={{name: accounts[op[1].issue_to_account]}}>{accounts[op[1].issue_to_account]}</Link> : null}
                        </td>
                    );
                } else {
                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.was_issued" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={assets.get(op[1].asset_to_issue.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.by" />
                            &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].issuer]}}>{accounts[op[1].issuer]}</Link> : null}
                        </td>
                    );
                }

                break;  

            case 16: // asset_burn
                let missingAssets = this.getAssets(op[1].amount_to_burn.asset_id);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.burn_asset" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_burn.amount} asset={assets.get(op[1].amount_to_burn.asset_id)} /> : null}
                    </td>
                );
                break;   

            case 17: // asset_fund_fee_pool
                let missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.fund_pool" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get(op[1].asset_id)} /> : null}
                    </td>
                );
                break;  

            case 18: // asset_settle
                let missingAssets = this.getAssets(op[1].amount.asset_id);
                
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.asset_settle" />
                        &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                    </td>
                );
                break;  

            case 19: // asset_global_settle
                let missingAssets = this.getAssets([op[1].asset_to_settle, op[1].price.base.asset_id]);
                
                column = (
                    <td style={style.right_td}>
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

            case 20: // asset_publish_feed
                let missingAssets = this.getAssets(op[1].asset_id);
                
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.publish_feed" />
                        &nbsp;{!missingAssets[0] ? <Link to="asset" params={{symbol: assets.get(op[1].asset_id).symbol}}>{assets.get(op[1].asset_id).symbol}</Link> : null}
                    </td>
                );
                break;

            case 21: // delegate_create
                let missingAccounts = this.getAccounts(op[1].delegate_account);
                
                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.delegate_create" /> 
                        &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].delegate_account]}}>{accounts[op[1].delegate_account]}</Link> : null}
                    </td>
                );
                
                break;

            case 22: // witness_create
                let missingAccounts = this.getAccounts(op[1].witness_account);

                column = (
                    <td style={style.right_td}>
                        <Translate component="span" content="transaction.witness_create" /> 
                        &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].witness_account]}}>{accounts[op[1].witness_account]}</Link> : null}
                    </td>
                );

                break;

            case 23: // witness_withdraw_pay
                let missingAccounts = this.getAccounts(op[1].to_account);
                let missingAssets = this.getAssets("1.4.0");
                let missingWitnesses = this.fetchWitnesses(op[1].witness_account, witnesses, witness_id_to_name);
                
                if (current === accounts[op[1].witness_account]) {
                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.witness_pay" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get("1.4.0")} /> : null}
                            <Translate component="span" content="transaction.to" /> 
                            &nbsp;{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].witness_account]}}>{accounts[op[1].witness_account]}</Link> : null}
                        </td>
                    );
                } else {
                    column = (
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.received" />
                            &nbsp;{!missingAssets[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={assets.get("1.4.0")} /> : null}
                            <Translate component="span" content="transaction.from" /> 
                            &nbsp;{!missingWitnesses[0] ? <Link to="account" params={{name: witness_id_to_name[op[1].witness_account]}}>{witness_id_to_name[op[1].witness_account]}</Link> : null}
                        </td>
                    ); 
                }

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
    accounts: {},
    assets: {},
    block: false,
    witnesses: {},
    witness_id_to_name: {}
};

Operation.propTypes = {
    op: PropTypes.array.isRequired,
    current: PropTypes.string.isRequired,
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    block: PropTypes.number,
    witnesses: PropTypes.object,
    witness_id_to_name: PropTypes.object
};

export default Operation;
