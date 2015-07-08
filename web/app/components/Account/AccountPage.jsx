import React from "react";
import { RouteHandler, Link } from "react-router";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import AccountLeftPanel from "./AccountLeftPanel";

class AccountPage extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        AccountActions.getAccount(this.props.params.name, true);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.params.name !== this.props.params.name) {
            AccountActions.getAccount(nextProps.params.name, true);
        }
    }

    shouldComponentUpdate(nextProps) {
        return true;
    }

    render() {
        let account_name = this.props.params.name;
        return (
            <div className="grid-block page-layout">
                <div className="grid-block medium-2 left-column no-padding">
                    <AccountLeftPanel account_name={account_name} account_id={"1.2.1333"} active_menu_entry="overview" />
                </div>
                <div className="grid-block medium-10 main-content">
                    <AltContainer
                        stores={[AccountStore, AssetStore, SettingsStore]}
                        inject={{
                            all_delegates: () => {
                                return AccountStore.getState().account_name_to_id;
                            },
                            cachedAccounts: () => {
                                return AccountStore.getState().cachedAccounts;
                            },
                            accountBalances: () => {
                                return AccountStore.getState().balances;
                            },
                            accountHistories: () => {
                                return AccountStore.getState().accountHistories;
                            },
                            account_name_to_id: () => {
                                return AccountStore.getState().account_name_to_id;
                            },
                            account_id_to_name: () => {
                                return AccountStore.getState().account_id_to_name;
                            },
                            assets: () => {
                                return AssetStore.getState().assets;
                            },
                            settings: () => {
                                return SettingsStore.getState().settings;
                            }
                          }}
                        >
                        <RouteHandler account_name={account_name} />
                    </AltContainer>
                </div>
            </div>
        );
    }
}

AccountPage.contextTypes = {router: React.PropTypes.func.isRequired};

export default AccountPage;
