import React from "react";
import {isArray, isString} from "lodash-es";
import AccountActions from "actions/AccountActions";
import DropdownMenuItem from "./DropdownMenuItem";
import DividerMenuItem from "./DividerMenuItem";
import MenuItemType from "./MenuItemType";
import MenuDataStructure from "./MenuDataStructure";

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
            contacts,
            showSend,
            showDeposit,
            showWithdraw,
            toggleDropdownSubmenu
        } = this.props;

        let isContact = contacts.has(currentAccount);

        let clickHandlers = {
            toggleLock: toggleLock,
            followUnfollow: this[
                isContact ? "_onRemoveContact" : "_onAddContact"
            ].bind(this),
            showSend: showSend,
            showDeposit: showDeposit,
            showWithdraw: showWithdraw,
            toggleDropdownSubmenu: toggleDropdownSubmenu
        };

        let renderingProps = {
            isAccountLocked: locked,
            passwordLogin: passwordLogin,
            currentAccount: currentAccount,
            isContact: isContact,
            isMyAccount: isMyAccount,
            showAccountLinks: showAccountLinks,
            tradeUrl: tradeUrl,
            enableDepositWithdraw: enableDepositWithdraw
        };

        let menuDataStructure = MenuDataStructure.getData(
            clickHandlers,
            renderingProps
        );

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
        );
    }
}
