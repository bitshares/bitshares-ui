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

    onSymbolChanged(e) {
        this.props.symbol = e.target.value;
        console.log(e.target.value);
        console.log(this.props.symbol);
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
                                <label><Translate content="account.user_issued_assets.symbol" />
                                    <input value={this.props.symbol} type="text" ref="symbol" onChange={this.onSymbolChanged.bind(this)} />
                                </label>

                                <label><Translate content="account.user_issued_assets.name" />
                                <input type="text" id="name" value="" onChange="" /></label>
                                
                                <label><Translate content="account.user_issued_assets.description" />
                                <input type="text" id="description" value="" onChange="" /></label>

                                <label><Translate content="account.user_issued_assets.max_supply" />
                                <input type="text" id="max_supply" value="" onChange="" /></label>

                                <label><Translate content="account.user_issued_assets.precision" />
                                <input type="text" id="precision" value="" onChange="" /></label>
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

AccountUserIssuedAssets.defaultProps = {
    assets: [],
    symbol: "",
    name: "",
    description: "",
    max_supply: 0,
    precision: 0,
    onSymbolChanged: function() {}
};

AccountUserIssuedAssets.propTypes = {
    assets: PropTypes.object.isRequired,
    symbol: PropTypes.string.isRequired,
    onSymbolChanged: PropTypes.func.isRequired
};

export default AccountUserIssuedAssets;
