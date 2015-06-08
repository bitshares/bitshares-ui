import React from "react";
import Translate from "react-translate-component";

require("./transfer.scss");

class DoneScreen extends React.Component {
    constructor() {
        super();
    }

    render() {

        return (
                <div className="grid-block vertical medium-offset-1 medium-10 large-offset-2 large-8">
                    <div className="grid-block modal-content">
                        <div className="grid-content">
                            <Translate component="h4" content="transfer.broadcast" />
                            <h5>Some trx details here..</h5>
                            <br/>
                            <br/>
                            <div className="button-group">
                              <button className="button info" onClick={this.props.onCancel}><Translate component="span" content="transfer.again" /></button>
                              <button className="button success" onClick={this._onConfirm}><Translate component="span" content="transfer.see" /></button>
                            </div>
                        </div>
                    </div>
                    <br/>
                    
              </div>  
        );
    }
}

export default DoneScreen;
