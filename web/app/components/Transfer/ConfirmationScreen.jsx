import React from "react";
import Identicon from "../Account/Identicon";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import Translate from "react-translate-component";

require("./transfer.scss");

class ConfirmationScreen extends React.Component {

    render() {
        let {transfer, assets} = this.props;
        let precision = utils.get_asset_precision(assets.get(transfer.asset).precision);
        
        return (
                <div className="grid-block vertical medium-offset-1 medium-10 large-offset-2 large-8">
                    <div className="grid-block modal-content">
                        <div className="grid-content shrink show-for-medium">
                            <Identicon account={transfer.to[0]} size={{height: 150, width: 150}}/>
                            <center>{transfer.to[0]}</center>
                        </div>
                        <div className="grid-content">
                            <div className="text-group">
                                <div><Translate component="span" content="transfer.from" />:</div>
                                <div>{this.props.from}</div>
                            </div>
                            <div className="text-group">
                                <div><Translate component="span" content="transfer.to" />:</div>
                                <div>{transfer.to[0]}</div>
                            </div>                        
                            <div className="text-group">
                                <div><Translate component="span" content="transfer.amount" />:</div> 
                                <div><FormattedAsset amount={transfer.amount * precision} asset={assets.get(transfer.asset)}/></div>
                            </div>
                            <div className="text-group">
                                <div><Translate component="span" content="transfer.memo" />:</div>
                                <div>{transfer.memo}</div>
                            </div>  
                            <div className="modal-footer" style={{paddingTop: "0.5rem"}}>
                                <div className="button-group">
                                  <button className="button secondary" onClick={this.props.onCancel}><Translate component="span" content="transfer.back" /></button>
                                    &nbsp; &nbsp;
                                  <button className="button success" onClick={this.props.onConfirm}><Translate component="span" content="transfer.confirm" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <br/>
                    
              </div>  
        );
    }
}

export default ConfirmationScreen;
