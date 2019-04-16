import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import {ChainStore} from "bitsharesjs";

const compareKeys = (prev, next) => {
    let minus = prev.filter(x => !next.includes(x));
    let plus = next.filter(x => !prev.includes(x));

    return {minus, plus};
};

export const AccountUpdate = ({op, fromComponent}) => {
    const account = op[1].account;

    const votes = op[1].new_options ? op[1].new_options.votes : undefined;
    const memo_key = op[1].new_options ? op[1].new_options.memo_key : undefined;

    const owner = op[1].owner ? op[1].owner : undefined;
    const active = op[1].active ? op[1].active : undefined;

    let change = {};
    let votesPlusNames = [];
    let votesMinusNames = [];

    if (fromComponent === "proposed_operation") {
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
                        const id =
                            item.get("witness_account") ||
                            item.get("committee_member_account");
                        const name = id
                            ? ChainStore.getAccountName(id) || id
                            : null;
                        if (name) votesPlusNames.push(name);
                    }
                });
                votesMinusData.forEach(item => {
                    if (item) {
                        const id =
                            item.get("witness_account") ||
                            item.get("committee_member_account");
                        const name = id
                            ? ChainStore.getAccountName(id) || id
                            : null;
                        if (name) votesMinusNames.push(name);
                    }
                });
                change.votes = {minus: votesMinusNames, plus: votesPlusNames};
            }
        }

        if (owner) {
            const _owner = _account
                .get("active")
                .get("key_auths")
                .map(a => a.get(0))
                .toArray();
            change.keys = {
                ...change.keys,
                ...compareKeys(_owner, owner.key_auths.map(x => x[0]))
            };
        }
        if (active) {
            const _active = _account
                .get("active")
                .get("key_auths")
                .map(a => a.get(0))
                .toArray();
            change.keys = {
                ...change.keys,
                ...compareKeys(_active, active.key_auths.map(x => x[0]))
            };
        }

        if (memo_key) {
            const _memo = _account.get("options").get("memo_key");
            change.keys = {...change.keys, ...compareKeys([_memo], [memo_key])};
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
