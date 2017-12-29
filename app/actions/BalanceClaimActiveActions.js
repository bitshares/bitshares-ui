import alt from "alt-instance";

class BalanceClaimActiveActions {

    setPubkeys(pubkeys) {
        return pubkeys;
    }

    setSelectedBalanceClaims(selected_balances) {
        return selected_balances;
    }

    claimAccountChange(claim_account_name) {
        return claim_account_name;
    }

}

const BalanceClaimActiveActionsWrapped = alt.createActions(BalanceClaimActiveActions);
export default BalanceClaimActiveActionsWrapped;
