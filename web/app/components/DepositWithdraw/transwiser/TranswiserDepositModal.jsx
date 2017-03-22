import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import AccountBalance from "../../Account/AccountBalance";

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

   render() {
       let qr = this.props.qr && this.props.qr.replace("http://", "https://");
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
                       <a href={this.props.depositUrl} rel="noopener noreferrer" target="_blank">{this.props.depositUrl}</a>
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.scan_qr" /></label>
                       <img src={qr} />
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
                           <div className="button"><Translate content="modal.ok" /></div>
                       </Trigger>
                    </div>
               </div>
           </div>
       )
   }

};

export default BindToChainState(TranswiserDepositModal, {keep_updating:true});
