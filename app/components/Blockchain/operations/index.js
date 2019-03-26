import React from "react";
import {Transfer} from "./Transfer";
import {LimitOrderCreate} from "./LimitOrderCreate";
import {LimitOrderCancel} from "./LimitOrderCancel";
import {ShortOrderCancel} from "./ShortOrderCancel";
import {CallOrderUpdate} from "./CallOrderUpdate";
import {KeyCreate} from "./KeyCreate";
import {AccountCreate} from "./AccountCreate";
import {AccountUpdate} from "./AccountUpdate";
import {AccountWhitelist} from "./AccountWhitelist";
import {AccountUpgrade} from "./AccountUpgrade";
import {AccountTransfer} from "./AccountTransfer";
import {AssetCreate} from "./AssetCreate";
import {AssetUpdate} from "./AssetUpdate";
import {AssetUpdateFeedProducers} from "./AssetUpdateFeedProducers";
import {AssetIssue} from "./AssetIssue";
import {AssetReserve} from "./AssetReserve";
import {AssetFundFeePool} from "./AssetFundFeePool";
import {AssetSettle} from "./AssetSettle";
import {AssetGlobalSettle} from "./AssetGlobalSettle";
import {AssetPublishFeed} from "./AssetPublishFeed";
import {WitnessCreate} from "./WitnessCreate";
import {WitnessUpdate} from "./WitnessUpdate";
import {WitnessWithdrawPay} from "./WitnessWithdrawPay";
import {ProposalCreate} from "./ProposalCreate";
import {ProposalUpdate} from "./ProposalUpdate";
import {ProposalDelete} from "./ProposalDelete";
import {WithdrawPermissionCreate} from "./WithdrawPermissionCreate";
import {WithdrawPermissionUpdate} from "./WithdrawPermissionUpdate";
import {WithdrawPermissionClaim} from "./WithdrawPermissionClaim";
import {WithdrawPermissionDelete} from "./WithdrawPermissionDelete";
import {FillOrder} from "./FillOrder";
import {GlobalParametersUpdate} from "./GlobalParametersUpdate";
import {FileWrite} from "./FileWrite";
import {VestingBalanceCreate} from "./VestingBalanceCreate";
import {VestingBalanceWithdraw} from "./VestingBalanceWithdraw";
import {BondCreateOffer} from "./BondCreateOffer";
import {BondCancelOffer} from "./BondCancelOffer";
import {BondAcceptOffer} from "./BondAcceptOffer";
import {BondClaimCollaterial} from "./BondClaimCollaterial";
import {WorkerCreate} from "./WorkerCreate";
import {BalanceClaim} from "./BalanceClaim";
import {CommittyMemberCreate} from "./CommittyMemberCreate";
import {TransferToBlind} from "./TransferToBlind";
import {TransferFromBlind} from "./TransferFromBlind";
import {AssetClaimFees} from "./AssetClaimFees";
import {CommitteeMemberUpdateGlobalParams} from "./CommitteeMemberUpdateGlobalParams";
import {Custom} from "./Custom";
import {OverrideTransfer} from "./OverrideTransfer";
import {DefaultOperation} from "./DefaultOperation";

export default function opComponents(opType, props, opts) {
    console.log("** operation params**", {opType, props, opts});

    switch (opType) {
        case "transfer":
            return <Transfer {...props} changeColor={opts.changeColor} />;
            break;
        case "limit_order_create":
            return (
                <LimitOrderCreate {...props} changeColor={opts.changeColor} />
            );
            break;
        case "limit_order_cancel":
            column = (
                <LimitOrderCancel {...props} changeColor={opts.changeColor} />
            );
            break;

        case "short_order_cancel":
            column = (
                <ShortOrderCancel {...props} changeColor={opts.changeColor} />
            );
            break;

        case "call_order_update":
            column = (
                <CallOrderUpdate {...props} changeColor={opts.changeColor} />
            );
            break;

        case "key_create":
            column = <KeyCreate />;
            break;

        case "account_create":
            column = (
                <AccountCreate {...props} linkToAccount={opts.linkToAccount} />
            );
            break;

        case "account_update":
            column = <AccountUpdate {...props} />;
            break;

        case "account_whitelist":
            column = <AccountWhitelist {...props} />;
            break;

        case "account_upgrade":
            column = (
                <AccountUpgrade {...props} linkToAccount={opts.linkToAccount} />
            );
            break;

        case "account_transfer":
            column = (
                <AccountTransfer
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "asset_create":
            column = <AssetCreate {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_update":
        case "asset_update_bitasset":
            column = <AssetUpdate {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_update_feed_producers":
            column = (
                <AssetUpdateFeedProducers
                    {...props}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "asset_issue":
            column = <AssetIssue {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_reserve":
            column = <AssetReserve {...props} />;
            break;

        case "asset_fund_fee_pool":
            column = (
                <AssetFundFeePool
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "asset_settle":
            column = <AssetSettle {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_global_settle":
            column = (
                <AssetGlobalSettle
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAsset={opts.linkToAsset}
                />
            );
            break;

        case "asset_publish_feed":
            column = (
                <AssetPublishFeed
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "witness_create":
            column = (
                <WitnessCreate {...props} linkToAccount={opts.linkToAccount} />
            );

            break;

        case "witness_update":
            column = <WitnessUpdate {...props} />;
            break;

        case "witness_withdraw_pay":
            column = (
                <WitnessWithdrawPay
                    {...props}
                    linkToAccount={opts.linkToAccount}
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
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_update":
            column = (
                <WithdrawPermissionUpdate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_claim":
            column = (
                <WithdrawPermissionClaim
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_delete":
            column = <WithdrawPermissionDelete />;
            break;

        case "fill_order":
            column = (
                <FillOrder
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
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
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "vesting_balance_withdraw":
            column = <VestingBalanceWithdraw {...props} />;
            break;

        case "bond_create_offer":
            column = <BondCreateOffer {...props} />;
            break;

        case "bond_cancel_offer":
            column = <BondCancelOffer {...props} />;
            break;

        case "bond_accept_offer":
            column = (
                <BondAcceptOffer
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "bond_claim_collateral":
            column = (
                <BondClaimCollaterial
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "worker_create":
            column = <WorkerCreate {...props} />;
            break;

        case "balance_claim":
            column = (
                <BalanceClaim
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "committee_member_create":
            column = (
                <CommittyMemberCreate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "transfer_to_blind":
            column = (
                <TransferToBlind
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "transfer_from_blind":
            column = (
                <TransferFromBlind
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "asset_claim_fees":
            column = (
                <AssetClaimFees
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
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
            column = <OverrideTransfer {...props} />;
            break;

        default:
            return <DefaultOperation {...props} />;
    }
}
