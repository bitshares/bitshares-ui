import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import {ChainStore} from "tuscjs";

const compareKeys = (prev, next) => {
    let minus = prev.filter(x => !next.includes(x));
    let plus = next.filter(x => !prev.includes(x));

    return {minus, plus};
};

const getVotesName = item => {
    if (item.id.startsWith("1.14")) {
        // worker
        let worker_account = ChainStore.getAccountName(item.worker_account);
        return (
            "Worker " +
            item.name +
            (worker_account
                ? " of " + worker_account
                : " account " + item.worker_account)
        );
    } else if (item.id.startsWith("1.6.")) {
        let witness_account = ChainStore.getAccountName(item.witness_account);
        return (
            "Witness " +
            (witness_account
                ? witness_account
                : " account " + item.witness_account)
        );
    } else {
        let committee_member_account = ChainStore.getAccountName(
            item.committee_member_account
        );
        return (
            "Committee " +
            (committee_member_account
                ? committee_member_account
                : " account " + item.committee_member_account)
        );
    }
};

export const AccountUpdate = ({op, fromComponent, collapsed}) => {
    const account = op[1].account;

    const votes = op[1].new_options ? op[1].new_options.votes : undefined;
    const memo_key = op[1].new_options ? op[1].new_options.memo_key : undefined;

    const owner = op[1].owner ? op[1].owner : undefined;
    const active = op[1].active ? op[1].active : undefined;

    let change = {};
    let votesPlusNames = [];
    let votesMinusNames = [];

    if (collapsed == undefined) {
        collapsed = true;
    }

    if (fromComponent === "proposed_operation" && !collapsed) {
        const _account = ChainStore.getAccount(account, false);
        const _votes = _account
            .get("options")
            .get("votes")
            .toArray();

        if (votes) {
            const votesIds = compareKeys(_votes, votes);
            const votesPlusData = ChainStore.getObjectsByVoteIds(votesIds.plus);
            const votesMinusData = ChainStore.getObjectsByVoteIds(
                votesIds.minus
            );

            if (votesPlusData && votesMinusData) {
                votesPlusData.forEach(item => {
                    if (item) {
                        const name = getVotesName(item.toJS());
                        if (name) votesPlusNames.push(name);
                    }
                });
                votesMinusData.forEach(item => {
                    if (item) {
                        const name = getVotesName(item.toJS());
                        if (name) votesMinusNames.push(name);
                    }
                });
                change.votes = {minus: votesMinusNames, plus: votesPlusNames};
            }
        }

        if (owner) {
            change.owner = {};
            const _owner_keys = _account
                .get("owner")
                .get("key_auths")
                .map(a => a.get(0))
                .toArray();
            change.owner.keys = compareKeys(
                _owner_keys,
                owner.key_auths.map(x => x[0])
            );
            const _owner_accounts = _account
                .get("owner")
                .get("account_auths")
                .map(a => a.get(0))
                .toArray();
            change.owner.accounts = compareKeys(
                _owner_accounts,
                owner.account_auths.map(x => x[0])
            );
            if (
                _account.get("owner").get("weight_threshold") !==
                owner.weight_threshold
            ) {
                change.owner.weight_threshold = owner.weight_threshold;
            }
        }
        if (active) {
            change.active = {};
            const _active_keys = _account
                .get("active")
                .get("key_auths")
                .map(a => a.get(0))
                .toArray();
            change.active.keys = compareKeys(
                _active_keys,
                active.key_auths.map(x => x[0])
            );
            const _active_accounts = _account
                .get("active")
                .get("account_auths")
                .map(a => a.get(0))
                .toArray();
            change.active.accounts = compareKeys(
                _active_accounts,
                active.account_auths.map(x => x[0])
            );
            if (
                _account.get("active").get("weight_threshold") !==
                active.weight_threshold
            ) {
                change.active.weight_threshold = active.weight_threshold;
            }
        }

        if (memo_key) {
            change.memo = {};
            const _memo = _account.get("options").get("memo_key");
            change.memo.keys = compareKeys([_memo], [memo_key]);
            if (
                change.memo.keys.minus.length == 0 &&
                change.memo.keys.plus.length == 0
            ) {
                change.memo = undefined;
            }
        }
    }

    return (
        <span>
            <TranslateWithLinks
                string={
                    fromComponent === "proposed_operation"
                        ? "proposal.update_account"
                        : "operation.update_account"
                }
                keys={[
                    {
                        type: "account",
                        value: op[1].account,
                        arg: "account"
                    },
                    {
                        type: "change",
                        value: change,
                        arg: "change"
                    }
                ]}
            />
        </span>
    );
};
