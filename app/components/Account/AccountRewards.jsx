import React from "react";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import notify from "actions/NotificationActions";
import CryptoBridgeStore from "../../stores/CryptoBridgeStore";
import AccountStore from "../../stores/AccountStore";
import CryptoBridgeActions from "../../actions/CryptoBridgeActions";
import counterpart from "counterpart";

class AccountRewards extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            claimingRewardId: null
        };
    }

    componentDidUpdate(prevProps) {
        if (
            JSON.stringify(prevProps.rewards) !==
                JSON.stringify(this.props.rewards) ||
            prevProps.account !== this.props.account ||
            prevProps.reclaimFee !== this.props.reclaimFee
        ) {
            this.forceUpdate();
        }
    }

    claimReward(account, id, type) {
        this.setState({claimingRewardId: id});

        CryptoBridgeActions.claimReward(account, id, type)
            .then(() => {
                notify.addNotification({
                    message: counterpart.translate(
                        "cryptobridge.competition.api.claim.success"
                    ),
                    level: "success",
                    autoDismiss: 3
                });
                this.setState({claimingRewardId: null});
                this.props.onChange(account.get("id"));
            })
            .catch(() => {
                notify.addNotification({
                    message: counterpart.translate(
                        "cryptobridge.competition.api.claim.error"
                    ),
                    level: "error",
                    autoDismiss: 3
                });
                this.setState({claimingRewardId: null});
            });
    }

    render() {
        const {rewards, account, reclaimFee} = this.props;
        const {claimingRewardId} = this.state;

        if (!rewards || !rewards.length || !account || !reclaimFee) {
            return null;
        }

        return (
            <div className={"trading-competition"}>
                <Translate
                    component="h2"
                    content={"cryptobridge.competition.title"}
                />
                <Translate
                    component="p"
                    content={"cryptobridge.competition.description"}
                />
                <Translate
                    component="p"
                    className={"label warning normal"}
                    content={"cryptobridge.competition.disclaimer"}
                    with={{amount: reclaimFee}}
                />

                <ul>
                    {this.props.rewards.map(reward => {
                        return (
                            <li key={reward.id}>
                                <div className={"reward-buttons"}>
                                    <button
                                        style={{marginRight: "1rem"}}
                                        className={"button primary"}
                                        disabled={
                                            claimingRewardId === reward.id
                                        }
                                        onClick={() => {
                                            this.claimReward(
                                                account,
                                                reward.id,
                                                "stake"
                                            );
                                        }}
                                    >
                                        <Translate
                                            content={
                                                "cryptobridge.competition.button.stake"
                                            }
                                        />
                                        <br />
                                        <span style={{fontSize: "80%"}}>
                                            (<Translate
                                                content={
                                                    "cryptobridge.competition.button.stake_bonus"
                                                }
                                                with={{percent: 10}}
                                            />)
                                        </span>
                                    </button>
                                    <button
                                        className={"button secondary"}
                                        disabled={
                                            claimingRewardId === reward.id
                                        }
                                        onClick={() => {
                                            this.claimReward(
                                                account,
                                                reward.id,
                                                "claim"
                                            );
                                        }}
                                    >
                                        <Translate
                                            content={
                                                "cryptobridge.competition.button.claim"
                                            }
                                        />
                                        <br />
                                        <span style={{fontSize: "80%"}}>
                                            (<Translate
                                                content={
                                                    "cryptobridge.competition.button.claim_bonus"
                                                }
                                            />)
                                        </span>
                                    </button>
                                </div>
                                <div className={"label info normal"}>
                                    <Translate
                                        content={
                                            "cryptobridge.competition.reward.bonus"
                                        }
                                        with={{amount: reward.payout}}
                                    />
                                </div>
                                <table>
                                    <tbody>
                                        <tr>
                                            <th>
                                                <Translate
                                                    content={
                                                        "cryptobridge.competition.reward.period"
                                                    }
                                                />:
                                            </th>
                                            <td>
                                                {reward.from} - {reward.to}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>
                                                <Translate
                                                    content={
                                                        "cryptobridge.competition.reward.usd"
                                                    }
                                                />:
                                            </th>
                                            <td>${reward.amount}</td>
                                        </tr>
                                        <tr>
                                            <th>
                                                <Translate
                                                    content={
                                                        "cryptobridge.competition.reward.payout"
                                                    }
                                                />:
                                            </th>
                                            <td>
                                                {reward.payout} BCO (@{" "}
                                                {reward.price} BCO/USD)
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

export default connect(AccountRewards, {
    listenTo() {
        return [CryptoBridgeStore, AccountStore];
    },
    getProps() {
        const currentAccount =
            AccountStore.getState().currentAccount ||
            AccountStore.getState().passwordAccount;

        return {
            rewards: CryptoBridgeStore.getRewards(currentAccount)
        };
    }
});
