import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import BalanceComponent from "../Utility/BalanceComponent";
import DoneScreen from "./DoneScreen";
import classNames from "classnames";
import utils from "common/utils";
import AccountActions from "actions/AccountActions";
import AccountImage from "../Account/AccountImage";
import AccountInfo from "../Account/AccountInfo";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import AccountSelector from "../Account/AccountSelector";
import {debounce} from "lodash";
import Immutable from "immutable";
import ChainStore from "api/ChainStore";
import AccountStore from "stores/AccountStore";
import Wallet from "components/Wallet/Wallet";
import validation from "common/validation";
import AmountSelector from "../Utility/AmountSelector";
import BindToChainState from "../Utility/BindToChainState";

class Transfer extends React.Component {

    constructor(props) {
        super(props)
        this.state = Transfer.getInitialState();
    }

    static getInitialState(){
        return {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            amount: null,
            asset: null,
            errors: {
                from: null,
                amount: null,
                to: null,
                memo: null
            }
        };
    }

    fromChanged(from_name) {
        this.setState({from_name})
    }

    toChanged(to_name) {
        this.setState({to_name})
    }

    onFromAccountChanged(from_account) {
        this.setState({from_account})
    }

    onToAccountChanged(to_account) {
        this.setState({to_account})
    }

    onAmountChanged({amount, asset}) {
        this.setState({amount, asset})
    }


    onSubmit(e) {
        e.preventDefault();
        let asset = this.state.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = this.state.amount.replace( /,/g, "" )
        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.state.memo
        ).then( () => {
            this.setState(Transfer.getInitialState());
        }).catch( e => {
            console.log( "error: ",e)
        } );
    }

    render() {
        let asset_types = [];
        let balance = null;
        if (this.state.from_account) {
            let account_balances = this.state.from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances);
            if (asset_types.length > 0) {
                let current_asset_id = this.state.asset ? this.state.asset.get("id") : asset_types[0];
                balance = (<span>Available: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
            }
        }
        let submitButtonClass = "button";
        if(!this.state.from_account || !this.state.to_account || !this.state.amount || !this.state.asset)
            submitButtonClass += " disabled";

        let from_error = null

        let from = ChainStore.getAccount( this.state.from_name )
        if( from && !AccountStore.getState().linkedAccounts.contains( this.state.from_name ) ) {
           from_error = "Not your Account"
        }

        return (
            <form className="grid-block vertical full-width-content" onSubmit={this.onSubmit.bind(this)} noValidate>
                <div className="grid-container" style={{paddingTop: "2rem"}}>
                    {/*  F R O M  */}
                    <AccountSelector label="transfer.from"
                                     error={from_error}
                                     accountName={this.state.from_name}
                                     onChange={this.fromChanged.bind(this)}
                                     onAccountChanged={this.onFromAccountChanged.bind(this)}
                                     account={this.state.from_name}
                        />

                    <p/>
                    {/*  T O  */}
                    <AccountSelector label="transfer.to"
                                     accountName={this.state.to_name}
                                     onChange={this.toChanged.bind(this)}
                                     onAccountChanged={this.onToAccountChanged.bind(this)}
                                     account={this.state.to_name}

                        />
                    {/*  A M O U N T   */}
                    <br/>
                    <AmountSelector label="transfer.amount"
                                    amount={this.state.amount}
                                    onChange={this.onAmountChanged.bind(this)}
                                    asset={asset_types.length > 0 ? asset_types[0] : null}
                                    assets={asset_types}
                                    display_balance={balance}/>
                    {/*  M E M O  */}
                    <br/><br/>
                    <div className={classNames({"has-error": this.state.errors.memo})}>
                        <label>
                            <Translate component="span" content="transfer.memo"/>
                        </label>
                        <textarea id="memo" rows="1" ref="memo" value={this.state.memo} tabIndex="4"/>
                        <div>{this.state.errors.memo}</div>
                    </div>

                    {/*  S E N D  B U T T O N  */}
                    <div>
                        <button className={submitButtonClass} type="submit" value="Submit" tabIndex="5">
                            <Translate component="span" content="transfer.send" />
                        </button>
                    </div>

                    {/* TODO: show remaining balance */}

                </div>

            </form>
        );
    }
}

export default Transfer;
