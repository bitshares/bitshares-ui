import React from "react";
import {Link} from "react-router-dom";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import {connect} from "alt-react";
import utils from "common/utils";
import Translate from "react-translate-component";

class AccountsSettings extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(
                nextProps.myAccounts,
                this.props.myAccounts
            ) || nextProps.hiddenAccounts !== this.props.hiddenAccounts
        );
    }

    onToggleHide(account, hide, e) {
        e.preventDefault();
        AccountActions.toggleHideAccount(account, hide);
    }

    render() {
        let {myAccounts, hiddenAccounts} = this.props;

        let accounts = hiddenAccounts
            .toArray()
            .concat(myAccounts)
            .sort();

        if (!accounts.length) {
            return (
                <div>
                    <Translate content="settings.no_accounts" />
                </div>
            );
        }

        return (
            <table className="table">
                <tbody>
                    {accounts.map(account => {
                        let isIgnored = hiddenAccounts.has(account);
                        let hideLink = (
                            <a
                                onClick={
                                    isIgnored
                                        ? this.onToggleHide.bind(
                                              this,
                                              account,
                                              false
                                          )
                                        : this.onToggleHide.bind(
                                              this,
                                              account,
                                              true
                                          )
                                }
                            >
                                <Translate
                                    content={
                                        "account." +
                                        (isIgnored ? "unignore" : "ignore")
                                    }
                                />
                            </a>
                        );

                        return (
                            <tr key={account}>
                                <td>{account}</td>
                                <td>
                                    <Link
                                        to={`/account/${account}/permissions`}
                                    >
                                        <Translate content="settings.view_keys" />
                                    </Link>
                                </td>
                                <td>{hideLink}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}

AccountsSettings = connect(AccountsSettings, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            myAccounts: AccountStore.getMyAccounts(),
            hiddenAccounts: AccountStore.getState().myHiddenAccounts
        };
    }
});

export default AccountsSettings;
