import React from "react";
import {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import classNames from "classnames";
import {FormattedDate} from "react-intl";
import intlData from "../Utility/intlData";
import AssetActions from "actions/AssetActions";

require("./operations.scss");

class OpType extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.type !== this.props.type
        );
    }

    render() {
        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("label", this.props.color);
        return (
            <tr>
                <td>
                    <Translate component="span" content="explorer.block.op_type" />:
                </td>
                <td>
                    <span className={labelClass}>
                        {trxTypes[this.props.type]}
                    </span>
                </td>
            </tr>
        );
    }
}

class OperationTable extends React.Component {

    render() {
        

        return (
            <div>
                <h6><Translate component="span" content="explorer.block.op" /> #{this.props.index + 1}</h6>
                <table style={{marginBottom: "1em"}} className="table">
                    <caption></caption>
                    <tbody>
                        <OpType type={this.props.type} color={this.props.color}/>
                        {this.props.children}
                        <tr>
                            <td><Translate component="span" content="transfer.fee" />:</td>
                            <td>{!this.props.missingFee ? <FormattedAsset amount={this.props.fee.amount} asset={this.props.assets.get(this.props.fee.asset_id)} /> : null}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            );
    }
}

class Transaction extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.trx.operations.ref_block_prefix !== this.props.trx.operations.ref_block_prefix ||
            nextProps.assets !== this.props.assets
            );
    }

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
            if (id && !this.props.accounts[id]) {
                AccountActions.getAccount(id);
                missing[index] = true;
            }
        });
        
        return missing;
    }

    render() {
        let {trx, index, accounts, assets} = this.props;
        let info = null;

        info = [];

        trx.operations.forEach((op, opIndex) => {
            let missingFee = this.getAssets([op[1].fee.asset_id])[0];

            console.log("block op:", op);
            switch (op[0]) { // For a list of trx types, see chain_types.coffee

                case 0: // transfer

                    let missing = this.getAssets([op[1].amount.asset_id]);
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="success" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                            <tr>
                                <td><Translate component="span" content="transfer.from" />:</td>
                                <td>{accounts[op[1].from] ? <Link to="account" params={{name: accounts[op[1].from]}}>{accounts[op[1].from]}</Link> : op[1].from}</td>
                            </tr>
                            <tr>
                                <td><Translate component="span" content="transfer.to" />:</td>
                                <td>{accounts[op[1].to] ? <Link to="account" params={{name: accounts[op[1].to]}}>{accounts[op[1].to]}</Link> : op[1].to}</td>
                            </tr>
                            <tr>
                                <td><Translate component="span" content="transfer.amount" />:</td>
                                <td>{!missing[0] ? <FormattedAsset amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}</td>
                            </tr>
                        </OperationTable>
                    );
                    break;

                case 1: // limit_order_create
                    let missing = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="warning" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="transaction.amount_sell" />:</td>
                                    <td>{!missing[0] ? <FormattedAsset amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.min_receive" />:</td>
                                    <td>{!missing[1] ? <FormattedAsset amount={op[1].min_to_receive.amount} asset={assets.get(op[1].min_to_receive.asset_id)} /> : null}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.seller" />:</td>
                                    <td>{accounts[op[1].seller] ? <Link to="account" params={{name: accounts[op[1].seller]}}>{accounts[op[1].seller]}</Link> : op[1].seller}</td>
                                </tr>                                
                                <tr>
                                    <td><Translate component="span" content="transaction.expiration" />:</td>
                                    <td>
                                        <FormattedDate
                                            value={op[1].expiration}
                                            formats={intlData.formats}
                                            format="full"
                                        />
                                    </td>
                                </tr>

                        </OperationTable>
                    );
                    break;

                case 2: // short_order_create
                    this.getAssets([op[1].amount_to_sell.asset_id, op[1].collateral.asset_id]);
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="short" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="transaction.amount_sell" />:</td>
                                    <td>{assets.get(op[1].amount_to_sell.asset_id) ? <FormattedAsset amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.collateral" />:</td>
                                    <td>{assets.get(op[1].collateral.asset_id) ? <FormattedAsset amount={op[1].collateral.amount} asset={assets.get(op[1].collateral.asset_id)} /> : null}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.coll_ratio" />:</td>
                                    <td>{op[1].initial_collateral_ratio}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.coll_maint" />:</td>
                                    <td>{op[1].maintenance_collateral_ratio}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="transaction.seller" />:</td>
                                    <td>{accounts[op[1].seller] ? <Link to="account" params={{name: accounts[op[1].seller]}}>{accounts[op[1].seller]}</Link> : op[1].seller}</td>
                                </tr>                                
                                <tr>
                                    <td><Translate component="span" content="transaction.expiration" />:</td>
                                    <td>
                                        <FormattedDate
                                            value={op[1].expiration}
                                            formats={intlData.formats}
                                            format="full"
                                        />
                                    </td>
                                </tr>
                        </OperationTable>
                    );
                    break;

                case 3: // limit_order_cancel
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="cancel" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="transfer.limit_order_cancel" />:</td>
                                    <td>{op[1].order}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="explorer.block.fee_payer" />:</td>
                                    <td>{accounts[op[1].fee_paying_account] ? <Link to="account" params={{name: accounts[op[1].fee_paying_account]}}>{accounts[op[1].fee_paying_account]}</Link> : op[1].fee_paying_account}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;

                case 4: // short_order_cancel
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="cancel" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="transfer.short_order_cancel" />:</td>
                                    <td>{op[1].order}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="explorer.block.fee_payer" />:</td>
                                    <td>{accounts[op[1].fee_paying_account] ? <Link to="account" params={{name: accounts[op[1].fee_paying_account]}}>{accounts[op[1].fee_paying_account]}</Link> : op[1].fee_paying_account}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;        

                case 5: // call_order_update
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="default" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="transfer.limit_order_cancel" />:</td>
                                    <td>{op[1].order}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="explorer.block.fee_payer" />:</td>
                                    <td>{accounts[op[1].fee_paying_account] ? <Link to="account" params={{name: accounts[op[1].fee_paying_account]}}>{accounts[op[1].fee_paying_account]}</Link> : op[1].fee_paying_account}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;                                 

                case 6: // key_create
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="default" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="explorer.block.fee_payer" />:</td>
                                    <td>{accounts[op[1].fee_paying_account] ? <Link to="account" params={{name: accounts[op[1].fee_paying_account]}}>{accounts[op[1].fee_paying_account]}</Link> : op[1].fee_paying_account}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="explorer.block.key" />:</td>
                                    <td>{op[1].key_data[1]}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;

                case 7: // account_create
                    let missingAccounts = this.getAccounts([op[1].registrar, op[1].referrer]);

                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="default" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="account.name" />:</td>
                                    <td><Link to="account" params={{name: op[1].name}}>{op[1].name}</Link></td>
                                </tr>                                
                                <tr>
                                    <td><Translate component="span" content="account.member.reg" />:</td>
                                    <td>{!missingAccounts[0] ? <Link to="account" params={{name: accounts[op[1].registrar]}}>{accounts[op[1].registrar]}</Link> : op[1].registrar}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="account.member.ref" />:</td>
                                    <td>{!missingAccounts[1] ? <Link to="account" params={{name: accounts[op[1].referrer]}}>{accounts[op[1].referrer]}</Link> : op[1].referrer}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;

                case 8: // account_update
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="default" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                                <tr>
                                    <td><Translate component="span" content="account.name" />:</td>
                                    <td><Link to="account" params={{name: op[1].name}}>{op[1].name}</Link></td>
                                </tr>                                
                                <tr>
                                    <td><Translate component="span" content="account.member.reg" />:</td>
                                    <td>{accounts[op[1].registrar] ? <Link to="account" params={{name: accounts[op[1].registrar]}}>{accounts[op[1].registrar]}</Link> : op[1].registrar}</td>
                                </tr>
                                <tr>
                                    <td><Translate component="span" content="account.member.ref" />:</td>
                                    <td>{accounts[op[1].referrer] ? <Link to="account" params={{name: accounts[op[1].referrer]}}>{accounts[op[1].referrer]}</Link> : op[1].referrer}</td>
                                </tr>
                        </OperationTable>
                    );
                    break;                    

                case 12: // Asset create
                    info.push(
                        <OperationTable key={opIndex} index={opIndex} color="warning" type={op[0]} fee={op[1].fee} missingFee={missingFee} assets={assets}>
                            <tr>
                                <td><Translate component="span" content="explorer.assets.issuer" />:</td>
                                <td>{accounts[op[1].issuer] ? <Link to="account" params={{name: accounts[op[1].issuer]}}>{accounts[op[1].issuer]}</Link> : op[1].from}</td>
                            </tr>
                            <tr>
                                <td><Translate component="span" content="explorer.assets.symbol" />:</td>
                                <td><Link to="asset" params={{symbol: op[1].symbol}}>{op[1].symbol}</Link></td>
                            </tr>
                            <tr>
                                <td><Translate component="span" content="explorer.assets.precision" />:</td>
                                <td>{op[1].precision}</td>
                            </tr>
                        </OperationTable>                        
                    );
                    break;

                default: 
                    info.push(
                            null
                        );
            }
        });

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <h5><Translate component="span" content="explorer.block.trx" /> #{index + 1}</h5>
                    {info}
                </div>
            </div>
        );
    }
}

Transaction.propTypes = {
    trx: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Transaction;
