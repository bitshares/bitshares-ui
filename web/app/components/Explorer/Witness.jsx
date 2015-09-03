import React from "react";
import WitnessActions from "actions/WitnessActions";
import Immutable from "immutable";
import Inspector from "react-json-inspector";
import AccountImage from "../Account/AccountImage";
require("../Blockchain/json-inspector.scss");

class Witness extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name)
            );
    }

    _getWitness(id) {
        if (id) {
            if (!this.props.witnesses.get(id)) {
                WitnessActions.getWitness(id);
            } 
        } else {
            WitnessActions.getWitness(this.props.params.name);
        }
    }

    render() {
        let name = this.context.router.getCurrentParams().name;
        let {witnesses, witnessAccounts, witness_name_to_id } = this.props;
        let id = witness_name_to_id.get(name);
        let witness = witnesses.get(id);
        console.log("id:", id, "witness:", witness);
        this._getWitness(id);

        if (!id || !witness) {
            return (
                <div className="grid-block vertical">
                </div>
            );    
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-container text-center">
                    <h4>{name}</h4>
                    <AccountImage account={name} />
                    <h5>#{id}</h5>
                </div>
                <div className="grid-block small-vertical medium-horizontal">        
                    <div className="grid-content">                
                        <Inspector data={ witness } search={false}/>
                    </div>
                    <div className="grid-content">                
                        <Inspector data={ witnessAccounts.get(witness.witness_account) } search={false}/>
                    </div>
                </div>
            </div>
        );
    }
}

Witness.contextTypes = { router: React.PropTypes.func.isRequired };

export default Witness;
