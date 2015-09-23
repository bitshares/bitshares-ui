import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState({keep_updating: true})
class Statistics extends React.Component {

    static propTypes = {
        stat_object: ChainTypes.ChainObject.isRequired
    }

    render() {
        let stat_object = this.props.stat_object.toJS();
        console.log("-- Statistics.render -->", stat_object);
        return (
            <table className="table striped">
                <tr>
                    <td><Translate content="account.member.fees_paid"/> </td>
                    <td><FormattedAsset amount={parseFloat(stat_object.lifetime_fees_paid)} asset="1.3.0" /></td>
                </tr>
                <tr>
                    <td><Translate content="account.member.fees_pending"/> </td>
                    <td><FormattedAsset amount={parseFloat(stat_object.pending_fees)} asset="1.3.0" /></td>
                </tr>
                <tr>
                    <td><Translate content="account.member.fees_vested"/> </td>
                    <td><FormattedAsset amount={parseFloat(stat_object.pending_vested_fees)} asset="1.3.0" /></td>
                </tr>
            </table>
        );
    }
}

export default Statistics;
