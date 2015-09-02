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
import AccountStore from "stores/AccountStore.js"
import Wallet from "components/Wallet/Wallet";
import validation from "common/validation";
import AmountSelector from "../Utility/AmountSelector"

class Transfer extends React.Component {

    constructor(props) {
       super(props)
          this.state = { 
            from_name:"", 
            to_name:"",
            from_account: null
          }
    }

    fromChanged( from_name )
    {
       this.setState( {from_name} )
    }

    toChanged( to_name )
    {
       this.setState( {to_name} )
    }

    onFromAccountChanged( from_account )
    {
       this.setState( {from_account} )
    }

    onAmountChanged( amount ) 
    {
       this.setState( {amount} )
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

    render() {
       ChainStore.getAccount( this.state.from_name )

       let asset_types = []
       if( this.state.from_account ) {

       }

       console.log( "FROM NAME: ", this.state.from_name )
       console.log( "TO NAME: ", this.state.to_name )
        return (
            <form className="grid-block vertical full-width-content" onSubmit={this.onSubmit} noValidate>
               <div className="grid-container" style={{paddingTop: "2rem"}}>
                    {/*  F R O M  */}
                    <AccountSelector label="transfer.from" 
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
                                     account={this.state.to_name}
                    
                    />
                    {/*  A M O U N T   */}
                    <br/>
                    <AmountSelector label="transfer.amount"
                                     amount={this.state.amount}
                                     onChange={this.onAmountChanged.bind(this)}
                                     asset={"1.3.0"}
                                     assets={["1.3.0","1.3.1","1.3.2"]} 
                    />

                    {/*  M E M O  */}

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
