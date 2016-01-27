import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link, PropTypes} from "react-router";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {operations} from "chain/chain_types";
import market_utils from "common/market_utils";
import utils from "common/utils";
import BlockTime from "./BlockTime";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToAssetById from "../Blockchain/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import ChainStore from "api/ChainStore";
import account_constants from "chain/account_constants";
import MemoText from "./MemoText";

require("./operations.scss");

let ops = Object.keys(operations);
let listings = account_constants.account_listing;

class TransactionLabel extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.color !== this.props.color ||
            nextProps.type !== this.props.type
        );
    }
    render() {
        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("label", this.props.color || "info");
        return (
            <span className={labelClass}>
                {trxTypes[ops[this.props.type]]}
            </span>
        );
    }
}

@BindToChainState({keep_updating:true})
class Row extends React.Component {
    static contextTypes = {
        history: PropTypes.history
    }

    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    };

    constructor(props) {
        super(props);
        this.showDetails = this.showDetails.bind(this);
    }

    showDetails(e) {
        e.preventDefault();
        this.context.history.pushState(null, `/block/${this.props.block}`);
    }

    shouldComponentUpdate(nextProps) {
        let {block, dynGlobalObject} = this.props;
        let last_irreversible_block_num = dynGlobalObject.get("last_irreversible_block_num" );
        if (nextProps.dynGlobalObject === this.props.dynGlobalObject) {
            return false;
        }
        return block > last_irreversible_block_num;
    }

    render() {
        let {block, fee, color, type, key, hideDate, hideFee, hideOpLabel} = this.props;

        let last_irreversible_block_num = this.props.dynGlobalObject.get("last_irreversible_block_num" );
        let pending = null;
        if( block > last_irreversible_block_num ) {
           pending = <span>(<Translate content="operation.pending" blocks={block - last_irreversible_block_num} />)</span>
        }

        fee.amount = parseInt(fee.amount, 10);

        return (
                <tr key={key}>
                    {hideOpLabel ? null : (
                        <td className="left-td">
                            <a href onClick={this.showDetails}><TransactionLabel color={color} type={type} /></a>
                        </td>)}
                    <td style={{padding: "8px 5px"}}>
                        <div>
                            <span>{this.props.info}</span>
                        </div>
                        <div style={{fontSize: 14, paddingTop: 5}}>
                            <span>{counterpart.translate("explorer.block.title").toLowerCase()} <Link to={`/block/${block}`}>{utils.format_number(block, 0)}</Link></span>
                            <span> - <BlockTime  block_number={block}/></span>
                            <span className="facolor-fee"> - <FormattedAsset amount={fee.amount} asset={fee.asset_id} /></span>
                            {pending ? <span> - {pending}</span> : null}
                        </div>
                    </td>
                </tr>
            );
    }
}

class Operation extends React.Component {

    static defaultProps = {
        op: [],
        current: "",
        block: false,
        hideDate: false,
        hideFee: false,
        hideOpLabel: false,
        csvExportMode: false
    };

    static propTypes = {
        op: React.PropTypes.array.isRequired,
        current: React.PropTypes.string,
        block: React.PropTypes.number,
        hideDate: React.PropTypes.bool,
        hideFee: React.PropTypes.bool,
        csvExportMode: React.PropTypes.bool
    };

