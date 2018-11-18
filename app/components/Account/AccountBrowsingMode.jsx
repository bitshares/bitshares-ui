import React from "react";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import {Button, Modal, Icon, Popover} from "bitshares-ui-style-guide";

class AccountBrowsingMode extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            previousAccountName: null,
            isModalVisible: false
        };

        this.handleClose = this.handleClose.bind(this);
        this.handleSwitchBack = this.handleSwitchBack.bind(this);
        this.handleNeverShowAgain = this.handleNeverShowAgain.bind(this);
    }

    componentDidUpdate(prevProps) {
        /* if user changed his account to not his own*/
        if (
            prevProps.currentAccount &&
            this.props.currentAccount &&
            this.props.currentAccount !== prevProps.currentAccount &&
            !this.isMyAccount() &&
            this.isMyAccount(prevProps.currentAccount)
        ) {
            this.setState({
                isModalVisible: !this.props.neverShowBrowsingModeNotice,
                previousAccountName: prevProps.currentAccount
            });
        }
    }

    handleSwitchBack() {
        const myAccounts = AccountStore.getMyAccounts();

        let previousAccountName = this.state.previousAccountName;

        let switchToAccountName = null;

        if (this.isMyAccount(previousAccountName)) {
            switchToAccountName = previousAccountName;
        } else if (Array.isArray(myAccounts) && myAccounts.length) {
            switchToAccountName = myAccounts[0];
        }
        AccountActions.setCurrentAccount.defer(switchToAccountName);
    }

    isMyAccount(name) {
        const accountName = name ? name : this.props.currentAccount;

        const myAccounts = AccountStore.getMyAccounts();

        let isMyAccount = true;

        if (Array.isArray(myAccounts) && myAccounts.length && accountName) {
            isMyAccount = myAccounts.indexOf(accountName) >= 0;
        }

        return isMyAccount;
    }

    handleClose() {
        this.setState({
            isModalVisible: false
        });
    }

    handleNeverShowAgain() {
        this.handleClose();

        AccountActions.setNeverShowBrowsingModeNotice(true);
    }

    render() {
        const footer = [
            <Button key="ok" type="primary" onClick={this.handleClose}>
                {counterpart.translate("modal.ok")}
            </Button>,
            <Button key="cancel" onClick={this.handleNeverShowAgain}>
                {counterpart.translate(
                    "account_browsing_mode.never_show_again"
                )}
            </Button>
        ];

        if(this.props.usernameViewIcon) {
            return (
                window.innerWidth < 640 && !this.isMyAccount() ? 
                    <Popover 
                        content={<Translate content="account_browsing_mode.you_are_in_browsing_mode" />}
                        placement="bottom"
                    >
                        <Icon 
                            style={{marginLeft: 10}}
                            className="blue" 
                            type="eye" 
                            onClick={this.handleSwitchBack}
                        />
                    </Popover> : null
            );
        } else {
            return (
                <div className="account-browsing-mode">
                    <Modal
                        title={counterpart.translate(
                            "account_browsing_mode.modal_title"
                        )}
                        closable={false}
                        visible={this.state.isModalVisible}
                        footer={footer}
                    >
                        {counterpart.translate(
                            "account_browsing_mode.modal_description"
                        )}
                    </Modal>
                    {!this.isMyAccount() ? (
                        <Button
                            data-place="bottom"
                            data-tip={counterpart.translate(
                                "account_browsing_mode.you_are_in_browsing_mode"
                            )}
                            onClick={this.handleSwitchBack}
                            className="hide-for-small-only account-browsing-mode--button"
                        >
                            {counterpart.translate(
                                "account_browsing_mode.view_mode"
                            )}
                        </Button>
                    ) : null}
                </div>
            );
        }
    }
}

export default connect(
    AccountBrowsingMode,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                neverShowBrowsingModeNotice: AccountStore.getState()
                    .neverShowBrowsingModeNotice,
                currentAccount: AccountStore.getState().currentAccount
            };
        }
    }
);
