import React from "react";
import ChainComponent from "../Utility/ChainComponent"
import utils from "common/utils"
import validation from "common/validation"
import AccountImage from "../Account/AccountImage";
import Translate from "react-translate-component";
import ChainStore from "api/chain.js"


/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.  
 *
 * Properties:
 *    label         - a translation key for the label 
 *    error         - a transaltion key for the error message override, displayed when there is otherwise no error
 *    onChange      - a method to be called any time user input changes
 *    placeholder   - the placeholder text to be displayed when there is no user_input
 *    account       - the current value of the account selector, the string the user enters
 *
 */
class AccountSelector extends ChainComponent {
   constructor( props ) {
      super(props)
      this.state = {
         account : null,
         lookup_display : null /// if lookup by name, display id, if lookup by id display name
      }
   }

   getDefaultProps() { 
      return { 
        account: "", 
        label: "account.select", 
        error: "", 
        placeholder: null, 
        onChange:()=>{} 
      }
   }

   componentWillReceiveProps( next_props ) {
      super.componentWillReceiveProps(next_props)
      this.onUpdate( next_props )
   }

   onUpdate( next_props = null )
   { 
      if( !next_props )
      {
         next_props = {}
         for( let k in this.props ) next_props[k] = this.props[k]
      }
      let next_state =
      {
         account: null,
         lookup_display: null
      }
      console.log( "next_props.account: ", next_props.account )
      if( next_props.account == null )
      {
      }
      else if( validation.is_account_name( next_props.account ) )
      {
         next_state.account        = ChainStore.getAccount( next_props.account, this.onUpdate.bind(this) )
         next_state.lookup_display = 'id'
      }
      else if( utils.is_object_id( next_props.account ) )
      {
         next_state.account        = ChainStore.getAccount( next_props.account, this.onUpdate.bind(this) )
         next_state.lookup_display = 'name'
      }
      else if( next_props.account.substring(0,1) == "#" )
      {
         next_state.account        = ChainStore.getAccount( "1.2."+next_props.account.substring(1), this.onUpdate.bind(this) )
         next_state.lookup_display = 'name'
      }
      this.setState( next_state )
   }

   onInputChanged(event) {
       let key = event.target.id;
       let value = event.target.value && event.target.value[0] === "[" ? JSON.parse(event.target.value) : event.target.value;
       value = value.trim()
       value = value.toLowerCase()

       if (key === "account") {
           if( value == "#" ){ this.props.onChange(value); return }
           else if( value.substring(0,1) == "#" ) { 
             if( !utils.is_object_id( "1.2."+ value.substring(1) ) ) return
             else this.props.onChange(value)
           }
           else if( value.length > 2 && !validation.is_account_name( value ) ) return
           if(this.props.onChange) this.props.onChange( value )
       }
       this.onUpdate()
   }

    onKeyDown(e) {
        if (this.props.onAction && event.keyCode === 13) this.props.onAction(e);
    }

   render() {
      let lookup_display = null
      if( this.state.account && this.state.lookup_display ) 
      {
         lookup_display = this.state.account.get( this.state.lookup_display )
         if( utils.is_object_id( lookup_display ) )
            lookup_display = ": #" + lookup_display.substring(4)
         else
            lookup_display = ": "+lookup_display
      }
      let error = this.props.error
      if( !error )
      {
         if( this.props.account )
         {
            if( !validation.is_account_name( this.props.account) ) 
            {
               if( this.props.account.substring(0,1) != "#" )
               {
                  error = "invalid account name"
               }
            }
         }
      }

      let member_status = null
      if( this.props.account )
         member_status = ChainStore.getAccountMemberStatus(this.state.account)

      return (
          <div className="account-selector grid-content no-overflow">
              <AccountImage size={{height: 80, width: 80}}
                            account={this.state.account?this.state.account.get('name'):null} custom_image={null}/>
              <div className="content-area">
                  <div className="header-area">
                      <div className="right-label"><span>{member_status}</span><span>{lookup_display}</span></div>
                      <Translate component="label" content={this.props.label}/>
                  </div>
                  <div className="input-area">
                      <span className="inline-label">
                      <input id="account" type="text"
                             value={this.props.account}
                             defaultValue={this.props.account}
                             placeholder={this.props.placeholder}
                             ref="user_input"
                             onChange={this.onInputChanged.bind(this)}
                             onKeyDown={this.onKeyDown.bind(this)}/>
                      { !this.props.onAction ? null : (
                          <button className={this.props.action_class}
                                  onClick={this.props.onAction}>
                              <Translate content={this.props.action_label}/></button>
                      )}
                      </span>
                  </div>
                  <div className="error-area">
                      <span>{error}</span>
                  </div>
              </div>
          </div>
      )

   }

}
export default AccountSelector;
