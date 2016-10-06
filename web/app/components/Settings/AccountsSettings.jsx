import React from "react";
import {Link} from "react-router";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import connectToStores from "alt/utils/connectToStores";
import utils from "common/utils";
import Translate from "react-translate-component";

@connectToStores
export default class AccountsSettings extends React.Component {

    static getStores() {
        return [AccountStore];
    };

    static getPropsFromStores() {
        return {
            myAccounts: AccountStore.getMyAccounts(),
            ignoredAccounts: AccountStore.getState().myIgnoredAccounts
        };
    };

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.myAccounts, this.props.myAccounts) ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts
        );
    }

    onLinkAccount(account, e) {
        e.preventDefault();
        AccountActions.linkAccount(account);
    }

    onUnlinkAccount(account, e) {
        e.preventDefault();
        AccountActions.unlinkAccount(account);
    }

    render() {
        let {myAccounts, ignoredAccounts} = this.props;

        let accounts = ignoredAccounts.toArray().concat(myAccounts).sort();

        if (!accounts.length) {
            return <div><Translate content="settings.no_accounts" /></div>;
        }

        return (
            <table className="table">
                <tbody>
                    {accounts.map(account => {
                        let isIgnored = ignoredAccounts.has(account);
                        let hideLink = (<a
                            href
                            onClick={isIgnored ?
                                this.onLinkAccount.bind(this, account) :
                                this.onUnlinkAccount.bind(this, account)
                            }
                            >
                                <Translate content={"account." + (isIgnored ? "unignore" : "ignore")} />
                            </a>
                        );

                        return (
                            <tr key={account}>
                                <td>{account}</td>
                                <td><Link to={`/account/${account}/permissions`}><Translate content="settings.view_keys" /></Link></td>
                                <td>{hideLink}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}
