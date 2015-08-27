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
import AccountSelect from "../Forms/AccountSelect";
import debounce from "lodash.debounce";
import Immutable from "immutable";
import ChainStore from "api/chain.js"
import AccountStore from "stores/AccountStore.js"
import Wallet from "components/Wallet/Wallet";
import validation from "common/validation";

class Transfer extends BaseComponent {
    constructor(props) {
        super(props);

        this.state = {
            transfer: {
                from_account : null,
                from: "",
                from_id: null,
                from_name : "",
                from_assets : [  ],
                from_balance : null,
                amount: null,
                asset: "1.3.0",
                to_account : null,
                to: "",
                to_name : "",
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

    validateTransferFields( new_state ) {

        new_state.errors = {
            from: null,
            amount: "",
            to: null,
            memo: null
        }

        if( new_state.transfer.from_account && (new_state.transfer.from_account == new_state.transfer.to_account) )
           new_state.errors.to = "cannot transfer to the same account" 

        if( new_state.transfer.to.substring(0,1) == "#" ) 
        {
           if( isNaN( new_state.transfer.to.substring(1) ) ) new_state.errors.to = "invalid account number"
        }
        else if( new_state.transfer.to.length > 2 && !validation.is_account_name( new_state.transfer.to ) )
           new_state.errors.to = "invalid account name"

        if( new_state.transfer.from.substring(0,1) == "#" )
        {
           if(  isNaN( new_state.transfer.from.substring(1) ) ) new_state.errors.from = "invalid account number"
        }
        else if( new_state.transfer.from.length > 2 && !validation.is_account_name( new_state.transfer.from ) )
           new_state.errors.from = "invalid account name"

        let value = new_state.transfer.amount
        if(value) value = value.replace( /,/g, "" )
        let fvalue = parseFloat(value)
        if( value && value.length && isNaN(fvalue) && value != "." )
           new_state.errors.amount = "must be a number"
         else if( fvalue < 0 )
           new_state.errors.amount = "amount must be greater than 0" 

        if( new_state.transfer.from_account && !AccountStore.getState().myAccounts.contains( new_state.transfer.from) )
        {
           new_state.errors.from = "Not your account"
        }
        let errors = new_state.errors
        new_state.isValid = value && Number(value) > 0 && !(errors.from || errors.amount || errors.to || errors.memo) && new_state.transfer.from_account && new_state.transfer.to_account

    }

    update() {
       console.log( "init state:", this.state )
       console.log( "this.state.from: ",this.state.transfer.from )
        let transfer = { 
            from_balance : null,
            from_assets : this.state.transfer.from_assets,
            from: this.state.transfer.from.toLowerCase().trim(), 
            to: this.state.transfer.to.toLowerCase().trim(),
            from_name : "",
            to_name : "",
            amount : this.state.transfer.amount ? this.state.transfer.amount.trim() : "",
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

        if( transfer.to.substring(0,1) == "#" ) 
        {
           let substr = transfer.to.substring(1) 
           if( parseInt( substr ) == Number(substr) )
           {
              transfer.to_account   = ChainStore.getObject( "1.2."+substr )
              if( !transfer.to_account ) ChainStore.fetchObject( "1.2."+substr ).then( this.update.bind(this) )
           }
        }
        else
           transfer.to_account   = ChainStore.getAccountByName( transfer.to )

        if( transfer.from.substring(0,1) == "#" )
        {
           let substr = transfer.from.substring(1) 
           if( parseInt( substr ) == Number(substr) )
           {
              transfer.from_account   = ChainStore.getObject( "1.2."+substr )
              if( !transfer.from_account ) ChainStore.fetchObject( "1.2."+substr ).then( this.update.bind(this) )
           }
        }
        else
        {
           console.log( "lookup by name" )
           transfer.from_account   = ChainStore.getAccountByName( transfer.from )
        }

        if( transfer.to_account )
        {
           transfer.to_id = transfer.to_account.get('id')
           transfer.to_name = transfer.to_account.get('name')
           transfer.to_lookup_display = transfer.to.substring(0,1) == "#" ? transfer.to_account.get('name') : "#"+transfer.to_id.substring(4)
        }

        if( transfer.from_account )
        {
           transfer.from_name = transfer.from_account.get('name')
           transfer.from_id = transfer.from_account.get('id')
           if( transfer.from_id != this.state.transfer.from_id )
           {
               ChainStore.fetchFullAccountById( transfer.from_id ).then( this.update.bind(this) )
           }

           transfer.from_lookup_display = transfer.from.substring(0,1) == "#" ? transfer.from_account.get('name') : "#"+transfer.from_id.substring(4)

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
                       transfer.from_balance = balance[1] //bobj.get('balance')
                    if( bobj.get( 'balance' ) > 0 )
                       transfer.from_assets.push( [balance[0], aobj ? aobj.get('symbol') : balance[0] ] )
                 }
              }
           }
           transfer.from_available = ChainStore.getAccountBalance( transfer.from_account, transfer.asset )
        }

        new_state.transfer = transfer
        this.validateTransferFields( new_state )

        console.log("update state:",new_state)
        this.setState(new_state)
    }

    shouldComponentUpdate() { return true }

    componentDidMount() {
        React.findDOMNode(this.refs.from).focus();
    }

    formChange(event) {
        let {error, transfer} = this.state;
        error = null;
        let key = event.target.id;
        let value = event.target.value && event.target.value[0] === "[" ? JSON.parse(event.target.value) : event.target.value;

        if( key != "memo" )
           value = value.trim()

        console.log( "key:",key)
        console.log( "value:",value)
        if (key == "amount") {
           value = value.trim()
           value = value.replace( /,/g, "" )
           while( value.substring(0,2) == "00" )
              value = value.substring(1)

           console.log( "Value: ", value )


           if( value === "" )
           {
              transfer.amount = value
           }
           else if( value === "." ) transfer.amount = "0."
           else if( value.length )
           {
              console.log( "before: ",value )
              let n = Number(value)
              if( isNaN( n ) )
              {
                 console.log( "NAN" );
                 transfer.amount = parseFloat(value) + ""
                 if( transfer.amount == "NaN" )
                    transfer.amount = ""
                 
                 this.update();
                 return
              }
              
              let parts = value.split('.')
              console.log( "split: ", parts )
              transfer.amount = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              if( parts.length > 1 )
                 transfer.amount += "." + parts[1]
              console.log( "after: ",transfer.amount )
           }
        }
        else if (key === "from") {
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
            this.onConfirm();
        } else {
            this.setState({errors: this.state.errors});
        }
    }

    onConfirm() {
        // Launch api action here
        let t = this.state.transfer;
        let precision = utils.get_asset_precision(this.props.assets.get(this.state.transfer.asset).precision);

        let  amount = t.amount.replace( /,/g, "" )
        AccountActions.transfer(t.from_id, t.to_id, parseInt(amount * precision, 10), t.asset, t.memo)
                      .then( r => { console.log( "resolve: ", r) }, 
                             e => {
                             console.log( "error: ",e)
                             } );
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

        console.log( "transfer.amount", transfer.amount )
        if( transfer.amount == null ) transfer.amount = ""
        let submitButtonClass = classNames("button", {disabled: !this.state.isValid});
        return (
            <form className="grid-block vertical full-width-content" onSubmit={this.onSubmit} onChange={this.formChange} noValidate>
               <div className="grid-container" style={{paddingTop: "2rem"}}>
                    {/*  F R O M  */}
                    <div className="grid-block">
                        <div className="grid-content shrink">
                            <AccountImage size={{height: 80, width: 80}}
                                          account={transfer.from_name} custom_image={null}/>
                        </div>
                        <div className="grid-block vertical">
                           <div className="grid-block">  
                              <div className="grid-content">
                                  <Translate component="label" content="transfer.from" /> 
                              </div>
                              <div className="grid-content align-right shrink"> {/*balancesComp*/} </div>
                           </div>
                           <div className="grid-content full-width-content no-overflow"> 
                                <input id="from" type="text" value={transfer.from} defaultValue={transfer.from} ref="from" tabIndex="1"/>
                           </div>
                           <div className="grid-block no-overflow">
                               { errors.from ? null : 
                                 (<div className="grid-content shrink">
                                    {ChainStore.getAccountMemberStatus(transfer.from_account)}
                                 </div>) 
                               } 
                               { errors.from ? <div className="grid-content has-error no-overflow">{errors.from}</div> : null}
                               <div className="grid-content full-width-content"> </div>
                               <div className="grid-content align-right shrink">{ transfer.from_lookup_display }</div>
                           </div>
                        </div>
                    </div>
                    <p/>
                    {/*  T O  */}
                    <div className="grid-block">
                        <div className="grid-content shrink">
                            <AccountImage size={{height: 80, width: 80}}
                                          account={transfer.to_name} custom_image={null}/>
                        </div>
                        <div className="grid-block vertical">
                           <div className="grid-block">  
                              <div className="grid-content">
                                  <Translate component="label" content="transfer.to" /> 
                              </div>
                           </div>
                           <div className="grid-content full-width-content no-overflow"> 
                                <input id="to" type="text"  value={transfer.to} defaultValue={transfer.to} ref="to" tabIndex="2"/>
                           </div>
                           <div className="grid-block no-overflow">
                               { errors.to ? null : 
                                 (<div className="grid-content shrink">
                                    { ChainStore.getAccountMemberStatus(transfer.to_account) }
                                 </div>)
                               } 
                               { errors.to ? <div className="grid-content full-width-content has-error no-overflow">{errors.to}</div> : null}
                               <div className="grid-content full-width-content"> </div>
                               <div className="grid-content shrink">{ transfer.to_lookup_display }</div>
                           </div>
                        </div>
                    </div>
                    <p/>
                    {/*  A M O U N T  */}
                    <div className="grid-block">
                        <div className="grid-block vertical">
                           <div className="grid-block">
                              <div className="grid-content">
                               <label> <Translate component="span" content="transfer.amount" /> </label>
                              </div>
                              <div className="grid-content align-right shrink no-overflow">
                                 { !transfer.from_balance ? null : (
                                    <span>
                                    <Translate component="span" content="transfer.available" />  
                                    <BalanceComponent balance={transfer.from_balance}/>
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div className={classNames("grid-content", "no-overflow", {"has-error": errors.amount})}>
                                   <span className="inline-label">
                                       <input id="amount" type="text" placeholder="0.0" value={transfer.amount} defaultValue={transfer.amount} onChange={this.form_change} ref="amount" tabIndex="3"/>
                                       <span className="form-label select">{this.renderSelect("asset", transfer.from_assets)}</span>
                                   </span>
                                   <p>{errors.amount}</p>
                           </div>
                        </div>
                    </div>

                    {/*  M E M O  */}
                    <div className="grid-block">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": errors.memo})}>
                            <label>
                                <Translate component="span" content="transfer.memo" />
                            </label>
                            <textarea id="memo" rows="1" ref="memo" value={transfer.memo} tabIndex="4"/>
                            <div>{errors.memo}</div>
                        </div>
                    </div>

                    {/*  S E N D  B U T T O N  */}
                    <div className="grid-block">
                        <div className={classNames("grid-content", "no-overflow", {"has-error": this.state.error})}>
                            <label>&nbsp;</label>
                            <button className={submitButtonClass} type="submit" value="Submit" tabIndex="5"><Translate component="span" content="transfer.send" /></button>
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
    assets: {}
};

Transfer.propTypes = {
    cachedAccounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

Transfer.contextTypes = { router: React.PropTypes.func.isRequired };

export default Transfer;
