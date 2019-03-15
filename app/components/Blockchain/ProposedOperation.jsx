import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router-dom";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import market_utils from "common/market_utils";
import utils from "common/utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import FormattedPrice from "../Utility/FormattedPrice";
import {ChainStore, ChainTypes as grapheneChainTypes} from "bitsharesjs";
import account_constants from "chain/account_constants";
import MemoText from "./MemoText";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
const {operations} = grapheneChainTypes;
import PropTypes from "prop-types";
import {
    Transfer,
    LimitOrderCreate,
    LimitOrderCancel,
    ShortOrderCancel,
    CallOrderUpdate,
    KeyCreate,
    AccountCreate,
    AccountUpdate,
    AccountWhitelist,
    AccountUpgrade,
    AccountTransfer,
    AssetCreate,
    AssetUpdate,
    AssetUpdateFeedProducers,
    AssetIssue,
    AssetReserve,
    AssetFundFeePool,
    AssetSettle,
    AssetGlobalSettle,
    AssetPublishFeed,
    WitnessCreate,
    WitnessUpdate,
    WitnessWithdrawPay,
    ProposalCreate,
    ProposalUpdate,
    ProposalDelete,
    WithdrawPermissionCreate,
    WithdrawPermissionUpdate,
    WithdrawPermissionClaim,
    WithdrawPermissionDelete
} from "./operations";

require("./operations.scss");

let ops = Object.keys(operations);
let listings = account_constants.account_listing;

export const TransactionIDAndExpiry = ({id, expiration, style}) => {
    const endDate = counterpart.localize(new Date(expiration), {
        format: "short"
    });
    return (
        <b style={style}>
            <span>#{id} | </span>
            <span>
                <Translate content="proposal.expires" />: {endDate}
            </span>
        </b>
    );
};

class Row extends React.Component {
    constructor(props) {
        super(props);
        this.showDetails = this.showDetails.bind(this);
    }

    showDetails(e) {
        e.preventDefault();
        this.props.history.push(`/block/${this.props.block}`);
    }

    render() {
        let {id, fee, hideFee, hideExpiration, expiration} = this.props;

        fee.amount = parseInt(fee.amount, 10);

        return (
            <div style={{padding: "5px 0", textAlign: "left"}}>
                <span>
                    {this.props.info}
                    &nbsp;
                    {hideFee ? null : (
                        <span className="facolor-fee">
                            (
                            <FormattedAsset
                                amount={fee.amount}
                                asset={fee.asset_id}
                            />{" "}
                            fee)
                        </span>
                    )}
                </span>
                {!hideExpiration &&
                    this.props.expiration && (
                        <TransactionIDAndExpiry
                            id={id}
                            expiration={expiration}
                            style={{
                                paddingTop: 5,
                                fontSize: "0.85rem",
                                paddingBottom: "0.5rem",
                                display: "block"
                            }}
                        />
                    )}
            </div>
        );
    }
}

class ProposedOperation extends React.Component {
    state = {
        label_color: "info"
    };

    static defaultProps = {
        op: [],
        current: "",
        block: null,
        hideDate: false,
        hideFee: false,
        hideOpLabel: false,
        csvExportMode: false
    };

    static propTypes = {
        op: PropTypes.array.isRequired,
        current: PropTypes.string,
        block: PropTypes.number,
        hideDate: PropTypes.bool,
        hideFee: PropTypes.bool,
        csvExportMode: PropTypes.bool
    };

