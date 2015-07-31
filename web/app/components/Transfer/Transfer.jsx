import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import DoneScreen from "./DoneScreen";
import classNames from "classnames";
import utils from "common/utils";
import AccountActions from "actions/AccountActions";
import AccountInfo from "../Account/AccountInfo";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import AccountSelect from "../Forms/AccountSelect";
import debounce from "lodash.debounce";
import Immutable from "immutable";
import Wallet from "components/Wallet/Wallet";

class Transfer extends BaseComponent {
    constructor(props) {
        super(props);

        this.state = {
            transfer: {
                from: null,
                from_id: null,
                amount: null,
                asset: "1.3.0",
                to: null,
                to_id: null,
                memo: null
            },
            isValid: false,
            confirmation: false,
            done: false,
            error: null,
            errors: {
                from: null,
                amount: null,
                to: null,
                memo: null
            },
            searchTerm: ""
        };

        this._bind("formChange", "onSubmit", "onConfirm", "newTransfer");
        this._searchAccounts = debounce(this._searchAccounts, 150);
    }

    componentDidMount() {
        let {cachedAccounts, currentAccount} = this.props;
        if (currentAccount) {
            let account = cachedAccounts.get(currentAccount.name);
            if (!account) {
                AccountActions.getAccount(currentAccount.name);
            }
        }
    }

    componentWillReceiveProps(nextProps) {

        // Update searchAccounts if the id is missing from transfer.to_id
        let {transfer} = this.state;
        if (!transfer.to_id && transfer.to && !Immutable.is(nextProps.searchAccounts, this.props.searchAccounts)) {
            let to_account = nextProps.searchAccounts.findEntry(a => {
                return a === transfer.to;
            });
            if (to_account) {
                transfer.to_id = to_account[0];         
                this.setState({transfer: transfer});
                this.validateTransferFields();       
            }
        }

        // Make sure transfer.from_id is defined
        if (transfer.from && !transfer.from_id) { 
            let {account_name_to_id} = nextProps;
            if (account_name_to_id[transfer.from]) {
                transfer.from_id = account_name_to_id[transfer.from];
                this.setState({transfer: transfer});
            }
        }
    }

    validateTransferFields() {
        function checkBalance(account_balance, asset_id, amount) {
            if (!account_balance || !asset_id || !amount) {
                return -1;
            }
            for (var i = 0; i < account_balance.length; i++) {
                if (account_balance[i].asset_id === asset_id) {
                    return account_balance[i].amount - amount;
                }
            }
        }

        let errors = this.state.errors;
        let transfer = this.state.transfer;
        let req = counterpart.translate("transfer.errors.req");
        let pos = counterpart.translate("transfer.errors.pos");
        let valid = counterpart.translate("transfer.errors.valid");
        let balance = counterpart.translate("transfer.errors.balance");
        errors.amount = null;
        let finalBalance = checkBalance(this.props.accountBalances.get(transfer.from), transfer.asset, transfer.amount );
        if(transfer.amount !== null) {
            if (!transfer.amount) {
                errors.amount = req;
            } else if ((Number(transfer.amount) === 0)) {
                errors.amount = pos;
            } else if (!(Number(transfer.amount) > 0.0)) {
                errors.amount = valid;
            } else if (finalBalance < 0) {
                errors.amount = balance;
            }
        }
        errors.to = null;
        if(transfer.to !== null) {
            if (!transfer.to || !transfer.to_id) {
                errors.to = req;
            }
        }
        this.state.isValid = !(errors.from || errors.amount || errors.to || errors.memo);


    }

    formChange(event) {
        let {error, transfer} = this.state;
        error = null;
        let key = event.target.id;
        let value = event.target.value && event.target.value[0] === "[" ? JSON.parse(event.target.value) : event.target.value;
        if (key === "from") {
            transfer.from = value;
            transfer.from_id = this.props.account_name_to_id[value];
            if (!this.props.cachedAccounts.get(value)) { AccountActions.getAccount(value); }
        } else if (key === "to") {
            this._searchAccounts(value);
            transfer.to = value;
            let account = this.props.searchAccounts.findEntry((name) => {
                return name === value;
            });

            transfer.to_id = account ? account[0] : null;

        } else {
            transfer[key] = value;
        }
        this.setState({error: error, transfer: transfer});
        this.validateTransferFields();       
    }

