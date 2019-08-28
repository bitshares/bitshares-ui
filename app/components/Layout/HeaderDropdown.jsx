import React from "react";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import cnames from "classnames";
import AccountActions from "actions/AccountActions";
import DropdownMenuItem from "./DropdownMenuItem";
import DividerMenuItem from "./DividerMenuItem";

export default class DropDownMenu extends React.Component {
    shouldComponentUpdate(np) {
        let shouldUpdate = false;
        for (let key in np) {
            if (typeof np[key] === "function") continue;
            shouldUpdate = shouldUpdate || np[key] !== this.props[key];
        }
        return shouldUpdate;
    }

    _onAddContact() {
        AccountActions.addAccountContact(this.props.currentAccount);
    }

    _onRemoveContact() {
        AccountActions.removeAccountContact(this.props.currentAccount);
    }

    render() {
        const {
            dropdownActive,
            toggleLock,
            maxHeight,
            locked,
            active,
            passwordLogin,
            isMyAccount,
            showAccountLinks,
            tradeUrl,
            enableDepositWithdraw,
            currentAccount,
            contacts
        } = this.props;

        let isContact = contacts.has(currentAccount);

        return (
            <ul
                className="dropdown header-menu"
                style={{
                    left: -200,
                    top: 64,
                    maxHeight: !dropdownActive ? 0 : maxHeight,
                    overflowY: "auto"
                }}
            >
                <DropdownMenuItem
                    currentPath={active}
                    target={toggleLock}
                    icon={{
                        name: "power"
                    }}
                    text={`header.${
                        this.props.locked ? "unlock_short" : "lock_short"
                    }`}
                />

                <DividerMenuItem />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern={`/create-account/${
                        !passwordLogin ? "wallet" : "password"
                    }`}
                    target={this.props.onNavigate.bind(
                        this,
                        `/create-account/${
                            !passwordLogin ? "wallet" : "password"
                        }`
                    )}
                    icon={{
                        name: "user",
                        title: "icons.user.create_account"
                    }}
                    text="header.create_account"
                    hidden={!locked}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/account"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}`
                    )}
                    icon={{
                        name: "dashboard"
                    }}
                    text="header.dashboard"
                    hidden={locked}
                />

                <DropdownMenuItem
                    currentPath={active}
                    target={this[
                        isContact ? "_onRemoveContact" : "_onAddContact"
                    ].bind(this)}
                    icon={{
                        name: `${isContact ? "minus" : "plus"}-circle`,
                        title: isContact
                            ? "icons.minus_circle.remove_contact"
                            : "icons.plus_circle.add_contact"
                    }}
                    text={`account.${isContact ? "unfollow" : "follow"}`}
                    hidden={isMyAccount || !showAccountLinks}
                />

                <DividerMenuItem hidden={isMyAccount || !showAccountLinks} />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/market/"
                    additionalClassName="column-show-small"
                    target={this.props.onNavigate.bind(this, tradeUrl)}
                    icon={{
                        name: "trade",
                        title: "icons.trade.exchange"
                    }}
                    text="header.exchange"
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/explorer"
                    additionalClassName="column-show-small"
                    target={this.props.onNavigate.bind(
                        this,
                        "/explorer/blocks"
                    )}
                    icon={{
                        name: "server"
                    }}
                    text="header.explorer"
                />

