import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AssetStore from "stores/AssetStore";
import AssetActions from "actions/AssetActions";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";

class AccountUserIssuedAssets extends React.Component {
    constructor() {
        super();

        this.state = {
        	// assets = AssetStore.myassets TODO: load my UIAs from the store
        };
    }

    render() {
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Issued Assets</h3>
                    
                    <div>
		                <table className="table">
		                    <thead>
		                    <tr>
		                        <th>Symbol</th>
		                        <th>Name</th>
		                        <th>Description</th>
		                        {/* <th>Public Data</th> FIXME: this column is hidden because its purpose overlaps with Description */}
		                        <th>Max Supply</th>
		                        <th>Precision</th>
		                    </tr>
		                    </thead>
		                    <tbody>
		                    </tbody>
		                </table>
		            </div>
                </div>
                
                <div className="content-block">
                    <div className="actions clearfix">
                        <Trigger open="issue_asset">
                        	<button className="button">Issue New Asset</button>
                        </Trigger>
                    </div>
                </div>

				<Modal id="issue_asset" overlay={true}>
                    <Trigger close="issue_asset">
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <div className="grid-block vertical">
                        <form>
                        	<div className="shrink grid-content"> 
                            <p>TODO: add UIA form here</p>
	                        </div>
	                        <div className="grid-content button-group">
	                            <input type="submit" className="button" value="Create Asset" />
	                            <Trigger close="issue_asset">
	                                <a href className="secondary button">Cancel</a>
	                            </Trigger>
	                        </div>
                        </form>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default AccountUserIssuedAssets;
