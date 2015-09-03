import React from "react";
import Immutable from "immutable";
import DelegateActions from "actions/DelegateActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";

class DelegateCard extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    shouldComponentUpdate(nextProps) {
        return nextProps.name !== this.props.name;
    }

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.transitionTo("delegate", {name: this.props.name});
    }

    render() {
        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card">
                    <h4 className="text-center">{this.props.name}</h4>
                    <div className="card-content clearfix">
                        <div className="float-left">
                            <AccountImage account={this.props.name} size={{height: 64, width: 64}}/>
                        </div>
                        <ul className="balances">
                            <li>Total votes: <FormattedAsset decimalOffset={5} amount={this.props.delegate.total_votes} asset={"1.3.0"}/></li>
                        </ul>                        
                    </div>
                </div>
            </div>
        );
    }
}

DelegateCard.defaultProps = {
    name: null
};

class DelegateList extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.delegates, this.props.delegates) ||
                !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name)
            );
    }

    render() {

        let {delegate_id_to_name, delegates} = this.props;
        let itemRows = null;
        if (delegates.size > 0) {
            itemRows = delegates
                .map((a) => {
                    return (
                        <DelegateCard key={a.id} name={delegate_id_to_name.get(a.id)} delegate={a}>
                        </DelegateCard>
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
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.delegates, this.props.delegates) ||
            !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name) ||
            !Immutable.is(nextProps.globalObject, this.props.globalObject)
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
                    <div className="grid-block" style={{alignItems: "flex-start", overflowY: "auto", zIndex: 1}}>
                        <DelegateList delegates={delegates} delegate_id_to_name={delegate_id_to_name}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Delegates;
