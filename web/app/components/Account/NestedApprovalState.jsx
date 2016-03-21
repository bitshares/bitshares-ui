import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Immutable from "immutable";
import utils from "common/utils";
import Icon from "../Icon/Icon";
import LinkToAccountById from "../Blockchain/LinkToAccountById";

@BindToChainState()
class SecondLevel extends React.Component {
    static propTypes = {
       required: ChainTypes.ChainAccountsList,
       available: ChainTypes.ChainAccountsList
    };

    shouldComponentUpdate(nextProps) {

        return (
            !utils.are_equal_shallow(nextProps.required, this.props.required) ||
            !utils.are_equal_shallow(nextProps.available, this.props.available) ||
            nextProps.added !== this.props.added ||
            nextProps.removed !== this.props.removed
        );
    }

    listToMap(accountsList) {
        let map = {};

        accountsList.forEach(account => {
            if (account) {
                map[account.get("id")] = account;
            }
        });

        return map;
    }

    render() {
        let {requiredLevelOne, requiredLevelTwo, availableLevelOne, type} = this.props;

        let requiredAccounts = this.listToMap(this.props.required);

        let status = [];

        let requiredWeight = 1;
        let currentWeight = 0;

        requiredLevelOne.forEach(account => {
            let fullAccount = requiredAccounts[account];
            if (fullAccount) {
                let accountName = fullAccount.get("name")
                requiredWeight = fullAccount.getIn([type, "weight_threshold"]);

                if (requiredLevelTwo[accountName] && "accounts" in requiredLevelTwo[accountName]) {
                    requiredLevelTwo[accountName].accounts.forEach(levelTwo => {
                        let fullAccount = requiredAccounts[levelTwo[0]];
                        if (fullAccount) {

                            if (availableLevelOne.indexOf(levelTwo[0]) !== -1) {
                                currentWeight += levelTwo[1];
                            }

                            let isOK = availableLevelOne.indexOf(levelTwo[0]) !== -1;
                            status.push(
                                <div
                                    key={levelTwo[0]}
                                    style={{
                                        width: "100%",
                                        overflow: "hidden"
                                    }}>
                                    <div style={{
                                        display: "inline-block",
                                        paddingLeft: "10%",
                                        paddingTop: 2
                                    }}>
                                        <LinkToAccountById subpage="permissions" account={fullAccount.get("id")} /> : {levelTwo[1]}
                                    </div>
                                    <div
                                        className="float-right"
                                        style={{
                                            display: "inline-block",
                                            paddingLeft: 20
                                        }}>
                                        <span>{isOK ? <Icon name="checkmark-circle" size="1x" className="success"/> : <Icon name="cross-circle" size="1x" className="error"/>}</span>
                                    </div>
                                </div>
                            );
                        }    
                    });
                }

                let isOK = currentWeight >= requiredWeight;
                status.unshift(
                    <div key={accountName} style={{width: "100%", paddingBottom: 5}}>
                        <div style={{display: "inline-block"}}><LinkToAccountById subpage="permissions" account={account} /></div>
                        <div className="float-right" style={{paddingLeft: 20, marginRight: 10}}>
                            <span className={isOK ? "txtlabel success" : "txtlabel warning"}>{currentWeight} / {requiredWeight}</span>
                        </div>
                    </div>
                );
                
            }
        });

        return (
            <div>
                {status}
            </div>
        );
    }
}

@BindToChainState()
class FirstLevel extends React.Component {

    static propTypes = {
       required: ChainTypes.ChainAccountsList,
       available: ChainTypes.ChainAccountsList
    };

    static defaultProps = {
        type: "active",
        added: null,
        removed: null
    };

    getNestedStructure(accountList, type, auth_type) {
        let allAccounts = [];
        let levelOne = [];
        let levelTwo = {};

        accountList.forEach(account => {

            if (account) {
                let accountName = account.get("name");
                levelOne.push(account.get("id"));

                if (allAccounts.indexOf(account.get("id")) === -1) {
                    allAccounts.push(account.get("id"));
                }
                
                if (account.getIn([type, auth_type]).size) {
                    levelTwo[accountName] = [];

                    levelTwo[accountName] = {};
                    levelTwo[accountName]["id"] = account.get("id");
                    levelTwo[accountName]["id"] = account.get("id");
                    levelTwo[accountName]["accounts"] = [];

                    account.getIn([type, auth_type]).forEach(nestedAccount => {
                        levelTwo[accountName]["accounts"].push(nestedAccount.toJS());
                        if (allAccounts.indexOf(nestedAccount.get(0)) === -1) {
                            allAccounts.push(nestedAccount.get(0));
                        }
                    });
                }
            }
        });

        return {
            allAccounts,
            levelOne,
            levelTwo
        };
    }

    render() {
        let {type, proposal, added, removed} = this.props;

        let {allAccounts: required, levelOne: requiredLevelOne, levelTwo: requiredLevelTwo} =
            this.getNestedStructure(this.props.required, type, "account_auths");

        let {allAccounts: available, levelOne: availableLevelOne, levelTwo: availableLevelTwo} =
            this.getNestedStructure(this.props.available, type, "account_auths");

        if (added) {
            availableLevelOne.push(added);
        }

        if (removed) {
            availableLevelOne.splice(availableLevelOne.indexOf(removed), 1);
        }

        return (
            <SecondLevel
                type={type}
                added={added}
                removed={removed}
                required={Immutable.List(required)}
                requiredLevelOne={requiredLevelOne}
                requiredLevelTwo={requiredLevelTwo}
                available={Immutable.List(available)}
                availableLevelOne={availableLevelOne}
                availableLevelTwo={availableLevelTwo}
            />
        );
    }
}

@BindToChainState({keep_updating: true})
export default class ProposalWrapper extends React.Component {

    static propTypes = {
       proposal: ChainTypes.ChainObject.isRequired,
       type: React.PropTypes.string.isRequired
    };

    static defaultProps = {
        type: "active",
        added: null
    };

    render() {
        let {proposal, type} = this.props;

        let available = proposal.get(`available_${type}_approvals`);
        let required = proposal.get(`required_${type}_approvals`);

        return (
            <FirstLevel
                {...this.props}
                required={required}
                available={available}
            />
        );
    }
}