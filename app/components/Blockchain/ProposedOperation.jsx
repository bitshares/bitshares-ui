import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import {ChainStore, ChainTypes as grapheneChainTypes} from "bitsharesjs";
// import account_constants from "chain/account_constants";
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
    WithdrawPermissionDelete,
    FillOrder,
    GlobalParametersUpdate,
    FileWrite,
    VestingBalanceCreate,
    VestingBalanceWithdraw,
    BondCreateOffer,
    BondCancelOffer,
    BondAcceptOffer,
    BondClaimCollaterial,
    WorkerCreate,
    BalanceClaim,
    CommittyMemberCreate,
    TransferToBlind,
    TransferFromBlind,
    AssetClaimFees,
    CommitteeMemberUpdateGlobalParams,
    Custom,
    OverrideTransfer,
    DefaultOperation
} from "./operations";

require("./operations.scss");

let ops = Object.keys(operations);
// let listings = account_constants.account_listing;

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
        let {op, block, hideExpiration, index, csvExportMode} = this.props;
        const {label_color} = this.state;
        let line = null,
            column = null;

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
                column = (
                    <FillOrder
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "global_parameters_update":
                column = <GlobalParametersUpdate />;
                break;

            case "file_write":
                column = <FileWrite />;
                break;

            case "vesting_balance_create":
                column = (
                    <VestingBalanceCreate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "vesting_balance_withdraw":
                column = <VestingBalanceWithdraw {...this.props} />;
                break;

            case "bond_create_offer":
                column = <BondCreateOffer {...this.props} />;
                break;

            case "bond_cancel_offer":
                column = <BondCancelOffer {...this.props} />;
                break;

            case "bond_accept_offer":
                column = (
                    <BondAcceptOffer
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "bond_claim_collateral":
                column = (
                    <BondClaimCollaterial
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "worker_create":
                column = <WorkerCreate {...this.props} />;
                break;

            case "balance_claim":
                column = (
                    <BalanceClaim
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "committee_member_create":
                column = (
                    <CommittyMemberCreate
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "transfer_to_blind":
                column = (
                    <TransferToBlind
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "transfer_from_blind":
                column = (
                    <TransferFromBlind
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                    />
                );
                break;

            case "asset_claim_fees":
                column = (
                    <AssetClaimFees
                        {...this.props}
                        linkToAccount={this.linkToAccount}
                        changeColor={this.changeColor}
                    />
                );
                break;

            case "committee_member_update_global_parameters":
                column = <CommitteeMemberUpdateGlobalParams />;
                break;

            case "custom":
                column = <Custom />;
                break;

            case "override_transfer":
                column = <OverrideTransfer {...this.props} />;
                break;

            default:
                <DefaultOperation {...this.props} />;
        }

        if (csvExportMode) {
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
                index={index}
                id={this.props.id}
                block={block}
                type={op[0]}
                color={label_color}
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