                {[
                    {
                        icon: {
                            name: "transfer",
                            title: "icons.transfer"
                        },
                        disabled: !showAccountLinks,
                        mainText: "header.payments",
                        mainCallback: this.props.showSend,
                        subText: null,
                        subURL: null
                    },
                    {
                        icon: {
                            name: "deposit",
                            title: "icons.deposit.deposit"
                        },
                        disabled: !enableDepositWithdraw,
                        mainText: "modal.deposit.submit",
                        mainCallback: this.props.showDeposit,
                        subText: "header.deposit_legacy",
                        subURL: "/deposit-withdraw"
                    },
                    {
                        icon: {
                            name: "withdraw",
                            title: "icons.withdraw"
                        },
                        disabled: !enableDepositWithdraw,
                        mainText: "modal.withdraw.submit",
                        mainCallback: this.props.showWithdraw,
                        subText: "header.withdraw_legacy",
                        subURL: "/deposit-withdraw"
                    }
                ].map(
                    (
                        {
                            icon,
                            subURL,
                            disabled,
                            mainText,
                            subText,
                            mainCallback
                        },
                        index
                    ) => (
                        <li
                            key={index}
                            className={cnames({
                                active: active.indexOf(subURL) !== -1,
                                disabled
                            })}
                            onClick={
                                disabled
                                    ? event => {
                                          event.stopPropagation();
                                      }
                                    : mainCallback
                            }
                        >
                            <div className="table-cell">
                                <Icon size="2x" {...icon} />
                            </div>
                            <div className="table-cell">
                                <Translate content={mainText} />{" "}
                                {subText && (
                                    <span
                                        onClick={
                                            disabled
                                                ? () => {}
                                                : event => {
                                                      event.stopPropagation();
                                                      this.props.onNavigate.bind(
                                                          this,
                                                          subURL
                                                      )(event);
                                                  }
                                        }
                                        className={cnames(
                                            "header-dropdown-sub-link",
                                            {enabled: !disabled}
                                        )}
                                    >
                                        <Translate content={subText} />
                                    </span>
                                )}
                            </div>
                        </li>
                    )
                )}

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/settings"
                    additionalClassName="desktop-only"
                    target={this.props.onNavigate.bind(this, "/settings")}
                    icon={{
                        name: "cogs"
                    }}
                    text="header.settings"
                />

                <DividerMenuItem additionalClassName="desktop-only" />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/spotlight"
                    target={this.props.onNavigate.bind(this, "/spotlight")}
                    icon={{
                        name: "showcases"
                    }}
                    text="header.showcases"
                />

                <DividerMenuItem />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/settings"
                    additionalClassName="mobile-only has-submenu"
                    target={this.props.toggleDropdownSubmenu}
                    icon={{
                        name: "cogs"
                    }}
                    text="header.settings"
                />

                <DividerMenuItem additionalClassName="mobile-only" />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/news"
                    target={this.props.onNavigate.bind(this, "/news")}
                    icon={{
                        name: "news"
                    }}
                    text="news.news"
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/voting"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/voting`
                    )}
                    icon={{
                        name: "thumbs-up",
                        title: "icons.thumbs_up"
                    }}
                    text="account.voting"
                    disabled={!showAccountLinks}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern={["/assets", "/account/"]}
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/assets`
                    )}
                    icon={{
                        name: "assets"
                    }}
                    text="explorer.assets.title"
                    disabled={!showAccountLinks}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/signedmessages"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/signedmessages`
                    )}
                    icon={{
                        name: "text",
                        title: "icons.text.signed_messages"
                    }}
                    text="account.signedmessages.menuitem"
                    disabled={!showAccountLinks}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/member-stats"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/member-stats`
                    )}
                    icon={{
                        name: "text",
                        title: "icons.text.membership_stats"
                    }}
                    text="account.member.stats"
                    disabled={!showAccountLinks}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/vesting"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/vesting`
                    )}
                    icon={{
                        name: "hourglass"
                    }}
                    text="account.vesting.title"
                    hidden={!isMyAccount}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/whitelist"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/whitelist`
                    )}
                    icon={{
                        name: "list"
                    }}
                    text="account.whitelist.title"
                    disabled={!showAccountLinks}
                />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/permissions"
                    target={this.props.onNavigate.bind(
                        this,
                        `/account/${currentAccount}/permissions`
                    )}
                    icon={{
                        name: "warning",
                        title: ""
                    }}
                    text="account.permissions"
                />

                <DividerMenuItem />

                <DropdownMenuItem
                    currentPath={active}
                    includePattern="/accounts"
                    target={this.props.onNavigate.bind(this, "/accounts")}
                    icon={{
                        name: "folder",
                        title: ""
                    }}
                    text="explorer.accounts.title"
                    hidden={!showAccountLinks}
                />

                <DividerMenuItem hidden={!showAccountLinks} />

            </ul>
        );
    }
}
