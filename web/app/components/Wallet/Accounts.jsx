import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountActions from "actions/AccountActions";
import AccountCard from "../Dashboard/AccountCard";

class Accounts extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.accounts, this.props.accounts) ||
            !Immutable.is(nextProps.balances, this.props.balances)
        );
    }

    addAccount(e) {
        e.preventDefault();
        let input = e.target.querySelector("input");
        AccountActions.addAccount(input.value);
        input.value = "";
    }

    clickHandler(name) {
        AccountActions.setActiveAccount(name);
    }

    render() {
        let {assets, balances} = this.props;

        let itemRows = this.props.accounts
        .sort((a, b) => { // By BTS balance first then by name
            // if (b.balances[0].amount - a.balances[0].amount === 0) {
            if (b.name > a.name) {
                return -1;
            } else if (b.name < a.name) {
                return 1;
            }
            return 0;
            // }
            // return b.balances[0].amount - a.balances[0].amount;
        })
        .map((a) => {
            return (
                <AccountCard 
                    key={a.name} 
                    assets={assets} 
                    account={a} 
                    balances={balances.get(a.id)}
                    onClick={this.clickHandler.bind(this, a.name)}
                />
            );
        }).toArray();

        itemRows.push(
            <AccountCard new={true} key="new"/>
        );

        return (
            <div className="grid-block wrap">
                {itemRows}
            </div>
        );
    }
}

Accounts.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Accounts;
