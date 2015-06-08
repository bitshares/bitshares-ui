import React from "react";
import {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";

// let trxTypes = {
//     0: "Transfer",
//     6: "Create key",
//     7: "Create account",
//     11: "Create asset"
// };

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
        
        return (
                <tr>
                    {this.props.block ? <td><Link to="block" params={{height: this.props.block}}>#{this.props.block}</Link></td> : null}
                    <td style={style.left_td}><TransactionLabel color={this.props.color} type={this.props.type} /></td>
                    {this.props.children}   
                </tr>
            );
    }
}

class TransactionRow extends React.Component {

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

    render() {
        let {op, accounts, assets, current, block} = this.props;
        
        let line = null;

        switch (op[0]) { // For a list of trx types, see chain_types.coffee

            case 0: // Normal transfer
                let missing = this.getAssets(op[1].amount.asset_id);

                op[1].amount.amount = parseFloat(op[1].amount.amount);
                if (current === accounts[op[1].from]) {
                    line = (
                        <Row block={block} type={op[0]} color="success">
                            <td style={style.right_td}>
                            <Translate component="span" content="transaction.sent" />
                            {missing[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.to" /> {accounts[op[1].to] ? <Link to="account" params={{name: accounts[op[1].to]}}>{accounts[op[1].to]}</Link> : op[1].to}
                            </td>
                        </Row>
                    );
                } else if(current === accounts[op[1].to]){
                    line = (
                        <Row block={block} type={op[0]} color="success">
                            <td style={style.right_td}><Translate component="span" content="transaction.received" /> <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={assets.get(op[1].amount.asset_id)} /> 
                            &nbsp;<Translate component="span" content="transaction.from" /> {accounts[op[1].from] ? <Link to="account" params={{name: accounts[op[1].from]}}>{accounts[op[1].from]}</Link> : op[1].from}
                            </td>
                        </Row>
                    );
                }

                break;

            case 1: // limit_order
                let missing = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);

                line = (
                    <Row block={block} type={op[0]} color="warning">
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.limit_order" />
                            &nbsp;{!missing[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.at" />
                            &nbsp;{!missing[1] ? <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={op[1].min_to_receive.amount / op[1].amount_to_sell.amount}
                                                    asset={assets.get(op[1].min_to_receive.asset_id)}
                                                    base={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                        </td>
                    </Row>
                );
                break;

            case 2: // short_order
                let missing = this.getAssets([op[1].amount_to_sell.asset_id, op[1].collateral.asset_id]);

                line = (
                    <Row block={block} type={op[0]} color="warning">
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.short_order" />
                            &nbsp;{!missing[0] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_sell.amount} asset={assets.get(op[1].amount_to_sell.asset_id)} /> : null}
                            &nbsp;<Translate component="span" content="transaction.coll_of" />
                            &nbsp;{!missing[1] ? <FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral.amount} asset={assets.get(op[1].collateral.asset_id)} /> : null}
                        </td>
                    </Row>
                );
                break;

            case 3: // limit_order_cancel
                let missing = this.getAssets(op[1].fee.asset_id);
                line = (
                    <Row block={block} type={op[0]} color="warning">
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.limit_order_cancel" />
                            &nbsp;{op[1].order}
                        </td>
                    </Row>
                );
                break;

            case 4: // short_order_cancel
                let missing = this.getAssets(op[1].fee.asset_id);

                line = (
                    <Row block={block} type={op[0]} color="warning">
                        <td style={style.right_td}>
                            <Translate component="span" content="transaction.limit_order_cancel" />
                        </td>
                    </Row>
                );
                break;

            case 6: // key_create
                line = (
                    <Row block={block} type={op[0]} color="default">
                        <td style={style.right_td}><Translate component="span" content="transaction.create_key" />
                        </td>
                    </Row>
                );
                break;

            case 7: // account_create
                if (current === accounts[op[1].registrar]) {
                    line = (
                        <Row block={block} type={op[0]} color="default">
                            <td style={style.right_td}><Translate component="span" content="transaction.reg_account" /> <Link to="account" params={{name: op[1].name}}>{op[1].name}</Link></td>
                        </Row>
                    );
                } else {
                    line = (
                        <Row block={block} type={op[0]} color="default">
                            <td style={style.right_td}>{accounts[op[1].registrar] ? <Link to="account" params={{name: accounts[op[1].registrar]}}>{accounts[op[1].registrar]}</Link> : op[1].registrar}
                            &nbsp;<Translate component="span" content="transaction.reg_account" /> <Link to="account" params={{name: op[1].name}}>{op[1].name}</Link></td>
                        </Row>
                    );    
                }
                break;

            case 11: // Asset create
                line = (
                    <Row block={block} type={op[0]} color="warning">
                        <td style={style.right_td}><Translate component="span" content="transaction.create_asset" /> <Link to="asset" params={{symbol: op[1].symbol}}>{op[1].symbol}</Link></td>
                    </Row>
                );
                break;

            default: 
                line = (
                    <tr>
                        <td><Link to="block" params={{height: block}}>#{block}</Link></td>
                        <td>{op[0]}</td>
                    </tr>

                );
        }

        return (
            line ? line : <tr></tr>
        );
    }
}

TransactionRow.defaultProps = {
    op: [],
    current: "",
    accounts: {},
    assets: {},
    block: false
};

TransactionRow.propTypes = {
    op: PropTypes.array.isRequired,
    current: PropTypes.string.isRequired,
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    block: PropTypes.number
};

export default TransactionRow;
