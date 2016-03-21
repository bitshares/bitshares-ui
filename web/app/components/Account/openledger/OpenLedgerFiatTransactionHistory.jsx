import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import LoadingIndicator from "../../LoadingIndicator";
import { ChainStore } from "@graphene/chain";
import ChainTypes from "../../Utility/ChainTypes";
import BindToChainState from "../../Utility/BindToChainState";
import Statistics from "../Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../../Icon/Icon";
import TimeAgo from "../../Utility/TimeAgo";
import HelpContent from "../../Utility/HelpContent";
// import WalletDb from "stores/WalletDb";
import WithdrawModal from "../../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import BalanceComponent from "../../Utility/BalanceComponent";
import RefcodeInput from "../../Forms/RefcodeInput";
import DepositFiatOpenLedger from "../../Modal/DepositFiatOpenLedger";
import WithdrawFiatOpenLedger from "../../Modal/WithdrawFiatOpenLedger";
var Post = require("../../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class OpenLedgerFiatTransactionHistory extends React.Component {
    static propTypes = {
        rpc_url:               React.PropTypes.string,
        account: ChainTypes.ChainAccount,
    };

    constructor(props) {
        super(props);
        this.state = {
             current_status: 'never_loaded',
             withdrawals: null,
             deposits: null,
             error: null
        }
    }

    onShowOpenLedgerTransactionHistory() {
         let json_rpc_request = {
          "jsonrpc": "2.0", 
          "method": "getRequestsList", 
          "params": {
             "bitsharesAccountName": this.props.account.get('name')
          }, 
          "id": 1 
         };
         let get_transaction_history_promise = fetch(this.props.rpc_url,
                                                     {method: 'POST', 
                                                      headers: new Headers({"Accept": "application/json", 
                                                      "content-type":"application/x-www-form-urlencoded"}), 
                                                     body: 'rq=' + encodeURIComponent(JSON.stringify(json_rpc_request)) })
                                              .then(response => response.json());
            
         get_transaction_history_promise.then((json_response) => {
                if ('result' in json_response)
                {
                  this.setState({
                     current_status: 'loaded',
                     withdrawals: json_response.result.withdrawals,
                     deposits: json_response.result.deposits,
                     error: null
                  });
                }
                else if ('error' in json_response && 'message' in json_response.error)
                  throw json_repsonse.error.message;
                else
                   throw 'Unexpected response';
            })
            .catch((error) => {
                this.setState({
                     current_status: 'error',
                     withdrawals: null,
                     deposits: null,
                     error: 'Error getting transaction history: ' + error
                });
            });
    }

    render() {
        if( !this.props.account )
            return null;

        let openledger_withdrawal_history_fragment = null;
        if (this.state.current_status === 'loaded')
        {
            let openledger_withdrawal_history_rows = [];
            if (this.state.withdrawals.length)
            {
                for (var i = 0; i < this.state.withdrawals.length; ++i)
                    openledger_withdrawal_history_rows.push(<tr>
                                                              <td>{this.state.withdrawals[i].amount} {this.state.withdrawals[i].currency}</td>
                                                              <td>{this.state.withdrawals[i].status}</td>
                                                            </tr>);
                openledger_withdrawal_history_fragment = <table className="table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Withdrawal Amount</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                { openledger_withdrawal_history_rows }
                                                            </tbody>
                                                         </table>;
            }
            else
                openledger_withdrawal_history_fragment = <p>No withdrawals</p>;
        }

        let openledger_deposit_history_fragment = null;
        if (this.state.current_status === 'loaded')
        {
            if (this.state.deposits.length)
            {
                let openledger_deposit_history_rows = [];
                for (var i = 0; i < this.state.deposits.length; ++i)
                    openledger_deposit_history_rows.push(<tr>
                                                              <td>{this.state.deposits[i].amount} {this.state.deposits[i].currency}</td>
                                                              <td><a href={this.state.deposits[i].link} target="_blank">link</a></td>
                                                              <td>{this.state.deposits[i].status}</td>
                                                         </tr>);
                openledger_deposit_history_fragment = <table className="table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Deposit Amount</th>
                                                                    <th>Details</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                { openledger_deposit_history_rows }
                                                            </tbody>
                                                         </table>;
            }
            else
                openledger_deposit_history_fragment = <p>No deposits</p>;
        }

        


        let openledger_transaction_history_fragment = null;

        if (this.state.current_status === 'error' )
            openledger_transaction_history_fragment = <div className="content-block">
                                                        <button className={"button outline"} onClick={this.onShowOpenLedgerTransactionHistory.bind(this)}> Retry </button>
                                                        <p>{this.state.error}</p>
                                                      </div>;
        else if (this.state.current_status === 'loading' )
            openledger_transaction_history_fragment = <div className="content-block">
                                                        <button className={"button outline"} onClick={this.onShowOpenLedgerTransactionHistory.bind(this)} disabled="true"> Show Transaction History </button>
                                                        <p>Loading...</p>
                                                      </div>;
        else
        {
            let button_label = this.state.current_status === 'never_loaded' ? 'Show Transaction History' : 'Refresh';
            openledger_transaction_history_fragment = <div className="content-block">
                                                        <br/>
                                                        <h4>Transaction History</h4>
                                                        <button className={"button outline"} onClick={this.onShowOpenLedgerTransactionHistory.bind(this)}> {button_label} </button>
                                                        {openledger_withdrawal_history_fragment} 
                                                        {openledger_deposit_history_fragment}
                                                      </div>;
        }

        return openledger_transaction_history_fragment;
    }
}; // OpenLedgerFiatTransactionHistory

export default OpenLedgerFiatTransactionHistory;
