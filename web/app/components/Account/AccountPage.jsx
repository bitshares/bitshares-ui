import React from "react";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import AccountLeftPanel from "./AccountLeftPanel";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import connectToStores from "alt/utils/connectToStores";

@BindToChainState({keep_updating: true, show_loader: true})
class AccountPage extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        account: "props.params.account_name"
    };

    componentWillMount() {
        let account = this.props.params.account_name;
        let {linkedAccounts, starredAccounts} = AccountStore.getState();
        if(account && linkedAccounts.get(account)) {
            if (starredAccounts.size && !starredAccounts.has(account)) {
                return;
            }
            AccountActions.setCurrentAccount(this.props.params.account_name);
        }
    }

    render() {
        let {myAccounts, linkedAccounts, account_name, searchAccounts, settings, wallet_locked, account} = this.props;

        let isMyAccount = AccountStore.isMyAccount(account);

        return (
            <div className="grid-block page-layout">
                <div className="show-for-medium grid-block medium-2 left-column no-padding">
                    <AccountLeftPanel
                        account={account}
                        isMyAccount={isMyAccount}
                        linkedAccounts={linkedAccounts}
                        myAccounts={myAccounts}
                    />
                </div>
                <div className="grid-block small-12 medium-10 main-content">
                    {React.cloneElement(
                        React.Children.only(this.props.children),
                        {
                            account_name,
                            linkedAccounts,
                            searchAccounts,
                            settings,
                            wallet_locked,
                            account,
                            isMyAccount
                        }
                    )}
                </div>
            </div>
        );
    }
}

@connectToStores
class AccountPageStoreWrapper extends React.Component {
    static getStores() {
        return [AccountStore, SettingsStore, WalletUnlockStore]
    }

    static getPropsFromStores() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            searchAccounts: AccountStore.getState().searchAccounts,
            settings: SettingsStore.getState().settings,
            wallet_locked: WalletUnlockStore.getState().locked,
            myAccounts:  AccountStore.getState().myAccounts
        }
    }

    render () {
        let account_name = this.props.routeParams.account_name;

        return <AccountPage {...this.props} account_name={account_name}/>
    }
}

export default AccountPageStoreWrapper;