    linkToAccount(name_or_id) {
        if (!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ? (
            <LinkToAccountById account={name_or_id} />
        ) : (
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>
        );
    }

    linkToAsset(symbol_or_id) {
        if (!symbol_or_id) return <span>-</span>;
        return utils.is_object_id(symbol_or_id) ? (
            <LinkToAssetById asset={symbol_or_id} />
        ) : (
            <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>
        );
    }

    changeColor = newColor => {
        const {label_color} = this.state;
        if (label_color !== newColor) {
            this.setState({label_color: newColor});
        }
    };

    render() {
        let {op, proposer, current, block, hideExpiration, index} = this.props;
        let line = null,
            column = null,
            color = "info";

        switch (
            ops[op[0]] // For a list of trx types, see chain_types.coffee
        ) {
            case "transfer":
                column = (
                    <Transfer {...this.props} changeColor={this.changeColor} />
                );

                break;

            case "limit_order_create":
                column = (
                    <LimitOrderCreate
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "limit_order_cancel":
                column = (
                    <LimitOrderCancel
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "short_order_cancel":
                column = (
                    <ShortOrderCancel
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "call_order_update":
                column = (
                    <CallOrderUpdate
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "key_create":
                column = <KeyCreate />;
                break;

            case "account_create":
                column = (
                    <AccountCreate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "account_update":
                column = <AccountUpdate {...this.props} />;
                break;

            case "account_whitelist":
                column = <AccountWhitelist {...this.props} />;
                break;

            case "account_upgrade":
                column = (
                    <AccountUpgrade
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "account_transfer":
                column = (
                    <AccountTransfer
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "asset_create":
                column = (
                    <AssetCreate
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                column = (
                    <AssetUpdate
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_update_feed_producers":
                column = (
                    <AssetUpdateFeedProducers
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_issue":
                column = (
                    <AssetIssue
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_reserve":
                column = <AssetReserve {...this.props} />;
                break;

            case "asset_fund_fee_pool":
                column = (
                    <AssetFundFeePool
                        {...this.props}
                        changeColor={this.changeColor}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "asset_settle":
                column = (
                    <AssetSettle
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_global_settle":
                column = (
                    <AssetGlobalSettle
                        {...this.props}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "asset_publish_feed":
                column = (
                    <AssetPublishFeed
                        {...this.props}
                        changeColor={this.changeColor}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "witness_create":
                column = (
                    <WitnessCreate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );

                break;

            case "witness_update":
                column = <WitnessUpdate {...this.props} />;
                break;

            case "witness_withdraw_pay":
                column = (
                    <WitnessWithdrawPay
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "proposal_create":
                column = <ProposalCreate />;
                break;

            case "proposal_update":
                column = <ProposalUpdate />;
                break;

            case "proposal_delete":
                column = <ProposalDelete />;
                break;

            case "withdraw_permission_create":
                column = (
                    <WithdrawPermissionCreate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "withdraw_permission_update":
                column = (
                    <WithdrawPermissionUpdate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "withdraw_permission_claim":
                column = (
                    <WithdrawPermissionClaim
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "withdraw_permission_delete":
                column = <WithdrawPermissionDelete />;
                break;

            case "fill_order":
                color = "success";
                o = op[1];
                column = (
                    <span>
                        {this.linkToAccount(op[1].account_id)}
                        &nbsp;
                        <Translate component="span" content="proposal.paid" />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].pays.amount}
                            asset={op[1].pays.asset_id}
                        />
                        &nbsp;
                        <Translate component="span" content="proposal.obtain" />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].receives.amount}
                            asset={op[1].receives.asset_id}
                        />
                        &nbsp;
                        <Translate component="span" content="proposal.at" />
                        &nbsp;
                        <FormattedPrice
                            base_asset={o.pays.asset_id}
                            base_amount={o.pays.amount}
                            quote_asset={o.receives.asset_id}
                            quote_amount={o.receives.amount}
                        />
                    </span>
                );
                break;

            case "global_parameters_update":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.global_parameters_update"
                        />
                    </span>
                );
                break;

            case "file_write":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.file_write"
                        />
                    </span>
                );
                break;

            case "vesting_balance_create":
                column = (
                    <span>
                        &nbsp;
                        {this.linkToAccount(op[1].creator)}
                        <Translate
                            component="span"
                            content="proposal.vesting_balance_create"
                        />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].owner)}
                    </span>
                );
                break;

            case "vesting_balance_withdraw":
                column = (
                    <TranslateWithLinks
                        string={"proposal.vesting_balance_withdraw"}
                        keys={[
                            {
                                type: "account",
                                value: op[1].owner,
                                arg: "account"
                            },
                            {type: "amount", value: op[1].amount, arg: "amount"}
                        ]}
                    />
                );
                break;

            case "bond_create_offer":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.bond_create_offer"
                        />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                    </span>
                );
                break;

            case "bond_cancel_offer":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.bond_cancel_offer"
                        />
                        &nbsp;
                        {op[1].offer_id}
                    </span>
                );
                break;

            case "bond_accept_offer":
                if (current === op[1].lender) {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="proposal.bond_accept_offer"
                            />
                            &nbsp;
                            <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={op[1].amount_borrowed.amount}
                                asset={op[1].amount_borrowed.asset_id}
                            />
                            <Translate component="span" content="proposal.to" />
                            &nbsp;
                            {this.linkToAccount(op[1].borrower)}
                        </span>
                    );
                } else if (current === op[1].borrower) {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="proposal.bond_accept_offer"
                            />
                            &nbsp;
                            <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={op[1].amount_borrowed.amount}
                                asset={op[1].amount_borrowed.asset_id}
                            />
                            <Translate
                                component="span"
                                content="proposal.from"
                            />
                            &nbsp;
                            {this.linkToAccount(op[1].lender)}
                        </span>
                    );
                }
                break;

            case "bond_claim_collateral":
                if (current === op[1].lender) {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="proposal.bond_pay_collateral"
                            />
                            &nbsp;
                            <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={op[1].collateral_claimed.amount}
                                asset={op[1].collateral_claimed.asset_id}
                            />
                            <Translate component="span" content="proposal.to" />
                            &nbsp;
                            {this.linkToAccount(op[1].claimer)}
                        </span>
                    );
                } else if (current === op[1].claimer) {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="proposal.bond_claim_collateral"
                            />
                            &nbsp;
                            <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={op[1].collateral_claimed.amount}
                                asset={op[1].collateral_claimed.asset_id}
                            />
                            <Translate
                                component="span"
                                content="proposal.from"
                            />
                            &nbsp;
                            {this.linkToAccount(op[1].lender)}
                        </span>
                    );
                }
                break;

            case "worker_create":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.create_worker"
                        />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].daily_pay}
                            asset={"1.3.0"}
                        />
                    </span>
                );
                break;

            case "balance_claim":
                color = "success";
                op[1].total_claimed.amount = parseInt(
                    op[1].total_claimed.amount,
                    10
                );
                column = (
                    <span>
                        {this.linkToAccount(op[1].deposit_to_account)}
                        &nbsp;
                        <BindToChainState.Wrapper
                            asset={op[1].total_claimed.asset_id}
                        >
                            {({asset}) => (
                                <Translate
                                    component="span"
                                    content="proposal.balance_claim"
                                    balance_amount={utils.format_asset(
                                        op[1].total_claimed.amount,
                                        asset
                                    )}
                                    balance_id={op[1].balance_to_claim.substring(
                                        5
                                    )}
                                />
                            )}
                        </BindToChainState.Wrapper>
                    </span>
                );
                break;

            case "committee_member_create":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="proposal.committee_member_create"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].committee_member_account)}
                    </span>
                );
                break;

