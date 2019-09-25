import counterpart from "counterpart";
import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import AccountBalance from "../../Account/AccountBalance";
import WithdrawModalCitadel from "./WithdrawModalCitadel";
import CitadelDepositAddressCache from "common/CitadelDepositAddressCache";
import utils from "common/utils";
import AccountActions from "actions/AccountActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {citadelAPIs} from "api/apiConfig";
import {debounce} from "lodash-es";
import {checkFeeStatusAsync, checkBalance} from "common/trxHelper";
import {Asset} from "common/MarketClasses";
import {ChainStore} from "tuscjs/es";
import {getConversionJson} from "common/gatewayMethods";
import PropTypes from "prop-types";
import {Modal} from "bitshares-ui-style-guide";

class ButtonWithdraw extends React.Component {
    static propTypes = {
        balance: ChainTypes.ChainObject,
        url: PropTypes.string.isRequired
    };

    getWithdrawModalId() {
        return "withdraw_asset_" + this.props.gateway + "_bridge";
    }

    onWithdraw() {
        this.props.showModal();
    }

    render() {
        let withdraw_modal_id = this.getWithdrawModalId();

        let button_class = "button disabled";
        if (
            Object.keys(this.props.account.get("balances").toJS()).includes(
                this.props.asset.get("id")
            )
        ) {
            if (
                !!this.props.amount_to_withdraw &&
                !(this.props.amount_to_withdraw.indexOf(" ") >= 0) &&
                !isNaN(this.props.amount_to_withdraw) &&
                this.props.amount_to_withdraw > 0 &&
                this.props.amount_to_withdraw <=
                    this.props.balance.toJS().balance /
                        utils.get_asset_precision(
                            this.props.asset.get("precision")
                        )
            ) {
                button_class = "button";
            }
        }

        return (
            <span>
                <span>
                    <button
                        className={button_class}
                        onClick={this.onWithdraw.bind(this)}
                    >
                        <Translate content="" />
                        <Translate content="gateway.withdraw_now" />{" "}
                    </button>
                </span>
                <Modal
                    title={counterpart.translate("gateway.withdraw_coin", {
                        coin: this.props.output_coin_name,
                        symbol: this.props.output_coin_symbol
                    })}
                    visible={this.props.visible}
                    onCancel={this.props.hideModal}
                    footer={null}
                >
                    <WithdrawModalCitadel
                        showModal={this.props.showModal}
                        hideModal={this.props.hideModal}
                        key={`${this.props.key}`}
                        account={this.props.account.get("name")}
                        issuer={this.props.issuer}
                        asset={this.props.asset.get("id")}
                        output_coin_name={this.props.output_coin_name}
                        output_coin_symbol={this.props.output_coin_symbol}
                        output_coin_type={this.props.output_coin_type}
                        output_supports_memos={this.props.output_supports_memos}
                        amount_to_withdraw={this.props.amount_to_withdraw}
                        modal_id={withdraw_modal_id}
                        url={this.props.url}
                        output_wallet_type={this.props.output_wallet_type}
                        balance={
                            this.props.account.get("balances").toJS()[
                                this.props.asset.get("id")
                            ]
                        }
                    />
                </Modal>
            </span>
        );
    }
}

ButtonWithdraw = BindToChainState(ButtonWithdraw);

class ButtonWithdrawContainer extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        output_coin_type: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired
    };

    render() {
        let withdraw_button = (
            <ButtonWithdraw
                showModal={this.props.showModal}
                hideModal={this.props.hideModal}
                visible={this.props.visible}
                key={this.props.key}
                account={this.props.account}
                issuer={this.props.issuer}
                asset={this.props.asset}
                output_coin_name={this.props.output_coin_name}
                output_coin_symbol={this.props.output_coin_symbol}
                output_coin_type={this.props.output_coin_type}
                output_supports_memos={this.props.output_supports_memos}
                amount_to_withdraw={this.props.amount_to_withdraw}
                url={this.props.url}
                gateway={this.props.gateway}
                output_wallet_type={this.props.output_wallet_type}
                balance={
                    this.props.account.get("balances").toJS()[
                        this.props.asset.get("id")
                    ]
                }
            />
        );

        return <span>{withdraw_button}</span>;
    }
}

ButtonWithdrawContainer = BindToChainState(ButtonWithdrawContainer);