    linkToAccount(name_or_id) {
        if(!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ?
            <LinkToAccountById account={name_or_id}/> :
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>;
    }

    linkToAsset(symbol_or_id) {
        if(!symbol_or_id) return <span>-</span>;
        return utils.is_object_id(symbol_or_id) ?
            <LinkToAssetById asset={symbol_or_id}/> :
            <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>;
    }

    shouldComponentUpdate(nextProps) {
        if (!this.props.op || !nextProps.op) {
            return false;
        }
        return !utils.are_equal_shallow(nextProps.op[1], this.props.op[1]);
    }

    render() {
        let {op, current, block, hideFee} = this.props;
        let line = null, column = null, color = "info";

        switch (ops[op[0]]) { // For a list of trx types, see chain_types.coffee

            case "transfer":

                let memoComponent = null;

                if(op[1].memo) {
                    memoComponent = <MemoText memo={op[1].memo} />
                }

                color = "success";
                op[1].amount.amount = parseFloat(op[1].amount.amount);

                column = (
                    <span key={"transfer_" + this.props.key} className="right-td">
                        <TranslateWithLinks
                            string="operation.transfer"
                            keys={[
                                {type: "account", value: op[1].from, arg: "from"},
                                {type: "amount", value: op[1].amount, arg: "amount", decimalOffset: op[1].amount.asset_id === "1.3.0" ? 5 : null},
                                {type: "account", value: op[1].to, arg: "to"}
                            ]}                                    
                        />
                        {memoComponent}
                    </span>
                );

                break;

            case "limit_order_create":
                color = "warning";
                let o = op[1];
                let isAsk = market_utils.isAskOp(op[1]);

                column = (
                        <span>
                            <TranslateWithLinks
                                string={isAsk ? "operation.limit_order_sell" : "operation.limit_order_buy"}
                                keys={[
                                    {type: "account", value: op[1].seller, arg: "account"},
                                    {type: "amount", value: isAsk ? op[1].amount_to_sell : op[1].min_to_receive, arg: "amount"},
                                    {type: "price", value: {base: isAsk ? op[1].min_to_receive : op[1].amount_to_sell, quote: isAsk ? op[1].amount_to_sell : op[1].min_to_receive}, arg: "price"}
                                ]}                                    
                            />
                        </span>
                );
                break;


            case "limit_order_cancel":
                color = "cancel";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.limit_order_cancel"
                            keys={[
                                {type: "account", value: op[1].fee_paying_account, arg: "account"}
                            ]}
                            params={{
                                order: op[1].order.substring(4)
                            }}                                
                        />
                    </span>
                );
                break;

            case "call_order_update":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.call_order_update"
                            keys={[
                                {type: "account", value: op[1].funding_account, arg: "account"},
                                {type: "asset", value: op[1].delta_debt.asset_id, arg: "debtSymbol"},
                                {type: "amount", value: op[1].delta_debt, arg: "debt"},
                                {type: "amount", value: op[1].delta_collateral, arg: "collateral"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "key_create":
                column = (
                        <span>
                            <Translate component="span" content="transaction.create_key" />
                        </span>
                );
                break;

            case "account_create":
                column = 
                    <TranslateWithLinks
                            string="operation.reg_account"
                            keys={[
                                {type: "account", value: op[1].registrar, arg: "registrar"},
                                {type: "account", value: op[1].name, arg: "new_account"}
                            ]}                                    
                    />
                break;

            case "account_update":
                // if (op[1].new_options.voting_account) {
                //     let proxyAccount = ChainStore.getAccount(op[1].new_options.voting_account);
                //     column = (
                //         <span>
                //             <TranslateWithLinks
                //                 string="operation.set_proxy"
                //                 keys={[
                //                     {type: "account", value: op[1].account, arg: "account"},
                //                     {type: "account", value: op[1].new_options.voting_account, arg: "proxy"}
                //                 ]}                                    
                //             />
                //         </span>
                //     );
                // } else {
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.update_account"
                            keys={[
                                {type: "account", value: op[1].account, arg: "account"}
                            ]}                                    
                        />
                    </span>
                );
                // }
                break;

            case "account_whitelist":

                let label = op[1].new_listing === listings.no_listing ? "unlisted_by" :
                              op[1].new_listing === listings.white_listed ? "whitelisted_by" :
                              "blacklisted_by";
                column = (
                    <span>
                        <TranslateWithLinks
                            string={"operation." + label}
                            keys={[
                                {type: "account", value: op[1].authorizing_account, arg: "lister"},
                                {type: "account", value: op[1].account_to_list, arg: "listee"}
                            ]}                                    
                        />
                    </span>
                )
                break;

            case "account_upgrade":
                   column = (
                       <span>
                            <TranslateWithLinks
                                string={op[1].upgrade_to_lifetime_member ? "operation.lifetime_upgrade_account" : "operation.annual_upgrade_account"} 
                                keys={[
                                    {type: "account", value: op[1].account_to_upgrade, arg: "account"}
                                ]}                                    
                            />
                        </span>
                    );
                break;

            case "account_transfer":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.account_transfer"
                            keys={[
                                {type: "account", value: op[1].account_id, arg: "account"},
                                {type: "account", value: op[1].new_owner, arg: "to"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_create":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_create"
                            keys={[
                                {type: "account", value: op[1].issuer, arg: "account"},
                                {type: "asset", value: op[1].symbol, arg: "asset"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_update"
                            keys={[
                                {type: "account", value: op[1].issuer, arg: "account"},
                                {type: "asset", value: op[1].asset_to_update, arg: "asset"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_update_feed_producers":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_update_feed_producers"
                            keys={[
                                {type: "account", value: op[1].issuer, arg: "account"},
                                {type: "asset", value: op[1].asset_to_update, arg: "asset"}
                            ]}                                    
                        />
                    </span>
                );               
                break;

            case "asset_issue":
                color = "warning";
                op[1].asset_to_issue.amount = parseInt(op[1].asset_to_issue.amount, 10);
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_issue"
                            keys={[
                                {type: "account", value: op[1].issuer, arg: "account"},
                                {type: "amount", value: op[1].asset_to_issue, arg: "amount"},
                                {type: "account", value: op[1].issue_to_account, arg: "to"},
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_fund_fee_pool":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_issue"
                            keys={[
                                {type: "account", value: op[1].from_account, arg: "account"},
                                {type: "asset", value: op[1].asset_id, arg: "asset"},
                                {type: "amount", value: {amount: op[1].amount, asset_id: "1.3.0"}, arg: "amount"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_settle":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_settle"
                            keys={[
                                {type: "account", value: op[1].account, arg: "account"},
                                {type: "amount", value: op[1].amount, arg: "amount"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_global_settle":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_global_settle"
                            keys={[
                                {type: "account", value: op[1].account, arg: "account"},
                                {type: "asset", value: op[1].asset_to_settle, arg: "asset"},
                                {type: "price", value: op[1].price, arg: "price"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "asset_publish_feed":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.publish_feed"
                            keys={[
                                {type: "account", value: op[1].publisher, arg: "account"},
                                {type: "price", value: op[1].feed.settlement_price, arg: "price"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "witness_create":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.witness_create"
                            keys={[
                                {type: "account", value: op[1].witness_account, arg: "account"}
                            ]}                                    
                        />
                    </span>
                );

                break;

            case "witness_update":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.witness_update"
                            keys={[
                                {type: "account", value: op[1].witness_account, arg: "account"}
                            ]}                                    
                        />
                    </span>
                );

                break;

            case "witness_withdraw_pay":
                console.log("witness_withdraw_pay:", op[1].witness_account);
                if (current === op[1].witness_account) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.witness_pay" />
                            &nbsp;<FormattedAsset amount={op[1].amount} asset={"1.3.0"} />
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.received" />
                            &nbsp;<FormattedAsset amount={op[1].amount} asset={"1.3.0"} />
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                }
                break;

            case "proposal_create":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.proposal_create"
                            keys={[
                                {type: "account", value: op[1].fee_paying_account, arg: "account"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "proposal_update":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.proposal_update"
                            keys={[
                                {type: "account", value: op[1].fee_paying_account, arg: "account"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "proposal_delete":
                column = (
                    <span>
                        <Translate component="span" content="transaction.proposal_delete" />
                    </span>
                );
                break;

            case "withdraw_permission_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.withdraw_permission_create" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "withdraw_permission_update":
                column = (
                    <span>
                        <Translate component="span" content="transaction.withdraw_permission_update" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "withdraw_permission_claim":
                column = (
                    <span>
                        <Translate component="span" content="transaction.withdraw_permission_claim" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_to_account)}
                    </span>
                );
                break;

            case "withdraw_permission_delete":
                column = (
                    <span>
                        <Translate component="span" content="transaction.withdraw_permission_delete" />
                        &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "fill_order":
                color = "success";
                o = op[1];

                let receivedAmount = o.fee.asset_id === o.receives.asset_id ? o.receives.amount - o.fee.amount : o.receives.amount;
                hideFee = !(o.fee.amount > 0);
                column = (
                        <span>
                            <TranslateWithLinks
                                string="operation.fill_order"
                                keys={[
                                    {type: "account", value: op[1].account_id, arg: "account"},
                                    {type: "amount", value: {amount: receivedAmount, asset_id: op[1].receives.asset_id}, arg: "received", decimalOffset: op[1].receives.asset_id === "1.3.0" ? 3 : null},
                                    {type: "price", value: {base: o.pays, quote: o.receives}, arg: "price"}
                                ]}                                    
                            />
                        </span>
                );
                break;

            case "global_parameters_update":
                column = (
                    <span>
                        <Translate component="span" content="transaction.global_parameters_update" />
                    </span>
                );
                break;

            case "vesting_balance_create":
                column = (
                    <span>
                        &nbsp;{this.linkToAccount(op[1].creator)}
                        <Translate component="span" content="transaction.vesting_balance_create" />
                        &nbsp;<FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                        &nbsp;{this.linkToAccount(op[1].owner)}
                    </span>
                );
                break;

            case "vesting_balance_withdraw":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.vesting_balance_withdraw"
                            keys={[
                                {type: "account", value: op[1].owner, arg: "account"},
                                {type: "amount", value: op[1].amount, arg: "amount"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "worker_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.create_worker" />
                        &nbsp;<FormattedAsset amount={op[1].daily_pay} asset={"1.3.0"} />
                    </span>
                );
                break;


            case "balance_claim":
                color = "success";
                op[1].total_claimed.amount = parseInt(op[1].total_claimed.amount, 10);
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.balance_claim"
                            keys={[
                                {type: "account", value: op[1].deposit_to_account, arg: "account"},
                                {type: "amount", value: op[1].total_claimed, arg: "amount"}
                            ]}                                    
                        />
                    </span>
                );
                break;

            case "committee_member_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.committee_member_create" />
                        &nbsp;{this.linkToAccount(op[1].committee_member_account)}
                    </span>
                );
                break;

            case "transfer_to_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].from)}
                        &nbsp;<Translate component="span" content="transaction.sent"/>
                        &nbsp;<FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "transfer_from_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].to)}
                        &nbsp;<Translate component="span" content="transaction.received"/>
                        &nbsp;<FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "asset_claim_fees":
                color = "success";
                op[1].amount_to_claim.amount = parseInt(op[1].amount_to_claim.amount, 10);
                column = (
                    <span>
                        {this.linkToAccount(op[1].issuer)}&nbsp;
                        <BindToChainState.Wrapper asset={op[1].amount_to_claim.asset_id}>
                           { ({asset}) =>
                                   <Translate
                                       component="span"
                                       content="transaction.asset_claim_fees"
                                       balance_amount={utils.format_asset(op[1].amount_to_claim.amount, asset)}
                                       asset={asset.get("symbol")}
                                   />
                           }
                       </BindToChainState.Wrapper>
                    </span>
                );
                break;


            case "custom":
                column = (
                    <span>
                        <Translate component="span" content="transaction.custom" />
                    </span>
                );
                break;

            case "asset_reserve":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_reserve"
                            keys={[
                                {type: "account", value: op[1].payer, arg: "account"},
                                {type: "amount", value: op[1].amount_to_reserve, arg: "amount"}
                            ]}                                    
                        />
                    </span>
                )
                break;

            default:
                console.log("unimplemented op:", op);
                column = (
                    <span>
                        <Link to={`/block/${block}`}>#{block}</Link>
                    </span>

                );
        }

        if (this.props.csvExportMode) {
            const globalObject = ChainStore.getObject("2.0.0");
            const dynGlobalObject = ChainStore.getObject("2.1.0");
            const block_time = utils.calc_block_time(block, globalObject, dynGlobalObject)
            return (
                <div key={this.props.key}>
                    <div>{block_time ? block_time.toLocaleString() : ""}</div>
                    <div>{ops[op[0]]}</div>
                    <div>{column}</div>
                    <div><FormattedAsset amount={parseInt(op[1].fee.amount, 10)} asset={op[1].fee.asset_id} /></div>
                </div>
            );
        }

        line = column ? (
            <Row
                key={this.props.key}
                block={block}
                type={op[0]}
                color={color}
                fee={op[1].fee}
                hideDate={this.props.hideDate}
                hideFee={hideFee}
                hideOpLabel={this.props.hideOpLabel}
                info={column}
            >
            </Row>
        ) : null;



        return (
            line ? line : <tr></tr>
        );
    }
}

export default Operation;
