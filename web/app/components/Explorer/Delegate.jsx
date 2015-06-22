import React from "react";
import {PropTypes} from "react";
import DelegateActions from "actions/DelegateActions";
import Immutable from "immutable";
import Translate from "react-translate-component";
import Inspector from "react-json-inspector";
require("../Blockchain/json-inspector.scss");

class Delegate extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.delegates, this.props.delegates) ||
            !Immutable.is(nextProps.delegate_id_to_name, this.props.delegate_id_to_name)
            );
    }

    componentWillReceiveProps(nextProps) {
        let name = this.context.router.getCurrentParams().name;
        let id = nextProps.delegate_name_to_id.get(name);
        this._getDelegate(id);
    }

    componentWillUnmount() {
        let name = this.props.params.name;
        let id = this.props.delegate_name_to_id.get(name);
        DelegateActions.unSubscribe(id);
    }

    _getDelegate(id) {
        if (id) {
            let {delegates, delegateAccounts, globalObject } = this.props;
            
            if (!delegates.get(id)) {
                DelegateActions.getDelegates(id);
            } else {
                let accountID = delegates.get(id).delegate_account;
                if (!delegateAccounts.get(id)) {
                    DelegateActions.getDelegateAccounts(accountID);
                } else {
                    DelegateActions.subscribe(id, delegateAccounts.get(id).statistics);
                }
            }
        } else if (this.props.delegates.size === 0) {
            DelegateActions.getDelegates(this.props.globalObject.active_delegates);
        }
    }

    render() {
        let name = this.context.router.getCurrentParams().name;
        let {delegates, delegateAccounts, delegate_id_to_name, delegate_name_to_id } = this.props;
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
                <div className="grid-block page-layout">
                    <div className="grid-block">
                        <h4>{name} | id: {id} </h4>
                        <Inspector data={ delegates.get(id) } search={false}/>
                        <Inspector data={ delegateAccounts.get(id) } search={false}/>
                    </div>
                </div>
            </div>
        );
    }
}

Delegate.defaultProps = {
};

Delegate.propTypes = {
};

Delegate.contextTypes = { router: React.PropTypes.func.isRequired };

export default Delegate;