    onSubmit(e) {
        e.preventDefault();
        this.validateTransferFields();
        if(this.state.isValid) {
            //this.setState({confirmation: true});
            this.onConfirm()
        } else {
            this.setState({errors: this.state.errors});
        }
    }

    onConfirm() {
        // Launch api action here
        let t = this.state.transfer;
        let precision = utils.get_asset_precision(this.props.assets.get(this.state.transfer.asset).precision);
        if (!t.from_id) {
            t.from_id = this.props.currentAccount.id;
        }
        AccountActions.transfer(t.from_id, t.to_id, t.amount * precision, t.asset, t.memo).then(() => {
            this.setState({confirmation: false, done: true, error: null});
            notify.addNotification({
                message: "Transfer completed",
                level: "success",
                autoDismiss: 10
            });
        }).catch(error => {
            this.setState({confirmation: false, done: false});
        });
    }

    newTransfer() {
        this.setState({
            confirmation: false, done: false
        });
    }

    _onSearchChange(e) {
        this.setState({searchTerm: e.target.value});
        this._searchAccounts(e.target.value);
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }


    renderSelect(ref, values, value) {
        var options = values.map(function(value) {
            return <option value={value[0]}>{value[1]}</option>;
        });
        return (
            <select defaultValue={value} className="form-control" id={ref} ref={ref}>
                {options}
            </select>
        );
    }

    _onAccountSelect(account_name) {
        let {transfer} = this.state;
        transfer.from = account_name;
        transfer.from_id = this.props.account_name_to_id[account_name];
        this.setState({transfer: transfer});
    }

