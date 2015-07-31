import React from "react";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import Immutable from "immutable";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";
import LoadingIndicator from "../LoadingIndicator";

class AccountHistory extends React.Component {

    constructor() {
        super();
        this.state = {
            perPage: 20,
            count: 20,
            pages: null,
            currentPage: 1,
            setPage: 1
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("nextProps:", nextProps.account_id_to_name);
        // console.log("this.props:", this.props.account_id_to_name);
        return (
                !Immutable.is(nextProps.accountHistories, this.props.accountHistories) ||
                nextProps.account_name !== this.props.account_name ||
                nextState.currentPage !== this.state.currentPage ||
                nextState.setPage !== this.state.setPage ||
                nextState.pages !== this.state.pages ||
                // Object.keys(nextProps.account_id_to_name).equals(Object.keys(this.props.account_id_to_name))
                // returning true here until issue #93 has been resolved
                true
            );
    }

    componentDidMount() {
        this._setCount(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this._setCount(nextProps);
    }

    _changePage(direction, newValue) {
        let {currentPage, count, pages} = this.state;

        switch (direction) {
            case "up":
                currentPage--;
                break;
            case "down":
                currentPage++;
                break;
            case "first":
                currentPage = 1;
                break;
            case "last":
                currentPage = pages;
                break;
            case "setPage":
                currentPage = newValue;
                break;
            case "default":
                break;
        }

        currentPage = Math.max(1, currentPage);
        currentPage = Math.min(pages, currentPage);
        this.setState({currentPage: currentPage, setPage: currentPage});
    }

    _setCount(props) {
        let {account_name, cachedAccounts, account_name_to_id, assets, accountHistories, account_id_to_name} = this.props;
        let {perPage} = this.state;
        if (props.accountHistories.get(account_name)) {
            let count = props.accountHistories.get(account_name).length;
            let pages = (count % perPage === 0) ? (count / perPage) : 1 + Math.floor(count / perPage);
            this.setState({count: count, pages: pages});
        }
    }

    _setPage(e) {
        let newValue = parseInt(e.target.value, 10);
        if (typeof newValue === "number") {
            newValue = Math.max(1, newValue);
            newValue = Math.min(this.state.pages, newValue);
            if (newValue !== this.state.currentPage) {
                this._changePage("setPage", newValue);
            }
        }
    }

    render() {
        let {account_name, cachedAccounts, account_name_to_id, assets, accountHistories, account_id_to_name} = this.props;
        let {perPage, count, pages, currentPage, setPage} = this.state;
        let account = account_name ? cachedAccounts.get(account_name) : null;
        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        } 
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        if (!pages) {
            return (
                <div className="grid-content">
                </div>
            );
        }

        let myHistory = accountHistories.get(account_name), history = null;

        let start = (currentPage - 1) * perPage;
        if (myHistory.length > 0) {
            history = [];
            for (var i = start; i < Math.min(myHistory.length, start + perPage); i++) {
                let trx = myHistory[i];
                history.push(
                    <Operation
                        key={i}
                        op={trx.op}
                        block={trx.block_num}
                        account_id_to_name={account_id_to_name}
                        assets={assets}
                        current={account.id}
                        witnesses={WitnessStore.getState().witnesses}
                        witness_id_to_name={WitnessStore.getState().witness_id_to_name}
                        inverted={this.props.settings.get("inverseMarket")}
                    />
                );
            }
        }

        return (
            <div className="grid-content">
                <ul className="pagination">
                    <li onClick={this._changePage.bind(this, "first")}>1</li>
                    <li className="button outline block-button" onClick={this._changePage.bind(this, "up")}><Translate content="pagination.newer" /></li>
                    <li style={{padding: "0", margin: "0"}}><input value={setPage} onChange={this._setPage.bind(this)} type="number" onSubmit={this._changePage.bind(this, "set")}/></li>
                    <li className="button outline block-button" onClick={this._changePage.bind(this, "down")}><Translate content="pagination.older" /></li>
                    <li onClick={this._changePage.bind(this, "last")}>{pages.toString()}</li>
                </ul>
                <table style={{width: "100%"}} className="table">
                    <thead>
                        <tr>
                            <th><Translate content="explorer.block.title" /></th>
                            <th><Translate content="explorer.block.op" /></th>
                            <th><Translate content="account.votes.info" /></th>
                            <th style={{paddingRight: "1.5rem", textAlign: "right"}}><Translate content="transfer.fee" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history}
                    </tbody>
                </table>
            </div>
        );
    }
}

AccountHistory.defaultProps = {
    account_name: "",
    cachedAccounts: {},
    accountHistories: {},
    account_name_to_id: {},
    assets: {},
    account_id_to_name: {}
};

AccountHistory.propTypes = {
    account_name: PropTypes.string.isRequired,
    cachedAccounts: PropTypes.object.isRequired,
    accountHistories: PropTypes.object.isRequired,
    account_name_to_id: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    account_id_to_name: PropTypes.object.isRequired
};

export default AccountHistory;
