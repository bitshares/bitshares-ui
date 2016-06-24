import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import WithdrawModalBlocktrades from "./WithdrawModalBlocktrades";
import BlockTradesDepositAddressCache from "./BlockTradesDepositAddressCache";
import Post from "common/formPost";
import utils from "common/utils";

@BindToChainState({keep_updating:true})
class BlockTradesBridgeDepositRequest extends React.Component {
    static propTypes = {
        url:               React.PropTypes.string,
        gateway:           React.PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        initial_deposit_input_coin_type: React.PropTypes.string,
        initial_deposit_output_coin_type: React.PropTypes.string,
        initial_deposit_estimated_input_amount: React.PropTypes.string,
        initial_withdraw_input_coin_type: React.PropTypes.string,
        initial_withdraw_output_coin_type: React.PropTypes.string,
        initial_withdraw_estimated_input_amount: React.PropTypes.string
    };

    constructor(props) {
        super(props);
        this.refresh_interval = 2 * 60 * 1000; // update deposit limit/estimates every two minutes

        this.deposit_address_cache = new BlockTradesDepositAddressCache();

        this.coin_info_request_states =
        {
            request_in_progress: 0,
            request_complete: 1,
            request_failed: 2
        };

        this.estimation_directions =
        {
            output_from_input: 0,
            input_from_output: 1
        };

        let urls = {
            blocktrades: "https://api.blocktrades.us/v2",
            openledger: "https://bitshares.openledger.info/depositwithdraw/api/v2"
        }

        this.state =
        {
            url: props.url || urls[props.gateway],

            // things that get displayed for deposits
            deposit_input_coin_type: null,
            deposit_output_coin_type: null,
            input_address_and_memo: null,
            deposit_estimated_input_amount: this.props.initial_deposit_estimated_input_amount || "1.0",
            deposit_estimated_output_amount: null,
            deposit_limit: null,
            deposit_error: null,

            // things that get displayed for deposits
            withdraw_input_coin_type: null,
            withdraw_output_coin_type: null,
            withdraw_estimated_input_amount: this.props.initial_withdraw_estimated_input_amount || "1.0",
            withdraw_estimated_output_amount: null,
            withdraw_limit: null,
            withdraw_error: null,

            // input address-related
            coin_info_request_state: this.coin_info_request_states.request_in_progress,
            input_address_requests_in_progress: {},

            // estimate-related
            deposit_estimate_direction: this.estimation_directions.output_from_input,

            // deposit limit-related
            deposit_limit_cache: {},
            deposit_limit_requests_in_progress: {},

            // generic data from BlockTrades
            coins_by_type: null,
            allowed_mappings_for_deposit: null,
            allowed_mappings_for_withdraw: null
        };

        // get basic data from blocktrades

        let coin_types_url = this.state.url + "/coins";
        let coin_types_promise = fetch(coin_types_url,
                                       {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                 .then(response => response.json());
        
        let wallet_types_url = this.state.url + "/wallets";
        let wallet_types_promise = fetch(wallet_types_url, 
                                         {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                   .then(response => response.json());
        
        let trading_pairs_url = this.state.url + "/trading-pairs";
        let trading_pairs_promise = fetch(trading_pairs_url, 
                                          {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                    .then(response => response.json());

        let active_wallets_url = this.state.url + "/active-wallets";
        let active_wallets_promise = fetch(active_wallets_url, 
                                          {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                    .then(response => response.json());

        Promise.all([coin_types_promise, wallet_types_promise, trading_pairs_promise, active_wallets_promise])
        .then((json_responses) => {
            let [coin_types, wallet_types_reply, trading_pairs, active_wallets] = json_responses;

            // get quick access to coins by their types
            let coins_by_type = {};
            coin_types.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);

            // determine which mappings we will display for deposits and withdrawals
            let allowed_mappings_for_deposit = {}; // all non-bts to bts
            let allowed_mappings_for_withdraw = {}; // all bts to non-bts
            trading_pairs.forEach(pair => {
                let input_coin_info = coins_by_type[pair.inputCoinType];
                let output_coin_info = coins_by_type[pair.outputCoinType];

                // filter out pairs where one asset is a backed asset and the other is a backing asset,
                // those pairs rightly belong under the gateway section, not under the bridge section.
                if (input_coin_info.backingCoinType != pair.outputCoinType &&
                    output_coin_info.backingCoinType != pair.inputCoinType)
                {
                    // filter out mappings where one of the wallets is offline
                    if (active_wallets.indexOf(input_coin_info.walletType) != -1 &&
                        active_wallets.indexOf(output_coin_info.walletType) != -1)
                    {
                        if (input_coin_info.walletType != "bitshares2" && 
                            output_coin_info.walletType == "bitshares2")
                        {
                            allowed_mappings_for_deposit[pair.inputCoinType] = allowed_mappings_for_deposit[pair.inputCoinType] || [];
                            allowed_mappings_for_deposit[pair.inputCoinType].push(pair.outputCoinType);
                        }
                        else if (input_coin_info.walletType == "bitshares2" && 
                                 output_coin_info.walletType != "bitshares2")
                        {
                            allowed_mappings_for_withdraw[pair.inputCoinType] = allowed_mappings_for_withdraw[pair.inputCoinType] || [];
                            allowed_mappings_for_withdraw[pair.inputCoinType].push(pair.outputCoinType);
                        }
                    }
                }
            });

            // we can now set the input and output coin types
            let deposit_input_coin_type = null;
            let deposit_output_coin_type = null;
            let allowed_deposit_coin_types = Object.keys(allowed_mappings_for_deposit);
            allowed_deposit_coin_types.forEach(deposit_coin_type => { allowed_mappings_for_deposit[deposit_coin_type].sort(); });

            if (allowed_deposit_coin_types.length)
            {
                if (this.props.initial_deposit_input_coin_type &&
                    this.props.initial_deposit_input_coin_type in allowed_mappings_for_deposit)
                    deposit_input_coin_type = this.props.initial_deposit_input_coin_type;
                else
                    deposit_input_coin_type = allowed_deposit_coin_types[0];
                let output_coin_types_for_this_input = allowed_mappings_for_deposit[deposit_input_coin_type];
                if (this.props.initial_deposit_output_coin_type &&
                    output_coin_types_for_this_input.indexOf(this.props.initial_deposit_output_coin_type) != -1)
                    deposit_output_coin_type = this.props.initial_deposit_output_coin_type;
                else
                    deposit_output_coin_type = output_coin_types_for_this_input[0];
            }
            
            let withdraw_input_coin_type = null;
            let withdraw_output_coin_type = null;
            let allowed_withdraw_coin_types = Object.keys(allowed_mappings_for_withdraw);
            allowed_withdraw_coin_types.forEach(withdraw_coin_type => { allowed_mappings_for_withdraw[withdraw_coin_type].sort(); });

            if (allowed_withdraw_coin_types.length)
            {
                if (this.props.initial_withdraw_input_coin_type &&
                    this.props.initial_withdraw_input_coin_type in allowed_mappings_for_withdraw)
                    withdraw_input_coin_type = this.props.initial_withdraw_input_coin_type;
                else
                    withdraw_input_coin_type = allowed_withdraw_coin_types[0];
                let output_coin_types_for_this_input = allowed_mappings_for_withdraw[withdraw_input_coin_type];
                if (this.props.initial_withdraw_output_coin_type &&
                    output_coin_types_for_this_input.indexOf(this.props.initial_withdraw_output_coin_type) != -1)
                    withdraw_output_coin_type = this.props.initial_withdraw_output_coin_type;
                else
                    withdraw_output_coin_type = output_coin_types_for_this_input[0];
            }
            
            let input_address_and_memo = this.getCachedOrGeneratedInputAddress(deposit_input_coin_type, deposit_output_coin_type);
            let deposit_limit = this.getCachedOrFreshDepositLimit("deposit", deposit_input_coin_type, deposit_output_coin_type);
            let deposit_estimated_output_amount = this.getAndUpdateOutputEstimate("deposit", deposit_input_coin_type, deposit_output_coin_type, this.state.deposit_estimated_input_amount);

            let withdraw_estimated_output_amount = this.getAndUpdateOutputEstimate("withdraw", withdraw_input_coin_type, withdraw_output_coin_type, this.state.withdraw_estimated_input_amount);
            let withdraw_limit = this.getCachedOrFreshDepositLimit("withdraw", withdraw_input_coin_type, withdraw_output_coin_type);

            this.setState({
                coin_info_request_state: this.coin_info_request_states.request_complete,
                coins_by_type: coins_by_type,
                allowed_mappings_for_deposit: allowed_mappings_for_deposit,
                allowed_mappings_for_withdraw: allowed_mappings_for_withdraw,
                deposit_input_coin_type: deposit_input_coin_type,
                deposit_output_coin_type: deposit_output_coin_type,
                input_address_and_memo: input_address_and_memo,
                deposit_limit: deposit_limit,
                deposit_estimated_output_amount: deposit_estimated_output_amount,
                deposit_estimate_direction: this.estimation_directions.output_from_input,
                withdraw_input_coin_type: withdraw_input_coin_type,
                withdraw_output_coin_type: withdraw_output_coin_type,
                withdraw_limit: withdraw_limit,
                withdraw_estimated_output_amount: withdraw_estimated_output_amount,
                withdraw_estimate_direction: this.estimation_directions.output_from_input,
            });

        })
        .catch((error) => {
            this.setState( {
				url: "https://api.blocktrades.info/v2"
            });
		
            let coin_types_url_failover = this.state.url + "/coins";
            let coin_types_promise_failover = fetch(coin_types_url_failover,
                                       {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                 .then(response => response.json());
        
            let wallet_types_url_failover = this.state.url + "/wallets";
            let wallet_types_promise_failover = fetch(wallet_types_url_failover, 
                                         {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                   .then(response => response.json());
        
            let trading_pairs_url_failover = this.state.url + "/trading-pairs";
            let trading_pairs_promise_failover = fetch(trading_pairs_url_failover, 
                                          {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                    .then(response => response.json());

            let active_wallets_url_failover = this.state.url + "/active-wallets";
            let active_wallets_promise_failover = fetch(active_wallets_url_failover, 
                                          {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                    .then(response => response.json());
									
            Promise.all([coin_types_promise_failover, wallet_types_promise_failover, trading_pairs_promise_failover, active_wallets_promise_failover])
            .then((json_responses) => {
                let [coin_types, wallet_types_reply, trading_pairs, active_wallets] = json_responses;

                // get quick access to coins by their types
                let coins_by_type = {};
                coin_types.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);

                // determine which mappings we will display for deposits and withdrawals
                let allowed_mappings_for_deposit = {}; // all non-bts to bts
                let allowed_mappings_for_withdraw = {}; // all bts to non-bts
                trading_pairs.forEach(pair => {
                    let input_coin_info = coins_by_type[pair.inputCoinType];
                    let output_coin_info = coins_by_type[pair.outputCoinType];

                    // filter out pairs where one asset is a backed asset and the other is a backing asset,
                    // those pairs rightly belong under the gateway section, not under the bridge section.
                    if (input_coin_info.backingCoinType != pair.outputCoinType &&
                        output_coin_info.backingCoinType != pair.inputCoinType)
                    {
                        // filter out mappings where one of the wallets is offline
                        if (active_wallets.indexOf(input_coin_info.walletType) != -1 &&
                           active_wallets.indexOf(output_coin_info.walletType) != -1)
                        {
                            if (input_coin_info.walletType != "bitshares2" && 
                                output_coin_info.walletType == "bitshares2")
                            {
                                allowed_mappings_for_deposit[pair.inputCoinType] = allowed_mappings_for_deposit[pair.inputCoinType] || [];
                                allowed_mappings_for_deposit[pair.inputCoinType].push(pair.outputCoinType);
                            }
                            else if (input_coin_info.walletType == "bitshares2" && 
                                     output_coin_info.walletType != "bitshares2")
                            {
                                allowed_mappings_for_withdraw[pair.inputCoinType] = allowed_mappings_for_withdraw[pair.inputCoinType] || [];
                                allowed_mappings_for_withdraw[pair.inputCoinType].push(pair.outputCoinType);
                            }
                        }
                    }
                });

                // we can now set the input and output coin types
                let deposit_input_coin_type = null;
                let deposit_output_coin_type = null;
                let allowed_deposit_coin_types = Object.keys(allowed_mappings_for_deposit);
                allowed_deposit_coin_types.forEach(deposit_coin_type => { allowed_mappings_for_deposit[deposit_coin_type].sort(); });

                if (allowed_deposit_coin_types.length)
                {
                    if (this.props.initial_deposit_input_coin_type &&
                        this.props.initial_deposit_input_coin_type in allowed_mappings_for_deposit)
                        deposit_input_coin_type = this.props.initial_deposit_input_coin_type;
                    else
                        deposit_input_coin_type = allowed_deposit_coin_types[0];
                    let output_coin_types_for_this_input = allowed_mappings_for_deposit[deposit_input_coin_type];
                    if (this.props.initial_deposit_output_coin_type &&
                        output_coin_types_for_this_input.indexOf(this.props.initial_deposit_output_coin_type) != -1)
                        deposit_output_coin_type = this.props.initial_deposit_output_coin_type;
                    else
                        deposit_output_coin_type = output_coin_types_for_this_input[0];
                }
            
                let withdraw_input_coin_type = null;
                let withdraw_output_coin_type = null;
                let allowed_withdraw_coin_types = Object.keys(allowed_mappings_for_withdraw);
                allowed_withdraw_coin_types.forEach(withdraw_coin_type => { allowed_mappings_for_withdraw[withdraw_coin_type].sort(); });

                if (allowed_withdraw_coin_types.length)
                {
                    if (this.props.initial_withdraw_input_coin_type &&
                        this.props.initial_withdraw_input_coin_type in allowed_mappings_for_withdraw)
                        withdraw_input_coin_type = this.props.initial_withdraw_input_coin_type;
                    else
                        withdraw_input_coin_type = allowed_withdraw_coin_types[0];
                    let output_coin_types_for_this_input = allowed_mappings_for_withdraw[withdraw_input_coin_type];
                    if (this.props.initial_withdraw_output_coin_type &&
                        output_coin_types_for_this_input.indexOf(this.props.initial_withdraw_output_coin_type) != -1)
                        withdraw_output_coin_type = this.props.initial_withdraw_output_coin_type;
                    else
                        withdraw_output_coin_type = output_coin_types_for_this_input[0];
                }
            
                let input_address_and_memo = this.getCachedOrGeneratedInputAddress(deposit_input_coin_type, deposit_output_coin_type);
                let deposit_limit = this.getCachedOrFreshDepositLimit("deposit", deposit_input_coin_type, deposit_output_coin_type);
                let deposit_estimated_output_amount = this.getAndUpdateOutputEstimate("deposit", deposit_input_coin_type, deposit_output_coin_type, this.state.deposit_estimated_input_amount);

                let withdraw_estimated_output_amount = this.getAndUpdateOutputEstimate("withdraw", withdraw_input_coin_type, withdraw_output_coin_type, this.state.withdraw_estimated_input_amount);
                let withdraw_limit = this.getCachedOrFreshDepositLimit("withdraw", withdraw_input_coin_type, withdraw_output_coin_type);

                this.setState({
                    coin_info_request_state: this.coin_info_request_states.request_complete,
                    coins_by_type: coins_by_type,
                    allowed_mappings_for_deposit: allowed_mappings_for_deposit,
                    allowed_mappings_for_withdraw: allowed_mappings_for_withdraw,
                    deposit_input_coin_type: deposit_input_coin_type,
                    deposit_output_coin_type: deposit_output_coin_type,
                    input_address_and_memo: input_address_and_memo,
                    deposit_limit: deposit_limit,
                    deposit_estimated_output_amount: deposit_estimated_output_amount,
                    deposit_estimate_direction: this.estimation_directions.output_from_input,
                    withdraw_input_coin_type: withdraw_input_coin_type,
                    withdraw_output_coin_type: withdraw_output_coin_type,
                    withdraw_limit: withdraw_limit,
                    withdraw_estimated_output_amount: withdraw_estimated_output_amount,
                    withdraw_estimate_direction: this.estimation_directions.output_from_input,
                });

            })
            .catch((error) => {
                this.setState( {
                    coin_info_request_state: this.coin_info_request_states.request_failed,
                    coins_by_type: null,
                    allowed_mappings_for_deposit: null,
                    allowed_mappings_for_withdraw: null
                });						
            });
		});
    }

    // functions for periodically updating our deposit limit and estimates
    updateEstimates()
    {
        if (this.state.deposit_input_coin_type && this.state.deposit_output_coin_type)
        {
            // input address won't usually need refreshing unless there was an error
            // generating it last time around
            let new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(this.state.deposit_input_coin_type, this.state.deposit_output_coin_type);


            let new_deposit_limit = this.getCachedOrFreshDepositLimit("deposit", this.state.deposit_input_coin_type, this.state.deposit_output_coin_type);
            let new_deposit_estimated_input_amount = this.state.deposit_estimated_input_amount;
            let new_deposit_estimated_output_amount = this.state.deposit_estimated_output_amount;

            if (this.state.deposit_estimate_direction == this.estimation_directions.output_from_input)
                new_deposit_estimated_output_amount = this.getAndUpdateOutputEstimate("deposit", this.state.deposit_input_coin_type, this.state.deposit_output_coin_type, new_deposit_estimated_input_amount);
            else
                new_deposit_estimated_input_amount = this.getAndUpdateInputEstimate("deposit", this.state.deposit_input_coin_type, this.state.deposit_output_coin_type, new_deposit_estimated_output_amount);
            

            let new_withdraw_limit = this.getCachedOrFreshDepositLimit("withdraw", this.state.withdraw_input_coin_type, this.state.withdraw_output_coin_type);
            let new_withdraw_estimated_input_amount = this.state.withdraw_estimated_input_amount;
            let new_withdraw_estimated_output_amount = this.state.withdraw_estimated_output_amount;

            if (this.state.withdraw_estimate_direction == this.estimation_directions.output_from_input)
                new_withdraw_estimated_output_amount = this.getAndUpdateOutputEstimate("withdraw", this.state.withdraw_input_coin_type, this.state.withdraw_output_coin_type, new_withdraw_estimated_input_amount);
            else
                new_withdraw_estimated_input_amount = this.getAndUpdateinputEstimate("withdraw", this.state.withdraw_input_coin_type, this.state.withdraw_output_coin_type, new_withdraw_estimated_output_amount);


            this.setState(
            {
                input_address_and_memo: new_input_address_and_memo,
                deposit_limit: new_deposit_limit,
                deposit_estimated_input_amount: new_deposit_estimated_input_amount,
                deposit_estimated_output_amount: new_deposit_estimated_output_amount,
                withdraw_limit: new_withdraw_limit,
                withdraw_estimated_input_amount: new_withdraw_estimated_input_amount,
                withdraw_estimated_output_amount: new_withdraw_estimated_output_amount
            });
        }
    }

    componentDidMount()
    {
        this.update_timer = setInterval(this.updateEstimates.bind(this), this.refresh_interval);
    }

    componentWillUnmount()
    {
        clearInterval(this.update_timer);
    }
    
    // functions for managing input addresses
    getCachedInputAddress(input_coin_type, output_coin_type, memo)
    {
        let account_name = this.props.account.get('name');
        return this.deposit_address_cache.getCachedInputAddress(this.props.gateway, account_name, input_coin_type, output_coin_type);
    }

    cacheInputAddress(input_coin_type, output_coin_type, address, memo)
    {
        let account_name = this.props.account.get('name');
        this.deposit_address_cache.cacheInputAddress(this.props.gateway, account_name, input_coin_type, output_coin_type, address);
    }

    getCachedOrGeneratedInputAddress(input_coin_type, output_coin_type)
    {
        // if we already have an address, just return it
        let cached_input_address_and_memo = this.getCachedInputAddress(input_coin_type, output_coin_type);
        if (cached_input_address_and_memo)
            return cached_input_address_and_memo;

        // if we've already asked for this address, return null, it will trigger a refresh when it completes
        this.state.input_address_requests_in_progress[input_coin_type] = this.state.input_address_requests_in_progress[input_coin_type] || {};
        if (this.state.input_address_requests_in_progress[input_coin_type][output_coin_type])
            return null;

        // else, no active request for this mapping, kick one off
        let body = JSON.stringify({ 
            inputCoinType: input_coin_type,
            outputCoinType: output_coin_type, 
            outputAddress: this.props.account.get('name')
        });

        this.state.input_address_requests_in_progress[input_coin_type][output_coin_type] = true;

        fetch(this.state.url + '/simple-api/initiate-trade', {
            method:'post',
            headers: new Headers({"Accept": "application/json", "Content-Type": "application/json"}),
            body: body
        }).then(reply => { reply.json().then( json => {
            console.assert(json.inputCoinType == input_coin_type, "unexpected reply from initiate-trade");
                console.assert(json.outputCoinType == output_coin_type, "unexpected reply from initiate-trade");
                if (json.inputCoinType != input_coin_type ||
                    json.outputCoinType != output_coin_type)
                    throw Error("unexpected reply from initiate-trade");
                this.cacheInputAddress(json.inputCoinType, json.outputCoinType, json.inputAddress, json.inputMemo);
                delete this.state.input_address_requests_in_progress[input_coin_type][output_coin_type];
                if (this.state.deposit_input_coin_type == json.inputCoinType &&
                    this.state.deposit_output_coin_type == json.outputCoinType)
                    this.setState({input_address_and_memo: {"address": json.inputAddress, "memo": json.inputMemo}});
            }, error => {
                delete this.state.input_address_requests_in_progress[input_coin_type][output_coin_type];
                if (this.state.deposit_input_coin_type == input_coin_type &&
                    this.state.deposit_output_coin_type == output_coin_type)
                    this.setState({input_address_and_memo: {"address": "error generating address", "memo": null}});
            }
        )
        }, error => {
            delete this.state.input_address_requests_in_progress[input_coin_type][output_coin_type];
            if (this.state.deposit_input_coin_type == input_coin_type &&
                this.state.deposit_output_coin_type == output_coin_type)
                this.setState({input_address_and_memo: {"address": "error generating address", "memo": null}});
        });
        return null;
    }
    
    // functions for managing deposit limits
    getCachedDepositLimit(input_coin_type, output_coin_type)
    {
        
        this.state.deposit_limit_cache[input_coin_type] = this.state.deposit_limit_cache[input_coin_type] || {};
        if (this.state.deposit_limit_cache[input_coin_type][output_coin_type])
        {
            let deposit_limit_record = this.state.deposit_limit_cache[input_coin_type][output_coin_type];
            let cache_age = new Date() - deposit_limit_record.timestamp;
            if (cache_age < this.refresh_interval)
                return deposit_limit_record;
            delete this.state.deposit_limit_cache[input_coin_type][output_coin_type]; 
        }
        return null;
    }

    cacheDepositLimit(input_coin_type, output_coin_type, deposit_limit_record)
    {
        deposit_limit_record.timestamp = new Date();
        this.state.deposit_limit_cache[input_coin_type] = this.state.deposit_limit_cache[input_coin_type] || {};
        this.state.deposit_limit_cache[input_coin_type][output_coin_type] = deposit_limit_record;
    }

    getCachedOrFreshDepositLimit(deposit_or_withdraw, input_coin_type, output_coin_type)
    {
        let deposit_limit_record = this.getCachedDepositLimit(input_coin_type, output_coin_type);
        if (deposit_limit_record)
            return deposit_limit_record;

        this.state.deposit_limit_requests_in_progress[input_coin_type] = this.state.input_address_requests_in_progress[input_coin_type] || {};
        this.state.deposit_limit_requests_in_progress[input_coin_type][output_coin_type] = true;

        let deposit_limit_url = this.state.url + 
                                "/deposit-limits?inputCoinType=" + encodeURIComponent(input_coin_type) +
                                "&outputCoinType=" + encodeURIComponent(output_coin_type);
        let deposit_limit_promise = fetch(deposit_limit_url, 
                                          {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                    .then(response => response.json());
        deposit_limit_promise.then(reply => {
            console.assert(reply.inputCoinType == input_coin_type &&
                           reply.outputCoinType == output_coin_type, 
                           "unexpected reply from deposit-limits");
            if (reply.inputCoinType != input_coin_type || reply.outputCoinType != output_coin_type)
                throw Error("unexpected reply from deposit-limits");
            let new_deposit_limit_record =
            { 
                timestamp: new Date(),
                limit: reply.depositLimit 
            };
            this.cacheDepositLimit(input_coin_type, output_coin_type, new_deposit_limit_record);
            delete this.state.deposit_limit_requests_in_progress[input_coin_type][output_coin_type];
            if (this.state[deposit_or_withdraw + "_input_coin_type"] == input_coin_type && 
                this.state[deposit_or_withdraw + "_output_coin_type"] == output_coin_type)
                this.setState({[deposit_or_withdraw + "_limit"]: new_deposit_limit_record});
        }, error => {
            delete this.state.deposit_limit_requests_in_progress[input_coin_type][output_coin_type];
        });
        return null;
    }

    getAndUpdateOutputEstimate(deposit_or_withdraw, input_coin_type, output_coin_type, input_amount)
    {
        let estimate_output_url = this.state.url + 
                                "/estimate-output-amount?inputAmount=" + encodeURIComponent(input_amount) +
                                "&inputCoinType=" + encodeURIComponent(input_coin_type) +
                                "&outputCoinType=" + encodeURIComponent(output_coin_type);
        let estimate_output_promise = fetch(estimate_output_url,
                                            {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                      .then(response => response.json());
        estimate_output_promise.then(reply => {
            // console.log("Reply: ", reply);
            if (reply.error)
            {
                if (this.state[deposit_or_withdraw + "_input_coin_type"] == input_coin_type && 
                    this.state[deposit_or_withdraw + "_output_coin_type"] == output_coin_type &&
                    this.state[deposit_or_withdraw + "_estimated_input_amount"] == input_amount &&
                    this.state[deposit_or_withdraw + "_estimate_direction"] == this.estimation_directions.output_from_input)
                {
                    let user_message = reply.error.message;
                    let expected_prefix = "Internal Server Error: ";
                    if (user_message.startsWith(expected_prefix))
                        user_message = user_message.substr(expected_prefix.length);

                    this.setState({[deposit_or_withdraw + "_error"]: user_message});
                }
            }
            else
            {
                console.assert(reply.inputCoinType == input_coin_type &&
                               reply.outputCoinType == output_coin_type &&
                               reply.inputAmount == input_amount, 
                               "unexpected reply from estimate-output-amount");
                if (reply.inputCoinType != input_coin_type || 
                    reply.outputCoinType != output_coin_type || 
                    reply.inputAmount != input_amount)
                    throw Error("unexpected reply from estimate-output-amount");
                if (this.state[deposit_or_withdraw + "_input_coin_type"] == input_coin_type && 
                    this.state[deposit_or_withdraw + "_output_coin_type"] == output_coin_type &&
                    this.state[deposit_or_withdraw + "_estimated_input_amount"] == input_amount &&
                    this.state[deposit_or_withdraw + "_estimate_direction"] == this.estimation_directions.output_from_input)
                    this.setState({[deposit_or_withdraw + "_estimated_output_amount"]: reply.outputAmount, [deposit_or_withdraw + "_error"]: null});
            }
        }, error => {
        });

        return null;
    }

    getAndUpdateInputEstimate(deposit_or_withdraw, input_coin_type, output_coin_type, output_amount)
    {
        let estimate_input_url = this.state.url + 
                                "/estimate-input-amount?outputAmount=" + encodeURIComponent(output_amount) +
                                "&inputCoinType=" + encodeURIComponent(input_coin_type) +
                                "&outputCoinType=" + encodeURIComponent(output_coin_type);
        let estimate_input_promise = fetch(estimate_input_url,
                                            {method: 'get', headers: new Headers({"Accept": "application/json"})})
                                      .then(response => response.json());
        estimate_input_promise.then(reply => {
            console.assert(reply.inputCoinType == input_coin_type &&
                           reply.outputCoinType == output_coin_type &&
                           reply.outputAmount == output_amount, 
                           "unexpected reply from estimate-input-amount");
            if (reply.inputCoinType != input_coin_type || 
                reply.outputCoinType != output_coin_type || 
                reply.outputAmount != output_amount)
                throw Error("unexpected reply from estimate-input-amount");
            if (this.state[deposit_or_withdraw + "_input_coin_type"] == input_coin_type && 
                this.state[deposit_or_withdraw + "_output_coin_type"] == output_coin_type &&
                this.state[deposit_or_withdraw + "_estimated_output_amount"] == output_amount &&
                this.state[deposit_or_withdraw + "_estimate_direction"] == this.estimation_directions.input_from_output)
                this.setState({[deposit_or_withdraw + "_estimated_input_amount"]: reply.inputAmount});
        }, error => {
        });

        return null;
    }

    onInputAmountChanged(deposit_or_withdraw, event)
    {
        let new_estimated_input_amount = event.target.value;
        let new_estimated_output_amount = this.getAndUpdateOutputEstimate(deposit_or_withdraw,
                                                                          this.state[deposit_or_withdraw + "_input_coin_type"], 
                                                                          this.state[deposit_or_withdraw + "_output_coin_type"], 
                                                                          new_estimated_input_amount);

        this.setState(
        {
            [deposit_or_withdraw + "_estimated_input_amount"]: new_estimated_input_amount,
            [deposit_or_withdraw + "_estimated_output_amount"]: new_estimated_output_amount,
            [deposit_or_withdraw + "_estimate_direction"]: this.estimation_directions.output_from_input
        });
    }

    onOutputAmountChanged(deposit_or_withdraw, event)
    {
        let new_estimated_output_amount = event.target.value;
        let new_estimated_input_amount = this.getAndUpdateInputEstimate(deposit_or_withdraw, 
                                                                        this.state[deposit_or_withdraw + "_input_coin_type"], 
                                                                        this.state[deposit_or_withdraw + "_output_coin_type"], 
                                                                        new_estimated_output_amount);

        this.setState(
        {
            [deposit_or_withdraw + "_estimated_output_amount"]: new_estimated_output_amount,
            [deposit_or_withdraw + "_estimated_input_amount"]: new_estimated_input_amount,
            [deposit_or_withdraw + "_estimate_direction"]: this.estimation_directions.input_from_output
        });
    }


    getWithdrawModalId() {
        return "withdraw_asset_" + this.props.gateway + "_bridge";
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }
    
    onInputCoinTypeChanged(deposit_or_withdraw, event)
    {
        let new_input_coin_type = event.target.value;
        let possible_output_coin_types = this.state["allowed_mappings_for_" + deposit_or_withdraw][new_input_coin_type];
        let new_output_coin_type = possible_output_coin_types[0];
        if (possible_output_coin_types.indexOf(this.state[deposit_or_withdraw + "_output_coin_type"]) != -1)
            new_output_coin_type = this.state[deposit_or_withdraw + "_output_coin_type"];

        let new_input_address_and_memo = this.state.input_address_and_memo;
        if (deposit_or_withdraw == "deposit")
            new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(new_input_coin_type, new_output_coin_type);
        let new_deposit_limit = this.getCachedOrFreshDepositLimit(deposit_or_withdraw, new_input_coin_type, new_output_coin_type);
        let estimated_output_amount = this.getAndUpdateOutputEstimate(deposit_or_withdraw, new_input_coin_type, new_output_coin_type, this.state.deposit_estimated_input_amount);
        
        this.setState(
        {
            [deposit_or_withdraw + "_input_coin_type"]: new_input_coin_type,
            [deposit_or_withdraw + "_output_coin_type"]: new_output_coin_type,
            input_address_and_memo: new_input_address_and_memo,
            [deposit_or_withdraw + "_limit"]: new_deposit_limit,
            [deposit_or_withdraw + "_estimated_output_amount"]: estimated_output_amount,
            [deposit_or_withdraw + "_estimate_direction"]: this.estimation_directions.output_from_input
        });
    }
    
    onOutputCoinTypeChanged(deposit_or_withdraw, event)
    {
        let new_output_coin_type = event.target.value;
        let new_input_address_and_memo = this.state.input_address_and_memo;
        if (deposit_or_withdraw == "deposit")
            new_input_address_and_memo = this.getCachedOrGeneratedInputAddress(this.state[deposit_or_withdraw + "_input_coin_type"], new_output_coin_type);
        let new_deposit_limit = this.getCachedOrFreshDepositLimit(deposit_or_withdraw, this.state[deposit_or_withdraw + "_input_coin_type"], new_output_coin_type);
        let estimated_output_amount = this.getAndUpdateOutputEstimate(deposit_or_withdraw, this.state[deposit_or_withdraw + "_input_coin_type"], new_output_coin_type, this.state[deposit_or_withdraw + "_estimated_input_amount"]);
        
        this.setState(
        {
            [deposit_or_withdraw + "_output_coin_type"]: new_output_coin_type,
            input_address_and_memo: new_input_address_and_memo,
            [deposit_or_withdraw + "_limit"]: new_deposit_limit,
            [deposit_or_withdraw + "_estimated_output_amount"]: estimated_output_amount,
            [deposit_or_withdraw + "_estimate_direction"]: this.estimation_directions.output_from_input
        });
    }

    render() {
        if (!this.props.account || !this.props.issuer_account || !this.props.gateway)
            return  <div></div>;

        let deposit_body, deposit_header, withdraw_body, withdraw_header, withdraw_modal_id;

        if (this.state.coin_info_request_state == this.coin_info_request_states.request_failed)
        {
            return  <div>
                        <p>Error connecting to blocktrades.us, please try again later</p>
                    </div>;
        }
        else if (this.state.coin_info_request_state == this.coin_info_request_states.never_requested || 
                 this.state.coin_info_request_state == this.coin_info_request_states.request_in_progress)
        {
            return  <div>
                      <p>Retrieving current trade data from blocktrades.us</p>
                    </div>;
        }
        else
        {
            // depending on what wallets are online, we might support deposits, withdrawals, both, or neither at any given time.
            let deposit_table = null;
            let withdraw_table = null;

            let calcText = <Translate content="gateway.calc" />;

            if (Object.getOwnPropertyNames(this.state.allowed_mappings_for_deposit).length > 0)
            {
                // deposit
                let deposit_input_coin_type_options = [];
                Object.keys(this.state.allowed_mappings_for_deposit).sort().forEach(allowed_deposit_input_coin_type => {
                    deposit_input_coin_type_options.push(<option key={allowed_deposit_input_coin_type} value={allowed_deposit_input_coin_type || ""}>{this.state.coins_by_type[allowed_deposit_input_coin_type].symbol}</option>);
                });
                let deposit_input_coin_type_select = 
                    <select style={{width: "11rem"}} className="external-coin-types" value={this.state.deposit_input_coin_type || ""} onChange={this.onInputCoinTypeChanged.bind(this, "deposit")}>
                      {deposit_input_coin_type_options}
                    </select>;

                let deposit_output_coin_type_options = [];
                let deposit_output_coin_types = this.state.allowed_mappings_for_deposit[this.state.deposit_input_coin_type];
                deposit_output_coin_types.forEach(allowed_deposit_output_coin_type => {
                    deposit_output_coin_type_options.push(<option key={allowed_deposit_output_coin_type} value={allowed_deposit_output_coin_type || ""}>{this.state.coins_by_type[allowed_deposit_output_coin_type].walletSymbol}</option>);
                });
                let deposit_output_coin_type_select = 
                    <select style={{width: "11rem"}} className="native-coin-types" value={this.state.deposit_output_coin_type || ""} onChange={this.onOutputCoinTypeChanged.bind(this, "deposit")}>
                      {deposit_output_coin_type_options}
                    </select>

                let input_address_and_memo = this.state.input_address_and_memo ? this.state.input_address_and_memo: {"address": "unknown", "memo": null};

                    
                let estimated_input_amount_text = this.state.deposit_estimated_input_amount;
                let estimated_output_amount_text = this.state.deposit_estimated_output_amount;

                let deposit_input_amount_edit_box = estimated_input_amount_text ? 
                        <input style={{width: "11rem"}} type="text"
                               value={estimated_input_amount_text || ""}
                               onChange={this.onInputAmountChanged.bind(this, "deposit") } /> : calcText;
                let deposit_output_amount_edit_box = estimated_output_amount_text ?
                        <input style={{width: "11rem"}} type="text"
                               value={estimated_output_amount_text || ""}
                               onChange={this.onOutputAmountChanged.bind(this, "deposit") } /> : calcText;
                
                let deposit_limit_element = <span>updating</span>;
                if (this.state.deposit_limit)
                {
                    if (this.state.deposit_limit.limit)
                        deposit_limit_element = <span className="deposit-limit"><Translate content="gateway.limit" amount={utils.format_number(this.state.deposit_limit.limit, 8)} symbol={this.state.coins_by_type[this.state.deposit_input_coin_type].walletSymbol} /></span>;                    
                    else
                        deposit_limit_element = null;
                    //else
                    //    deposit_limit_element = <span>no limit</span>;
                }
                
                let deposit_error_element = null;
                if (this.state.deposit_error)
                    deposit_error_element = <div>{this.state.deposit_error}</div>;


                deposit_header = 
                <thead>
                    <tr>
                        <th><Translate content="gateway.deposit" /></th>
                        <th ><Translate content="gateway.balance" /></th>
                        <th ><Translate content="gateway.deposit_to" /></th>
                    </tr>
                </thead>;

                deposit_body =                         
                    <tbody>
                        <tr>
                            <td>
                                <div style={{display: "inline-block"}}>
                                    <div>{deposit_input_coin_type_select}</div>
                                    <div>{deposit_input_amount_edit_box}</div>
                                </div>
                                &rarr;
                                <div style={{display: "inline-block"}}>
                                    <div>{deposit_output_coin_type_select}</div>
                                    <div>{deposit_output_amount_edit_box}</div>
                                </div>                            
                                <div>
                                    {deposit_error_element}
                                 </div>  
                            </td>
                            <td>
                                <AccountBalance account={this.props.account.get('name')} asset={this.state.coins_by_type[this.state.deposit_output_coin_type].walletSymbol} />
                            </td>
                            <td>
                                {input_address_and_memo.address}<br/>
                                {deposit_limit_element}                                 
                            </td>
                        </tr>
                    </tbody>;
            }

            if (Object.getOwnPropertyNames(this.state.allowed_mappings_for_withdraw).length > 0)
            {
                withdraw_modal_id = this.getWithdrawModalId();
                let withdraw_asset_symbol = this.state.coins_by_type[this.state.withdraw_input_coin_type].symbol;

                // withdrawal
                let withdraw_input_coin_type_options = [];
                Object.keys(this.state.allowed_mappings_for_withdraw).sort().forEach(allowed_withdraw_input_coin_type => {
                    withdraw_input_coin_type_options.push(<option key={allowed_withdraw_input_coin_type} value={allowed_withdraw_input_coin_type}>{this.state.coins_by_type[allowed_withdraw_input_coin_type].walletSymbol}</option>);
                });
                let withdraw_input_coin_type_select =
                    <select style={{width: "11rem"}} className="native-coin-types" value={this.state.withdraw_input_coin_type} onChange={this.onInputCoinTypeChanged.bind(this, "withdraw")}>
                      {withdraw_input_coin_type_options}
                    </select>;

                let withdraw_output_coin_type_options = [];
                let withdraw_output_coin_types = this.state.allowed_mappings_for_withdraw[this.state.withdraw_input_coin_type];
                withdraw_output_coin_types.forEach(allowed_withdraw_output_coin_type => {
                    withdraw_output_coin_type_options.push(<option key={allowed_withdraw_output_coin_type} value={allowed_withdraw_output_coin_type}>{this.state.coins_by_type[allowed_withdraw_output_coin_type].symbol}</option>);
                });
                let withdraw_output_coin_type_select = 
                    <select style={{width: "11rem"}} className="external-coin-types" value={this.state.withdraw_output_coin_type} onChange={this.onOutputCoinTypeChanged.bind(this, "withdraw")}>
                      {withdraw_output_coin_type_options}
                    </select>;

                let estimated_input_amount_text = this.state.withdraw_estimated_input_amount;

                let withdraw_input_amount_edit_box = estimated_input_amount_text ? 
                    <input style={{width: "11rem"}} type="text"
                           value={estimated_input_amount_text || ""}
                           onChange={this.onInputAmountChanged.bind(this, "withdraw") } /> : calcText;

                let estimated_output_amount_text = this.state.withdraw_estimated_output_amount;
                let withdraw_output_amount_edit_box = estimated_output_amount_text ?
                    <input style={{width: "11rem"}} type="text"
                           value={estimated_output_amount_text || ""}
                           onChange={this.onOutputAmountChanged.bind(this, "withdraw") } /> : calcText;

                let withdraw_button = 
                    <span>
                        <button className={"button"} onClick={this.onWithdraw.bind(this)}><Translate content="" /><Translate content="gateway.withdraw_now" /> </button>
                    </span>;
                let withdraw_error_element = null;
                if (this.state.withdraw_error)
                    withdraw_error_element = <div>{this.state.withdraw_error}</div>;

                let withdraw_limit_element = <span>...</span>;
                if (this.state.withdraw_limit)
                {
                    if (this.state.withdraw_limit.limit)
                        withdraw_limit_element = <span className="deposit-limit"><Translate content="gateway.limit" amount={utils.format_number(this.state.withdraw_limit.limit, 8)} symbol={this.state.coins_by_type[this.state.withdraw_input_coin_type].walletSymbol} /></span>;
                    else
                        withdraw_limit_element = <span>no limit</span>;
                }

                withdraw_header =
                <thead>
                    <tr>
                        <th><Translate content="gateway.withdraw" /></th>
                        <th ><Translate content="gateway.balance" /></th>
                        <th ></th>
                    </tr>
                </thead>;

               withdraw_body =                         
                <tbody>
                    <tr>
                        <td>
                            <div style={{display: "inline-block"}}>
                                <div>{withdraw_input_coin_type_select}</div>
                                <div>{withdraw_input_amount_edit_box}</div>
                            </div>
                            &rarr;
                            <div style={{display: "inline-block"}}>
                                <div>{withdraw_output_coin_type_select}</div>
                                <div>{withdraw_output_amount_edit_box}</div>
                            </div>                           
                            <div>
                                {withdraw_error_element}
                             </div>                            
                        </td>
                        <td>
                            <AccountBalance account={this.props.account.get('name')} asset={this.state.coins_by_type[this.state.withdraw_input_coin_type].walletSymbol} /> 
                        </td>
                        <td>
                            {withdraw_button}<br/>
                            {withdraw_limit_element}
                        </td>
                    </tr>
                </tbody>
                }   

            return (
                <div>
                    <div style={{paddingBottom: 15}}><Translate component="h5" content="gateway.bridge_text" /></div>
                    <div className="blocktrades-bridge">
                        <table className="table">
                            {deposit_header}
                            {deposit_body}
                            {withdraw_header}
                            {withdraw_body}
                        </table>
                    </div>
                    <Modal id={withdraw_modal_id} overlay={true}>
                        <Trigger close={withdraw_modal_id}>
                            <a href="#" className="close-button">&times;</a>
                        </Trigger>
                        <br/>
                        <div className="grid-block vertical">
                            <WithdrawModalBlocktrades
                                account={this.props.account.get('name')}
                                issuer={this.props.issuer_account.get('name')}
                                asset={this.state.coins_by_type[this.state.withdraw_input_coin_type].walletSymbol}
                                output_coin_name={this.state.coins_by_type[this.state.withdraw_output_coin_type].name}
                                output_coin_symbol={this.state.coins_by_type[this.state.withdraw_output_coin_type].symbol}
                                output_coin_type={this.state.withdraw_output_coin_type}
                                modal_id={withdraw_modal_id} 
                                url={this.state.url}
                                output_wallet_type={this.state.coins_by_type[this.state.withdraw_output_coin_type].walletType} /> 
                        </div>
                    </Modal>
                </div>
            );
        }
    }
}; // BlockTradesBridgeDepositRequest

export default BlockTradesBridgeDepositRequest;
