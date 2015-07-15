import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import DelegateActions from "actions/DelegateActions";
import AccountImage from "../Account/AccountImage";
import { Link } from "react-router";

class DelegateCard extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.name !== this.props.name;
    }

    render() {
        return (
            <div style={{padding: "0.5em 0.5em", minHeight: "15em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="delegate" params={{name: this.props.name}}>
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

DelegateCard.defaultProps = {
    name: ""
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
                        <DelegateCard key={a.id} name={delegate_id_to_name.get(a.id)}>
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



class Delegates extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.delegates, this.props.delegates) ||
            !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name) ||
            !Immutable.is(nextProps.dynGlobalObject, this.props.dynGlobalObject)
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
        let {delegate_id_to_name, delegates, dynGlobalObject, globalObject} = this.props;
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
                    <div className="grid-block shrink">
                        <div className="grid-content">
                            <h5>Total number of delegates active: {Object.keys(globalObject.active_committee_members).length}</h5>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block" style={{overflowY: "auto", zIndex: 1}}>
                        <DelegateList delegates={delegates} delegate_id_to_name={delegate_id_to_name}/>
                    </div>
                </div>
            </div>
        );
    }
}


Delegates.defaultProps = {
    accounts: {},
    assets: {}
};

Delegates.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Delegates;
