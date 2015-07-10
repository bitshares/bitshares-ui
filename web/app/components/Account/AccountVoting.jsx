import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import VotesTable from "./VotesTable";
import VoteActions from "actions/VoteActions";
import VoteStore from "stores/VoteStore";
import BaseComponent from "../BaseComponent";

class AccountVoting extends BaseComponent {

    constructor(props) {
        super(props);
        super(props, VoteStore);
    }

    isStateChanged() {
        let account_name = this.props.account_name;
        let my_delegates = this.state.c_delegates[account_name];
        let my_witnesses = this.state.c_witnesses[account_name];
        let my_budget_items = this.state.c_budget_items[account_name];
        let my_proxy_account = this.state.c_proxies[account_name];

        return my_delegates !== this.state.i_delegates[account_name] ||
               my_witnesses !== this.state.i_witnesses[account_name] ||
               my_budget_items !== this.state.i_budget_items[account_name] ||
               my_proxy_account !== this.state.i_proxies[account_name];
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
        // DODO: use this.state.containers = {delegates.. } to cache local data and compare it to nextState
        //let account_name = this.props.account_name;
        //let my_delegates = this.state.c_delegates[account_name];
        //let my_witnesses = this.state.c_witnesses[account_name];
        //let my_budget_items = this.state.c_budget_items[account_name];
        //let my_proxy_account = this.state.c_proxies[account_name];
        //
        //return my_delegates !== nextState.c_delegates[account_name] ||
        //    my_witnesses !== nextState.c_witnesses[account_name] ||
        //    my_budget_items !== nextState.c_budget_items[account_name] ||
        //    my_proxy_account !== nextState.c_proxies[account_name];
    }

    switchProxy() {
        console.log("[AccountVoting.jsx:37] ----- switchProxy ----->");
        let proxy_account = this.state.proxy_account === null ? "" : null;
        VoteActions.setProxyAccount(this.props.account_name, proxy_account);
        this.setState({proxy_account});
    }

    onAddRow(container_name, name) {
        VoteActions.addItem(container_name, this.props.account_name, {name});
    }

    onRemoveRow(container_name, name) {
        VoteActions.removeItem(container_name, this.props.account_name, {name});
    }

    onProxyChanged(e) {
        VoteActions.setProxyAccount(this.props.account_name, this.refs.proxy_account.value());
        //this.setState({proxy_account: this.refs.proxy_account.value()});
    }

    onPublish() {
        console.log("[AccountVoting.jsx:49] ----- onPublish ----->");
        VoteActions.publishChanges(this.props.account_name);
    }

    onCancelChanges(e) {
        e.preventDefault();
        VoteActions.cancelChanges(this.props.account_name);
    }

    render() {
        let account_name = this.props.account_name;
        let my_delegates = this.state.c_delegates[account_name];
        let my_witnesses = this.state.c_witnesses[account_name];
        let my_budget_items = this.state.c_budget_items[account_name];
        let my_proxy_account = this.state.c_proxies[account_name];
        //console.log("[AccountVoting.jsx:83] ----- render ----->", my_proxy_account, my_delegates, my_witnesses, my_budget_items);
        let ad = this.props.all_delegates;
        let all_delegates = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);
        let all_witnesses = all_delegates;
        let all_budget_items = all_delegates;
        let action_buttons_class = "button" + (this.isStateChanged() ? "" : " disabled");

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>
                        <div className="switch float-right">
                            <input type="checkbox" checked={this.state.proxy_account}/>
                            <label onClick={this.switchProxy.bind(this)}></label>
                        </div>
                        Proxy Voting Account
                    </h3>
                    {my_proxy_account !== null ? (
                        <div className="medium-4">
                            <br/>
                            <label>Account Name</label>
                            <AutocompleteInput
                                id="proxy_account" ref="proxy_account"
                                options={all_delegates}
                                onChange={this.onProxyChanged.bind(this)}/>
                        </div>
                        ) : null
                    }
                </div>
                {my_proxy_account === null ?
                    (<div>
                    <div className="content-block">
                        <h3>Delegates</h3>
                        <VotesTable
                            selectedEntities={my_delegates}
                            allEntities={all_delegates}
                            onAddRow={this.onAddRow.bind(this, "delegates")}
                            onRemoveRow={this.onRemoveRow.bind(this, "delegates")} />
                    </div>
                    <div className="content-block">
                        <h3>Witnesses</h3>
                        <VotesTable
                            selectedEntities={my_witnesses}
                            allEntities={all_witnesses}
                            onAddRow={this.onAddRow.bind(this, "witnesses")}
                            onRemoveRow={this.onRemoveRow.bind(this, "witnesses")} />
                    </div>
                    <div className="content-block">
                        <h3>Budget Items</h3>
                        <VotesTable
                            selectedEntities={my_budget_items}
                            allEntities={all_budget_items}
                            onAddRow={this.onAddRow.bind(this, "budget_items")}
                            onRemoveRow={this.onRemoveRow.bind(this, "budget_items")} />
                    </div>
                    </div>) : null
                }
                <div className="content-block">
                    <div className="actions clearfix">
                        <button className={action_buttons_class} onClick={this.onPublish.bind(this)}>Publish Changes</button>
                        <a href="#" className={action_buttons_class + " secondary"} onClick={this.onCancelChanges.bind(this)}>Reset Changes</a>
                    </div>
                </div>
            </div>
        );
    }
}

export default AccountVoting;
