import React from "react";
import {Link} from "react-router";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../../Utility/ChainTypes";
import BindToChainState from "../../Utility/BindToChainState";
import FormattedAsset from "../../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import BalanceComponent from "../../Utility/BalanceComponent";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import FormattedPrice from "../../Utility/FormattedPrice";
import counterpart from "counterpart";
import AmountSelector from "../../Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import AccountBalance from "../../Account/AccountBalance";


var Post = require ("../../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class TranswiserDepositModal extends React.Component {

    static propTypes =
    {
        issuerAccount:     ChainTypes.ChainAccount.isRequired,
        depositUrl:        React.PropTypes.string.isRequired,
        qr:                React.PropTypes.string.isRequired,
        fee:               React.PropTypes.number.isRequired,
        modalId:           React.PropTypes.string.isRequired,
        inventoryAsset:    ChainTypes.ChainAsset.isRequired
    }

   constructor( props ) {
      super(props);
   }

   gotoShop(){
       window.open(this.props.depositUrl);
   }

   render() {
       return (
           <div className="grid-block vertical full-width-content">
               <div className="grid-container">
                   <div className="content-block">
                       <h3><Translate content="gateway.transwiser.deposit_title" asset={this.props.inventoryAsset.get('symbol')} /></h3>
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.inventory" /></label>
                       <AccountBalance account={this.props.issuerAccount.get('name')} asset={this.props.inventoryAsset.get('symbol')} />
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.transwiser.visit_weidian" /></label>
                       <a onClick={this.gotoShop.bind(this)} href={this.props.depositUrl} target="_blank">{this.props.depositUrl}</a>
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.scan_qr" /></label>
                       <img src={this.props.qr} />
                    </div>
                   {/*
                   <br/>
                   <div className="content-block">
                       <label><Translate content="transfer.fee" /></label>
                       {this.props.fee}
                   </div>
                   */}
                    <div className="content-block">
                       <Trigger close={this.props.modalId}>
                           <a href className="secondary button"><Translate content="modal.ok" /></a>
                       </Trigger>
                    </div>
               </div>
           </div>
       )
   }

};

export default TranswiserDepositModal
