import React from "react";
import {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link as RealLink} from "react-router";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import classNames from "classnames";
import {FormattedDate} from "react-intl";
import {operations} from "chain/chain_types";
import Inspector from "react-json-inspector";
import utils from "common/utils";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToAssetById from "../Blockchain/LinkToAssetById";
import FormattedPrice from "../Utility/FormattedPrice";
import account_constants from "chain/account_constants";
import Icon from "../Icon/Icon";
import WalletUnlockActions from "actions/WalletUnlockActions";
import ProposedOperation from "./ProposedOperation";

require("./operations.scss");
require("./json-inspector.scss");

let ops = Object.keys(operations);
let listings = Object.keys(account_constants.account_listing);

class OpType extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.type !== this.props.type
        );
    }

    render() {
        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("txtlabel", this.props.color || "info");
        return (
            <tr>
                <td>
                    <span className={labelClass}>
                        {trxTypes[ops[this.props.type]]}
                    </span>
                </td>
                <td>
                </td>
            </tr>
        );
    }
}

class NoLinkDecorator extends React.Component {
    render() {
        return <span>{this.props.children}</span>;
    }
}

class OperationTable extends React.Component {

    render() {

       let fee_row = this.props.fee.amount > 0 ? (
            <tr>
                <td><Translate component="span" content="transfer.fee" /></td>
                <td><FormattedAsset color="fee" amount={this.props.fee.amount} asset={this.props.fee.asset_id} /></td>
            </tr> ) : null;

        return (
            <div >
            {/*  <h6><Translate component="span" content="explorer.block.op" /> #{this.props.index + 1}/{this.props.opCount}</h6> */}
                <table style={{marginBottom: "1em"}} className="table op-table">
                    <caption></caption>
                    <tbody>
                        <OpType type={this.props.type} color={this.props.color}/>
                        {this.props.children}
                        {fee_row}
                    </tbody>
                </table>
            </div>
            );
    }
}

class Transaction extends React.Component {

    linkToAccount(name_or_id) {
        if(!name_or_id) return <span>-</span>;
        let Link = this.props.no_links ? NoLinkDecorator : RealLink;
        return utils.is_object_id(name_or_id) ?
            <LinkToAccountById account={name_or_id}/> :
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>;
    }

