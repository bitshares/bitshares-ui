import React from "react";
import Immutable from "immutable";
import WitnessActions from "actions/WitnessActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";

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
        this.context.router.transitionTo("account", {account_name: this.props.witness.get("name")});
    }

    render() {
        let witness_data = ChainStore.getWitnessById( this.props.witness.get('id') )
        if( witness_data ) {
           // console.log( "Witness Data: ", witness_data.toJS() )
        }
        else {
           // console.log( "Witness Data: ", witness_data )
           return null
        }
        let total_votes = witness_data.get( "total_votes" );

        let color = {};
        if( this.props.most_recent - witness_data.get('last_aslot') > 100 ) {
           color = {color: "red"};
        }

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card" style={color}>
                    <h4 className="text-center">{this.props.witness.get('name')}</h4>
                    <div className="card-content">
                        <div className="text-center">
                            <AccountImage account={this.props.witness.get('name')} size={{height: 64, width: 64}}/>
                        </div>
                        <div className="text-center">
                        Votes:  <FormattedAsset amount={total_votes} asset="1.3.0" />
                        </div>
                        <div className="text-center">
                        Last Produced Slot:  {witness_data.get('last_aslot')} 
                        </div>
                        <div className="text-center">
                        Total Missed:  {witness_data.get('total_missed')} 
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class WitnessList extends React.Component {

    render() {

        let {witness_id_to_name, witnesses} = this.props;
        let most_recent_aslot = 0
        witnesses.forEach( w => { console.log( "w: ", w ); 
                                  let s = w.last_aslot; 
                                  if( most_recent_aslot  < s ) most_recent_aslot = s; } );

        console.log( "most_recent_aslot: ", most_recent_aslot );

        let itemRows = null;
        if (witnesses.size > 0) {
            itemRows = witnesses
                .filter(a => {
                    return witness_id_to_name.get(a.id).indexOf(this.props.filter) !== -1;
                })
                .sort((a, b) => {
                    if (witness_id_to_name.get(a.id) > witness_id_to_name.get(b.id)) {
                        return 1;
                    } else if (witness_id_to_name.get(a.id) < witness_id_to_name.get(b.id)) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((a) => {
                    return (
                        <WitnessCard key={a.id} witness={witness_id_to_name.get(a.id)} most_recent={this.props.current_aslot} />
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
        this.state = {
            filterWitness: ""
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.dynGlobalObject, this.props.dynGlobalObject) ||
            nextState.filterWitness !== this.state.filterWitness
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

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterWitness: e.target.value});
    }

    render() {
        let {witness_id_to_name, witnesses, dynGlobalObject, globalObject} = this.props;
        let activeWitnesses = [];
        dynGlobalObject = dynGlobalObject.toJS();
        globalObject = globalObject.toJS();
        console.log( "global object: ", globalObject );

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
                            <h4>Currently active witness:</h4>
                            <h3>{witness_id_to_name.get(dynGlobalObject.current_witness)}</h3>
                            <h5>Total number of witnesses active: {Object.keys(globalObject.active_witnesses).length}</h5>
                            <h6>Current Slot #:  {dynGlobalObject.current_aslot} </h6>
                            <h6>Participation Rate:  {dynGlobalObject.participation}%</h6>
                            <h6>Pay-per-Block:  <FormattedAsset amount={globalObject.parameters.witness_pay_per_block} asset="1.3.0" /></h6>
                            <h6>Remaining Daily Budget:  <FormattedAsset amount={dynGlobalObject.witness_budget} asset="1.3.0" /></h6>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block">
                            <div className="grid-content">
                                <div className="grid-block small-12 medium-6">
                                    <Translate component="h3" content="markets.filter" />
                                    <input type="text" value={this.state.filterWitness} onChange={this._onFilter.bind(this)} />
                                </div>
                                <WitnessList
                                    current_aslot={dynGlobalObject.current_aslot}
                                    witnesses={witnesses}
                                    witness_id_to_name={witness_id_to_name}
                                    filter={this.state.filterWitness}
                                />
                            </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Witnesses;
