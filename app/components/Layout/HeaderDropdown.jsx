import React from "react";
import Translate from "react-translate-component";
import {isArray, isString} from "lodash-es";
import AccountActions from "actions/AccountActions";
import DropdownMenuItem from "./DropdownMenuItem";
import DividerMenuItem from "./DividerMenuItem";
import SubmenuItem from "./SubmenuItem";
import MenuItemType from "./MenuItemType";
import MenuDataStructure from "./MenuDataStructure";

export default class DropDownMenu extends React.Component {
    constructor() {
        super();

        this.state = {
            dropdownSubmenuActive: false,
            dropdownSubmenuActiveItem: {}
        };
    }

    _toggleDropdownSubmenu(item = this.state.dropdownSubmenuActiveItem, event) {
        if (event) event.stopPropagation();

        this.setState({
            dropdownSubmenuActive: !this.state.dropdownSubmenuActive,
            dropdownSubmenuActiveItem: item
        });
    }

    shouldComponentUpdate(np, ns) {
        let shouldUpdate = false;

        for (let key in np) {
            if (typeof np[key] === "function") continue;
            shouldUpdate = shouldUpdate || np[key] !== this.props[key];
        }

        for (let key in ns) {
            if (typeof ns[key] === "function") continue;
            shouldUpdate = shouldUpdate || ns[key] !== this.state[key];
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
            contacts,
            showSend,
            showDeposit,
            showWithdraw
        } = this.props;

        let isContact = contacts.has(currentAccount);

        let clickHandlers = {
            toggleLock: toggleLock,
            followUnfollow: this[
                isContact ? "_onRemoveContact" : "_onAddContact"
            ].bind(this),
            showSend: showSend,
            showDeposit: showDeposit,
            showWithdraw: showWithdraw
        };

        let renderingProps = {
            isAccountLocked: locked,
            currentAccount: currentAccount,
            isContact: isContact,
            isMyAccount: isMyAccount,
            showAccountLinks: showAccountLinks,
            tradeUrl: tradeUrl,
            enableDepositWithdraw: enableDepositWithdraw,
            passwordLogin: passwordLogin
        };

        let menuDataStructure = MenuDataStructure.getData(
            clickHandlers,
            renderingProps
        );

        return !this.state.dropdownSubmenuActive ? (
            <ul
                className="dropdown header-menu"
                style={{
                    left: -200,
                    top: 64,
                    maxHeight: !dropdownActive ? 0 : maxHeight,
                    overflowY: "auto"
                }}
            >
                {menuDataStructure.map((menuItem, index) => {
                    switch (menuItem.inDropdownBehavior) {
                        case MenuItemType.Always:
                        case MenuItemType.Dynamic:
                            // Convert pure path to click handler
                            let clickHandler = isString(menuItem.target)
                                ? this.props.onNavigate.bind(
                                      this,
                                      menuItem.target
                                  )
                                : menuItem.target;

                            if (
                                menuItem.submenu &&
                                !isArray(menuItem.submenu)
                            ) {
                                menuItem.submenu.target = isString(
                                    menuItem.submenu.target
                                )
                                    ? this.props.onNavigate.bind(
                                          this,
                                          menuItem.submenu.target
                                      )
                                    : menuItem.submenu.target;
                            }

                            // Attach click handler for submenus
                            if (menuItem.submenu && isArray(menuItem.submenu)) {
                                clickHandler = this._toggleDropdownSubmenu.bind(
                                    this,
                                    menuItem
                                );

                                menuItem.submenu.map(submenuItem => {
                                    submenuItem.target = isString(
                                        submenuItem.target
                                    )
                                        ? this.props.onNavigate.bind(
                                              this,
                                              submenuItem.target
                                          )
                                        : submenuItem.target;
                                });
                            }

                            return (
                                <DropdownMenuItem
                                    key={index}
                                    currentPath={active}
                                    includePattern={menuItem.includePattern}
                                    excludePattern={menuItem.excludePattern}
                                    target={clickHandler}
                                    additionalClassName={
                                        menuItem.additionalClassName
                                    }
                                    icon={menuItem.icon}
                                    text={menuItem.text}
                                    behavior={menuItem.inDropdownBehavior}
                                    submenu={menuItem.submenu}
                                    hidden={menuItem.hidden}
                                    disabled={menuItem.disabled}
                                />
                            );
                        case MenuItemType.Divider:
                            return (
                                <DividerMenuItem
                                    key={index}
                                    additionalClassName={
                                        menuItem.additionalClassName
                                    }
                                    hidden={menuItem.hidden}
                                />
                            );
                    }
                })}
            </ul>
        ) : (
            <ul
                className="dropdown header-menu header-submenu"
                style={{
                    left: -200,
                    top: 64,
                    maxHeight: !dropdownActive ? 0 : maxHeight,
                    overflowY: "auto"
                }}
            >
                <li
                    className="parent-item"
                    onClick={this._toggleDropdownSubmenu.bind(this, {})}
                >
                    <div className="table-cell">
                        <span className="parent-item-icon">&lt;</span>
                        <Translate
                            content={this.state.dropdownSubmenuActiveItem.text}
                            component="span"
                            className="parent-item-name"
                        />
                    </div>
                </li>
                <DividerMenuItem />

                {this.state.dropdownSubmenuActiveItem.submenu.map(
                    (submenuItem, index) => {
                        return (
                            <DropdownMenuItem
                                key={index}
                                target={submenuItem.target}
                                text={submenuItem.text}
                                hidden={submenuItem.hidden}
                                icon={submenuItem.icon}
                            />
                        );
                    }
                )}
            </ul>
        );
    }
}
