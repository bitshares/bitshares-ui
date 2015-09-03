import React from "react";
import DelegateActions from "actions/DelegateActions";
import Immutable from "immutable";
import Inspector from "react-json-inspector";
import AccountImage from "../Account/AccountImage";
require("../Blockchain/json-inspector.scss");

class Delegate extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.delegates, this.props.delegates) ||
            !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name)
            );
    }

    _getDelegate(id) {
        if (id) {
            if (!this.props.delegates.get(id)) {
                DelegateActions.getDelegate(id);
            } 
        } else {
            DelegateActions.getDelegate(this.props.params.name);
        }
    }

    render() {
        let name = this.context.router.getCurrentParams().name;
        let {delegates, delegateAccounts, delegate_name_to_id } = this.props;
        let id = delegate_name_to_id.get(name);
        let delegate = delegates.get(id);
        this._getDelegate(id);

        if (!id || !delegate) {
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
                        <Inspector data={ delegate } search={false}/>
                    </div>
                    <div className="grid-content">
                        <Inspector data={ delegateAccounts.get(id) } search={false}/>
                    </div>
                </div>
            </div>
        );
    }
}

Delegate.contextTypes = { router: React.PropTypes.func.isRequired };

export default Delegate;
