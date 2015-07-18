import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";

class AccountUserIssuedAssets extends React.Component {
    constructor() {
        super();

        this.state = {

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
		                        <th>Public Data</th>
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
                        <button className="button">Issue New Asset</button>
                    </div>
                </div>


            </div>
        );
    }
}

export default AccountUserIssuedAssets;
