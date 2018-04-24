import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountStakeCreateNew from "./AccountStakeCreateNew";
import {ChainStore} from "bitsharesjs/es";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";

const BCO_ASSET_ID = "1.3.1564";
const BCO_ASSET_PRECISION = 7;

class VestingBalance extends React.Component {
    _onClaim(claimAll, e) {
        e.preventDefault();
        WalletActions.claimVestingBalance(
            this.props.account.id,
            this.props.vb,
            claimAll
        ).then(() => {
            typeof this.props.handleChanged == "function" &&
                this.props.handleChanged();
        });
    }

    render() {
        let {vb} = this.props;
        if (!this.props.vb) {
            return null;
        }

        let cvbAsset,
            available = false,
            daysLeft = 0,
            balance;
        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);

            const claimStartDate = utils.timeStringToGrapheneDate(
                vb.policy[1].start_claim
            );
            const claimEndDate = new Date(
                claimStartDate.getTime() + vb.policy[1].vesting_seconds * 1000
            );

            if (new Date() >= claimEndDate) {
                available = true;
                daysLeft = 0;
            } else {
                daysLeft = parseInt(
                    claimEndDate.getTime() / 1000 - new Date().getTime() / 1000
                );
                daysLeft = (daysLeft / 86400).toFixed(2);
            }
        }

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return null;
        }

        return (
            <div>
                <h2>
                    <Translate content="cryptobridge.account.id" /> {vb.id}
                </h2>

                <table className="table key-value-table">
                    <tbody>
                        <tr>
                            <td>
                                <Translate content="cryptobridge.account.staking_amount" />
                            </td>
                            <td>
                                <FormattedAsset
                                    amount={vb.balance.amount}
                                    asset={vb.balance.asset_id}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="cryptobridge.account.remaining" />
                            </td>
                            <td>
                                {daysLeft > 0 ? (
                                    <Translate
                                        days={daysLeft}
                                        content="cryptobridge.account.days"
                                    />
                                ) : (
                                    <Translate
                                        className="green"
                                        content="cryptobridge.account.available"
                                    />
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="cryptobridge.account.status" />
                            </td>
                            <td style={{textAlign: "right"}}>
                                {available ? (
                                    <button
                                        onClick={this._onClaim.bind(this, true)}
                                        className="button"
                                    >
                                        <Translate content="account.member.claim" />
                                    </button>
                                ) : (
                                    <Translate content="cryptobridge.account.staking" />
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

class AccountStaking extends React.Component {
    constructor() {
        super();

        this.state = {
            vbs: null
        };
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentWillUpdate(nextProps) {
        let newId = nextProps.account.get("id");
        let oldId = this.props.account.get("id");

        if (newId !== oldId) {
            this.retrieveVestingBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId) {
        accountId = accountId || this.props.account.get("id");

        Apis.instance()
            .db_api()
            .exec("get_vesting_balances", [accountId])
            .then(vbs => {
                this.setState({vbs});
            })
            .catch(err => {
                console.log("error:", err);
            });
    }

    render() {
        let {vbs} = this.state;
        if (
            !vbs ||
            !this.props.account ||
            !this.props.account.get("vesting_balances")
        ) {
            return null;
        }

        let account = this.props.account.toJS();

        let balances = vbs
            .map(vb => {
                if (vb.balance.amount) {
                    return (
                        <VestingBalance
                            key={vb.id}
                            vb={vb}
                            account={account}
                            handleChanged={this.retrieveVestingBalances.bind(
                                this
                            )}
                        />
                    );
                }
            })
            .filter(a => {
                return !!a;
            });

        const stakeAsset = new Asset({
            asset_id: BCO_ASSET_ID,
            precision: BCO_ASSET_PRECISION,
            amount: 0
        });

        return (
            <div className="grid-content" ref="appTables">
                <div className="content-block small-12">
                    <AccountStakeCreateNew
                        account={this.props.account}
                        balances={this.props.balances}
                        asset={stakeAsset}
                        gateFee={this.props.gateFee}
                    />

                    {!balances.length ? (
                        <h4 style={{paddingTop: "1rem"}}>
                            <Translate
                                content={"cryptobridge.account.no_balances"}
                            />
                        </h4>
                    ) : (
                        balances
                    )}
                </div>
            </div>
        );
    }
}

AccountStaking.VestingBalance = VestingBalance;
export default AccountStaking;