    linkToAsset(symbol_or_id) {
        if(!symbol_or_id) return <span>-</span>;
        let Link = this.props.no_links ? NoLinkDecorator : RealLink;
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
        let {trx} = this.props;
        let info = null;
        info = [];

        let opCount = trx.operations.length;

        trx.operations.forEach((op, opIndex) => {

            let rows = [];
            let color = "";
            switch (ops[op[0]]) { // For a list of trx types, see chain_types.coffee

                case "transfer":

                    color = "success";

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

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.from" /></td>
                            <td>{this.linkToAccount(op[1].from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.to" /></td>
                            <td>{this.linkToAccount(op[1].to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} /></td>
                        </tr>
                    );

                    {memo_text ?
                        rows.push(
                            <tr>
                                <td><Translate content="transfer.memo" /></td>
                                <td>{memo_text}</td>
                            </tr>
                    ) : null}

                    {op[1].memo && lockedWallet ?
                        rows.push(
                            <tr>
                                <td><Translate content="transfer.memo" /></td>
                                <td>
                                    <Translate content="transfer.memo_unlock" />&nbsp;
                                    <a href onClick={this._toggleLock.bind(this)}>
                                        <Icon name="locked"/>
                                    </a>
                                </td>
                            </tr>
                    ) : null}

                    break;

                case "limit_order_create":
                    color = "warning";
                    // missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);
                    // let price = (!missingAssets[0] && !missingAssets[1]) ? utils.format_price(op[1].amount_to_sell.amount, assets.get(op[1].amount_to_sell.asset_id), op[1].min_to_receive.amount, assets.get(op[1].min_to_receive.asset_id), false, inverted) : null;
                    rows.push(
                        <tr key="1">
                            <td><Translate component="span" content="exchange.sell" /></td>
                            <td><FormattedAsset amount={op[1].amount_to_sell.amount} asset={op[1].amount_to_sell.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key="2">
                            <td><Translate component="span" content="exchange.buy" /></td>
                            <td><FormattedAsset amount={op[1].min_to_receive.amount} asset={op[1].min_to_receive.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key="3">
                            <td><Translate component="span" content="exchange.price" /></td>
                            <td>
                                <FormattedPrice
                                    base_asset={op[1].amount_to_sell.asset_id}
                                    quote_asset={op[1].min_to_receive.asset_id}
                                    base_amount={op[1].amount_to_sell.amount}
                                    quote_amount={op[1].min_to_receive.amount} />
                            </td>
                        </tr>
                    );
                    // rows.push(
                    //     <tr key="2">
                    //         <td><Translate component="span" content="transaction.min_receive" /></td>
                    //         <td>{!missingAssets[1] ? <FormattedAsset amount={op[1].min_to_receive.amount} asset={op[1].min_to_receive.asset_id} /> : null}</td>
                    //     </tr>
                    // );
                    rows.push(
                        <tr key="4">
                            <td><Translate component="span" content="transaction.seller" /></td>
                            <td>{this.linkToAccount(op[1].seller)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key="5">
                            <td><Translate component="span" content="transaction.expiration" /></td>
                            <td>
                                <FormattedDate
                                    value={op[1].expiration}
                                    format="full"
                                />
                            </td>
                        </tr>
                    );

                    break;

                case "limit_order_cancel":
                    color = "cancel";
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.order_id" /></td>
                            <td>{op[1].order}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.fee_payer" /></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );

                    break;

                case "short_order_cancel":
                    color = "cancel";
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.order_id" /></td>
                            <td>{op[1].order}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.fee_payer" /></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );

                    break;

                case "call_order_update":
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.funding_account" /></td>
                            <td>{this.linkToAccount(op[1].funding_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.delta_collateral" /></td>
                            <td><FormattedAsset amount={op[1].delta_collateral.amount} asset={op[1].delta_collateral.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.delta_debt" /></td>
                            <td><FormattedAsset amount={op[1].delta_debt.amount} asset={op[1].delta_debt.asset_id} /></td>
                        </tr>
                    );
                    break;

                case "key_create":
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.fee_payer" /></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.key" /></td>
                            <td>{op[1].key_data[1]}</td>
                        </tr>
                    );

                    break;

                case "account_create":
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.name" /></td>
                            <td>{this.linkToAccount(op[1].name)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.member.registrar" /></td>
                            <td>{this.linkToAccount(op[1].registrar)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.member.lifetime_referrer" /></td>
                            <td>{this.linkToAccount(op[1].referrer)}</td>
                        </tr>
                    );

                    break;

                case "account_update":
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.name" /></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );
                    // let voting_account = ChainStore.getAccount(op[1].new_options.voting_account)
                    // let updating_account = ChainStore.getAccount(op[1].account)
                    if( op[1].new_options.voting_account )
                    {
                       // let proxy_account_name = voting_account.get('name')
                       rows.push(
                                   <tr>
                                       <td><Translate component="span" content="account.votes.proxy" /></td>
                                       <td>{this.linkToAccount(op[1].new_options.voting_account)}</td>
                                   </tr>
                       );
                    }
                    else
                    {
                       console.log( "num witnesses: ", op[1].new_options.num_witness )
                       console.log( "===============> NEW: ", op[1].new_options )
                       rows.push(
                                   <tr>
                                       <td><Translate component="span" content="account.votes.proxy" /></td>
                                       <td><Translate component="span" content="account.votes.no_proxy" /></td>
                                   </tr>
                       );
                       rows.push(
                                   <tr>
                                       <td><Translate component="span" content="account.options.num_committee" /></td>
                                       <td>{op[1].new_options.num_committee}</td>
                                   </tr>
                       );
                       rows.push(
                                   <tr>
                                       <td><Translate component="span" content="account.options.num_witnesses" /></td>
                                       <td>{op[1].new_options.num_witness}</td>
                                   </tr>
                       );
                       rows.push(
                                   <tr>
                                       <td><Translate component="span" content="account.options.votes" /></td>
                                       <td>{JSON.stringify( op[1].new_options.votes) }</td>
                                   </tr>
                       );
                    }
                    rows.push(
                                <tr>
                                    <td><Translate component="span" content="account.options.memo_key" /></td>
                                   {/* TODO replace with KEY render component that provides a popup */}
                                    <td>{op[1].new_options.memo_key.substring(0,10)+"..."}</td>
                                </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.common_options" /></td>
                            <td><Inspector data={ op[1] } search={false} /></td>
                        </tr>
                    );

                    break;

                case "account_whitelist":
                    let listing;
                    for (var i = 0; i < listings.length; i++) {
                        if (account_constants.account_listing[listings[i]] === op[1].new_listing) {
                            console.log("listings:", listings[i]);
                            listing = listings[i];
                        }
                    };

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.authorizing_account" /></td>
                            <td>{this.linkToAccount(op[1].authorizing_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.listed_account" /></td>
                            <td>{this.linkToAccount(op[1].account_to_list)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.new_listing" /></td>
                            <td><Translate content={`transaction.whitelist_states.${listing}`} /></td>
                        </tr>
                    );

                    break;

                case "account_upgrade":
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.account_upgrade" /></td>
                            <td>{this.linkToAccount(op[1].account_to_upgrade)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.lifetime" /></td>
                            <td>{op[1].upgrade_to_lifetime_member.toString()}</td>
                        </tr>
                    );
                    break;

                case "account_transfer":
                    /* This case is uncomplete, needs filling out with proper fields */
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.from" /></td>
                            <td>{this.linkToAccount(op[1].account_id)}</td>
                        </tr>
                    );

                    break;

                case "asset_create":
                    color = "warning";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.assets.issuer" /></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.assets.symbol" /></td>
                            <td>{this.linkToAsset(op[1].symbol)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.assets.precision" /></td>
                            <td>{op[1].precision}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.user_issued_assets.max_supply" /></td>
                            <td>{utils.format_asset(op[1].common_options.max_supply, op[1])}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="account.user_issued_assets.description" /></td>
                            <td>{op[1].common_options.description}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.market_fee" /></td>
                            <td>{op[1].common_options.market_fee_percent / 100}%</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.max_market_fee" /></td>
                            <td>{utils.format_asset(op[1].common_options.max_market_fee, op[1])}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.common_options" /></td>
                            <td><Inspector data={ op[1].common_options } search={false} /></td>
                        </tr>
                    );

                    break;

                case "asset_update":
                case "asset_update_bitasset":
                    color = "warning";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.asset_update" /></td>
                            <td>{this.linkToAsset(op[1].asset_to_update)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.assets.issuer" /></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );
                    if (op[1].new_issuer !== op[1].issuer) {
                        rows.push(
                            <tr>
                                <td><Translate component="span" content="account.user_issued_assets.new_issuer" /></td>
                                <td>{this.linkToAccount(op[1].new_issuer)}</td>
                            </tr>
                        );
                        }
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="markets.core_rate" /></td>
                            <td>
                                <FormattedPrice
                                    base_asset={op[1].new_options.core_exchange_rate.base.asset_id}
                                    quote_asset={op[1].new_options.core_exchange_rate.quote.asset_id}
                                    base_amount={op[1].new_options.core_exchange_rate.base.amount}
                                    quote_amount={op[1].new_options.core_exchange_rate.quote.amount}
                                />
                            </td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.new_options" /></td>
                            <td><Inspector data={ op[1].new_options } search={false}/></td>
                        </tr>
                    );

                    break;

                case "asset_update_feed_producers":
                    color = "warning";
                    console.log("op:", op);
                    let producers = [];
                    op[1].new_feed_producers.forEach(producer => {
                        // let missingAsset = this.getAccounts([producer])[0];
                        producers.push(<div>{this.linkToAccount(producer)}<br/></div>);
                    });

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.asset_update" /></td>
                            <td>{this.linkToAsset(op[1].asset_to_update)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.new_producers" /></td>
                            <td>{producers}</td>
                        </tr>
                    );

                    break;

                case "asset_issue":
                    color = "warning";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.assets.issuer" /></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.asset_issue" /></td>
                            <td><FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount} asset={op[1].asset_to_issue.asset_id} /></td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.to" /></td>
                            <td>{this.linkToAccount(op[1].issue_to_account)}</td>
                        </tr>
                    );

                    break;

                case "asset_burn":
                    color = "cancel";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.account.title" /></td>
                            <td>{this.linkToAccount(op[1].payer)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount_to_burn.amount} asset={op[1].amount_to_burn.asset_id} /></td>
                        </tr>
                    );

                    break;

                case "asset_fund_fee_pool":
                    color = "warning";
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.account.title" /></td>
                            <td>{this.linkToAccount(op[1].from_account)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.asset.title" /></td>
                            <td>{this.linkToAsset(op[1].asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount} asset="1.3.0" /></td>
                        </tr>
                    );

                    break;

                case "asset_settle":
                    color = "warning";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.account.title" /></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.asset.title" /></td>
                            <td>{this.linkToAsset(op[1].amount.asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} /></td>
                        </tr>
                    );

                    break;

                case "asset_publish_feed":
                    color = "warning";
                    let {feed} = op[1];

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.publisher" /></td>
                            <td>{this.linkToAccount(op[1].publisher)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.asset.title" /></td>
                            <td>{this.linkToAsset(op[1].asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.asset.price_feed.maximum_short_squeeze_ratio" /></td>
                            <td>{(feed.maximum_short_squeeze_ratio / 1000).toFixed(2)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.asset.price_feed.maintenance_collateral_ratio" /></td>
                            <td>{(feed.maintenance_collateral_ratio / 1000).toFixed(2)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="markets.core_rate" /></td>
                            <td>
                                <FormattedPrice
                                    base_asset={feed.core_exchange_rate.base.asset_id}
                                    quote_asset={feed.core_exchange_rate.quote.asset_id}
                                    base_amount={feed.core_exchange_rate.base.amount}
                                    quote_amount={feed.core_exchange_rate.quote.amount}
                                />
                            </td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.settlement_price" /></td>
                            <td>
                                <FormattedPrice
                                    base_asset={feed.settlement_price.base.asset_id}
                                    quote_asset={feed.settlement_price.quote.asset_id}
                                    base_amount={feed.settlement_price.base.amount}
                                    quote_amount={feed.settlement_price.quote.amount}
                                />
                            </td>
                        </tr>
                    );

                    break;

                case "committee_member_create":

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.committee_member.title" /></td>
                            <td>{this.linkToAccount(op[1].committee_member_account)}</td>
                        </tr>
                    );

                    break;

                case "witness_create":

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.witness" /></td>
                            <td>{this.linkToAccount(op[1].witness_account)}</td>
                        </tr>
                    );

                    break;

                case "witness_update":

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="explorer.block.witness" /></td>
                            <td>{this.linkToAccount(op[1].witness_account)}</td>
                        </tr>
                    );

                    if (op[1].new_url) {
                        rows.push(
                            <tr>
                                <td><Translate component="span" content="transaction.new_url" /></td>
                                <td><a href={op[1].new_url} target="_blank">{op[1].new_url}</a></td>
                            </tr>
                        );
                    }

                    break;

                case "balance_claim":
                    color = "success";

                    let bal_id = op[1].balance_to_claim.substring(5);
                    // console.log( "bal_id: ", bal_id, op[1].balance_to_claim );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.claimed" /></td>
                            <td><FormattedAsset amount={op[1].total_claimed.amount} asset={op[1].total_claimed.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.deposit_to" /></td>
                            <td>{this.linkToAccount(op[1].deposit_to_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.balance_id" /></td>
                            <td>#{bal_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.balance_owner" /></td>
                            <td style={{fontSize: "80%"}}>{op[1].balance_owner_key.substring(0,10)}...</td>
                        </tr>
                    );
                    break;

                case "vesting_balance_withdraw":
                    color = "success";

                    rows.push(
                        <tr key="1">
                            <td><Translate component="span" content="transfer.to" /></td>
                            <td>{this.linkToAccount(op[1].owner)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key="2">
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} /></td>
                        </tr>
                    );

                    break;

                case "transfer_to_blind":
                    rows.push(
                        <tr  key="1">
                            <td><Translate component="span" content="transfer.from" /></td>
                            <td>{this.linkToAccount(op[1].from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr  key="2">
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key="3">
                            <td><Translate component="span" content="transaction.blinding_factor" /></td>
                            <td style={{fontSize: "80%"}}>{op[1].blinding_factor}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key="4">
                            <td><Translate component="span" content="transaction.outputs" /></td>
                            <td><Inspector data={ op[1].outputs[0] } search={false} /></td>
                        </tr>
                    );
                    break;

                case "transfer_from_blind":
                    rows.push(
                        <tr  key="1">
                            <td><Translate component="span" content="transfer.to" /></td>
                            <td>{this.linkToAccount(op[1].to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr  key="2">
                            <td><Translate component="span" content="transfer.amount" /></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key="3">
                            <td><Translate component="span" content="transaction.blinding_factor" /></td>
                            <td style={{fontSize: "80%"}}>{op[1].blinding_factor}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key="4">
                            <td><Translate component="span" content="transaction.inputs" /></td>
                            <td><Inspector data={ op[1].inputs[0] } search={false} /></td>
                        </tr>
                    );
                    break;

                case "blind_transfer":
                    rows.push(
                        <tr key="1">
                            <td><Translate component="span" content="transaction.inputs" /></td>
                            <td><Inspector data={ op[1].inputs[0] } search={false} /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key="2">
                            <td><Translate component="span" content="transaction.outputs" /></td>
                            <td><Inspector data={ op[1].outputs[0]} search={false} /></td>
                        </tr>
                    );
                    break;

                case "proposal_create":
                    var key = 1;
                    console.log("op:", op);
                    var expiration_date = new Date(op[1].expiration_time+'Z')
                    var has_review_period = op[1].review_period_seconds !== undefined
                    var review_begin_time = ! has_review_period ? null :
                        expiration_date.getTime() - op[1].review_period_seconds * 1000
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.review_period" /></td>
                            <td>
                                { has_review_period ?
                                <FormattedDate
                                    value={new Date( review_begin_time )}
                                    format="full"
                                />
                                :<span>&mdash;</span>}
                            </td>
                        </tr>
                    )
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.expiration_time" /></td>
                            <td><FormattedDate
                                    value={expiration_date}
                                    format="full"
                                />
                            </td>
                        </tr>
                    )
                    var operations = [];
                    for(let pop of op[1].proposed_ops) operations.push( pop.op )

                    let proposalsText = op[1].proposed_ops.map( (o, index) => {
                        return (
                            <ProposedOperation
                                key={index}
                                index={index}
                                op={o.op}
                                inverted={false}
                                hideFee={true}
                                hideOpLabel={true}
                                hideDate={true}
                                proposal={true}
                            />
                        );
                    });

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.proposed_operations" /></td>
                            <td>{proposalsText}</td>
                        </tr>
                    )
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.fee_paying_account" /></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    )
                    break
                
                case "proposal_update":
                    let fields = [
                        "active_approvals_to_add", "active_approvals_to_remove",
                        "owner_approvals_to_add", "owner_approvals_to_remove",
                        "key_approvals_to_add", "key_approvals_to_remove"
                    ];

                    let key = 1;

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.fee_paying_account" /></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    )

                    fields.forEach((field) => {
                        if (op[1][field].length) {
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate content={`proposal.update.${field}`} /></td>
                                    <td>{op[1][field].map(value => {return <div>{this.linkToAccount(value)}</div>})}</td>
                                </tr>
                            )
                        }
                    })

                    break;

                // proposal_delete

                case "asset_claim_fees":
                    color = "success";

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.claimed" /></td>
                            <td><FormattedAsset amount={op[1].amount_to_claim.amount} asset={op[1].amount_to_claim.asset_id} /></td>
                        </tr>
                    );

                    rows.push(
                        <tr>
                            <td><Translate component="span" content="transaction.deposit_to" /></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );
                    
                    break;

                default:
                    console.log("unimplemented op:", op);
                    rows.push(
                        <tr >
                            <td><Translate component="span" content="explorer.block.op" /></td>
                            <td><Inspector data={ op } search={false} /></td>
                        </tr>
                    );
                    break;
            }

            info.push(
                <OperationTable key={opIndex} opCount={opCount} index={opIndex} color={color} type={op[0]} fee={op[1].fee}>
                    {rows}
                </OperationTable>
            );
        });

        return (
            <div>
            {/*     <h5><Translate component="span" content="explorer.block.trx" /> #{index + 1}</h5> */ }
                {info}
            </div>
        );
    }
}

Transaction.defaultProps = {
    no_links: false
};

Transaction.propTypes = {
    trx: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    no_links: PropTypes.bool
};

export default Transaction;