            case "transfer_to_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].from)}
                        &nbsp;
                        <Translate component="span" content="proposal.sent" />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                    </span>
                );
                break;

            case "transfer_from_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].to)}
                        &nbsp;
                        <Translate
                            component="span"
                            content="proposal.received"
                        />
                        &nbsp;
                        <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                    </span>
                );
                break;

            case "asset_claim_fees":
                color = "success";
                op[1].amount_to_claim.amount = parseInt(
                    op[1].amount_to_claim.amount,
                    10
                );
                column = (
                    <span>
                        {this.linkToAccount(op[1].issuer)}
                        &nbsp;
                        <BindToChainState.Wrapper
                            asset={op[1].amount_to_claim.asset_id}
                        >
                            {({asset}) => (
                                <TranslateWithLinks
                                    string="transaction.asset_claim_fees"
                                    keys={[
                                        {
                                            type: "amount",
                                            value: op[1].amount_to_claim,
                                            arg: "balance_amount"
                                        },
                                        {
                                            type: "asset",
                                            value: asset.get("id"),
                                            arg: "asset"
                                        }
                                    ]}
                                />
                            )}
                        </BindToChainState.Wrapper>
                    </span>
                );
                break;

            case "committee_member_update_global_parameters":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="proposal.committee_member_update_global_parameters"
                            keys={[
                                {
                                    type: "account",
                                    value: "1.2.0",
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "custom":
                column = (
                    <span>
                        <Translate component="span" content="proposal.custom" />
                    </span>
                );
                break;

            case "override_transfer":
                column = (
                    <TranslateWithLinks
                        string="proposal.override_transfer"
                        keys={[
                            {
                                type: "account",
                                value: op[1].issuer,
                                arg: "issuer"
                            },
                            {type: "account", value: op[1].from, arg: "from"},
                            {type: "account", value: op[1].to, arg: "to"},
                            {type: "amount", value: op[1].amount, arg: "amount"}
                        ]}
                    />
                );
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
            const block_time = utils.calc_block_time(
                block,
                globalObject,
                dynGlobalObject
            );
            return (
                <div key={this.props.key}>
                    <div>{block_time ? block_time.toLocaleString() : ""}</div>
                    <div>{ops[op[0]]}</div>
                    <div>{column}</div>
                    <div>
                        <FormattedAsset
                            amount={parseInt(op[1].fee.amount, 10)}
                            asset={op[1].fee.asset_id}
                        />
                    </div>
                </div>
            );
        }

        line = column ? (
            <Row
                index={this.props.index}
                id={this.props.id}
                block={block}
                type={op[0]}
                color={color}
                fee={op[1].fee}
                hideDate={this.props.hideDate}
                hideFee={this.props.hideFee}
                hideOpLabel={this.props.hideOpLabel}
                info={column}
                expiration={this.props.expiration}
                hideExpiration={hideExpiration}
            />
        ) : null;

        return line ? line : <div />;
    }
}

export default ProposedOperation;
