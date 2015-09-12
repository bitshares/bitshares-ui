import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "./LinkToAccountById";

@BindToChainState()
class LinkToWitnessById extends React.Component {
    static propTypes = {
        witness: ChainTypes.ChainObject.isRequired
    }

    render() {
        let witness_account = this.props.witness.get("witness_account");
        return <LinkToAccountById account={witness_account} />
    }
}

export default LinkToWitnessById;
