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
import {AssetSettleCancel} from "./AssetSettleCancel";
import {AssetGlobalSettle} from "./AssetGlobalSettle";
import {AssetPublishFeed} from "./AssetPublishFeed";
import {AssetClaimPool} from "./AssetClaimPool";
import {AssetUpdateIssuer} from "./AssetUpdateIssuer";
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
import {BidCollateral} from "./BidCollateral";

export default function opComponents(opType, props, opts) {
    switch (opType) {
        case "transfer":
            return <Transfer {...props} {...opts} />;
            break;
        case "limit_order_create":
            return <LimitOrderCreate {...props} {...opts} />;
            break;
        case "limit_order_cancel":
            return <LimitOrderCancel {...props} {...opts} />;
            break;

        case "short_order_cancel":
            return <ShortOrderCancel {...props} {...opts} />;
            break;

        case "call_order_update":
            return <CallOrderUpdate {...props} {...opts} />;
            break;

        case "key_create":
            return <KeyCreate />;
            break;

        case "account_create":
            return <AccountCreate {...props} {...opts} />;
            break;

        case "account_update":
            return <AccountUpdate {...props} {...opts} />;
            break;

        case "account_whitelist":
            return <AccountWhitelist {...props} {...opts} />;
            break;

        case "account_upgrade":
            return <AccountUpgrade {...props} {...opts} />;
            break;

        case "account_transfer":
            return <AccountTransfer {...props} {...opts} />;
            break;

        case "asset_create":
            return <AssetCreate {...props} {...opts} />;
            break;

        case "asset_update":
        case "asset_update_bitasset":
            return <AssetUpdate {...props} {...opts} />;
            break;
        /* -------------------------------------------------------------------------------------------- */
        case "asset_update_feed_producers":
            return <AssetUpdateFeedProducers {...props} {...opts} />;
            break;

        case "asset_issue":
            return <AssetIssue {...props} {...opts} />;
            break;

        case "asset_reserve":
            return <AssetReserve {...props} {...opts} />;
            break;

        case "asset_fund_fee_pool":
            return <AssetFundFeePool {...props} {...opts} />;
            break;

        case "asset_settle":
            return <AssetSettle {...props} {...opts} />;
            break;

        case "asset_settle_cancel":
            return <AssetSettleCancel {...props} />;
            break;

        case "asset_global_settle":
            return <AssetGlobalSettle {...props} {...opts} />;
            break;

        case "asset_publish_feed":
            return <AssetPublishFeed {...props} {...opts} />;
            break;

        case "asset_claim_pool":
            return <AssetClaimPool {...props} {...opts} />;
            break;

        case "asset_update_issuer":
            return <AssetUpdateIssuer {...props} />;
            break;

        case "witness_create":
            return <WitnessCreate {...props} {...opts} />;
            break;

        case "witness_update":
            return <WitnessUpdate {...props} {...opts} />;
            break;

        case "witness_withdraw_pay":
            return <WitnessWithdrawPay {...props} {...opts} />;
            break;

        case "proposal_create":
            return <ProposalCreate {...props} {...opts} />;
            break;

        case "proposal_update":
            return <ProposalUpdate {...props} {...opts} />;
            break;

        case "proposal_delete":
            return <ProposalDelete {...props} {...opts} />;
            break;

        case "withdraw_permission_create":
            return <WithdrawPermissionCreate {...props} {...opts} />;
            break;

        case "withdraw_permission_update":
            return <WithdrawPermissionUpdate {...props} {...opts} />;
            break;

        case "withdraw_permission_claim":
            return <WithdrawPermissionClaim {...props} {...opts} />;
            break;

        case "withdraw_permission_delete":
            return <WithdrawPermissionDelete {...props} {...opts} />;
            break;

        case "fill_order":
            return <FillOrder {...props} {...opts} />;
            break;

        case "global_parameters_update":
            return (
                <GlobalParametersUpdate fromComponent={opts.fromComponent} />
            );
            break;

        case "file_write":
            return <FileWrite />;
            break;

        case "vesting_balance_create":
            return <VestingBalanceCreate {...props} {...opts} />;
            break;

        case "vesting_balance_withdraw":
            return <VestingBalanceWithdraw {...props} {...opts} />;
            break;

        case "bond_create_offer":
            return <BondCreateOffer {...props} />;
            break;

        case "bond_cancel_offer":
            return <BondCancelOffer {...props} />;
            break;

        case "bond_accept_offer":
            return <BondAcceptOffer {...props} {...opts} />;
            break;

        case "bond_claim_collateral":
            return <BondClaimCollaterial {...props} {...opts} />;
            break;

        case "worker_create":
            return <WorkerCreate {...props} {...opts} />;
            break;

        case "balance_claim":
            return <BalanceClaim {...props} {...opts} />;
            break;

        case "committee_member_create":
            return <CommittyMemberCreate {...props} {...opts} />;
            break;

        case "transfer_to_blind":
            return <TransferToBlind {...props} {...opts} />;
            break;

        case "transfer_from_blind":
            return <TransferFromBlind {...props} {...opts} />;
            break;

        case "asset_claim_fees":
            return <AssetClaimFees {...props} {...opts} />;
            break;

        case "committee_member_update_global_parameters":
            return (
                <CommitteeMemberUpdateGlobalParams
                    fromComponent={opts.fromComponent}
                />
            );
            break;

        case "custom":
            return <Custom fromComponent={opts.fromComponent} />;
            break;

        case "override_transfer":
            return <OverrideTransfer {...props} {...opts} />;
            break;

        case "bid_collateral":
            return <BidCollateral {...props} />;
            break;

        default:
            return <DefaultOperation {...props} />;
    }
}
