import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import WitnessActions from "actions/WitnessActions";
import AccountImage from "../Account/AccountImage";
import { Link } from "react-router";

class WitnessCard extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.name !== this.props.name;
    }

    render() {
        return (
            <div style={{padding: "0.5em 0.5em", minHeight: "15em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="witness" params={{name: this.props.name}}>
                        <div>
                            <AccountImage account={this.props.name} size={{height: 150, width: 150}}/>
                        </div>
                        <div className="card-divider">
                            {this.props.name}
                        </div>
                        {this.props.children}
                    </Link>
                </div>
            </div>
        );
    }
}

WitnessCard.defaultProps = {
    name: ""
};

class WitnessList extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
                !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name)
            );
    }

    render() {

        let {witness_id_to_name, witnesses} = this.props;
        let itemRows = null;
        if (witnesses.size > 0) {
            itemRows = witnesses
                .map((a) => {
                    // console.log("witness:", a, witness_id_to_name.get(a.id));
                    return (
                        <WitnessCard key={a.id} name={witness_id_to_name.get(a.id)}>
                        </WitnessCard>
                    );
                }).toArray();
        } 

        return (
            <div className="grid-block small-up-1 medium-up-2 large-up-3">
                {itemRows}
            </div>
        );
    }
}



class Witnesses extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.dynGlobalObject, this.props.dynGlobalObject)
        );
    }

    _fetchWitnesses(witnessIds, witnesses, witness_id_to_name) {
        if (!Array.isArray(witnessIds)) {
            witnessIds = [witnessIds];
        }

        let missing = [];
        let missingAccounts = [];
        witnessIds.forEach(id => {
            // Check for missing witness data
            if (!witnesses.get(id)) {
                missing.push(id);
            // Check for missing witness account data
            } else if (!witness_id_to_name.get(id)) {
                missingAccounts.push(witnesses.get(id).witness_account);
            }
        });

        if (missing.length > 0) {
            WitnessActions.getWitnesses(missing);
        } 

        if (missingAccounts.length > 0) {
            WitnessActions.getWitnessAccounts(missingAccounts);
        }
    }

    render() {
        let {witness_id_to_name, witnesses, dynGlobalObject, globalObject} = this.props;
        let activeWitnesses = [];
        for (let key in globalObject.active_witnesses) {
            if (globalObject.active_witnesses.hasOwnProperty(key)) {
                activeWitnesses.push(globalObject.active_witnesses[key]);
            }
        }

        this._fetchWitnesses(activeWitnesses, witnesses, witness_id_to_name);
       
        return (
            <div className="grid-block">
                <div className="grid-block page-layout">
                    <div className="grid-block shrink">
                        <div className="grid-content">
                            <h4>Currently active witness: {witness_id_to_name.get(dynGlobalObject.current_witness)}</h4>
                            <h5>Total number of witnesses active: {Object.keys(globalObject.active_witnesses).length}</h5>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block" style={{alignItems: "flex-start"}}>
                        <WitnessList witnesses={witnesses} witness_id_to_name={witness_id_to_name}/>
                    </div>
                </div>
            </div>
        );
    }
}


Witnesses.defaultProps = {
    accounts: {},
    assets: {}
};

Witnesses.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Witnesses;
