import React from "react";
import counterpart from "counterpart";
import {IssuesEnum} from "../Constants";
import CoinsDropdown from "../CoinsDropdown";
import ExplorerCheck from "../ExplorerCheck";
import {log} from "../SupportUtils";
import config from "../../../../config";
import ReCAPTCHA from "../../Utility/ReCAPTCHA";

/**
 * Gets a Deposit Trading Pair for the specified coin type
 * @param coinType
 * @param tradingPairs
 * @returns {*}
 */
const getDepositTradingPair = (coinType, tradingPairs) =>
    tradingPairs.filter(
        tradingPair => tradingPair.inputCoinType === coinType.toLowerCase()
    );

/**
 * Gets a Withdrawal Trading Pair for the specified coin type
 * @param coinType
 * @param tradingPairs
 * @returns {*}
 */
const getWithdrawalTradingPair = (coinType, tradingPairs) =>
    tradingPairs.filter(
        tradingPair => tradingPair.outputCoinType === coinType.toLowerCase()
    );

/**
 * Gets the Disabled Coins message for the selected coin and IssueId
 * @param issueId
 * @param selectedCoin
 * @param tradingPairs
 * @returns {*}
 */
const getDisabledCoinsMessage = (
    issueId,
    selectedCoin = null,
    tradingPairs
) => {
    try {
        if (issueId !== -1 && selectedCoin !== null && selectedCoin !== null) {
            const {coinType} = selectedCoin;

            if (issueId === IssuesEnum.DEPOSIT) {
                const tradingPair = getDepositTradingPair(
                    coinType,
                    tradingPairs
                )[0];
                if (tradingPair.disabled) {
                    return tradingPair.message
                        ? tradingPair.message
                        : counterpart.translate(
                              "cryptobridge.support.disabled_deposits_message"
                          );
                }
            } else if (issueId === IssuesEnum.WITHDRAWAL) {
                const tradingPair = getWithdrawalTradingPair(
                    coinType,
                    tradingPairs
                )[0];
                if (tradingPair.disabled) {
                    return tradingPair.message
                        ? tradingPair.message
                        : counterpart.translate(
                              "cryptobridge.support.disabled_withdrawals_message"
                          );
                }
            } else {
                log(
                    `DepositWithdrawForm.jsx:getDisabledCoinsMessage() - unknown IssueID (${issueId})`
                );
            }
        }
    } catch (err) {
        log(
            `DepositWithdrawForm.jsx:getDisabledCoinsMessage() - catch error (${err})`
        );
    }

    return null;
};

class DepositWithdrawForm extends React.Component {
    state = {
        selectedIssueId: -1,
        disabledCoinsMessage: null,
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

    componentDidMount() {
        const coinsUrl = config.support.coinsApi.url;
        const tradingPairsUrl = config.support.tradingPairsApi.url;

        const coinsPromise = fetch(coinsUrl).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                log(
                    `DepositWithdrawForm.jsx:componentDidMount() - Could not get coins from "${coinsUrl}" (${JSON.stringify(
                        response
                    )})`
                );
                throw new Error(`Could not get coins from "${coinsUrl}"`);
            }
        });

        const tradingPairsPromise = fetch(tradingPairsUrl).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                log(
                    `DepositWithdrawForm.jsx:componentDidMount() - Could not get trading pairs from "${tradingPairsUrl}" (${JSON.stringify(
                        response
                    )})`
                );
                throw new Error(
                    `Could not get trading pairs from "${tradingPairsUrl}"`
                );
            }
        });

        Promise.all([coinsPromise, tradingPairsPromise])
            .then(([coins, tradingPairs]) => {
                this.setState({
                    coins,
                    tradingPairs
                });
            })
            .catch(error => {
                log(
                    `DepositWithdrawForm.jsx:componentDidMount() - Coins/TradingPairs Promise catch() error (${error})`
                );
            });
    }

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
        if (nextProps.selectedIssueId !== prevState.selectedIssueId) {
            const disabledCoinsMessage = prevState.selectedCoin
                ? getDisabledCoinsMessage(
                      nextProps.selectedIssueId,
                      prevState.selectedCoin,
                      prevState.tradingPairs
                  )
                : null;

            return {
                selectedIssueId: nextProps.selectedIssueId,
                disabledCoinsMessage,
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
        const disabledCoinsMessage = getDisabledCoinsMessage(
            this.props.selectedIssueId,
            selectedCoin,
            this.state.tradingPairs
        );

        this.setState({
            selectedCoin,
            disabledCoinsMessage,
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
                <CoinsDropdown
                    coins={this.state.coins}
                    selected={
                        this.state.selectedCoin
                            ? this.state.selectedCoin.coinType
                            : -1
                    }
                    onChange={this._handleCoinChange}
                />
                <div style={{color: "red", marginBottom: 20}}>
                    {this.state.disabledCoinsMessage}
                </div>
                {this.state.selectedCoin !== null && (
                    <div>
                        {this.props.selectedIssueId ===
                            IssuesEnum.WITHDRAWAL && (
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
                                            recipientAddress: event.target.value
                                        })
                                    }
                                />
                            </label>
                        )}
                        {!this.state.transactionNotFound &&
                        this.state.selectedCoin &&
                        this.state.selectedCoin ? (
                            <ExplorerCheck
                                transferType={this.props.selectedIssueId}
                                data={this.state.recipientAddress}
                                selectedCoin={this.state.selectedCoin}
                                onNotFound={() =>
                                    this.setState({transactionNotFound: true})
                                }
                            />
                        ) : null}

                        {((this.props.selectedIssueId ===
                            IssuesEnum.WITHDRAWAL &&
                            this.state.transactionNotFound) ||
                            this.props.selectedIssueId ===
                                IssuesEnum.DEPOSIT) && (
                            <label htmlFor="transaction_id">
                                <span>
                                    {counterpart.translate(
                                        "cryptobridge.support.transaction_id"
                                    )}
                                </span>
                                <div className="label-hint">
                                    {this.props.selectedIssueId ===
                                    IssuesEnum.WITHDRAWAL
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
                                        this.props.selectedIssueId ===
                                        IssuesEnum.DEPOSIT
                                    }
                                    placeholder={counterpart.translate(
                                        "cryptobridge.support.enter_transaction_id"
                                    )}
                                    onChange={this._handleTransactionIdChange}
                                />
                            </label>
                        )}
                        {!this.state.transactionNotFound &&
                            this.props.selectedIssueId ===
                                IssuesEnum.DEPOSIT && (
                                <ExplorerCheck
                                    transferType={this.props.selectedIssueId}
                                    data={this.state.transactionId}
                                    selectedCoin={this.state.selectedCoin}
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
                                                amount: event.target.value
                                            })
                                        }
                                    />
                                </label>
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
                )}
            </div>
        );
    }
}

export default DepositWithdrawForm;
