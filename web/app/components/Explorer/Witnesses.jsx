import React from "react";
import Immutable from "immutable";
import WitnessActions from "actions/WitnessActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";
import TimeAgo from "../Utility/TimeAgo";


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

        let witness_aslot = witness_data.get('last_aslot')
        let color = {};
        if( this.props.most_recent - witness_aslot > 100 ) {
           color = {color: "red"};
        }
        let last_aslot_time = new Date(Date.now() - ((this.props.most_recent - witness_aslot ) * ChainStore.getObject( "2.0.0" ).getIn( ["parameters","block_interval"] )*1000));

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card" style={color}>
                    <h4 className="text-center">{this.props.witness.get('name')}</h4>
                    <div className="card-content">
                        <div className="text-center">
                            <AccountImage account={this.props.witness.get('name')} size={{height: 64, width: 64}}/>
                        </div>
                        <br/>
                        <table className="table key-value-table">
                            <tr>
                                <td>Votes</td>
                                <td><FormattedAsset amount={total_votes} asset="1.3.0" decimalOffset="5" /></td>
                            </tr>
                            <tr>
                                <td>Last&nbsp;Block</td>
                                <td><TimeAgo time={last_aslot_time} /></td>
                            </tr>
                            <tr>
                                <td>Missed</td>
                                <td>{witness_data.get('total_missed')}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

@BindToChainState({keep_updating: true})
class WitnessList extends React.Component {

    static propTypes = {
        witnesses: ChainTypes.ChainObjectsList.isRequired
    }

    render() {

        let {witnesses} = this.props;
        let most_recent_aslot = 0;
        witnesses.forEach( w => {
            if (w) {
                let s = w.get("last_aslot"); 
                if( most_recent_aslot < s ) {
                    most_recent_aslot = s;
                }
            }
        });


        let itemRows = null;
        if (witnesses.length > 0 && witnesses[1]) {
            itemRows = witnesses
                .filter(a => {
                    if (!a) { return false; }
                    let account = ChainStore.getObject(a.get("witness_account"));
                    if(!account) {return false; }
                    
                    return account.get("name").indexOf(this.props.filter) !== -1;
                })
                .sort((a, b) => {
                    let a_account = ChainStore.getObject(a.get("witness_account"));
                    let b_account = ChainStore.getObject(b.get("witness_account"));

                    if (!a_account || !b_account) {
                        return 0;
                    }

                    if (a_account.get("name") > b_account.get("name")) {
                        return 1;
                    } else if (a_account.get("name") < b_account.get("name")) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((a) => {
                    return (
                        <WitnessCard key={a.id} witness={a.get("witness_account")} most_recent={this.props.current_aslot} />
                    );
                });
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

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterWitness: e.target.value});
    }

    render() {
        let { dynGlobalObject, globalObject} = this.props;
        dynGlobalObject = dynGlobalObject.toJS();
        globalObject = globalObject.toJS();

        let current = ChainStore.getObject(dynGlobalObject.current_witness),
            currentAccount = null;
        if (current) {
            currentAccount = ChainStore.getObject(current.get("witness_account"));
        }

        return (
            <div className="grid-block">
                <div className="grid-block page-layout">
                    <div className="grid-block vertical small-5 medium-3">
                        <div className="grid-content">
                            <br/>
                            <table className="table key-value-table">
                                <tr>
                                    <td>Current witness</td>
                                    <td>{currentAccount ? currentAccount.get("name") : null}</td>
                                </tr>
                                <tr>
                                    <td>Active witnesses</td>
                                    <td>{Object.keys(globalObject.active_witnesses).length}</td>
                                </tr>
                                <tr>
                                    <td>Participation Rate</td>
                                    <td>{dynGlobalObject.participation}%</td>
                                </tr>
                                <tr>
                                    <td>Pay-per-Block</td>
                                    <td><FormattedAsset amount={globalObject.parameters.witness_pay_per_block} asset="1.3.0" /></td>
                                </tr>
                                <tr>
                                    <td>Remaining Budget</td>
                                    <td> <FormattedAsset amount={dynGlobalObject.witness_budget} asset="1.3.0" /></td>
                                </tr>
                                <tr>
                                    <td>Next Vote Update</td>
                                    <td> <TimeAgo time={dynGlobalObject.next_maintenance_time} /></td>
                                </tr>
                                <tr>
                                   <td> <Translate component="h4" content="markets.filter" /> </td>
                                   <td> <input type="text" value={this.state.filterWitness} onChange={this._onFilter.bind(this)} /> </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block">
                            <div className="grid-content ">
                                <WitnessList
                                    current_aslot={dynGlobalObject.current_aslot}
                                    witnesses={Immutable.List(globalObject.active_witnesses)}
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
