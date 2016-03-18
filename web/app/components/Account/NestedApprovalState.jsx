import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Immutable from "immutable";
import utils from "common/utils";

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
            nextProps.added !== this.props.added
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
        console.log("requiredAccounts:", requiredAccounts);

        let requiredWeight = 1;
        let currentWeight = 0;
        requiredLevelOne.forEach(account => {
            let fullAccount = requiredAccounts[account];
            if (fullAccount) {
                let accountName = fullAccount.get("name")
                requiredWeight = fullAccount.getIn([type, "weight_threshold"]);

                console.log("fullAccount:", fullAccount.toJS());
                requiredLevelTwo[accountName].accounts.forEach(levelTwo => {
                    console.log("levelTwo:", levelTwo);
                    if (availableLevelOne.indexOf(levelTwo[0]) !== -1) {
                        currentWeight += levelTwo[1];
                    }

                    let isOK = availableLevelOne.indexOf(levelTwo[0]) !== -1;
                    status.push(
                        <div style={{width: "100%"}}>
                            <div style={{display: "inline-block", paddingLeft: "10%"}}>{requiredAccounts[levelTwo[0]].get("name")}</div>
                            <div className="float-right" style={{display: "inline-block", paddingLeft: 20, backgroundColor: isOK ? "green" : "red"}}>
                                {isOK ? "OK" : "KO"}
                            </div>
                        </div>
                    );    
                });

                let isOK = currentWeight >= requiredWeight;
                status.unshift(
                    <div style={{width: "100%", paddingBottom: 5}}>
                        <div style={{display: "inline-block"}}>{accountName}</div>
                        <div className="float-right" style={{paddingLeft: 20, backgroundColor: isOK ? "green" : "red"}}>
                            {currentWeight} / {requiredWeight}
                        </div>
                    </div>
                );
                console.log("account:", accountName);
                
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
export default class FirstLevel extends React.Component {

    static propTypes = {
       required: ChainTypes.ChainAccountsList,
       available: ChainTypes.ChainAccountsList,
       type: React.PropTypes.string.isRequired
    };

    static defaultProps = {
        type: "active",
        added: null
    };

    getNestedStructure(accountList, type) {
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
                
                if (account.getIn([type, "account_auths"]).size) {
                    levelTwo[accountName] = [];

                    levelTwo[accountName] = {};
                    levelTwo[accountName]["id"] = account.get("id");
                    levelTwo[accountName]["id"] = account.get("id");
                    levelTwo[accountName]["accounts"] = [];

                    account.getIn([type, "account_auths"]).forEach(nestedAccount => {
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
        let {type, proposal, added} = this.props;

        let {allAccounts: required, levelOne: requiredLevelOne, levelTwo: requiredLevelTwo} =
            this.getNestedStructure(this.props.required, type);

        console.log("proposal:", this.props.proposal.toJS());
        console.log("required accounts:", required);
        console.log("requiredLevelOne:", requiredLevelOne);
        console.log("requiredLevelTwo:", requiredLevelTwo);

        let {allAccounts: available, levelOne: availableLevelOne, levelTwo: availableLevelTwo} =
            this.getNestedStructure(this.props.available, type);

        // console.log("available:", this.props.available.toJS());
        console.log("available accounts:", available);
        console.log("availableLevelOne:", availableLevelOne);
        console.log("availableLevelTwo:", availableLevelTwo);

        if (added) {
            availableLevelOne.push(added);
        }
        return (
            <SecondLevel
                type={type}
                added={this.props.added}
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