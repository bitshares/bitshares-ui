import React from "react";
import {PropTypes, Component} from "react";

class Assets extends Component {

    render() {
        let assets = this.props.assets.map((asset) => {
            return (
                <tr key={asset.symbol}>
                    <td>{asset.symbol}</td>
                    <td>{asset.id}</td>
                    <td>{asset.issuer}</td>
                </tr>
            );
        }).toArray();

        return (
            <div className="grid-block">
                <div className="grid-content small-6">
                    <h4>ASSETS:</h4>
                    <br/>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>ID</th>
                                <th>Issuer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets}
                        </tbody>

                    </table>
                </div>
            </div>
        );
    }
}

Assets.propTypes = {
    assets: PropTypes.object.isRequired
};

export default Assets;
