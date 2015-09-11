import React from "react";
import Immutable from "immutable";
import WitnessActions from "actions/WitnessActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";

@BindToChainState({keep_updating: true})
class WitnessCard extends React.Component {

    static propTypes = {
        witness: ChainTypes.ChainAccount.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.transitionTo("witness", {name: this.props.name});
    }

    render() {
        let witness_data = ChainStore.getWitnessById( this.props.witness.get('id') )
        if( witness_data )
           console.log( "Witness Data: ", witness_data.toJS() )
        else {
           console.log( "Witness Data: ", witness_data )
           return null
        }
        let total_votes = witness_data.get( "total_votes" );

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card">
                    <h4 className="text-center">{this.props.witness.get('name')}</h4>
                    <div className="card-content">
                        <div className="text-center">
                            <AccountImage account={this.props.witness.get('name')} size={{height: 64, width: 64}}/>
                        </div>
                        <div className="text-center">
                        Votes:  <FormattedAsset amount={total_votes} asset="1.3.0" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

WitnessCard.defaultProps = {
    name: null
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
                        <WitnessCard key={a.id} witness={witness_id_to_name.get(a.id)}>
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


@BindToChainState({keep_updating: true})
class Witnesses extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);
    }

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
        dynGlobalObject = dynGlobalObject.toJS();
        globalObject = globalObject.toJS();

        for (let key in globalObject.active_witnesses) {
            if (globalObject.active_witnesses.hasOwnProperty(key)) {
                activeWitnesses.push(globalObject.active_witnesses[key]);
            }
        }

        this._fetchWitnesses(activeWitnesses, witnesses, witness_id_to_name);
       
        return (
            <div className="grid-block">
                <div className="grid-block page-layout">
                    <div className="grid-block small-5 medium-3">
                        <div className="grid-content">
                            <h4>Currently active witness: {witness_id_to_name.get(dynGlobalObject.current_witness)}</h4>
                            <h5>Total number of witnesses active: {Object.keys(globalObject.active_witnesses).length}</h5>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block" style={{alignItems: "flex-start", overflowY: "auto", zIndex: 1}}>
                            <WitnessList witnesses={witnesses} witness_id_to_name={witness_id_to_name}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Witnesses;
