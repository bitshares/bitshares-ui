import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import ConfirmationScreen from "./ConfirmationScreen";
import DoneScreen from "./DoneScreen";
import classNames from "classnames";
import utils from "common/utils";
import AccountActions from "actions/AccountActions";
import AccountInfo from "../Account/AccountInfo";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import Typeahead from "../Forms/Typeahead";

class Transfer extends BaseComponent {
    constructor(props) {
        super(props);

        this.state = {
            transfer: {
                from: null,
                amount: null,
                asset: "1.4.0",
                to: null,
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
            }
        };

        this._bind("formChange", "onSubmit", "_onConfCancel", "_onConfirm", "_newTransfer");
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.accounts === nextProps.accounts && this.state.transfer.from) { return; }
        let {accounts, currentAccount} = this.props;
        let account_id = this.state.transfer.from ? this.state.transfer.from[0] : currentAccount.id;
        let account = accounts.get(account_id);
        if (!account) { AccountActions.getAccount(account_id); }
    }

    validateTransferFields() {
        let errors = this.state.errors;
        let transfer = this.state.transfer;
        let req = counterpart.translate("transfer.errors.req");
        let pos = counterpart.translate("transfer.errors.pos");
        let valid = counterpart.translate("transfer.errors.valid");
        this.state.errors.amount = null;
        if (!transfer.amount) {
            errors.amount = req;
        } else if ((Number(transfer.amount) === 0)) {
            errors.amount = pos;
        } else if (!(Number(transfer.amount) > 0.0)) {
            errors.amount = valid;
        }

        errors.to = null;
        if (!transfer.to) {
            errors.to = req;
        }

        this.state.isValid = !(errors.from || errors.amount || errors.to || errors.memo);
    }

    formChange(event) {
        this.state.error = null;
        let key = event.target.id;
        let value = event.target.value[0] === "[" ? JSON.parse(event.target.value) : event.target.value;
        this.state.transfer[key] = value;
        if (key === "from" && value) {
            if (!this.props.accounts.get(value[0])) { AccountActions.getAccount(value[0]); }
        }
        this.validateTransferFields();
        this.setState(this.state);
    }

    onSubmit(e) {
        e.preventDefault();
        this.validateTransferFields();
        if(this.state.isValid) {
            this.setState({confirmation: true});
        } else {
            this.setState({errors: this.state.errors});
        }
    }

    //testValidation(amount) {
    //    let {accountBalances, currentAccount, assets} = this.props;
    //    let finalBalance = 0, balances = accountBalances.get(currentAccount.id);
    //    balances.forEach((balance) => {
    //        if (this.state.transfer.asset === balance.asset_id) {
    //            let precision = utils.get_asset_precision(assets.get(balance.asset_id).precision);
    //            finalBalance = balance.amount - amount * precision;
    //        }
    //        if (finalBalance < 0) {
    //            throw forms.ValidationError([forms.ValidationError("Insufficient funds", {code: "error1"})]);
    //        }
    //    });
    //}

    _onConfCancel() {
        this.setState({confirmation: false, done: false});
    }

    _onConfirm() {
        // Launch api action here
        let t = this.state.transfer;
        let precision = utils.get_asset_precision(this.props.assets.get(this.state.transfer.asset).precision);
        if (!t.from) {
            t.from = this.props.currentAccount.id;
        } else if (Array.isArray(t.from)) {
            t.from = t.from[0];
        }
        AccountActions.transfer(t.from, t.to[0], t.amount * precision, t.asset, t.memo).then(() => {
            this.setState({confirmation: false, done: true, error: null});
        }).catch(error => {
            this.setState({confirmation: false, done: false, error: error});
        });
    }

    _newTransfer() {
        let transfer = this.state.transfer;
        transfer.amount = 0;
        transfer.memo = "";
        this.setState({
            confirmation: false, done: false, transfer: transfer
        });
    }


    renderSelect(ref, values) {
        var options = values.map(function(value) {
            return <option value={value[0]}>{value[1]}</option>;
        });
        return (
            <select className="form-control" id={ref} ref={ref}>
                {options}
            </select>
        );
    }

    render() {
        let {transfer, errors} = this.state;
        let {accounts, currentAccount, assets, accountBalances} = this.props;
        let al = this.props.accounts_list;
        let account_choices = Object.keys(al).map(k => [`["${al[k]}","${k}"]`, k]);
        if (!account_choices[0]) {
            return (
                <div className="grid-block">
                    <div className="grid-block page-layout transfer-top">
                    </div>
                </div>
                );
        }
        let account = null;
        let balancesComp = null, finalBalances = null;
        let from = transfer.from ? transfer.from : JSON.parse(account_choices[0][0]);

        if (accounts.size > 0 && assets.size > 0) {
            account = accounts.get(this.state.transfer.from ? this.state.transfer.from[0] : currentAccount.id);
            let balances = account ? accountBalances.get(account.id) : null;
            if (account && balances) {
                balancesComp = balances.map((balance) => {
                    return <li key={balance.asset_id}><FormattedAsset amount={parseInt(balance.amount, 10)} asset={assets.get(balance.asset_id)}/></li>;
                });

                finalBalances = balances.map((balance) => {

                    if (balance.asset_id === transfer.asset && transfer.amount >= 0) {
                        let precision = utils.get_asset_precision(assets.get(balance.asset_id).precision);
                        return <span key={balance.asset_id}>
                            <Translate component="label" content="transfer.final" />
                            <FormattedAsset amount={balance.amount - transfer.amount * precision} asset={assets.get(balance.asset_id)}/>
                        </span>;
                    }
                });
            }
        }

        let submitButtonClass = classNames("button", {disabled: !this.state.isValid});

        if (this.state.confirmation && currentAccount) {
            return (
                <div className="grid-block">
                    <div className="grid-block page-layout transfer-top">
                        <ConfirmationScreen
                            onCancel={this._onConfCancel}
                            onConfirm={this._onConfirm}
                            key="cs"
                            transfer={this.state.transfer}
                            from={currentAccount.name}
                            assets={assets}
                            />
                    </div>
                </div>
            );
        }

        if (this.state.done && currentAccount) {
            return (
                <div className="grid-block">
                    <DoneScreen
                        onCancel={this._newTransfer}
                        key="ds"
                        transfer={this.state.transfer}
                        from={currentAccount.name}
                        />
                </div>
            );
        }


        return (
            <form className="grid-block vertical" onSubmit={this.onSubmit} onChange={this.formChange} noValidate>
                <div className="grid-block page-layout transfer-top shrink small-horizontal">
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.from})}>
                            <Translate component="label" content="transfer.from" />
                            {this.renderSelect("from", account_choices)}
                            <div>{errors.from}</div>
                        </div>
                    </div>
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.amount})}>
                            <label>
                                <Translate component="span" content="transfer.amount" />
                                <span className="inline-label">
                                    <input id="amount" type="text" placeholder="0.0" ref="amount"/>
                                    <span className="form-label select">{this.renderSelect("asset", [["1.4.0", "CORE"]])}</span>
                                </span>
                            </label>
                            <div>{errors.amount}</div>
                        </div>
                    </div>
                    <div className="grid-block medium-3">
                        <div className={classNames({"has-error": errors.to})}>
                            <Translate component="label" content="transfer.to" />
                            <Typeahead id="to-field" options={account_choices} />
                            <div>{errors.to}</div>
                        </div>
                    </div>
                    <div className="grid-block medium-3">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": this.state.error})}>
                            <label>&nbsp;</label>
                            <button className={submitButtonClass} type="submit" value="Submit"><Translate component="span" content="transfer.send" /></button>
                            { this.state.error ? <div>{this.state.error}</div> : <div>&nbsp;<br/></div> }
                        </div>
                    </div>
                </div>

                <div className="grid-block page-layout transfer-bottom small-horizontal">
                    <div className="grid-block medium-3 medium-order-1 small-order-3">
                        <div className="grid-content">
                            <AccountInfo account_name={from[1]} account_id={from[0]} image_size={{height: 120, width: 120}}/>
                            <hr/>
                            <h5><Translate component="span" content="transfer.balances" />:</h5>
                            <ul style={{listStyle: "none"}}>
                                {balancesComp}
                            </ul>
                        </div>
                    </div>
                    <div className="grid-block medium-3 medium-order-2 small-order-1">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.memo})}>
                            <label>
                                <Translate component="span" content="transfer.memo" />
                                <textarea id="memo" rows="5" ref="memo"/>
                            </label>
                            <div>{errors.memo}</div>
                        </div>
                    </div>
                    <div className="grid-block medium-3 medium-order-3 small-order-4">
                        <div className="grid-content">
                            { transfer.to ? <AccountInfo account_name={transfer.to[1]} account_id={transfer.to[0]} image_size={{height: 120, width: 120}}/> : null }
                        </div>
                    </div>
                    <div className="grid-block medium-3 medium-order-4 small-order-2">
                        <div className="grid-content">
                            {finalBalances}
                        </div>
                    </div>
                </div>
            </form>
        );
    }
}

Transfer.defaultProps = {
    accounts: {},
    assets: {},
    currentAccount: {}
};

Transfer.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    currentAccount: PropTypes.object.isRequired
};

export default Transfer;
