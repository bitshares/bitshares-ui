import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import Immutable from "immutable";
import Translate from "react-translate-component";
import Inspector from "react-json-inspector";
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
        let {witnesses, witnessAccounts, delegate_id_to_name, witness_name_to_id } = this.props;
        let id = witness_name_to_id.get(name);
        let witness = witnesses.get(id);
        this._getWitness(id);

        if (!id || !witness) {
            return (
                <div className="grid-block vertical">
                </div>
            );    
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block">
                        <h4>{name} | id: {id} </h4>
                        <Inspector data={ witness } search={false}/>
                        <Inspector data={ witnessAccounts.get(witness.witness_account) } search={false}/>
                    </div>
                </div>
            </div>
        );
    }
}

Witness.defaultProps = {
};

Witness.propTypes = {
};

Witness.contextTypes = { router: React.PropTypes.func.isRequired };

export default Witness;
