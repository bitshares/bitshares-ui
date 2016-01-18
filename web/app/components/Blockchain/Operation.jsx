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
import Aes from "ecc/aes";
import PublicKey from "ecc/key_public";
import PrivateKeyStore from "stores/PrivateKeyStore";
import WalletDb from "stores/WalletDb";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToAssetById from "../Blockchain/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import ChainStore from "api/ChainStore";
import account_constants from "chain/account_constants";
import Icon from "../Icon/Icon";
import WalletUnlockActions from "actions/WalletUnlockActions";

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
    }

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);
        this.showDetails = this.showDetails.bind(this);
    }

    showDetails(e) {
        e.preventDefault();
        this.context.history.pushState(null, `/block/${this.props.block}`);
    }

    render() {
        let {block, fee, color, type, key, hideDate, hideFee, hideOpLabel} = this.props;

        let last_irreversible_block_num = this.props.dynGlobalObject.get("last_irreversible_block_num" );
        let pending = null;
        if( block > last_irreversible_block_num )
           pending = <span>(<Translate content="operation.pending" blocks={block - last_irreversible_block_num} />)</span>

        fee.amount = parseInt(fee.amount, 10);
        return (
                <tr key={key}>
                    {hideOpLabel ? null : <td className="left-td"><a href onClick={this.showDetails}><TransactionLabel color={color} type={type} /></a></td>}
                    <td>{this.props.info}&nbsp;{pending}&nbsp;{hideFee ? null : <span className="facolor-fee">(<FormattedAsset amount={fee.amount} asset={fee.asset_id} /> fee)</span>}</td>
                    <td className="cursor-pointer" onClick={this.showDetails}><BlockTime block_number={block}/></td>
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
    }

    static propTypes = {
        op: React.PropTypes.array.isRequired,
        current: React.PropTypes.string,
        block: React.PropTypes.number,
        hideDate: React.PropTypes.bool,
        hideFee: React.PropTypes.bool,
        csvExportMode: React.PropTypes.bool
    }

    // shouldComponentUpdate(nextProps) {
    //     return utils.are_equal_shallow(nextProps.op, this.props.op);
    // }

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

    _toggleLock(e) {
        e.preventDefault();
        WalletUnlockActions.unlock().then(() => {
            this.forceUpdate();
        })
    }

    render() {
        let {op, current, block} = this.props;
        let line = null, column = null, color = "info";

        switch (ops[op[0]]) { // For a list of trx types, see chain_types.coffee

            case "transfer":
                let memo_text = null;
                let lockedWallet = false;
                if(op[1].memo) {
                    let memo = op[1].memo;
                    let from_private_key = PrivateKeyStore.getState().keys.get(memo.from)
                    let to_private_key = PrivateKeyStore.getState().keys.get(memo.to)
                    let private_key = from_private_key ? from_private_key : to_private_key;
                    let public_key = from_private_key ? memo.to : memo.from;
                    public_key = PublicKey.fromPublicKeyString(public_key)

                    try {
                        private_key = WalletDb.decryptTcomb_PrivateKey(private_key);
                    }
                    catch(e) {
                        lockedWallet = true;
                        private_key = null;
                    }
                    try {
                        memo_text = private_key ? Aes.decrypt_with_checksum(
                            private_key,
                            public_key,
                            memo.nonce,
                            memo.message
                        ).toString() : null;
                    } catch(e) {
                        console.log("transfer memo exception ...", e);
                        memo_text = "*";
                    }
                }

                color = "success";
                op[1].amount.amount = parseFloat(op[1].amount.amount);
                let full_memo = memo_text;
                if (memo_text && memo_text.length > 35) {

                    memo_text = memo_text.substr(0, 35) + "...";
                }

                let memoComponent = op[1].memo && lockedWallet ? (
                    <div className="memo">
                        <Translate content="transfer.memo_unlock" />&nbsp;
                        <a href onClick={this._toggleLock.bind(this)}>
                            <Icon name="locked"/>
                        </a>
                    </div>) : memo_text ? (
                        <div className="memo">
                            <span data-tip={full_memo} data-place="bottom" data-offset="{'bottom': 10}" data-type="light" data-html>
                                {memo_text}
                            </span>
                        </div>
                    ) : null;

                column = (
                    <span key={"transfer_" + this.props.key} className="right-td">
                        {this.linkToAccount(op[1].from)}
                        &nbsp;<Translate component="span" content="transaction.sent"/>
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id}/>
                        &nbsp;<Translate component="span" content="transaction.to"/> {this.linkToAccount(op[1].to)}
                        {memoComponent}
                    </span>
                );

                break;

            case "limit_order_create":
                color = "warning";
                let o = op[1];
                let isAsk = market_utils.isAskOp(op[1]);
                // if (!inverted) {
                //     isAsk = !isAsk;
                // }
                column = (
                        <span>
                        <BindToChainState.Wrapper asset_sell={op[1].amount_to_sell.asset_id} asset_min={op[1].min_to_receive.asset_id}>
                            { ({asset_sell, asset_min}) =>
                                isAsk ?
                                    <span>
                                        {this.linkToAccount(op[1].seller)}&nbsp;
                                        <Translate
                                            component="span"
                                            content="transaction.limit_order_sell"
                                            sell_amount={utils.format_asset(op[1].amount_to_sell.amount, asset_sell, false, false)}
                                            num={this.props.result[1].substring(4)}
                                            />
                                        <FormattedPrice quote_asset={o.amount_to_sell.asset_id} base_asset={o.min_to_receive.asset_id} quote_amount={o.amount_to_sell.amount} base_amount={o.min_to_receive.amount} />
                                    </span>
                                    :
                                    <span>
                                        {this.linkToAccount(op[1].seller)}&nbsp;
                                        <Translate
                                            component="span"
                                            content="transaction.limit_order_buy"
                                            buy_amount={utils.format_asset(op[1].min_to_receive.amount, asset_min, false, false)}
                                            num={this.props.result[1].substring(4)}
                                            />
                                        <FormattedPrice base_asset={o.amount_to_sell.asset_id} quote_asset={o.min_to_receive.asset_id} base_amount={o.amount_to_sell.amount} quote_amount={o.min_to_receive.amount} />
                                    </span>
                            }
                        </BindToChainState.Wrapper>
                        </span>
                );
                break;


            case "limit_order_cancel":
                color = "cancel";
                column = (
                    <span>
                        {this.linkToAccount(op[1].fee_paying_account)}&nbsp;
                        <Translate component="span" content="transaction.limit_order_cancel" />
                        &nbsp;#{op[1].order.substring(4)}
                    </span>
                );
                break;

            case "short_order_cancel":
                color = "cancel";
                column = (
                    <span>
                        <Translate component="span" content="transaction.short_order_cancel" />
                        &nbsp;{op[1].order}
                    </span>
                );
                break;

            case "call_order_update":
                color = "warning";
                column = (
                    <span>
                        {this.linkToAccount(op[1].funding_account)}&nbsp;
                        <Translate component="span" content="transaction.call_order_update" />
                        &nbsp;{this.linkToAsset(op[1].delta_debt.asset_id)}
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
                if (current === op[1].registrar) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.reg_account" />
                            &nbsp;{this.linkToAccount(op[1].name)}
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            {this.linkToAccount(op[1].name)}
                            &nbsp;<Translate component="span" content="transaction.was_reg_account" />
                            &nbsp;{this.linkToAccount(op[1].registrar)}
                        </span>
                    );
                }
                break;

            case "account_update":
                if (op[1].new_options.voting_account) {
                    let proxyAccount = ChainStore.getAccount(op[1].new_options.voting_account);
                    column = (
                        <span>
                            {this.linkToAccount(op[1].account)}&nbsp;
                            <Translate component="span" content="transaction.set_proxy" proxy={proxyAccount ? proxyAccount.get("name") : ""} />
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            {this.linkToAccount(op[1].account)}&nbsp;
                            <Translate component="span" content="transaction.update_account" />
                        </span>
                    );
                }
                break;

            case "account_whitelist":

                let label = op[1].new_listing === listings.no_listing ? "unlisted_by" :
                              op[1].new_listing === listings.white_listed ? "whitelisted_by" :
                              "blacklisted_by";
                column = (
                    <span>
                        <BindToChainState.Wrapper lister={op[1].authorizing_account} listee={op[1].account_to_list}>
                            { ({lister, listee}) =>
                                <Translate
                                    component="span"
                                    content={"transaction." + label}
                                    lister={lister.get("name")}
                                    listee={listee.get("name")}
                                />

                            }
                        </BindToChainState.Wrapper>
                    </span>
                )
                // if (current === op[1].authorizing_account) {
                //     column = (
                //         <span>
                //             <Translate component="span" content="transaction.whitelist_account" />
                //             &nbsp;{this.linkToAccount(op[1].account_to_list)}
                //         </span>
                //     );
                // } else {
                //     column = (
                //         <span>
                //             <Translate component="span" content="transaction.whitelisted_by" />
                //             &nbsp;{this.linkToAccount(op[1].authorizing_account)}
                //         </span>
                //     );
                // }
                break;

            case "account_upgrade":
                if( op[1].upgrade_to_lifetime_member ) {
                   column = (
                       <span>
                       {this.linkToAccount(op[1].account_to_upgrade) } &nbsp;
                           <Translate component="span" content="transaction.lifetime_upgrade_account" />
                       </span>
                   );
                } else {
                   column = (
                       <span>
                       {this.linkToAccount(op[1].account_to_upgrade) } &nbsp;
                           <Translate component="span" content="transaction.annual_upgrade_account" />
                       </span>
                   );

                }
                break;

            case "account_transfer":
                column = (
                    <span>
                        <Translate component="span" content="transaction.transfer_account" />
                        &nbsp;{this.linkToAccount(op[1].account_id)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].new_owner)}
                    </span>
                );
                break;

            case "asset_create":
                color = "warning";
                column = (
                    <span>
                        {this.linkToAccount(op[1].issuer)}&nbsp;
                        <Translate component="span" content="transaction.create_asset" />
                        &nbsp;{this.linkToAsset(op[1].symbol)}
                    </span>
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                color = "warning";
                column = (
                    <span>
                        <Translate component="span" content="transaction.update_asset" />
                        &nbsp;{this.linkToAsset(op[1].asset_to_update)}
                    </span>
                );
                break;

            case "asset_update_feed_producers":
                color = "warning";

                if (current === op[1].issuer) {
                    column = (
                        <span>
                            {this.linkToAccount(op[1].issuer)}&nbsp;
                            <Translate component="span" content="transaction.update_feed_producers" />
                            &nbsp;{this.linkToAsset(op[1].asset_to_update)}
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            {this.linkToAccount(op[1].issuer)}&nbsp;
                            <Translate component="span" content="transaction.feed_producer" />
                            &nbsp;{this.linkToAsset(op[1].asset_to_update)}
                        </span>
                    );
                }
                break;

            case "asset_issue":
                color = "warning";
                op[1].asset_to_issue.amount = parseInt(op[1].asset_to_issue.amount, 10);
                column = (
                    <span>
                        {this.linkToAccount(op[1].issuer)}
                        &nbsp;<Translate component="span" content="transaction.asset_issue" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={op[1].asset_to_issue.asset_id} />
                        &nbsp;<Translate component="span" content="transaction.to" />
                        &nbsp;{this.linkToAccount(op[1].issue_to_account)}
                    </span>
                );
                break;

            case "asset_burn":
                color = "cancel";
                column = (
                    <span>
                        <Translate component="span" content="transaction.burn_asset" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_to_burn.amount} asset={op[1].amount_to_burn.asset_id} />
                    </span>
                );
                break;

            case "asset_fund_fee_pool":
                color = "warning";
                let asset = ChainStore.getAsset( op[1].asset_id );
                if( asset ) asset = asset.get( "symbol" );
                else asset = op[1].asset_id;
                column = (
                    <span>
                        {this.linkToAccount(op[1].from_account)} &nbsp;
                        <Translate component="span" content="transaction.fund_pool"  asset={asset} />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset="1.3.0" />
                    </span>
                );
                break;

            case "asset_settle":
                color = "warning";
                column = (
                    <span>
                        <Translate component="span" content="transaction.asset_settle" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "asset_global_settle":
                color = "warning";
                column = (
                    <span>
                        <Translate component="span" content="transaction.asset_global_settle" />
                        &nbsp;{this.linkToAsset(op[1].asset_to_settle)}
                        &nbsp;<Translate component="span" content="transaction.at" />
                        &nbsp;<FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={op[1].price.quote.amount}
                                quote_asset={op[1].price.quote.asset_id}
                                base_asset={op[1].price.base.asset_id}
                                base_amount={op[1].price.base.amount}
                            />
                    </span>
                );
                break;

            case "asset_publish_feed":
                color = "warning";
                column = (
                    <span>
                        {this.linkToAccount(op[1].publisher)}&nbsp;
                        <Translate component="span" content="transaction.publish_feed" />
                        &nbsp;<FormattedPrice
                            base_asset={op[1].feed.settlement_price.base.asset_id}
                            quote_asset={op[1].feed.settlement_price.quote.asset_id}
                            base_amount={op[1].feed.settlement_price.base.amount}
                            quote_amount={op[1].feed.settlement_price.quote.amount}
                        />
                    </span>
                );
                break;

            case "witness_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.witness_create" />
                        &nbsp;{this.linkToAccount(op[1].witness_account)}
                    </span>
                );

                break;

            case "witness_update":
                column = (
                    <span>
                        <Translate component="span" content="transaction.witness_update" />
                        &nbsp;{this.linkToAccount(op[1].witness_account)}
                    </span>
                );

                break;

            case "witness_withdraw_pay":
                console.log("witness_withdraw_pay:", op[1].witness_account);
                if (current === op[1].witness_account) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.witness_pay" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={"1.3.0"} />
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.received" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount} asset={"1.3.0"} />
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                }
                break;

            case "proposal_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.proposal_create" />
                    </span>
                );
                break;

            case "proposal_update":
                column = (
                    <span>
                        <Translate component="span" content="transaction.proposal_update" />
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
                column = (
                        <span>
                            {this.linkToAccount(op[1].account_id)}&nbsp;
                            <Translate component="span" content="transaction.paid" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].pays.amount} asset={op[1].pays.asset_id} />
                            &nbsp;<Translate component="span" content="transaction.obtain" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].receives.amount} asset={op[1].receives.asset_id} />
                            &nbsp;<Translate component="span" content="transaction.at" />
                            &nbsp;<FormattedPrice base_asset={o.pays.asset_id} base_amount={o.pays.amount}
                                                  quote_asset={o.receives.asset_id} quote_amount={o.receives.amount}  />
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

            case "file_write":
                column = (
                    <span>
                        <Translate component="span" content="transaction.file_write" />
                    </span>
                );
                break;

            case "vesting_balance_create":
                column = (
                    <span>
                        &nbsp;{this.linkToAccount(op[1].creator)}
                        <Translate component="span" content="transaction.vesting_balance_create" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                        &nbsp;{this.linkToAccount(op[1].owner)}
                    </span>
                );
                break;

            case "vesting_balance_withdraw":
                column = (
                    <span>
                        {this.linkToAccount(op[1].owner)}&nbsp;
                        <Translate component="span" content="transaction.vesting_balance_withdraw" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "bond_create_offer":
                column = (
                    <span>
                        <Translate component="span" content="transaction.bond_create_offer" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "bond_cancel_offer":
                column = (
                    <span>
                        <Translate component="span" content="transaction.bond_cancel_offer" />
                        &nbsp;{op[1].offer_id}
                    </span>
                );
                break;

            case "bond_accept_offer":
                if (current === op[1].lender) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={op[1].amount_borrowed.asset_id} />
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].borrower)}
                        </span>
                    );
                } else if (current === op[1].borrower) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.bond_accept_offer" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount_borrowed.amount} asset={op[1].amount_borrowed.asset_id} />
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].lender)}
                        </span>
                    );
                }
                break;

            case "bond_claim_collateral":
                if (current === op[1].lender) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.bond_pay_collateral" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={op[1].collateral_claimed.asset_id} />
                            <Translate component="span" content="transaction.to" />
                            &nbsp;{this.linkToAccount(op[1].claimer)}
                        </span>
                    );
                } else if (current === op[1].claimer) {
                    column = (
                        <span>
                            <Translate component="span" content="transaction.bond_claim_collateral" />
                            &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].collateral_claimed.amount} asset={op[1].collateral_claimed.asset_id} />
                            <Translate component="span" content="transaction.from" />
                            &nbsp;{this.linkToAccount(op[1].lender)}
                        </span>
                    );
                }
                break;

            case "worker_create":
                column = (
                    <span>
                        <Translate component="span" content="transaction.create_worker" />
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].daily_pay} asset={"1.3.0"} />
                    </span>
                );
                break;


            case "balance_claim":
                color = "success";
                op[1].total_claimed.amount = parseInt(op[1].total_claimed.amount, 10);
                column = (
                    <span>
                        {this.linkToAccount(op[1].deposit_to_account)}&nbsp;
                        <BindToChainState.Wrapper asset={op[1].total_claimed.asset_id}>
                           { ({asset}) =>
                                   <Translate
                                       component="span"
                                       content="transaction.balance_claim"
                                       balance_amount={utils.format_asset(op[1].total_claimed.amount, asset)}
                                       balance_id={op[1].balance_to_claim.substring(5)}
                                   />
                           }
                       </BindToChainState.Wrapper>
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
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
                    </span>
                );
                break;

            case "transfer_from_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].to)}
                        &nbsp;<Translate component="span" content="transaction.received"/>
                        &nbsp;<FormattedAsset style={{fontWeight: "bold"}} amount={op[1].amount.amount} asset={op[1].amount.asset_id} />
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
                        {this.linkToAccount(op[1].payer)}&nbsp;<Translate content="transaction.asset_reserve" />:&nbsp;<FormattedAsset amount={op[1].amount_to_reserve.amount} asset={op[1].amount_to_reserve.asset_id} />
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
                hideFee={this.props.hideFee}
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
