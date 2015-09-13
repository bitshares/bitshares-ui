import React from "react";
import Immutable from "immutable";
import DelegateActions from "actions/DelegateActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";

@BindToChainState({keep_updating: true})
class DelegateCard extends React.Component {

    static propTypes = {
        delegate: ChainTypes.ChainAccount.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.transitionTo("account", {account_name: this.props.delegate.get("name")});
    }

    render() {
        let delegate_data = ChainStore.getCommitteeMemberById( this.props.delegate.get('id') )

        if (!delegate_data) {
            return null;
        }

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card">
                    <h4 className="text-center">{this.props.delegate.get("name")}</h4>
                    <div className="card-content clearfix">
                        <div className="float-left">
                            <AccountImage account={this.props.delegate.get("name")} size={{height: 64, width: 64}}/>
                        </div>
                        <ul className="balances">
                            <li>Total votes: <FormattedAsset decimalOffset={5} amount={delegate_data.get("total_votes")} asset={"1.3.0"}/></li>
                        </ul>                        
                    </div>
                </div>
            </div>
        );
    }
}

class DelegateList extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.delegates, this.props.delegates) ||
                !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name) ||
                nextProps.filter !== this.props.filter
            );
    }

    render() {

        let {delegate_id_to_name, delegates} = this.props;
        let itemRows = null;
        if (delegates.size > 0) {
            itemRows = delegates
                .filter(a => {
                    return delegate_id_to_name.get(a.id).indexOf(this.props.filter) !== -1;
                })
                .sort((a, b) => {
                    if (delegate_id_to_name.get(a.id) > delegate_id_to_name.get(b.id)) {
                        return 1;
                    } else if (delegate_id_to_name.get(a.id) < delegate_id_to_name.get(b.id)) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((a) => {
                    return (
                        <DelegateCard key={a.id} delegate={delegate_id_to_name.get(a.id)} />
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
class Delegates extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0"
    }

    constructor(props) {
        super(props);
        this.state = {
            filterDelegate: ""
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.delegates, this.props.delegates) ||
            !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name) ||
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterDelegate !== this.state.filterDelegate
        );
    }

    _fetchDelegates(delegateIds, delegates, delegate_id_to_name) {
        if (!Array.isArray(delegateIds)) {
            delegateIds = [delegateIds];
        }

        let missing = [];
        let missingAccounts = [];
        delegateIds.forEach(id => {
            // Check for missing witness data
            if (!delegates.get(id)) {
                missing.push(id);
            // Check for missing witness account data
            } else if (!delegate_id_to_name.get(id)) {
                missingAccounts.push(delegates.get(id).committee_member_account);
            }
        });

        if (missing.length > 0) {
            DelegateActions.getDelegates(missing);
        } 

        if (missingAccounts.length > 0) {
            DelegateActions.getDelegateAccounts(missingAccounts);
        }
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterDelegate: e.target.value});
    }

    render() {
        let {delegate_id_to_name, delegates, globalObject} = this.props;
        globalObject = globalObject.toJS();

        let activeDelegates = [];
        for (let key in globalObject.active_committee_members) {
            if (globalObject.active_committee_members.hasOwnProperty(key)) {
                activeDelegates.push(globalObject.active_committee_members[key]);
            }
        }

        this._fetchDelegates(activeDelegates, delegates, delegate_id_to_name);
       
        return (
            <div className="grid-block">
                <div className="grid-block page-layout">
                    <div className="grid-block small-5 medium-3">
                        <div className="grid-content">
                            <h5>Total number of delegates active: {Object.keys(globalObject.active_committee_members).length}</h5>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block">
                        <div className="grid-content">
                            <div className="grid-block small-12 medium-6">
                                <Translate component="h3" content="markets.filter" />
                                <input type="text" value={this.state.filterDelegate} onChange={this._onFilter.bind(this)} />
                            </div>
                            <DelegateList delegates={delegates} delegate_id_to_name={delegate_id_to_name} filter={this.state.filterDelegate}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Delegates;
