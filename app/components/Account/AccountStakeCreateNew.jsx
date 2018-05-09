import React from "react";
import {debounce} from "lodash";

import utils from "common/utils";
import counterpart from "counterpart";

import AmountSelector from "../Utility/AmountSelector";
import {Asset} from "common/MarketClasses";
import BalanceComponent from "../Utility/BalanceComponent";

import CryptoBridgeActions from "actions/CryptoBridgeActions";

import Translate from "react-translate-component";

import {checkFeeStatusAsync, checkBalance} from "common/trxHelper";

class AccountStakeCreateNew extends React.Component {
    static propTypes = {};

    static defaultProps = {};

    constructor(props) {
        super();

        this.state = {
            feeStatus: {},
            asset: props.asset,
            stakingPeriodValue: 2678400,
            confirmationCheckboxChecked: false,
            showValidationErrors: false
        };

        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
        this._getCurrentBalance = this._getCurrentBalance.bind(this);
        this._getFee = this._getFee.bind(this);
        this._onAmountChanged = this._onAmountChanged.bind(this);
        this._updateFee = debounce(this._updateFee.bind(this), 250);
    }

    componentWillMount() {
        this._updateFee();
        this._checkFeeStatus();
    }

    _checkFeeStatus(account = this.props.account) {
        if (!account) return;

        const assets = ["1.3.0", this.state.asset.asset_id];
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(
                checkFeeStatusAsync({
                    accountID: account.get("id"),
                    feeID: a,
                    type: "vesting_balance_create"
                })
            );
        });
        Promise.all(p)
            .then(status => {
                assets.forEach((a, idx) => {
                    feeStatus[a] = status[idx];
                });
                if (!utils.are_equal_shallow(this.state.feeStatus, feeStatus)) {
                    this.setState({
                        feeStatus
                    });
                }
                this._checkBalance();
            })
            .catch(err => {
                console.error(err);
            });
    }

    _updateFee() {
        if (!this.props.account) return null;
        checkFeeStatusAsync({
            accountID: this.props.account.get("id"),
            feeID: this.state.asset.asset_id,
            type: "vesting_balance_create"
        }).then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState(
                {
                    feeAmount: fee,
                    hasBalance,
                    hasPoolBalance,
                    error: !hasBalance || !hasPoolBalance
                },
                this._checkFeeStatus
            );
        });
    }

    _getCurrentBalance() {
        return this.props.balances.find(b => {
            return b && b.get("asset_type") === this.state.asset.asset_id;
        });
    }

    _checkBalance() {
        const {feeAmount, asset} = this.state;
        const balance = this._getCurrentBalance();
        if (!balance || !feeAmount) return;
        const hasBalance = checkBalance(
            asset.getAmount({real: true}),
            asset,
            this._getFee(),
            balance,
            this._getGateFee()
        );
        if (hasBalance === null) return;
        if (this.state.balanceError !== !hasBalance)
            this.setState({balanceError: !hasBalance});

        return hasBalance;
    }

    _getFee() {
        const defaultFee = {
            getAmount: function() {
                return 0;
            },
            asset_id: this.state.asset.asset_id
        };

        if (!this.state.feeStatus || !this.state.feeAmount) return defaultFee;

        const coreStatus = this.state.feeStatus["1.3.0"];
        const withdrawAssetStatus = this.state.feeStatus[
            this.state.asset.asset_id
        ];
        // Use core asset to pay the fees if present and balance is sufficient since it's cheapest
        if (coreStatus && coreStatus.hasBalance) return coreStatus.fee;
        // Use same asset as withdraw if not
        if (
            coreStatus &&
            !coreStatus.hasBalance &&
            withdrawAssetStatus &&
            withdrawAssetStatus.hasBalance
        ) {
            return withdrawAssetStatus.fee;
        }
        return coreStatus ? coreStatus.fee : defaultFee;
    }

    _getGateFee() {
        const {gateFee} = this.props;
        const {asset} = this.state;
        return new Asset({
            real: parseFloat(gateFee ? gateFee.replace(",", "") : 0),
            asset_id: asset.asset_id,
            precision: asset.precision
        });
    }

    _onAmountChanged = ({amount}) => {
        const {asset} = this.state;

        asset.setAmount({
            real: parseFloat(amount)
        });

        this.setState({
            asset
        });
    };

    _setTotalStakeAmount = currentBalance => {
        const {feeAmount, asset} = this.state;

        const amount =
            currentBalance && feeAmount
                ? parseFloat(
                      currentBalance.get("balance") /
                          Math.pow(10, asset.precision) -
                          feeAmount.getAmount({real: true})
                  ).toFixed(asset.precision)
                : 0;

        asset.setAmount({
            real: parseFloat(amount)
        });

        this.setState({
            asset
        });
    };

    _setStakingPeriod = stakingPeriodValue => {
        this.setState({
            stakingPeriodValue: parseInt(stakingPeriodValue.target.value, 10)
        });
    };

    _stakeBalance = () => {
        if (!this.state.confirmationCheckboxChecked) {
            this.setState({
                showValidationErrors: true
            });
        } else {
            const {account} = this.props;
            const {asset, stakingPeriodValue} = this.state;

            CryptoBridgeActions.stakeBalance(
                account.get("id"),
                stakingPeriodValue,
                asset.getAmount({real: true})
            );
        }
    };

    _onUnderstandCheckboxChange = () => {
        this.setState({
            confirmationCheckboxChecked: !this.state.confirmationCheckboxChecked
        });
    };

    render() {
        const {
            feeAmount,
            asset,
            showValidationErrors,
            stakingPeriodValue,
            confirmationCheckboxChecked
        } = this.state;

        const fee = (feeAmount && feeAmount.getAmount({real: true})) || 0;
        const reclaimFee =
            ((feeAmount && feeAmount.getAmount({real: true})) || 0) * 2;
        const currentBalance = this._getCurrentBalance();
        const amount = asset.getAmount({real: true});

        const balance = (
            <span
                style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}}
                onClick={this._setTotalStakeAmount.bind(this, currentBalance)}
            >
                {" "}
                {currentBalance && currentBalance.get("balance") ? (
                    <span>
                        <Translate
                            component="span"
                            content="cryptobridge.account.bco_available"
                        />
                        <BalanceComponent balance={currentBalance.get("id")} />
                    </span>
                ) : (
                    <Translate
                        component="span"
                        content="cryptobridge.account.bco_not_available"
                    />
                )}{" "}
            </span>
        );

        const stakingPeriods = [
            {
                name1: "cryptobridge.account.month_1",
                bonus: "0%",
                name: counterpart.translate("cryptobridge.account.month_1", {
                    bonus: "0%"
                }),
                monthName: counterpart.translate(
                    "cryptobridge.account.month_1_plural"
                ),
                value: 2678400
            },
            {
                name1: "cryptobridge.account.month_3",
                bonus: "20%",
                name: counterpart.translate("cryptobridge.account.month_3", {
                    bonus: "20%"
                }),
                monthName: counterpart.translate(
                    "cryptobridge.account.month_3_plural"
                ),
                value: 7776000
            },
            {
                name1: "cryptobridge.account.month_6",
                bonus: "50%",
                name: counterpart.translate("cryptobridge.account.month_6", {
                    bonus: "50%"
                }),
                monthName: counterpart.translate(
                    "cryptobridge.account.month_6_plural"
                ),
                value: 15552000
            },
            {
                name1: "cryptobridge.account.month_12",
                bonus: "100%",
                name: counterpart.translate("cryptobridge.account.month_12", {
                    bonus: "100%"
                }),
                monthName: counterpart.translate(
                    "cryptobridge.account.month_12_plural"
                ),
                value: 31536000
            }
        ];

        const stakingPeriod = stakingPeriods.find(period => {
            return period.value === stakingPeriodValue;
        });

        return (
            <div>
                <Translate
                    component="h2"
                    content="cryptobridge.account.title"
                />
                <Translate
                    component="p"
                    content="cryptobridge.account.staking_text1"
                    with={{percent: "50%"}}
                    unsafe
                />
                <Translate
                    component="p"
                    content="cryptobridge.account.staking_text2"
                    with={{
                        fee,
                        reclaimFee
                    }}
                    unsafe
                />
                <Translate
                    component="p"
                    content="cryptobridge.account.staking_text3"
                    unsafe
                />

                <div className="grid-block no-margin small-12 medium-6">
                    <Translate
                        component="label"
                        unsafe
                        content="cryptobridge.account.amount_bco"
                    />
                    <AmountSelector
                        label="transfer.amount"
                        amount={amount}
                        display_balance={balance}
                        onChange={this._onAmountChanged.bind(this)}
                        asset={asset.asset_id}
                        assets={[asset.asset_id]}
                        placeholder="0.0"
                        tabIndex={0}
                        style={{
                            width: "100%"
                        }}
                    />
                </div>
                <div className="grid-block no-margin small-12 medium-6">
                    <Translate
                        component="label"
                        style={{marginTop: "1rem"}}
                        content="cryptobridge.account.length"
                    />
                    <select
                        role="combobox"
                        onChange={this._setStakingPeriod}
                        value={stakingPeriodValue}
                    >
                        {stakingPeriods.map((p, i) => {
                            return (
                                <option
                                    key={"stakingPeriod" + i}
                                    value={p.value}
                                >
                                    {counterpart.translate(p.name1, {
                                        bonus: p.bonus
                                    })}
                                </option>
                            );
                        })}
                    </select>

                    {amount > 0 ? (
                        <label
                            className={
                                showValidationErrors &&
                                !confirmationCheckboxChecked
                                    ? "has-error"
                                    : ""
                            }
                        >
                            <input
                                type="checkbox"
                                onChange={this._onUnderstandCheckboxChange.bind(
                                    this
                                )}
                                checked={confirmationCheckboxChecked}
                            />
                            {counterpart("cryptobridge.account.understand", {
                                amount,
                                month: stakingPeriod.monthName
                            })}
                        </label>
                    ) : null}

                    <div style={{width: "100%", textAlign: "right"}}>
                        <button
                            onClick={this._stakeBalance.bind(this)}
                            className="button"
                        >
                            <Translate content="cryptobridge.account.stake_bco" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AccountStakeCreateNew;
