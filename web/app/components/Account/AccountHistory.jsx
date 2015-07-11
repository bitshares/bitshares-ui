import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Immutable from "immutable";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";

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
        return (
                !Immutable.is(nextProps.accountHistories, this.props.accountHistories) ||
                nextProps.account_name !== this.props.account_name ||
                nextState.currentPage !== this.state.currentPage ||
                nextState.setPage !== this.state.setPage ||
                nextState.pages !== this.state.pages
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
        let account = account_name_to_id[account_name] ? cachedAccounts.get(account_name_to_id[account_name]) : null;
        let {perPage} = this.state;
        let count = props.accountHistories.get(account.id).length;
        let pages = (count % perPage === 0) ? (count / perPage) : 1 + Math.floor(count / perPage);
        this.setState({count: count, pages: pages});
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
        if (!pages) {
            return (
                <div className="grid-content">
                </div>
            );
        }

        let account = account_name_to_id[account_name] ? cachedAccounts.get(account_name_to_id[account_name]) : null;
        if(!account) {
            return <div className="grid-content">Account {account_name} couldn't be displayed</div>;
        }

        let myHistory = accountHistories.get(account.id), history = null;

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
                        current={account_name}
                        witnesses={WitnessStore.getState().witnesses}
                        witness_id_to_name={WitnessStore.getState().witness_id_to_name}
                        inverted={this.props.settings.get("inverseMarket")}
                    />
                );
            };  
        }

        return (
            <div className="grid-content">
                <ul className="pagination">
                    <li onClick={this._changePage.bind(this, "first")}>1</li>
                    <li onClick={this._changePage.bind(this, "up")}>Newer</li>
                    <li><input value={setPage} onChange={this._setPage.bind(this)} type="number" onSubmit={this._changePage.bind(this, "set")}/></li>
                    <li onClick={this._changePage.bind(this, "down")}>Older</li>
                    <li onClick={this._changePage.bind(this, "last")}>{pages.toString()}</li>
                </ul>
                <table style={{width: "100%"}} className="table text-center">
                    <tbody>
                    {history}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default AccountHistory;
