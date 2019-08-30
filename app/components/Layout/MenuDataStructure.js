import MenuItemType from "./MenuItemType";

class MenuDataStructure {
    /*
        clickHandlers: {
            toggleLock,
            followUnfollow,
            showSend,
            showDeposit,
            showWithdraw
        },
        renderingProps: {
            isAccountLocked,
            passwordLogin,
            isContact,
            isMyAccount,
            showAccountLinks,
            tradeUrl,
            enableDepositWithdraw,

            passwordLogin,

            currentAccount,
            createAccountLink
        }
    */
    static getData(clickHandlers, renderingProps) {
        let result = [
            {
                target: clickHandlers.toggleLock,
                icon: "power",
                text: `header.${
                    renderingProps.isAccountLocked
                        ? "unlock_short"
                        : "lock_short"
                }`,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: `/create-account/${
                    !renderingProps.passwordLogin ? "wallet" : "password"
                }`,
                target: `/create-account/${
                    !renderingProps.passwordLogin ? "wallet" : "password"
                }`,
                icon: {
                    name: "user",
                    title: "icons.user.create_account"
                },
                text: "header.create_account",
                hidden: !renderingProps.isAccountLocked,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/account",
                target: `/account/${renderingProps.currentAccount}`,
                icon: "dashboard",
                text: "header.dashboard",
                hidden: renderingProps.isAccountLocked,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: ["account/", "/account/"],
                excludePattern: [
                    "/assets",
                    "/voting",
                    "/signedmessages",
                    "/member-stats",
                    "/vesting",
                    "/whitelist",
                    "/permissions"
                ],
                target: `/account/${renderingProps.currentAccount}`,
                icon: "dashboard",
                text: "header.dashboard",
                hidden:
                    renderingProps.currentAccount &&
                    !renderingProps.createAccountLink,
                inHeaderBehavior: MenuItemType.Always,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                target: clickHandlers.followUnfollow,
                icon: {
                    name: `${
                        renderingProps.isContact ? "minus" : "plus"
                    }-circle`,
                    title: renderingProps.isContact
                        ? "icons.minus_circle.remove_contact"
                        : "icons.plus_circle.add_contact"
                },
                text: `account.${
                    renderingProps.isContact ? "unfollow" : "follow"
                }`,
                hidden:
                    renderingProps.isMyAccount ||
                    !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                hidden:
                    renderingProps.isMyAccount ||
                    !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/market/",
                target: renderingProps.tradeUrl,
                hideClassName: "column-hide-xxs",
                additionalClassName: "column-show-small",
                icon: {
                    name: "trade",
                    title: "icons.trade.exchange"
                },
                text: "header.exchange",
                inHeaderBehavior: MenuItemType.Always,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/explorer",
                target: "/explorer/blocks",
                hideClassName: "column-hide-xs",
                additionalClassName: "column-show-small",
                icon: {
                    name: "server",
                    size: "2x"
                },
                text: "header.explorer",
                inHeaderBehavior: MenuItemType.Always,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                target: clickHandlers.showSend,
                icon: "transfer",
                text: "header.payments",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                target: clickHandlers.showDeposit,
                icon: {
                    name: "deposit",
                    title: "icons.deposit.deposit"
                },
                text: "modal.deposit.submit",
                submenu: {
                    target: "/deposit-withdraw",
                    text: "header.deposit_legacy",
                    disabled: !renderingProps.enableDepositWithdraw
                },
                disabled: !renderingProps.enableDepositWithdraw,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                target: clickHandlers.showWithdraw,
                icon: "withdraw",
                text: "modal.withdraw.submit",
                submenu: {
                    target: "/deposit-withdraw",
                    text: "header.withdraw_legacy",
                    disabled: !renderingProps.enableDepositWithdraw
                },
                disabled: !renderingProps.enableDepositWithdraw,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "deposit-withdraw",
                icon: {
                    name: "deposit-withdraw",
                    title: "icons.deposit.deposit_withdraw"
                },
                text: "header.deposit-withdraw",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/settings",
                target: "/settings",
                additionalClassName: "desktop-only",
                icon: "cogs",
                text: "header.settings",
                hidden: true,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                additionalClassName: "desktop-only",
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/spotlight",
                target: "/spotlight",
                icon: "showcases",
                text: "header.showcases",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/settings",
                additionalClassName: "mobile-only",
                icon: "cogs",
                text: "header.settings",
                submenu: [
                    {
                        target: "/settings/general",
                        text: "settings.general"
                    },
                    {
                        target: "/settings/wallet",
                        hidden: renderingProps.passwordLogin
                    },
                    {
                        target: "/settings/accounts",
                        text: "settings.accounts"
                    },
                    {
                        target: "/settings/password",
                        text: "settings.password",
                        hidden: renderingProps.passwordLogin
                    },
                    {
                        target: "/settings/backup",
                        text: "settings.backup",
                        hidden: renderingProps.passwordLogin
                    },
                    {
                        target: "/settings/restore",
                        text: "settings.restore",
                        hidden: renderingProps.passwordLogin
                    },
                    {
                        target: "/settings/access",
                        text: "settings.access"
                    },
                    {
                        target: "/settings/faucet_address",
                        text: "settings.faucet_address"
                    },
                    {
                        target: "/settings/reset",
                        text: "settings.reset"
                    }
                ],
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                additionalClassName: "mobile-only",
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/news",
                target: "/news",
                icon: "news",
                text: "news.news",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/voting",
                target: `/account/${renderingProps.currentAccount}/voting`,
                icon: {
                    name: "thumbs-up",
                    title: "icons.thumbs_up"
                },
                text: "account.voting",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/assets",
                excludePattern: "explorer",
                target: `/account/${renderingProps.currentAccount}/assets`,
                icon: "assets",
                text: "explorer.assets.title",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/signedmessages",
                target: `/account/${
                    renderingProps.currentAccount
                }/signedmessages`,
                icon: {
                    name: "text",
                    title: "icons.text.signed_messages"
                },
                text: "icons.text.signed_messages",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/member-stats",
                target: `/account/${
                    renderingProps.currentAccount
                }/member-stats`,
                icon: {
                    name: "text",
                    title: "icons.text.membership_stats"
                },
                text: "account.member.stats",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/vesting",
                target: `/account/${renderingProps.currentAccount}/vesting`,
                icon: "hourglass",
                text: "account.vesting.title",
                hidden: !renderingProps.isMyAccount,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/vesting",
                target: `/account/${renderingProps.currentAccount}/vesting`,
                icon: "hourglass",
                text: "account.vesting.title",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/whitelist",
                target: `/account/${renderingProps.currentAccount}/whitelist`,
                icon: "list",
                text: "account.whitelist.title",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                includePattern: "/permissions",
                target: `/account/${renderingProps.currentAccount}/permissions`,
                icon: "warning",
                text: "account.permissions",
                disabled: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/accounts",
                target: "/accounts",
                icon: "folder",
                text: "explorer.accounts.title",
                hidden: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Always
            },
            {
                hidden: !renderingProps.showAccountLinks,
                inHeaderBehavior: MenuItemType.Never,
                inDropdownBehavior: MenuItemType.Divider
            },
            {
                includePattern: "/help",
                icon: {
                    name: "question-circle",
                    title: "icons.question_circle"
                },
                text: "header.help",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/borrow",
                icon: "borrow",
                text: "showcases.borrow.title",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/barter",
                icon: "barter",
                text: "showcases.barter.title",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/direct-debit",
                icon: "direct_debit",
                text: "showcases.direct_debit.title",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/prediction",
                icon: "prediction-large",
                text: "showcases.prediction_market.title",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            },
            {
                includePattern: "/htlc",
                icon: "htlc",
                text: "showcases.htlc.title_short",
                inHeaderBehavior: MenuItemType.Dynamic,
                inDropdownBehavior: MenuItemType.Never
            }
        ];

        return result;
    }
}

export default MenuDataStructure;
