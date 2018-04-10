import React from "react";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import GatewayStore from "stores/GatewayStore";
// import AccountLeftPanel from "./AccountLeftPanel";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {connect} from "alt-react";
import accountUtils from "common/account_utils";
import {List} from "immutable";
import Page404 from "../Page404/Page404";

class AccountPage extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        account: "props.params.account_name"
    };

    componentDidMount() {
        if (this.props.account) {
            AccountActions.setCurrentAccount.defer(
                this.props.account.get("name")
            );

            // Fetch possible fee assets here to avoid async issues later (will resolve assets)
            accountUtils.getPossibleFees(this.props.account, "transfer");
        }
    }

    componentWillReceiveProps(np) {
        if (np.account) {
            const npName = np.account.get("name");
            const currentName =
                this.props.account && this.props.account.get("name");

            if (!this.props.account || npName !== currentName) {
                // Update the current account in order to access the header right menu options
                AccountActions.setCurrentAccount.defer(npName);
                // Fetch possible fee assets here to avoid async issues later (will resolve assets)
                accountUtils.getPossibleFees(np.account, "transfer");
            }
        }
    }

    render() {
        let {
            myActiveAccounts,
            account_name,
            searchAccounts,
            settings,
            wallet_locked,
            account,
            hiddenAssets
        } = this.props;

        if (!account) {
            return <Page404 />;
        }
        let isMyAccount = AccountStore.isMyAccount(account);

        return (
            <div className="grid-block page-layout">
                <div className="grid-block no-padding">
                    {React.cloneElement(
                        React.Children.only(this.props.children),
                        {
                            account_name,
                            myActiveAccounts,
                            searchAccounts,
                            settings,
                            wallet_locked,
                            account,
                            isMyAccount,
                            hiddenAssets,
                            contained: true,
                            balances: account.get("balances", List()).toList(),
                            orders: account.get("orders", List()).toList(),
                            backedCoins: this.props.backedCoins,
                            bridgeCoins: this.props.bridgeCoins,
                            gatewayDown: this.props.gatewayDown,
                            viewSettings: this.props.viewSettings,
                            proxy: account.getIn(["options", "voting_account"])
                        }
                    )}
                </div>
            </div>
        );
    }
}
AccountPage = BindToChainState(AccountPage, {
    keep_updating: true,
    show_loader: true
});

class AccountPageStoreWrapper extends React.Component {
    render() {
        let account_name = this.props.routeParams.account_name;

        return <AccountPage {...this.props} account_name={account_name} />;
    }
}

export default connect(AccountPageStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, WalletUnlockStore, GatewayStore];
    },
    getProps() {
        return {
            myActiveAccounts: AccountStore.getState().myActiveAccounts,
            searchAccounts: AccountStore.getState().searchAccounts,
            settings: SettingsStore.getState().settings,
            hiddenAssets: SettingsStore.getState().hiddenAssets,
            wallet_locked: WalletUnlockStore.getState().locked,
            viewSettings: SettingsStore.getState().viewSettings,
            backedCoins: GatewayStore.getState().backedCoins,
            bridgeCoins: GatewayStore.getState().bridgeCoins,
            gatewayDown: GatewayStore.getState().down
        };
    }
});
