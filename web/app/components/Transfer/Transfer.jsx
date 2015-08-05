import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import FormattedAsset from "../Utility/FormattedAsset";
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
import AccountSelect from "../Forms/AccountSelect";
import debounce from "lodash.debounce";
import Immutable from "immutable";
import ChainStore from "api/chain.js"
import Wallet from "components/Wallet/Wallet";
import validation from "common/validation"


class Transfer extends BaseComponent {
    constructor(props) {
        super(props);

        this.state = {
            transfer: {
                from_account : null,
                from: "",
                from_id: null,
                from_assets : [  ],
                from_balance : 0,
                amount: null,
                asset: "1.3.0",
                to_account : null,
                to: "",
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
       /*
        let {cachedAccounts, currentAccount} = this.props;
        if (currentAccount) {
            let account = cachedAccounts.get(currentAccount.name);
            if (!account) {
                AccountActions.getAccount(currentAccount.name);
            }
        }
        */
    }

    componentWillReceiveProps(nextProps) {
       /*
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
        */
    }

    validateTransferFields( new_state ) {

        new_state.errors = {
            from: null,
            amount: null,
            to: null,
            memo: null
        }

        if( new_state.transfer.from_account && (new_state.transfer.from_account == new_state.transfer.to_account) )
           new_state.errors.to = "cannot transfer to the same account" 
        if( new_state.transfer.to.length > 2 && !validation.is_account_name( new_state.transfer.to ) )
           new_state.errors.to = "invalid account name"
        if( new_state.transfer.from.length > 2 && !validation.is_account_name( new_state.transfer.from ) )
           new_state.errors.from = "invalid account name"



        let errors = new_state.errors
        new_state.isValid = !(errors.from || errors.amount || errors.to || errors.memo);

       /*
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
        */
    }
    update() {
       console.log( "init state:", this.state )
       console.log( "this.state.from: ",this.state.transfer.from )
        let transfer = { 
            from_balance : 0,
            from_assets : this.state.transfer.from_assets,
            from: this.state.transfer.from.toLowerCase().trim(), 
            to: this.state.transfer.to.toLowerCase().trim(),
            amount : this.state.transfer.amount,
            asset : this.state.transfer.asset,
            memo: this.state.transfer.memo
        }
        let new_state  = {
           error : null,
           done : this.state.done,
           isValid : false,
           confirmation : false,
           errors: {
               from: null,
               amount: null,
               to: null,
               memo: null
           }
        }

        transfer.to_account   = ChainStore.getAccountByName( transfer.to )
        transfer.to_id        = transfer.to_account ? transfer.to_account.get('id') : null
        transfer.from_account = ChainStore.getAccountByName( transfer.from )
        transfer.from_id      = transfer.from_account ? transfer.from_account.get('id') : null
        new_state.transfer = transfer

        if( transfer.from_id && transfer.from_id != this.state.transfer.from_id )
        {
            ChainStore.fetchFullAccountById( transfer.from_id ).then( this.update.bind(this) )
        }

        if( transfer.from_account )
        {
           console.log( transfer.from_account.toJS() )
           let avalable_balances = transfer.from_account.get('balances')

           console.log( "available balances: ", avalable_balances )
           transfer.from_assets = []
           if( avalable_balances )
           {
              for( let balance of avalable_balances.entries() )
              {
                 let aobj = ChainStore.getObject( balance[0] )
                 if( !aobj ) 
                    ChainStore.fetchObject( balance[0] ).then( this.update.bind(this) )

                 let bobj = ChainStore.getObject( balance[1] )
                 if( bobj )
                 {
                    if( balance[0] == transfer.asset )
                       transfer.from_balance = bobj.get('balance')
                    if( bobj.get( 'balance' ) > 0 )
                       transfer.from_assets.push( [balance[0], aobj ? aobj.get('symbol') : balance[0] ] )
                 }
              }
           }
           transfer.from_available = ChainStore.getAccountBalance( transfer.from_account, transfer.asset )
        }
        this.validateTransferFields( new_state )

        console.log("update state:",new_state)
        this.setState(new_state)
    }
    shouldComponentUpdate() { return true }

    formChange(event) {
        let {error, transfer} = this.state;
        error = null;
        let key = event.target.id;
        let value = event.target.value && event.target.value[0] === "[" ? JSON.parse(event.target.value) : event.target.value;
        console.log( "key:",key)
        console.log( "value:",value)
        if (key === "from") {
            transfer.from = value;
            if( validation.is_account_name( transfer.from ) )
               ChainStore.lookupAccountByName( transfer.from ).then( this.update.bind(this), this.update.bind(this) )
        } else if (key === "to") {
            transfer.to = value;
            if( validation.is_account_name( transfer.to ) )
               ChainStore.lookupAccountByName( transfer.to ).then( this.update.bind(this), this.update.bind(this) )
        } 
        else if( key == "asset" )
        {
            transfer.asset = value
        } else {
            transfer[key] = value;
        }
        this.update()
    }

    onSubmit(e) {
        e.preventDefault();
        this.validateTransferFields(this.state);
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
        console.log( "render state: ", this.state )

        let submitButtonClass = classNames("button", {disabled: !this.state.isValid});
        return (
            <form className="grid-block vertical overflow-visible" onSubmit={this.onSubmit} onChange={this.formChange} noValidate>
                   <div className="grid-block" ></div>
                   <div>
                    <p/>
                    {/*  F R O M  */}
                    <div className="grid-block medium-5">
                        <div className="grid-content shrink">
                            <AccountImage size={{height: 80, width: 80}}
                                          account={transfer.from} custom_image={null}/>
                        </div>
                        <div className="grid-block vertical">
                           <div className="grid-block">  
                              <div className="grid-content">
                                  <Translate component="label" content="transfer.from" /> 
                              </div>
                              <div className="grid-content align-right shrink"> {/*balancesComp*/} </div>
                           </div>
                           <div className="grid-content full-width-content no-overflow"> 
                                <input id="from" type="text" value={transfer.from}  defaultValue={transfer.from} ref="from" onChange={this.form_change}/>
                           </div>
                           <div className="grid-block"> 
                               { errors.from ? null : 
                                 (<div className="grid-content shrink">
                                    {ChainStore.getAccountMemberStatus(transfer.from_account)}
                                 </div>) 
                               } 
                               <div className="grid-content full-width-content no-overflow">{errors.from}</div>
                               <div className="grid-content shrink">{transfer.from_id}</div>
                           </div>
                        </div>
                    </div>
                    <p/>
                    {/*  T O  */}
                    <div className="grid-block medium-5">
                        <div className="grid-content shrink">
                            <AccountImage size={{height: 80, width: 80}}
                                          account={transfer.to} custom_image={null}/>
                        </div>
                        <div className="grid-block vertical">
                           <div className="grid-block">  
                              <div className="grid-content">
                                  <Translate component="label" content="transfer.to" /> 
                              </div>
                           </div>
                           <div className="grid-content full-width-content no-overflow"> 
                                <input id="to" type="text"  defaultValue={transfer.to} ref="to" onChange={this.form_change}/>
                           </div>
                           <div className="grid-block"> 
                               { errors.to ? null : 
                                 (<div className="grid-content shrink">
                                    {ChainStore.getAccountMemberStatus(transfer.to_account)}
                                 </div>)
                               } 
                               <div className="grid-content full-width-content no-overflow">{errors.to}</div>
                               <div className="grid-content shrink">{transfer.to_id}</div>
                           </div>
                        </div>
                    </div>
                    <p/>
                    {/*  A M O U N T  */}
                    <div className="grid-block medium-5">
                        <div className="grid-block vertical">
                           <div className="grid-block">
                              <div className="grid-content">
                               <label> <Translate component="span" content="transfer.amount" /> </label>
                              </div>
                              <div className="grid-content align-right shrink">
                                 { transfer.from_balance == 0 ? null : (
                                    <span>
                                    <Translate component="span" content="transfer.available" />  
                                    <FormattedAsset amount={transfer.from_balance} 
                                                    asset={ChainStore.getObject(transfer.asset)} />
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div className={classNames("grid-content", "no-overflow", {"has-error": errors.amount})}>
                                   <span className="inline-label">
                                       <input id="amount" type="text" placeholder="0.0" defaultValue={transfer.amount} ref="amount"/>
                                       <span className="form-label select">{this.renderSelect("asset", transfer.from_assets)}</span>
                                   </span>
                           </div>
                           <div className="grid-content">
                               {errors.amount}
                           </div>
                        </div>
                    </div>

                    {/*  M E M O  */}
                    <div className="grid-block medium-5">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.memo})}>
                            <label>
                                <Translate component="span" content="transfer.memo" />
                                <textarea id="memo" rows="1" ref="memo" value={transfer.memo}/>
                            </label>
                            <div>{errors.memo}</div>
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
                    {/*  F I N A L  B A L A N C E  A N D  F E E  */}
                    <div className="grid-block medium-3 medium-order-4 small-order-2">
                        <div className="grid-content">
                            {/*finalBalances*/}
                        </div>
                    </div>
                </div>

            </form>
        );
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
