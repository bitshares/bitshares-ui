import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import {ChainStore} from "bitsharesjs";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";
import {Button} from "bitshares-ui-style-guide";

function VestingBalanceView({
    vestingAsset,
    vestingType,
    vestingId,
    vestingBalance,
    coinDaysEarned,
    coinDaysRequired,
    coinDaysRemaining,
    availablePercent,
    canClaim,
    isCoinDays,
    onClaim
}) {
    return (
        <div>
            <Translate
                component="h5"
                content="account.vesting.balance_number"
                id={vestingId}
            />

            <table className="table key-value-table">
                <tbody>
                    <tr>
                        <td>
                            <Translate content="account.member.balance_type" />
                        </td>
                        <td>
                            <Translate
                                component="span"
                                content={"account.vesting.type." + vestingType}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Translate content="account.member.cashback" />
                        </td>
                        <td>
                            <FormattedAsset
                                amount={vestingBalance}
                                asset={vestingAsset}
                            />
                        </td>
                    </tr>
                    {coinDaysEarned ? (
                        <tr>
                            <td>
                                <Translate content="account.member.earned" />
                            </td>
                            <td>
                                {coinDaysEarned}
                                &nbsp;
                                <Translate
                                    content={
                                        isCoinDays
                                            ? "account.member.coindays"
                                            : "account.member.days"
                                    }
                                />
                            </td>
                        </tr>
                    ) : null}
                    {coinDaysRequired ? (
                        <tr>
                            <td>
                                <Translate content="account.member.required" />
                            </td>
                            <td>
                                {coinDaysRequired}
                                &nbsp;
                                <Translate
                                    content={
                                        isCoinDays
                                            ? "account.member.coindays"
                                            : "account.member.days"
                                    }
                                />
                            </td>
                        </tr>
                    ) : null}
                    {coinDaysRemaining ? (
                        <tr>
                            <td>
                                <Translate content="account.member.remaining" />
                            </td>
                            <td>
                                {coinDaysRemaining}
                                &nbsp;
                                <Translate content="account.member.days" />
                            </td>
                        </tr>
                    ) : null}
                    {availablePercent ? (
                        <tr>
                            <td>
                                <Translate content="account.member.available" />
                            </td>
                            <td>
                                {(availablePercent * 100).toFixed(2)}% /{" "}
                                <FormattedAsset
                                    amount={availablePercent * vestingBalance}
                                    asset={vestingAsset}
                                />
                            </td>
                        </tr>
                    ) : null}
                    <tr>
                        <td colSpan="2" style={{textAlign: "right"}}>
                            {canClaim ? (
                                <Button
                                    onClick={onClaim.bind(this, false)}
                                    type="primary"
                                >
                                    <Translate content="account.member.claim" />
                                </Button>
                            ) : null}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

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
            balance,
            available_percentage = 0,
            days_earned = 0,
            days_required = 0,
            days_remaining = 0,
            isCoinDays = true,
            canClaim = true;

        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);

            if (vb.policy && vb.policy[0] !== 2) {
                let start = Math.floor(
                    new Date(vb.policy[1].start_claim + "Z").getTime() / 1000
                );
                let now = Math.floor(new Date().getTime() / 1000);

                if (start > 0) {
                    // Vesting has a specific start date.
                    // Vesting with locked value required to mautre fully before claiming
                    // Full vesting period must pass before it can be claimed.
                    // Calculate days left before a claim is possible
                    // Example asset is BRIDGE.BCO - 1.3.1564

                    isCoinDays = false;

                    let seconds_earned = now - start;
                    let seconds_period = vb.policy[1].vesting_seconds;

                    if (seconds_earned < seconds_period) {
                        canClaim = false;
                        days_earned = parseFloat(
                            seconds_earned / 86400
                        ).toFixed(2);
                        days_required = parseFloat(
                            seconds_period / 86400
                        ).toFixed(2);
                        days_remaining = (days_required - days_earned).toFixed(
                            2
                        );
                    }
                } else {
                    // Vesting has no start time.
                    // Vesting balances has a vesting with maturing value
                    // If period is 0 we expect a 100% claimable balance
                    // otherwise we expect to be allowed to claim the matured percentage.

                    // Core is lazy calculating the vesting balance object, so we
                    // need to account for the time passed since it was last updated
                    let seconds_last_updated = Math.floor(
                        new Date(
                            vb.policy[1].coin_seconds_earned_last_update + "Z"
                        ).getTime() / 1000
                    );
                    let seconds_earned =
                        parseFloat(vb.policy[1].coin_seconds_earned) +
                        balance * (now - seconds_last_updated);
                    let seconds_period = vb.policy[1].vesting_seconds;

                    available_percentage =
                        seconds_period === 0
                            ? 1
                            : seconds_earned / (seconds_period * balance);

                    // Make sure we don't go over 1
                    available_percentage =
                        available_percentage > 1 ? 1 : available_percentage;

                    days_earned = utils.format_number(
                        utils.get_asset_amount(
                            seconds_earned / 86400,
                            cvbAsset
                        ),
                        0
                    );
                    days_required = utils.format_number(
                        utils.get_asset_amount(
                            (vb.balance.amount * seconds_period) / 86400,
                            cvbAsset
                        ),
                        0
                    );
                    days_remaining = utils.format_number(
                        (seconds_period * (1 - available_percentage)) / 86400 ||
                            0,
                        2
                    );
                }
            }
        }

        if (!cvbAsset || !balance) return null;

        return (
            <VestingBalanceView
                vestingId={vb.id}
                vestingAsset={vb.balance.asset_id}
                vestingType={vb.balance_type}
                vestingBalance={vb.balance.amount}
                coinDaysEarned={days_earned}
                coinDaysRequired={days_required}
                coinDaysRemaining={days_remaining}
                availablePercent={available_percentage}
                canClaim={canClaim}
                isCoinDays={isCoinDays}
                onClaim={this._onClaim.bind(this)}
            />
        );
    }
}

class AccountVesting extends React.Component {
    constructor() {
        super();

        this.state = {
            vesting_balances: null
        };
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentDidUpdate(prevProps) {
        let newId = prevProps.account.get("id");
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
            .then(vesting_balances => {
                this.setState({vesting_balances});
            })
            .catch(err => {
                console.log("error:", err);
            });
    }

    render() {
        let {vesting_balances} = this.state;
        if (
            !vesting_balances ||
            !this.props.account ||
            !this.props.account.get("vesting_balances")
        ) {
            return null;
        }

        let balances = vesting_balances
            .map(vb => {
                if (vb.balance.amount) {
                    return (
                        <VestingBalance
                            key={vb.id}
                            vb={vb}
                            account={this.props.account.toJS()}
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

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div
                    className="grid-block main-content margin-block wrap"
                    style={{margin: 0}}
                >
                    <div className="grid-content">
                        <Translate
                            component="h1"
                            content="account.vesting.title"
                        />
                        <Translate
                            content="account.vesting.explain"
                            component="p"
                        />
                        {!balances.length ? (
                            <h4 style={{paddingTop: "1rem"}}>
                                <Translate
                                    content={"account.vesting.no_balances"}
                                />
                            </h4>
                        ) : (
                            balances
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

AccountVesting.VestingBalance = VestingBalance;
export default AccountVesting;
