import React from "react";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import VotesTable from "./VotesTable";
import VoteActions from "actions/VoteActions";
import VoteStore from "stores/VoteStore";
import BaseComponent from "../BaseComponent";
import Tabs from "react-foundation-apps/src/tabs";
import counterpart from "counterpart";

class AccountVoting extends BaseComponent {

    constructor(props) {
        super(props, VoteStore);
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
        // TODO: get proxy_account's id before submitting it setProxyAccount
        VoteActions.setProxyAccount(this.props.account_name, 0, this.refs.proxy_account.value());
    }

    onPublish() {
        console.log("[AccountVoting.jsx:49] ----- onPublish ----->");
        let account_name = this.props.account_name;
        if (VoteStore.hasChanges(account_name)) {
            let account_json = VoteStore.getAccountJsonWithChanges(account_name);
            VoteActions.publishChanges(account_name, account_json);
        }
    }

    onCancelChanges(e) {
        e.preventDefault();
        VoteActions.cancelChanges(this.props.account_name);
        this.refs.proxy_account.setValue(this.state.c_proxies[this.props.account_name]);
    }

    render() {
        let account_name = this.props.account_name;
        let my_delegates = this.state.c_delegates[account_name];
        let my_witnesses = this.state.c_witnesses[account_name];
        let my_budget_items = this.state.c_budget_items[account_name];
        let my_proxy_account = this.state.c_proxies[account_name];
        //console.log("[AccountVoting.jsx:83] ----- render ----->", my_proxy_account, my_delegates, my_witnesses, my_budget_items);
        let ad = this.props.account_name_to_id;
        let all_delegates = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);
        let all_witnesses = all_delegates;
        let all_budget_items = all_delegates;
        let action_buttons_class = "button" + (VoteStore.hasChanges(account_name) ? "" : " disabled");

        let tabTitles = {
            delegates: counterpart.translate("explorer.delegates.title"),
            witnesses: counterpart.translate("explorer.witnesses.title"),
            workers: counterpart.translate("account.votes.workers")
        };

        return (
            <div className="grid-content">
                <div className="content-block">
                    <div className="medium-4">
                        <label><Translate content="account.votes.proxy" /></label>
                        <AutocompleteInput
                            id="proxy_account" ref="proxy_account"
                            options={all_delegates}
                            onChange={this.onProxyChanged.bind(this)}
                            initial_value={my_proxy_account}/>
                    </div>
                </div>
                {my_proxy_account === "" ?
                    (
                    <div className="content-block">
                        <Tabs>
                            <Tabs.Tab title={tabTitles.delegates}>
                                <VotesTable
                                    selectedEntities={my_delegates}
                                    allEntities={all_delegates}
                                    onAddRow={this.onAddRow.bind(this, "delegates")}
                                    onRemoveRow={this.onRemoveRow.bind(this, "delegates")} />
                            </Tabs.Tab>
                            <Tabs.Tab title={tabTitles.witnesses}>
                                <VotesTable
                                    selectedEntities={my_witnesses}
                                    allEntities={all_witnesses}
                                    onAddRow={this.onAddRow.bind(this, "witnesses")}
                                    onRemoveRow={this.onRemoveRow.bind(this, "witnesses")} />
                            </Tabs.Tab>
                            <Tabs.Tab title={tabTitles.workers}>
                                <VotesTable
                                    selectedEntities={my_budget_items}
                                    allEntities={all_budget_items}
                                    onAddRow={this.onAddRow.bind(this, "budget_items")}
                                    onRemoveRow={this.onRemoveRow.bind(this, "budget_items")} />
                            </Tabs.Tab>
                          </Tabs>
                    </div>
                    ) : null
                }
                <div className="content-block">
                    <div className="actions clearfix">
                        <button className={action_buttons_class} onClick={this.onPublish.bind(this)}><Translate content="account.perm.publish" /></button>
                        <a href="#" className={action_buttons_class + " secondary"} onClick={this.onCancelChanges.bind(this)}><Translate content="account.perm.reset" /></a>
                    </div>
                </div>
            </div>
        );
    }
}


AccountVoting.defaultProps = {
    account_name: "",
    account_name_to_id: {}
};

AccountVoting.propTypes = {
    account_name: PropTypes.string.isRequired,
    account_name_to_id: PropTypes.object.isRequired
};

export default AccountVoting;