class CitadelBridgeDepositRequest extends React.Component {
    static propTypes = {
        url: PropTypes.string,
        gateway: PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        initial_deposit_input_coin_type: PropTypes.string,
        initial_deposit_output_coin_type: PropTypes.string,
        initial_deposit_estimated_input_amount: PropTypes.string,
        initial_withdraw_input_coin_type: PropTypes.string,
        initial_withdraw_output_coin_type: PropTypes.string,
        initial_withdraw_estimated_input_amount: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.refresh_interval = 2 * 60 * 1000; // update deposit limit/estimates every two minutes

        this.deposit_address_cache = new CitadelDepositAddressCache();

        this.coin_info_request_states = {
            request_in_progress: 0,
            request_complete: 1,
            request_failed: 2
        };

        this.estimation_directions = {
            output_from_input: 0,
            input_from_output: 1
        };

        this.state = {
            isModalVisible: false,
            coin_symbol: "xmr",
            key_for_withdrawal_dialog: "xmr",
            supports_output_memos: "",
            url: citadelAPIs.BASE,
            error: null,

            // things that get displayed for deposits
            deposit_input_coin_type: null,
            deposit_output_coin_type: null,
            input_address_and_memo: null,
            deposit_estimated_input_amount:
                this.props.initial_deposit_estimated_input_amount || "1.0",
            deposit_estimated_output_amount: null,
            deposit_limit: null,
            deposit_error: null,
            failed_calculate_deposit: null,

            // things that get displayed for withdrawals
            withdraw_input_coin_type: null,
            withdraw_output_coin_type: null,
            withdraw_estimated_input_amount:
                this.props.initial_withdraw_estimated_input_amount || "1.0",
            withdraw_estimated_output_amount: null,
            withdraw_limit: null,
            withdraw_error: null,
            failed_calculate_withdraw: null,

            // input address-related
            coin_info_request_state: this.coin_info_request_states
                .request_in_progress,
            input_address_requests_in_progress: {},

            // estimate-related
            deposit_estimate_direction: this.estimation_directions
                .output_from_input,

            // deposit limit-related
            deposit_limit_cache: {},
            deposit_limit_requests_in_progress: {},

            // generic data from BlockTrades
            coins_by_type: null,
            allowed_mappings_for_deposit: null,
            allowed_mappings_for_withdraw: null,

            // announcements data
            announcements: []
        };

        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    urlConnection(checkUrl, state_coin_info) {
        this.setState({
            url: checkUrl
        });

        // get basic data from citadel
        let coin_types_url = checkUrl + "/coins";
        let coin_types_promise = fetch(coin_types_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        let wallet_types_url = checkUrl + "/wallets";
        let wallet_types_promise = fetch(wallet_types_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        let trading_pairs_url = checkUrl + "/trading-pairs";
        let trading_pairs_promise = fetch(trading_pairs_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        let active_wallets_url = checkUrl + "/active-wallets";
        let active_wallets_promise = fetch(active_wallets_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        Promise.all([
            coin_types_promise,
            wallet_types_promise,
            trading_pairs_promise,
            active_wallets_promise
        ])
            .then(json_responses => {
                let [
                    coin_types,
                    wallet_types_reply,
                    trading_pairs,
                    active_wallets
                ] = json_responses;

                // get quick access to coins by their types
                let coins_by_type = {};
                coin_types.forEach(
                    coin_type => (coins_by_type[coin_type.coinType] = coin_type)
                );

                // determine which mappings we will display for deposits and withdrawals
                let allowed_mappings_for_deposit = {}; // all non-bts to bts
                let allowed_mappings_for_withdraw = {}; // all bts to non-bts
                trading_pairs.forEach(pair => {
                    let input_coin_info = coins_by_type[pair.inputCoinType];
                    let output_coin_info = coins_by_type[pair.outputCoinType];

                    // filter out pairs where one asset is a backed asset and the other is a backing asset,
                    // those pairs rightly belong under the gateway section, not under the bridge section.
                    if (
                        input_coin_info.backingCoinType !=
                            pair.outputCoinType ||
                        (output_coin_info.backingCoinType !=
                            pair.inputCoinType &&
                            input_coin_info.restricted == false &&
                            output_coin_info.restricted == false)
                    ) {
                        // filter out mappings where one of the wallets is offline
                        if (
                            active_wallets.indexOf(
                                input_coin_info.walletType
                            ) != -1 &&
                            active_wallets.indexOf(
                                output_coin_info.walletType
                            ) != -1
                        ) {
                            if (
                                input_coin_info.walletType != "bitshares2" &&
                                output_coin_info.walletType == "bitshares2"
                            ) {
                                allowed_mappings_for_deposit[
                                    pair.inputCoinType
                                ] =
                                    allowed_mappings_for_deposit[
                                        pair.inputCoinType
                                    ] || [];
                                allowed_mappings_for_deposit[
                                    pair.inputCoinType
                                ].push(pair.outputCoinType);
                            } else {
                                allowed_mappings_for_withdraw[
                                    pair.inputCoinType
                                ] =
                                    allowed_mappings_for_withdraw[
                                        pair.inputCoinType
                                    ] || [];
                                allowed_mappings_for_withdraw[
                                    pair.inputCoinType
                                ].push(pair.outputCoinType);
                            }
                        }
                    }
                });

                // we can now set the input and output coin types
                let deposit_input_coin_type = null;
                let deposit_output_coin_type = null;
                let allowed_deposit_coin_types = Object.keys(
                    allowed_mappings_for_deposit
                );
                allowed_deposit_coin_types.forEach(deposit_coin_type => {
                    allowed_mappings_for_deposit[deposit_coin_type].sort();
                });

                if (allowed_deposit_coin_types.length) {
                    if (
                        this.props.initial_deposit_input_coin_type &&
                        this.props.initial_deposit_input_coin_type in
                            allowed_mappings_for_deposit
                    )
                        deposit_input_coin_type = this.props
                            .initial_deposit_input_coin_type;
                    else
                        deposit_input_coin_type = allowed_deposit_coin_types[0];
                    let output_coin_types_for_this_input =
                        allowed_mappings_for_deposit[deposit_input_coin_type];
                    if (
                        this.props.initial_deposit_output_coin_type &&
                        output_coin_types_for_this_input.indexOf(
                            this.props.initial_deposit_output_coin_type
                        ) != -1
                    )
                        deposit_output_coin_type = this.props
                            .initial_deposit_output_coin_type;
                    else
                        deposit_output_coin_type =
                            output_coin_types_for_this_input[0];
                }

                let withdraw_input_coin_type = null;
                let withdraw_output_coin_type = null;
                let allowed_withdraw_coin_types = Object.keys(
                    allowed_mappings_for_withdraw
                );
                allowed_withdraw_coin_types.forEach(withdraw_coin_type => {
                    allowed_mappings_for_withdraw[withdraw_coin_type].sort();
                });

                if (allowed_withdraw_coin_types.length) {
                    if (
                        this.props.initial_withdraw_input_coin_type &&
                        this.props.initial_withdraw_input_coin_type in
                            allowed_mappings_for_withdraw
                    )
                        withdraw_input_coin_type = this.props
                            .initial_withdraw_input_coin_type;
                    else
                        withdraw_input_coin_type =
                            allowed_withdraw_coin_types[0];
                    let output_coin_types_for_this_input =
                        allowed_mappings_for_withdraw[withdraw_input_coin_type];
                    if (
                        this.props.initial_withdraw_output_coin_type &&
                        output_coin_types_for_this_input.indexOf(
                            this.props.initial_withdraw_output_coin_type
                        ) != -1
                    )
                        withdraw_output_coin_type = this.props
                            .initial_withdraw_output_coin_type;
                    else
                        withdraw_output_coin_type =
                            output_coin_types_for_this_input[0];
                }

                let input_address_and_memo = this.getCachedOrGeneratedInputAddress(
                    deposit_input_coin_type,
                    deposit_output_coin_type
                );

                let deposit_limit = this.getCachedOrFreshDepositLimit(
                    "deposit",
                    deposit_input_coin_type,
                    deposit_output_coin_type
                );
                let deposit_estimated_output_amount = this.getAndUpdateOutputEstimate(
                    "deposit",
                    deposit_input_coin_type,
                    deposit_output_coin_type,
                    this.state.deposit_estimated_input_amount
                );

                let withdraw_estimated_output_amount = this.getAndUpdateOutputEstimate(
                    "withdraw",
                    withdraw_input_coin_type,
                    withdraw_output_coin_type,
                    this.state.withdraw_estimated_input_amount
                );
                let withdraw_limit = this.getCachedOrFreshDepositLimit(
                    "withdraw",
                    withdraw_input_coin_type,
                    withdraw_output_coin_type
                );

                if (this.unMounted) return;

                this.setState({
                    coin_info_request_state: this.coin_info_request_states
                        .request_complete,
                    coins_by_type: coins_by_type,
                    allowed_mappings_for_deposit: allowed_mappings_for_deposit,
                    allowed_mappings_for_withdraw: allowed_mappings_for_withdraw,
                    deposit_input_coin_type: deposit_input_coin_type,
                    deposit_output_coin_type: deposit_output_coin_type,
                    input_address_and_memo: input_address_and_memo,
                    deposit_limit: deposit_limit,
                    deposit_estimated_output_amount: deposit_estimated_output_amount,
                    deposit_estimate_direction: this.estimation_directions
                        .output_from_input,
                    withdraw_input_coin_type: withdraw_input_coin_type,
                    withdraw_output_coin_type: withdraw_output_coin_type,
                    withdraw_limit: withdraw_limit,
                    withdraw_estimated_output_amount: withdraw_estimated_output_amount,
                    withdraw_estimate_direction: this.estimation_directions
                        .output_from_input,
                    supports_output_memos:
                        coins_by_type["xmr"].supportsOutputMemos
                });
            })
            .catch(error => {
                this.setState({
                    coin_info_request_state: state_coin_info,
                    coins_by_type: null,
                    allowed_mappings_for_deposit: null,
                    allowed_mappings_for_withdraw: null
                });
            });
    }

    // functions for periodically updating our deposit limit and estimates
    updateEstimates() {
        if (
            this.state.deposit_input_coin_type &&
            this.state.deposit_output_coin_type
        ) {
            // input address won't usually need refreshing unless there was an error
            // generating it last time around
            let new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(
                this.state.deposit_input_coin_type,
                this.state.deposit_output_coin_type
            );

            let new_deposit_limit = this.getCachedOrFreshDepositLimit(
                "deposit",
                this.state.deposit_input_coin_type,
                this.state.deposit_output_coin_type
            );
            let new_deposit_estimated_input_amount = this.state
                .deposit_estimated_input_amount;
            let new_deposit_estimated_output_amount = this.state
                .deposit_estimated_output_amount;

            if (
                this.state.deposit_estimate_direction ==
                this.estimation_directions.output_from_input
            )
                new_deposit_estimated_output_amount = this.getAndUpdateOutputEstimate(
                    "deposit",
                    this.state.deposit_input_coin_type,
                    this.state.deposit_output_coin_type,
                    new_deposit_estimated_input_amount
                );
            else
                new_deposit_estimated_input_amount = this.getAndUpdateInputEstimate(
                    "deposit",
                    this.state.deposit_input_coin_type,
                    this.state.deposit_output_coin_type,
                    new_deposit_estimated_output_amount
                );

            let new_withdraw_limit = this.getCachedOrFreshDepositLimit(
                "withdraw",
                this.state.withdraw_input_coin_type,
                this.state.withdraw_output_coin_type
            );
            let new_withdraw_estimated_input_amount = this.state
                .withdraw_estimated_input_amount;
            let new_withdraw_estimated_output_amount = this.state
                .withdraw_estimated_output_amount;

            if (
                this.state.withdraw_estimate_direction ==
                this.estimation_directions.output_from_input
            )
                new_withdraw_estimated_output_amount = this.getAndUpdateOutputEstimate(
                    "withdraw",
                    this.state.withdraw_input_coin_type,
                    this.state.withdraw_output_coin_type,
                    new_withdraw_estimated_input_amount
                );
            else
                new_withdraw_estimated_input_amount = this.getAndUpdateinputEstimate(
                    "withdraw",
                    this.state.withdraw_input_coin_type,
                    this.state.withdraw_output_coin_type,
                    new_withdraw_estimated_output_amount
                );

            this.setState({
                input_address_and_memo: new_input_address_and_memo,
                deposit_limit: new_deposit_limit,
                deposit_estimated_input_amount: new_deposit_estimated_input_amount,
                deposit_estimated_output_amount: new_deposit_estimated_output_amount,
                withdraw_limit: new_withdraw_limit,
                withdraw_estimated_input_amount: new_withdraw_estimated_input_amount,
                withdraw_estimated_output_amount: new_withdraw_estimated_output_amount,
                key_for_withdrawal_dialog: new_withdraw_estimated_input_amount
            });
        }
    }

    componentWillMount() {
        // check
        let checkUrl = this.state.url;
        this.urlConnection(checkUrl, 0);
        let coin_types_promisecheck = fetch(checkUrl + "/coins", {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        let trading_pairs_promisecheck = fetch(checkUrl + "/trading-pairs", {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        let active_wallets_promisecheck = fetch(checkUrl + "/active-wallets", {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        Promise.all([
            coin_types_promisecheck,
            trading_pairs_promisecheck,
            active_wallets_promisecheck
        ])
            .then(json_responses => {
                let [
                    coin_types,
                    trading_pairs,
                    active_wallets
                ] = json_responses;
                let coins_by_type = {};
                coin_types.forEach(
                    coin_type => (coins_by_type[coin_type.coinType] = coin_type)
                );
                trading_pairs.forEach(pair => {
                    let input_coin_info = coins_by_type[pair.inputCoinType];
                    let output_coin_info = coins_by_type[pair.outputCoinType];
                    if (
                        input_coin_info.backingCoinType !=
                            pair.outputCoinType &&
                        output_coin_info.backingCoinType != pair.inputCoinType
                    ) {
                        if (
                            active_wallets.indexOf(
                                input_coin_info.walletType
                            ) != -1 &&
                            active_wallets.indexOf(
                                output_coin_info.walletType
                            ) != -1
                        ) {
                        }
                    }
                });
            })
            .catch(error => {
                this.urlConnection("https://citadel.li/trade", 2);
                this.setState({
                    coin_info_request_state: 0,
                    coins_by_type: null,
                    allowed_mappings_for_deposit: null,
                    allowed_mappings_for_withdraw: null
                });
            });
    }

    componentDidMount() {
        this.update_timer = setInterval(
            this.updateEstimates.bind(this),
            this.refresh_interval
        );
    }

    componentWillUnmount() {
        clearInterval(this.update_timer);
        this.unMounted = true;
    }

    // functions for managing input addresses
    getCachedInputAddress(input_coin_type, output_coin_type, memo) {
        let account_name = this.props.account.get("name");
        return this.deposit_address_cache.getCachedInputAddress(
            this.props.gateway,
            account_name,
            input_coin_type,
            output_coin_type
        );
    }

    cacheInputAddress(input_coin_type, output_coin_type, address, memo) {
        let account_name = this.props.account.get("name");
        this.deposit_address_cache.cacheInputAddress(
            this.props.gateway,
            account_name,
            input_coin_type,
            output_coin_type,
            address,
            memo
        );
    }

    getCachedOrGeneratedInputAddress(input_coin_type, output_coin_type) {
        // if we already have an address, just return it
        let cached_input_address_and_memo = this.getCachedInputAddress(
            input_coin_type,
            output_coin_type
        );
        if (cached_input_address_and_memo) {
            return cached_input_address_and_memo;
        }

        // if we've already asked for this address, return null, it will trigger a refresh when it completes
        this.state.input_address_requests_in_progress[input_coin_type] =
            this.state.input_address_requests_in_progress[input_coin_type] ||
            {};
        if (
            this.state.input_address_requests_in_progress[input_coin_type][
                output_coin_type
            ]
        )
            return null;

        // else, no active request for this mapping, kick one off
        let body = JSON.stringify({
            inputCoinType: input_coin_type,
            outputCoinType: output_coin_type,
            outputAddress: this.props.account.get("name")
        });

        this.state.input_address_requests_in_progress[input_coin_type][
            output_coin_type
        ] = true;

        fetch(this.state.url + "/simple-api/initiate-trade", {
            method: "post",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            }),
            body: body
        }).then(
            reply => {
                reply.json().then(
                    json => {
                        console.assert(
                            json.inputCoinType == input_coin_type,
                            "unexpected reply from initiate-trade"
                        );
                        console.assert(
                            json.outputCoinType == output_coin_type,
                            "unexpected reply from initiate-trade"
                        );
                        if (
                            json.inputCoinType != input_coin_type ||
                            json.outputCoinType != output_coin_type
                        )
                            throw Error("unexpected reply from initiate-trade");
                        this.cacheInputAddress(
                            json.inputCoinType,
                            json.outputCoinType,
                            json.inputAddress,
                            json.inputMemo
                        );
                        delete this.state.input_address_requests_in_progress[
                            input_coin_type
                        ][output_coin_type];
                        if (
                            this.state.deposit_input_coin_type ==
                                json.inputCoinType &&
                            this.state.deposit_output_coin_type ==
                                json.outputCoinType
                        )
                            this.setState({
                                input_address_and_memo: {
                                    address: json.inputAddress,
                                    memo: json.inputMemo
                                }
                            });
                    },
                    error => {
                        delete this.state.input_address_requests_in_progress[
                            input_coin_type
                        ][output_coin_type];
                        if (
                            this.state.deposit_input_coin_type ==
                                input_coin_type &&
                            this.state.deposit_output_coin_type ==
                                output_coin_type
                        )
                            this.setState({
                                input_address_and_memo: {
                                    address: "error generating address",
                                    memo: null
                                }
                            });
                    }
                );
            },
            error => {
                delete this.state.input_address_requests_in_progress[
                    input_coin_type
                ][output_coin_type];
                if (
                    this.state.deposit_input_coin_type == input_coin_type &&
                    this.state.deposit_output_coin_type == output_coin_type
                )
                    this.setState({
                        input_address_and_memo: {
                            address: "error generating address",
                            memo: null
                        }
                    });
            }
        );
        return null;
    }

    // functions for managing deposit limits
    getCachedDepositLimit(input_coin_type, output_coin_type) {
        this.state.deposit_limit_cache[input_coin_type] =
            this.state.deposit_limit_cache[input_coin_type] || {};
        if (this.state.deposit_limit_cache[input_coin_type][output_coin_type]) {
            let deposit_limit_record = this.state.deposit_limit_cache[
                input_coin_type
            ][output_coin_type];
            let cache_age = new Date() - deposit_limit_record.timestamp;
            if (cache_age < this.refresh_interval) return deposit_limit_record;
            delete this.state.deposit_limit_cache[input_coin_type][
                output_coin_type
            ];
        }
        return null;
    }

    cacheDepositLimit(input_coin_type, output_coin_type, deposit_limit_record) {
        deposit_limit_record.timestamp = new Date();
        this.state.deposit_limit_cache[input_coin_type] =
            this.state.deposit_limit_cache[input_coin_type] || {};
        this.state.deposit_limit_cache[input_coin_type][
            output_coin_type
        ] = deposit_limit_record;
    }

    getCachedOrFreshDepositLimit(
        deposit_withdraw_or_convert,
        input_coin_type,
        output_coin_type
    ) {
        let deposit_limit_record = this.getCachedDepositLimit(
            input_coin_type,
            output_coin_type
        );

        if (deposit_limit_record) return deposit_limit_record;

        this.state.deposit_limit_requests_in_progress[input_coin_type] =
            this.state.input_address_requests_in_progress[input_coin_type] ||
            {};
        this.state.deposit_limit_requests_in_progress[input_coin_type][
            output_coin_type
        ] = true;

        let deposit_limit_url =
            this.state.url +
            "/deposit-limits?inputCoinType=" +
            encodeURIComponent(input_coin_type) +
            "&outputCoinType=" +
            encodeURIComponent(output_coin_type);

        let deposit_limit_promise = fetch(deposit_limit_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        deposit_limit_promise.then(
            reply => {
                if (this.unMounted) return;
                console.assert(
                    reply.inputCoinType == input_coin_type &&
                        reply.outputCoinType == output_coin_type,
                    "unexpected reply from deposit-limits"
                );
                if (
                    reply.inputCoinType != input_coin_type ||
                    reply.outputCoinType != output_coin_type
                )
                    throw Error("unexpected reply from deposit-limits");
                let new_deposit_limit_record = {
                    timestamp: new Date(),
                    limit: reply.depositLimit
                };
                this.cacheDepositLimit(
                    input_coin_type,
                    output_coin_type,
                    new_deposit_limit_record
                );
                delete this.state.deposit_limit_requests_in_progress[
                    input_coin_type
                ][output_coin_type];
                if (
                    this.state[
                        deposit_withdraw_or_convert + "_input_coin_type"
                    ] == input_coin_type &&
                    this.state[
                        deposit_withdraw_or_convert + "_output_coin_type"
                    ] == output_coin_type
                )
                    this.setState({
                        [deposit_withdraw_or_convert +
                        "_limit"]: new_deposit_limit_record
                    });
            },
            error => {
                delete this.state.deposit_limit_requests_in_progress[
                    input_coin_type
                ][output_coin_type];
            }
        );
        return null;
    }

    getAndUpdateOutputEstimate(
        deposit_withdraw_or_convert,
        input_coin_type,
        output_coin_type,
        input_amount
    ) {
        if (this.unMounted) return;
        if (deposit_withdraw_or_convert == "deposit") {
            this.setState({failed_calculate_deposit: null});
        }
        if (deposit_withdraw_or_convert == "withdraw") {
            this.setState({failed_calculate_withdraw: null});
        }

        let estimate_output_url =
            this.state.url +
            "/estimate-output-amount?inputAmount=" +
            encodeURIComponent(input_amount) +
            "&inputCoinType=" +
            encodeURIComponent(input_coin_type) +
            "&outputCoinType=" +
            encodeURIComponent(output_coin_type);

        let estimate_output_promise = fetch(estimate_output_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        estimate_output_promise.then(
            reply => {
                if (this.unMounted) return;
                if (reply.error) {
                    if (
                        this.state[
                            deposit_withdraw_or_convert + "_input_coin_type"
                        ] == input_coin_type &&
                        this.state[
                            deposit_withdraw_or_convert + "_output_coin_type"
                        ] == output_coin_type &&
                        this.state[
                            deposit_withdraw_or_convert +
                                "_estimated_input_amount"
                        ] == input_amount &&
                        this.state[
                            deposit_withdraw_or_convert + "_estimate_direction"
                        ] == this.estimation_directions.output_from_input
                    ) {
                        let user_message = reply.error.message;

                        if (deposit_withdraw_or_convert == "deposit") {
                            this.setState({
                                failed_calculate_deposit: "Failed to calculate"
                            });
                        }
                        if (deposit_withdraw_or_convert == "withdraw") {
                            this.setState({
                                failed_calculate_withdraw: "Failed to calculate"
                            });
                        }

                        let expected_prefix = "Internal Server Error: ";
                        if (user_message.startsWith(expected_prefix))
                            user_message = user_message.substr(
                                expected_prefix.length
                            );

                        this.setState({
                            [deposit_withdraw_or_convert +
                            "_error"]: user_message
                        });
                    }
                } else {
                    console.assert(
                        reply.inputCoinType == input_coin_type &&
                            reply.outputCoinType == output_coin_type &&
                            reply.inputAmount == input_amount,
                        "unexpected reply from estimate-output-amount"
                    );
                    if (
                        reply.inputCoinType != input_coin_type ||
                        reply.outputCoinType != output_coin_type ||
                        reply.inputAmount != input_amount
                    ) {
                        this.setState({
                            [deposit_withdraw_or_convert +
                            "_estimated_output_amount"]: reply.outputAmount,
                            [deposit_withdraw_or_convert + "_error"]: null
                        });
                    }
                    if (
                        this.state[
                            deposit_withdraw_or_convert + "_input_coin_type"
                        ] == input_coin_type &&
                        this.state[
                            deposit_withdraw_or_convert + "_output_coin_type"
                        ] == output_coin_type &&
                        this.state[
                            deposit_withdraw_or_convert +
                                "_estimated_input_amount"
                        ] == input_amount &&
                        this.state[
                            deposit_withdraw_or_convert + "_estimate_direction"
                        ] == this.estimation_directions.output_from_input
                    ) {
                        this.setState({
                            [deposit_withdraw_or_convert +
                            "_estimated_output_amount"]: reply.outputAmount,
                            [deposit_withdraw_or_convert + "_error"]: null
                        });
                    }
                }
            },
            error => {}
        );

        return null;
    }

    getAndUpdateInputEstimate(
        deposit_withdraw_or_convert,
        input_coin_type,
        output_coin_type,
        output_amount
    ) {
        if (this.unMounted) return;
        if (deposit_withdraw_or_convert == "deposit") {
            this.setState({failed_calculate_deposit: null});
        }
        if (deposit_withdraw_or_convert == "withdraw") {
            this.setState({failed_calculate_withdraw: null});
        }

        let estimate_input_url =
            this.state.url +
            "/estimate-input-amount?outputAmount=" +
            encodeURIComponent(output_amount) +
            "&inputCoinType=" +
            encodeURIComponent(input_coin_type) +
            "&outputCoinType=" +
            encodeURIComponent(output_coin_type);
        let estimate_input_promise = fetch(estimate_input_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        estimate_input_promise.then(
            reply => {
                if (this.unMounted) return;

                console.assert(
                    reply.inputCoinType == input_coin_type &&
                        reply.outputCoinType == output_coin_type &&
                        reply.outputAmount == output_amount,
                    "unexpected reply from estimate-input-amount"
                );
                if (
                    reply.inputCoinType != input_coin_type ||
                    reply.outputCoinType != output_coin_type ||
                    reply.outputAmount != output_amount
                ) {
                    if (deposit_withdraw_or_convert == "deposit") {
                        this.setState({
                            failed_calculate_deposit: "Failed to calculate"
                        });
                    }
                    if (deposit_withdraw_or_convert == "withdraw") {
                        this.setState({
                            failed_calculate_withdraw: "Failed to calculate"
                        });
                    }
                }

                if (
                    this.state[
                        deposit_withdraw_or_convert + "_input_coin_type"
                    ] == input_coin_type &&
                    this.state[
                        deposit_withdraw_or_convert + "_output_coin_type"
                    ] == output_coin_type &&
                    this.state[
                        deposit_withdraw_or_convert + "_estimated_output_amount"
                    ] == output_amount &&
                    this.state[
                        deposit_withdraw_or_convert + "_estimate_direction"
                    ] == this.estimation_directions.input_from_output
                )
                    this.setState({
                        [deposit_withdraw_or_convert +
                        "_estimated_input_amount"]: reply.inputAmount,
                        key_for_withdrawal_dialog: reply.inputAmount
                    });
            },
            error => {}
        );

        return null;
    }

    onInputAmountChanged(deposit_withdraw_or_convert, event) {
        let new_estimated_input_amount = event.target.value;
        if (new_estimated_input_amount == "") {
            new_estimated_input_amount = "0";
        }

        let new_estimated_output_amount = this.getAndUpdateOutputEstimate(
            deposit_withdraw_or_convert,
            this.state[deposit_withdraw_or_convert + "_input_coin_type"],
            this.state[deposit_withdraw_or_convert + "_output_coin_type"],
            new_estimated_input_amount
        );

        this.setState({
            [deposit_withdraw_or_convert +
            "_estimated_input_amount"]: new_estimated_input_amount,
            [deposit_withdraw_or_convert +
            "_estimated_output_amount"]: new_estimated_output_amount,
            [deposit_withdraw_or_convert + "_estimate_direction"]: this
                .estimation_directions.output_from_input,
            key_for_withdrawal_dialog: new_estimated_input_amount
        });
    }

    onOutputAmountChanged(deposit_withdraw_or_convert, event) {
        let new_estimated_output_amount = event.target.value;
        if (new_estimated_output_amount == "") {
            new_estimated_output_amount = "0";
        }

        let new_estimated_input_amount = this.getAndUpdateInputEstimate(
            deposit_withdraw_or_convert,
            this.state[deposit_withdraw_or_convert + "_input_coin_type"],
            this.state[deposit_withdraw_or_convert + "_output_coin_type"],
            new_estimated_output_amount
        );

        this.setState({
            [deposit_withdraw_or_convert +
            "_estimated_output_amount"]: new_estimated_output_amount,
            [deposit_withdraw_or_convert +
            "_estimated_input_amount"]: new_estimated_input_amount,
            [deposit_withdraw_or_convert + "_estimate_direction"]: this
                .estimation_directions.input_from_output
        });
    }

    getWithdrawModalId() {
        return "withdraw_asset_" + this.props.gateway + "_bridge";
    }

    onWithdraw() {
        this.showModal();
    }

    onInputCoinTypeChanged(deposit_withdraw_or_convert, event) {
        let estimated_input_output_amount = null;
        let estimated_input_output_amount_state = "_estimated_output_amount";
        let new_input_coin_type = event.target.value;
        let possible_output_coin_types = this.state[
            "allowed_mappings_for_" + deposit_withdraw_or_convert
        ][new_input_coin_type];
        let new_output_coin_type = possible_output_coin_types[0];

        if (
            possible_output_coin_types.indexOf(
                this.state[deposit_withdraw_or_convert + "_output_coin_type"]
            ) != -1
        )
            new_output_coin_type = this.state[
                deposit_withdraw_or_convert + "_output_coin_type"
            ];

        let new_input_address_and_memo = this.state.input_address_and_memo;
        if (deposit_withdraw_or_convert == "deposit")
            new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(
                new_input_coin_type,
                new_output_coin_type
            );
        let new_deposit_limit = this.getCachedOrFreshDepositLimit(
            deposit_withdraw_or_convert,
            new_input_coin_type,
            new_output_coin_type
        );

        if (
            !this.state[deposit_withdraw_or_convert + "_estimated_input_amount"]
        ) {
            estimated_input_output_amount = this.getAndUpdateInputEstimate(
                deposit_withdraw_or_convert,
                new_input_coin_type,
                new_output_coin_type,
                this.state[
                    deposit_withdraw_or_convert + "_estimated_output_amount"
                ]
            );
            estimated_input_output_amount_state = "_estimated_input_amount";
        } else {
            estimated_input_output_amount = this.getAndUpdateOutputEstimate(
                deposit_withdraw_or_convert,
                new_input_coin_type,
                new_output_coin_type,
                this.state[
                    deposit_withdraw_or_convert + "_estimated_input_amount"
                ]
            );
        }

        if (deposit_withdraw_or_convert == "withdraw") {
            possible_output_coin_types.forEach(
                allowed_withdraw_output_coin_type => {
                    if (
                        new_output_coin_type ===
                        allowed_withdraw_output_coin_type
                    ) {
                        this.setState({
                            coin_symbol: new_input_coin_type + "input",
                            supports_output_memos: this.state.coins_by_type[
                                allowed_withdraw_output_coin_type
                            ].supportsOutputMemos
                        });
                    }
                }
            );
        }

        this.setState({
            [deposit_withdraw_or_convert +
            "_input_coin_type"]: new_input_coin_type,
            [deposit_withdraw_or_convert +
            "_output_coin_type"]: new_output_coin_type,
            input_address_and_memo: new_input_address_and_memo,
            [deposit_withdraw_or_convert + "_limit"]: new_deposit_limit,
            [deposit_withdraw_or_convert +
            estimated_input_output_amount_state]: estimated_input_output_amount,
            [deposit_withdraw_or_convert + "_estimate_direction"]: this
                .estimation_directions.output_from_input
        });
    }

    onOutputCoinTypeChanged(deposit_withdraw_or_convert, event) {
        let estimated_input_output_amount = null;
        let estimated_input_output_amount_state = "_estimated_output_amount";
        let new_output_coin_type = event.target.value;
        let withdraw_output_coin_types = this.state
            .allowed_mappings_for_withdraw[this.state.withdraw_input_coin_type];

        if (deposit_withdraw_or_convert == "withdraw") {
            withdraw_output_coin_types.forEach(
                allowed_withdraw_output_coin_type => {
                    if (
                        new_output_coin_type ===
                        allowed_withdraw_output_coin_type
                    ) {
                        this.setState({
                            coin_symbol: new_output_coin_type + "output",
                            supports_output_memos: this.state.coins_by_type[
                                allowed_withdraw_output_coin_type
                            ].supportsOutputMemos,
                            key_for_withdrawal_dialog: new_output_coin_type
                        });
                    }
                }
            );
        }

        let new_input_address_and_memo = this.state.input_address_and_memo;
        if (deposit_withdraw_or_convert == "deposit")
            new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(
                this.state[deposit_withdraw_or_convert + "_input_coin_type"],
                new_output_coin_type
            );
        let new_deposit_limit = this.getCachedOrFreshDepositLimit(
            deposit_withdraw_or_convert,
            this.state[deposit_withdraw_or_convert + "_input_coin_type"],
            new_output_coin_type
        );

        if (
            !this.state[deposit_withdraw_or_convert + "_estimated_input_amount"]
        ) {
            estimated_input_output_amount = this.getAndUpdateInputEstimate(
                deposit_withdraw_or_convert,
                this.state[deposit_withdraw_or_convert + "_input_coin_type"],
                new_output_coin_type,
                this.state[
                    deposit_withdraw_or_convert + "_estimated_output_amount"
                ]
            );
            estimated_input_output_amount_state = "_estimated_input_amount";
        } else {
            estimated_input_output_amount = this.getAndUpdateOutputEstimate(
                deposit_withdraw_or_convert,
                this.state[deposit_withdraw_or_convert + "_input_coin_type"],
                new_output_coin_type,
                this.state[
                    deposit_withdraw_or_convert + "_estimated_input_amount"
                ]
            );
        }

        this.setState({
            [deposit_withdraw_or_convert +
            "_output_coin_type"]: new_output_coin_type,
            input_address_and_memo: new_input_address_and_memo,
            [deposit_withdraw_or_convert + "_limit"]: new_deposit_limit,
            [deposit_withdraw_or_convert +
            estimated_input_output_amount_state]: estimated_input_output_amount,
            [deposit_withdraw_or_convert + "_estimate_direction"]: this
                .estimation_directions.output_from_input
        });
    }

    render() {
        if (
            !this.props.account ||
            !this.props.issuer_account ||
            !this.props.gateway
        )
            return <div />;

        let announcements,
            deposit_body,
            deposit_header,
            withdraw_body,
            withdraw_header,
            conversion_body,
            conversion_header,
            withdraw_modal_id,
            conversion_modal_id;

        if (
            this.state.coin_info_request_state ==
            this.coin_info_request_states.request_failed
        ) {
            return (
                <div>
                    <p>
                        Error connecting to citadel.li, please try again later
                    </p>
                </div>
            );
        } else if (
            this.state.coin_info_request_state ==
                this.coin_info_request_states.never_requested ||
            this.state.coin_info_request_state ==
                this.coin_info_request_states.request_in_progress
        ) {
            return (
                <div>
                    <p>Retrieving current trade data from citadel.li</p>
                </div>
            );
        } else {
            // depending on what wallets are online, we might support deposits, withdrawals, conversions, all, or neither at any given time.
            let deposit_table = null;
            let withdraw_table = null;
            let amount_to_withdraw = null;

            let calcTextDeposit = <Translate content="gateway.calc" />;
            if (this.state.failed_calculate_deposit != null) {
                calcTextDeposit = this.state.failed_calculate_deposit;
            }
            let calcTextWithdraw = <Translate content="gateway.calc" />;
            if (this.state.failed_calculate_withdraw != null) {
                calcTextWithdraw = this.state.failed_calculate_withdraw;
            }
            let calcTextConversion = <Translate content="gateway.calc" />;
            if (this.state.failed_calculate_conversion != null) {
                calcTextConversion = this.state.failed_calculate_conversion;
            }

            if (
                Object.getOwnPropertyNames(
                    this.state.allowed_mappings_for_deposit
                ).length > 0
            ) {
                // deposit
                let deposit_input_coin_type_options = [];
                Object.keys(this.state.allowed_mappings_for_deposit)
                    .sort()
                    .forEach(allowed_deposit_input_coin_type => {
                        deposit_input_coin_type_options.push(
                            <option
                                key={allowed_deposit_input_coin_type}
                                value={allowed_deposit_input_coin_type || ""}
                            >
                                {
                                    this.state.coins_by_type[
                                        allowed_deposit_input_coin_type
                                    ].symbol
                                }
                            </option>
                        );
                    });
                let deposit_input_coin_type_select = (
                    <select
                        style={{width: "11rem"}}
                        className="external-coin-types"
                        value={this.state.deposit_input_coin_type || ""}
                        onChange={this.onInputCoinTypeChanged.bind(
                            this,
                            "deposit"
                        )}
                    >
                        {deposit_input_coin_type_options}
                    </select>
                );

                let deposit_output_coin_type_options = [];
                let deposit_output_coin_types = this.state
                    .allowed_mappings_for_deposit[
                    this.state.deposit_input_coin_type
                ];
                deposit_output_coin_types.forEach(
                    allowed_deposit_output_coin_type => {
                        deposit_output_coin_type_options.push(
                            <option
                                key={allowed_deposit_output_coin_type}
                                value={allowed_deposit_output_coin_type || ""}
                            >
                                {
                                    this.state.coins_by_type[
                                        allowed_deposit_output_coin_type
                                    ].walletSymbol
                                }
                            </option>
                        );
                    }
                );
                let deposit_output_coin_type_select = (
                    <select
                        style={{width: "11rem"}}
                        className="native-coin-types"
                        value={this.state.deposit_output_coin_type || ""}
                        onChange={this.onOutputCoinTypeChanged.bind(
                            this,
                            "deposit"
                        )}
                    >
                        {deposit_output_coin_type_options}
                    </select>
                );

                let input_address_and_memo = this.state.input_address_and_memo
                    ? this.state.input_address_and_memo
                    : {address: "unknown", memo: null};

                let estimated_input_amount_text = this.state
                    .deposit_estimated_input_amount;
                let estimated_output_amount_text = this.state
                    .deposit_estimated_output_amount;

                let deposit_input_amount_edit_box = estimated_input_amount_text ? (
                    <input
                        style={{width: "11rem"}}
                        type="text"
                        value={estimated_input_amount_text || ""}
                        onChange={this.onInputAmountChanged.bind(
                            this,
                            "deposit"
                        )}
                    />
                ) : (
                    calcTextDeposit
                );
                let deposit_output_amount_edit_box = estimated_output_amount_text ? (
                    <input
                        style={{width: "11rem"}}
                        type="text"
                        value={estimated_output_amount_text || ""}
                        onChange={this.onOutputAmountChanged.bind(
                            this,
                            "deposit"
                        )}
                    />
                ) : (
                    calcTextDeposit
                );

                let deposit_limit_element = <span>updating</span>;
                if (this.state.deposit_limit) {
                    if (this.state.deposit_limit.limit)
                        deposit_limit_element = (
                            <div className="blocktrades-bridge">
                                <span className="deposit-limit">
                                    <Translate
                                        content="gateway.limit"
                                        amount={utils.format_number(
                                            this.state.deposit_limit.limit,
                                            8
                                        )}
                                        symbol={
                                            this.state.coins_by_type[
                                                this.state
                                                    .deposit_input_coin_type
                                            ].walletSymbol
                                        }
                                    />
                                </span>
                            </div>
                        );
                    else deposit_limit_element = null;
                    //else
                    //    deposit_limit_element = <span>no limit</span>;
                }

                let deposit_error_element = null;
                if (this.state.deposit_error)
                    deposit_error_element = (
                        <div>{this.state.deposit_error}</div>
                    );

                deposit_header = (
                    <thead>
                        <tr>
                            <th>
                                <Translate content="gateway.deposit" />
                            </th>
                            <th>
                                <Translate content="gateway.balance" />
                            </th>
                            <th>
                                <Translate
                                    content="gateway.deposit_to"
                                    asset={this.state.deposit_input_coin_type}
                                />
                            </th>
                        </tr>
                    </thead>
                );

                let deposit_address_and_memo_element = null;
                if (input_address_and_memo.memo)
                    deposit_address_and_memo_element = (
                        <Translate
                            unsafe
                            content="gateway.address_with_memo"
                            address={input_address_and_memo.address}
                            memo={input_address_and_memo.memo}
                        />
                    );
                else
                    deposit_address_and_memo_element = (
                        <span>{input_address_and_memo.address}</span>
                    );
                //<span><span className="blocktrades-with-memo">with memo</span> {input_address_and_memo.memo}</span>;

                deposit_body = (
                    <tbody>
                        <tr>
                            <td>
                                <div
                                    className="blocktrades-bridge"
                                    style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    <div className="inline-block">
                                        <div>
                                            {deposit_input_coin_type_select}
                                        </div>
                                        <div>
                                            {deposit_input_amount_edit_box}
                                        </div>
                                    </div>
                                    &rarr;
                                    <div className="inline-block">
                                        <div>
                                            {deposit_output_coin_type_select}
                                        </div>
                                        <div>
                                            {deposit_output_amount_edit_box}
                                        </div>
                                    </div>
                                    <div>{deposit_error_element}</div>
                                </div>
                            </td>
                            <td>
                                <AccountBalance
                                    account={this.props.account.get("name")}
                                    asset={
                                        this.state.coins_by_type[
                                            this.state.deposit_output_coin_type
                                        ].walletSymbol
                                    }
                                />
                            </td>
                            <td style={{wordBreak: "break-all"}}>
                                {deposit_address_and_memo_element}
                                <br />
                                {deposit_limit_element}
                            </td>
                        </tr>
                    </tbody>
                );
            }

            if (
                Object.getOwnPropertyNames(
                    this.state.allowed_mappings_for_withdraw
                ).length > 0
            ) {
                withdraw_modal_id = this.getWithdrawModalId();
                let withdraw_asset_symbol = this.state.coins_by_type[
                    this.state.withdraw_input_coin_type
                ].symbol;

                // withdrawal

                amount_to_withdraw = this.state.withdraw_estimated_input_amount;

                let withdraw_input_coin_type_options = [];
                Object.keys(this.state.allowed_mappings_for_withdraw)
                    .sort()
                    .forEach(allowed_withdraw_input_coin_type => {
                        withdraw_input_coin_type_options.push(
                            <option
                                key={allowed_withdraw_input_coin_type}
                                value={allowed_withdraw_input_coin_type}
                            >
                                {
                                    this.state.coins_by_type[
                                        allowed_withdraw_input_coin_type
                                    ].walletSymbol
                                }
                            </option>
                        );
                    });
                let withdraw_input_coin_type_select = (
                    <select
                        style={{width: "11rem"}}
                        className="native-coin-types"
                        value={this.state.withdraw_input_coin_type}
                        onChange={this.onInputCoinTypeChanged.bind(
                            this,
                            "withdraw"
                        )}
                    >
                        {withdraw_input_coin_type_options}
                    </select>
                );

                let withdraw_output_coin_type_options = [];
                let withdraw_output_coin_types = this.state
                    .allowed_mappings_for_withdraw[
                    this.state.withdraw_input_coin_type
                ];
                withdraw_output_coin_types.forEach(
                    allowed_withdraw_output_coin_type => {
                        withdraw_output_coin_type_options.push(
                            <option
                                key={allowed_withdraw_output_coin_type}
                                value={allowed_withdraw_output_coin_type}
                            >
                                {
                                    this.state.coins_by_type[
                                        allowed_withdraw_output_coin_type
                                    ].symbol
                                }
                            </option>
                        );
                    }
                );
                let withdraw_output_coin_type_select = (
                    <select
                        style={{width: "11rem"}}
                        className="external-coin-types"
                        value={this.state.withdraw_output_coin_type}
                        onChange={this.onOutputCoinTypeChanged.bind(
                            this,
                            "withdraw"
                        )}
                    >
                        {withdraw_output_coin_type_options}
                    </select>
                );

                let estimated_input_amount_text = this.state
                    .withdraw_estimated_input_amount;

                let withdraw_input_amount_edit_box = estimated_input_amount_text ? (
                    <input
                        style={{width: "11rem"}}
                        type="text"
                        value={estimated_input_amount_text || ""}
                        onChange={this.onInputAmountChanged.bind(
                            this,
                            "withdraw"
                        )}
                    />
                ) : (
                    calcTextWithdraw
                );

                let estimated_output_amount_text = this.state
                    .withdraw_estimated_output_amount;

                let withdraw_output_amount_edit_box = estimated_output_amount_text ? (
                    <input
                        style={{width: "11rem"}}
                        type="text"
                        value={estimated_output_amount_text || ""}
                        onChange={this.onOutputAmountChanged.bind(
                            this,
                            "withdraw"
                        )}
                    />
                ) : (
                    calcTextWithdraw
                );

                let withdraw_button = (
                    <ButtonWithdrawContainer
                        showModal={this.showModal}
                        hideModal={this.hideModal}
                        visible={this.state.isModalVisible}
                        key={this.state.key_for_withdrawal_dialog}
                        account={this.props.account.get("name")}
                        issuer={this.props.issuer_account.get("name")}
                        asset={
                            this.state.coins_by_type[
                                this.state.withdraw_input_coin_type
                            ].walletSymbol
                        }
                        output_coin_name={
                            this.state.coins_by_type[
                                this.state.withdraw_output_coin_type
                            ].name
                        }
                        output_coin_symbol={
                            this.state.coins_by_type[
                                this.state.withdraw_output_coin_type
                            ].symbol
                        }
                        output_coin_type={this.state.withdraw_output_coin_type}
                        output_supports_memos={this.state.supports_output_memos}
                        amount_to_withdraw={amount_to_withdraw}
                        url={this.state.url}
                        gateway={this.props.gateway}
                        output_wallet_type={
                            this.state.coins_by_type[
                                this.state.withdraw_output_coin_type
                            ].walletType
                        }
                    />
                );

                let withdraw_error_element = null;
                if (this.state.withdraw_error)
                    withdraw_error_element = (
                        <div>{this.state.withdraw_error}</div>
                    );

                let withdraw_limit_element = <span>...</span>;
                if (this.state.withdraw_limit) {
                    if (this.state.withdraw_limit.limit)
                        withdraw_limit_element = (
                            <div className="blocktrades-bridge">
                                <span className="deposit-limit">
                                    <Translate
                                        content="gateway.limit"
                                        amount={utils.format_number(
                                            this.state.withdraw_limit.limit,
                                            8
                                        )}
                                        symbol={
                                            this.state.coins_by_type[
                                                this.state
                                                    .withdraw_input_coin_type
                                            ].walletSymbol
                                        }
                                    />
                                </span>
                            </div>
                        );
                    else
                        withdraw_limit_element = (
                            <div className="blocktrades-bridge">
                                <span className="deposit-limit">no limit</span>
                            </div>
                        );
                }

                withdraw_header = (
                    <thead>
                        <tr>
                            <th>
                                <Translate content="gateway.withdraw" />
                            </th>
                            <th>
                                <Translate content="gateway.balance" />
                            </th>
                            <th />
                        </tr>
                    </thead>
                );

                withdraw_body = (
                    <tbody>
                        <tr>
                            <td>
                                <div className="blocktrades-bridge">
                                    <div className="inline-block">
                                        <div>
                                            {withdraw_input_coin_type_select}
                                        </div>
                                        <div>
                                            {withdraw_input_amount_edit_box}
                                        </div>
                                    </div>
                                    &rarr;
                                    <div className="inline-block">
                                        <div>
                                            {withdraw_output_coin_type_select}
                                        </div>
                                        <div>
                                            {withdraw_output_amount_edit_box}
                                        </div>
                                    </div>
                                    <div>{withdraw_error_element}</div>
                                </div>
                            </td>
                            <td>
                                <AccountBalance
                                    account={this.props.account.get("name")}
                                    asset={
                                        this.state.coins_by_type[
                                            this.state.withdraw_input_coin_type
                                        ].walletSymbol
                                    }
                                />
                            </td>
                            <td>
                                {withdraw_button}
                                <br />
                                {withdraw_limit_element}
                            </td>
                        </tr>
                    </tbody>
                );
            }

            if (this.state.announcements.length > 0) {
                announcements = (
                    <div className="blocktrades-announcements-container">
                        {this.state.announcements.map(function(data, index) {
                            let add_color = "txtann info";

                            if (data.status === 10) {
                                add_color = "txtann error";
                            } else if (data.status === 20) {
                                add_color = "txtann warning";
                            } else if (data.status === 30) {
                                add_color = "txtann success";
                            } else if (data.status === 40) {
                                add_color = "txtann info";
                            }

                            if (data.format === 1) {
                                data.message.replace(/\r\n|\r|\n/g, "<br />");
                            }

                            return (
                                <div
                                    className={
                                        "blocktrades-announcements " + add_color
                                    }
                                    key={index}
                                >
                                    {data.message}
                                </div>
                            );
                        }, this)}
                    </div>
                );
            }

            return (
                <div>
                    <div style={{paddingBottom: 15}}>
                        <Translate
                            component="h5"
                            content="gateway.bridge_text"
                        />
                    </div>
                    {announcements}
                    <table className="table">
                        {deposit_header}
                        {deposit_body}
                        {withdraw_header}
                        {withdraw_body}
                    </table>
                </div>
            );
        }
    }
} // CitadelBridgeDepositRequest

export default BindToChainState(CitadelBridgeDepositRequest);
