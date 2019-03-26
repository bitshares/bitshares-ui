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
                <LimitOrderCreate
                    {...props}
                    changeColor={opts.changeColor}
                    fromComponent={opts.fromComponent}
                />
            );
            break;
        case "limit_order_cancel":
            return (
                <LimitOrderCancel
                    {...props}
                    changeColor={opts.changeColor}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "short_order_cancel":
            return (
                <ShortOrderCancel {...props} changeColor={opts.changeColor} />
            );
            break;

        case "call_order_update":
            return (
                <CallOrderUpdate {...props} changeColor={opts.changeColor} />
            );
            break;

        case "key_create":
            return <KeyCreate />;
            break;

        case "account_create":
            return (
                <AccountCreate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "account_update":
            return (
                <AccountUpdate {...props} fromComponent={opts.fromComponent} />
            );
            break;

        case "account_whitelist":
            return (
                <AccountWhitelist
                    {...props}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "account_upgrade":
            return (
                <AccountUpgrade
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "account_transfer":
            return (
                <AccountTransfer
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "asset_create":
            return (
                <AssetCreate
                    {...props}
                    changeColor={opts.changeColor}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "asset_update":
        case "asset_update_bitasset":
            return (
                <AssetUpdate
                    {...props}
                    changeColor={opts.changeColor}
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "asset_update_feed_producers":
            return (
                <AssetUpdateFeedProducers
                    {...props}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "asset_issue":
            return <AssetIssue {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_reserve":
            return <AssetReserve {...props} />;
            break;

        case "asset_fund_fee_pool":
            return (
                <AssetFundFeePool
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "asset_settle":
            return <AssetSettle {...props} changeColor={opts.changeColor} />;
            break;

        case "asset_global_settle":
            return (
                <AssetGlobalSettle
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAsset={opts.linkToAsset}
                />
            );
            break;

        case "asset_publish_feed":
            return (
                <AssetPublishFeed
                    {...props}
                    changeColor={opts.changeColor}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "witness_create":
            return (
                <WitnessCreate {...props} linkToAccount={opts.linkToAccount} />
            );

            break;

        case "witness_update":
            return <WitnessUpdate {...props} />;
            break;

        case "witness_withdraw_pay":
            return (
                <WitnessWithdrawPay
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "proposal_create":
            return (
                <ProposalCreate {...props} fromComponent={opts.fromComponent} />
            );
            break;

        case "proposal_update":
            return <ProposalUpdate />;
            break;

        case "proposal_delete":
            return <ProposalDelete />;
            break;

        case "withdraw_permission_create":
            return (
                <WithdrawPermissionCreate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_update":
            return (
                <WithdrawPermissionUpdate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_claim":
            return (
                <WithdrawPermissionClaim
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "withdraw_permission_delete":
            return <WithdrawPermissionDelete />;
            break;

        case "fill_order":
            return (
                <FillOrder
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "global_parameters_update":
            return <GlobalParametersUpdate />;
            break;

        case "file_write":
            return <FileWrite />;
            break;

        case "vesting_balance_create":
            return (
                <VestingBalanceCreate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "vesting_balance_withdraw":
            return <VestingBalanceWithdraw {...props} />;
            break;

        case "bond_create_offer":
            return <BondCreateOffer {...props} />;
            break;

        case "bond_cancel_offer":
            return <BondCancelOffer {...props} />;
            break;

        case "bond_accept_offer":
            return (
                <BondAcceptOffer
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "bond_claim_collateral":
            return (
                <BondClaimCollaterial
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "worker_create":
            return <WorkerCreate {...props} />;
            break;

        case "balance_claim":
            return (
                <BalanceClaim
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "committee_member_create":
            return (
                <CommittyMemberCreate
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "transfer_to_blind":
            return (
                <TransferToBlind
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "transfer_from_blind":
            return (
                <TransferFromBlind
                    {...props}
                    linkToAccount={opts.linkToAccount}
                />
            );
            break;

        case "asset_claim_fees":
            return (
                <AssetClaimFees
                    {...props}
                    linkToAccount={opts.linkToAccount}
                    changeColor={opts.changeColor}
                />
            );
            break;

        case "committee_member_update_global_parameters":
            return <CommitteeMemberUpdateGlobalParams />;
            break;

        case "custom":
            return <Custom />;
            break;

        case "override_transfer":
            return <OverrideTransfer {...props} />;
            break;

        default:
            return <DefaultOperation {...props} />;
    }
}
