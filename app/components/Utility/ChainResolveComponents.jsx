/** Generic set of components for dealing with data in the ChainStore */
import React, {Component, Children} from "react";
import {connect} from "alt-react";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import AccountStore from "stores/AccountStore";
import {toPairs} from "lodash-es";

class ResolvemyActiveAccountsChainState extends Component {
    static propTypes = {
        myActiveAccounts: ChainTypes.ChainAccountsList.isRequired
    };

    render() {
        let myActiveAccounts = [];
        toPairs(this.props.myActiveAccounts).forEach(account => {
            if (!account[1]) return;
            console.log("... account.toJS()", account[1].toJS());
            myActiveAccounts.push(account[1]);
        });
        let child = Children.only(this.props.children);
        if (!child)
            return (
                <span>{myActiveAccounts.map(a => <br>{a.toJS()}</br>)}</span>
            );
        // Pass the list to a child reactjs component as this.props.resolvedmyActiveAccounts
        child = React.cloneElement(child, {myActiveAccounts});
        return <span>{child}</span>;
    }
}
ResolvemyActiveAccountsChainState = BindToChainState(
    ResolvemyActiveAccountsChainState
);

class ResolvemyActiveAccounts extends Component {
    render() {
        return (
            <ResolvemyActiveAccountsChainState
                myActiveAccounts={this.props.myActiveAccounts}
                children={this.props.children}
            />
        );
    }
}

ResolvemyActiveAccounts = connect(ResolvemyActiveAccounts, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return AccountStore.getState();
    }
});

export default ResolvemyActiveAccounts;