    render() {
        let {transfer, errors} = this.state;
        let {cachedAccounts, currentAccount, assets, accountBalances, myAccounts, payeeAccounts, account_name_to_id, searchAccounts} = this.props;
        let query_params = this.context.router.getCurrentQuery();

        if(query_params.to && !transfer.to) {
            transfer.to = query_params.to;
            // Launch a search for the account, the to_id will be updated in componentWillReceiveProps
            transfer.to_id = this._searchAccounts(query_params.to);
        }

        let account = null;
        let balancesComp = null, finalBalances = null;
        let myAssets = [];

        if(!transfer.from && currentAccount) {
            transfer.from = currentAccount.name;
            transfer.from_id = currentAccount.id;
        } else if (transfer.from && !transfer.from_id) {
            AccountActions.getAccount(transfer.from);
        }

        if (cachedAccounts.size > 0 && assets.size > 0 && accountBalances.size > 0) {
            account = cachedAccounts.get(this.state.transfer.from) || null;
            let balances = account ? accountBalances.get(account.name) : null;
            if (account && balances) {
                balancesComp = balances.map((balance) => {
                    return <li key={balance.asset_id}><FormattedAsset amount={parseInt(balance.amount, 10)} asset={assets.get(balance.asset_id)}/></li>;
                });

                finalBalances = balances.map((balance) => {
                    let asset = assets.get(balance.asset_id);
                    if (asset) {
                        myAssets.push([balance.asset_id, asset.symbol]);
                        if (balance.asset_id === transfer.asset && transfer.amount >= 0) {
                            let precision = utils.get_asset_precision(asset.precision);
                            return <span key={balance.asset_id}>
                                <Translate component="label" content="transfer.final" />
                                <FormattedAsset amount={balance.amount - transfer.amount * precision} asset={asset}/>
                            </span>;
                        }
                    }
                });
            }
        }

        let submitButtonClass = classNames("button", {disabled: !this.state.isValid});

        // if (this.state.done && currentAccount) {
        //     return (
        //         <div className="grid-block">
        //             <DoneScreen
        //                 onCancel={this.newTransfer}
        //                 key="ds"
        //                 transfer={this.state.transfer}
        //                 from={currentAccount.name}
        //                 assets={assets}
        //                 />
        //         </div>
        //     );
        // }

        let autoCompleteAccounts = searchAccounts.filter(a => {
            return a.indexOf(this.state.searchTerm) !== -1; 
        });

        return (<Wallet>
            <form className="grid-block vertical overflow-visible" onSubmit={this.onSubmit} onChange={this.formChange} noValidate>
                <div className="grid-block page-layout transfer-top shrink small-horizontal overflow-visible">
                    {/*  F R O M  */}
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "full-width-content", "no-overflow", {"has-error": errors.from})}>
                            <Translate component="label" content="transfer.from" />
                            {transfer.from && myAccounts.size > 0 ? <AccountSelect selected={transfer.from} account_names={myAccounts} onChange={this._onAccountSelect.bind(this)}/> : null}
                            <div>{errors.from}</div>
                        </div>
                    </div>
                    {/*  A M O U N T  */}
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.amount})}>
                            <label>
                                <Translate component="span" content="transfer.amount" />
                                <span className="inline-label">
                                    <input id="amount" type="text" placeholder="0.0" defaultValue={transfer.amount} ref="amount"/>
                                    <span className="form-label select">{this.renderSelect("asset", myAssets)}</span>
                                </span>
                            </label>
                            <div>{errors.amount}</div>
                        </div>
                    </div>
                    {/*  T O  */}
                    <div className="grid-block medium-3 overflow-visible">
                        <div className={classNames("medium-12", {"has-error": errors.to})}>
                            <Translate component="label" content="transfer.to" />
                            <AutocompleteInput
                                id="to"
                                options={autoCompleteAccounts}
                                initial_value={transfer.to}
                                onChange={this.formChange}
                                test={this.testFunction} />
                            <div>{errors.to}</div>
                        </div>
                    </div>
                    {/*  S E N D  B U T T O N  */}
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": this.state.error})}>
                            <label>&nbsp;</label>
                            <button className={submitButtonClass} type="submit" value="Submit"><Translate component="span" content="transfer.send" /></button>
                            { this.state.error ? <div>{this.state.error}</div> : <div>&nbsp;<br/></div> }
                        </div>
                    </div>
                </div>

                <div className="grid-block page-layout transfer-bottom small-horizontal">
                    {/*  F R O M  A C C O U N T  */}
                    <div className="grid-block medium-3 medium-order-1 small-order-3">
                        <div className="grid-content">
                            {transfer.from ? <AccountInfo account_name={transfer.from} account_id={transfer.from_id} image_size={{height: 120, width: 120}}/> : null}
                            <hr/>
                            <h5><Translate component="span" content="transfer.balances" />:</h5>
                            <ul style={{listStyle: "none"}}>
                                {balancesComp}
                            </ul>
                        </div>
                    </div>
                    {/*  M E M O  */}
                    <div className="grid-block medium-3 medium-order-2 small-order-1">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.memo})}>
                            <label>
                                <Translate component="span" content="transfer.memo" />
                                <textarea id="memo" rows="5" ref="memo" value={transfer.memo}/>
                            </label>
                            <div>{errors.memo}</div>
                        </div>
                    </div>
                    {/*  T O  A C C O U N T  */}
                    <div className="grid-block medium-3 medium-order-3 small-order-4">
                        <div className="grid-content">
                            { transfer.to_id ? <AccountInfo account_name={transfer.to} account_id={transfer.to_id} image_size={{height: 120, width: 120}}/> : null }
                        </div>
                    </div>
                    {/*  F I N A L  B A L A N C E  A N D  F E E  */}
                    <div className="grid-block medium-3 medium-order-4 small-order-2">
                        <div className="grid-content">
                            {finalBalances}
                        </div>
                    </div>
                </div>

            </form>
        </Wallet>);
    }
}

Transfer.defaultProps = {
    cachedAccounts: {},
    assets: {},
    currentAccount: {}
};

Transfer.propTypes = {
    cachedAccounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    currentAccount: PropTypes.object.isRequired
};

Transfer.contextTypes = { router: React.PropTypes.func.isRequired };

export default Transfer;
