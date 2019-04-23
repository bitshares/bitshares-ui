import React from "react";
import counterpart from "counterpart";
import {connect} from "alt-react";

import {ISSUES} from "../Constants";
import CoinsDropdown from "../CoinsDropdown";
import GatewayStore from "stores/GatewayStore";
import ExplorerCheck from "../ExplorerCheck";
import ReCAPTCHA from "../../Utility/ReCAPTCHA";
import AssetInfo from "../../Utility/AssetInfo";
import AssetTradingPairInfo from "../../Utility/AssetTraidingPairInfo";

class DepositWithdrawForm extends React.Component {
    state = {
        selectedIssueType: -1,
        selectedCoin: null,
        //explorerUrl: "",
        transactionId: "",
        transactionNotFound: false,
        amount: "",
        recipientAddress: "",
        subject: "",
        message: "",
        coins: [],
        tradingPairs: [],
        reCaptchaToken: null
    };

    getReducedState = state => {
        const {
            selectedCoin,
            transactionId,
            amount,
            recipientAddress,
            subject,
            message,
            reCaptchaToken
        } = state;

        return {
            selectedCoin,
            transactionId,
            amount,
            recipientAddress,
            subject,
            message,
            reCaptchaToken
        };
    };

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.onChange &&
            JSON.stringify(this.getReducedState(prevState)) !==
                JSON.stringify(this.getReducedState(this.state))
        ) {
            this.props.onChange(this.getReducedState(this.state));
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.selectedIssueType !== prevState.selectedIssueType) {
            return {
                selectedIssueType: nextProps.selectedIssueType,
                //explorerUrl: "",
                transactionId: "",
                transactionNotFound: false,
                amount: "",
                recipientAddress: "",
                message: ""
            };
        }

        return null;
    }

    /**
     * Handles the coin selection change
     *
     * @param selectedCoin
     * @private
     */
    _handleCoinChange = selectedCoin => {
        this.setState({
            selectedCoin,
            //explorerUrl,
            transactionNotFound: false
        });
    };

    /**
     * Handles the change of TransactionId
     *
     * @param event
     * @private
     */
    _handleTransactionIdChange = event => {
        const transactionId = event.target.value;

        this.setState({
            transactionId,
            //explorerUrl,
            transactionNotFound: false
        });
    };

    _onRecaptchaChange = token => {
        this.setState({reCaptchaToken: token});
    };

    render() {
        return (
            <div>
                {[ISSUES.DEPOSIT, ISSUES.WITHDRAWAL].indexOf(
                    this.state.selectedIssueType
                ) !== -1 && (
                    <div>
                        <CoinsDropdown
                            coins={this.props.cryptoBridgeBackedCoins}
                            selected={
                                this.state.selectedCoin
                                    ? this.state.selectedCoin.backingCoinType
                                    : -1
                            }
                            onChange={this._handleCoinChange}
                        />
                        {this.state.selectedCoin !== null && (
                            <div>
                                <AssetTradingPairInfo
                                    asset={this.state.selectedCoin}
                                    deposit={
                                        this.props.selectedIssueType ===
                                        ISSUES.DEPOSIT
                                    }
                                />
                                <AssetInfo
                                    asset={this.state.selectedCoin}
                                    type={
                                        this.props.selectedIssueType ===
                                        ISSUES.DEPOSIT
                                            ? "deposit"
                                            : "withdrawal"
                                    }
                                />
                                {this.props.selectedIssueType ===
                                    ISSUES.WITHDRAWAL && (
                                    <label htmlFor="recipient_address">
                                        <span>
                                            {counterpart.translate(
                                                "cryptobridge.support.recipient_address"
                                            )}
                                        </span>
                                        <input
                                            id="recipient_address"
                                            name="recipient_address"
                                            type="text"
                                            required
                                            placeholder={counterpart.translate(
                                                "cryptobridge.support.enter_recipient_address"
                                            )}
                                            onChange={event =>
                                                this.setState({
                                                    recipientAddress:
                                                        event.target.value
                                                })
                                            }
                                        />
                                    </label>
                                )}
                                {!this.state.transactionNotFound &&
                                this.state.selectedCoin &&
                                this.state.selectedCoin ? (
                                    <ExplorerCheck
                                        transferType={
                                            this.props.selectedIssueType
                                        }
                                        data={this.state.recipientAddress}
                                        selectedCoin={this.state.selectedCoin}
                                        onNotFound={() =>
                                            this.setState({
                                                transactionNotFound: true
                                            })
                                        }
                                    />
                                ) : null}

                                {((this.props.selectedIssueType ===
                                    ISSUES.WITHDRAWAL &&
                                    this.state.transactionNotFound) ||
                                    this.props.selectedIssueType ===
                                        ISSUES.DEPOSIT) && (
                                    <label htmlFor="transaction_id">
                                        <span>
                                            {counterpart.translate(
                                                "cryptobridge.support.transaction_id"
                                            )}
                                        </span>
                                        <div className="label-hint">
                                            {this.props.selectedIssueType ===
                                            ISSUES.WITHDRAWAL
                                                ? ` (${counterpart.translate(
                                                      "cryptobridge.support.format"
                                                  )}: "1.11.x")`
                                                : ""}
                                        </div>
                                        <input
                                            id="transaction_id"
                                            name="transaction_id"
                                            type="text"
                                            required={
                                                this.props.selectedIssueType ===
                                                ISSUES.DEPOSIT
                                            }
                                            placeholder={counterpart.translate(
                                                "cryptobridge.support.enter_transaction_id"
                                            )}
                                            onChange={
                                                this._handleTransactionIdChange
                                            }
                                        />
                                    </label>
                                )}
                                {!this.state.transactionNotFound &&
                                    this.props.selectedIssueType ===
                                        ISSUES.DEPOSIT && (
                                        <ExplorerCheck
                                            transferType={
                                                this.props.selectedIssueType
                                            }
                                            data={this.state.transactionId}
                                            selectedCoin={
                                                this.state.selectedCoin
                                            }
                                            onNotFound={() =>
                                                this.setState({
                                                    transactionNotFound: true
                                                })
                                            }
                                        />
                                    )}
                                {!this.state.transactionNotFound && (
                                    <div>
                                        <label htmlFor="coin_amount">
                                            <span>
                                                {counterpart.translate(
                                                    "cryptobridge.support.amount"
                                                )}
                                            </span>
                                            <input
                                                id="coin_amount"
                                                name="coin_amount"
                                                type="text"
                                                placeholder={counterpart.translate(
                                                    "cryptobridge.support.enter_amount"
                                                )}
                                                required
                                                value={this.state.amount}
                                                onChange={event =>
                                                    this.setState({
                                                        amount:
                                                            event.target.value
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {(this.props.selectedIssueType === ISSUES.OTHER ||
                    (this.state.selectedCoin !== null &&
                        !this.state.transactionNotFound)) && (
                    <div>
                        <label htmlFor="modal-new-ticket__message">
                            <span>
                                {counterpart.translate(
                                    "cryptobridge.support.message"
                                )}
                            </span>
                            <textarea
                                id="modal-new-ticket__message"
                                name="modal-new-ticket__message"
                                className="modal-new-ticket__message"
                                onChange={event =>
                                    this.setState({
                                        message: event.target.value
                                    })
                                }
                                placeholder={counterpart.translate(
                                    "cryptobridge.support.enter_your_message"
                                )}
                            />
                        </label>
                        <div style={{marginTop: "1rem"}}>
                            <ReCAPTCHA
                                onChange={this._onRecaptchaChange}
                                payload={{user: this.props.account}}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default connect(DepositWithdrawForm, {
    listenTo() {
        return [GatewayStore];
    },
    getProps() {
        return {
            cryptoBridgeBackedCoins: GatewayStore.getState().backedCoins.get(
                "BRIDGE",
                []
            )
        };
    }
});
