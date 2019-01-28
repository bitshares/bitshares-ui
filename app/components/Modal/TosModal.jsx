import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletUnlockStore from "stores/WalletUnlockStore";
import CryptoBridgeStore from "stores/CryptoBridgeStore";
import CryptoBridgeActions from "actions/CryptoBridgeActions";
import PropTypes from "prop-types";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs";

class TosModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            terms: null,
            termsAccepted: false
        };
    }

    componentWillReceiveProps(nextProps) {
        if (
            !this.isFetchingAccount &&
            !nextProps.locked &&
            nextProps.currentAccount &&
            !nextProps.accounts.get(nextProps.currentAccount)
        ) {
            const account = ChainStore.getAccount(nextProps.currentAccount);

            if (account) {
                // getting account
                this.isFetchingAccount = true;
                CryptoBridgeActions.getAccount(account);
            }
        } else if (
            nextProps.locked &&
            nextProps.accounts.get(nextProps.currentAccount)
        ) {
            CryptoBridgeActions.removeAccount(nextProps.currentAccount);
        }

        if (!Immutable.is(nextProps.accounts, this.props.accounts)) {
            this.isFetchingAccount = false;

            const {account} =
                nextProps.accounts.get(nextProps.currentAccount) || {};

            if (
                account &&
                account.terms.accepted !== account.terms.latest.version
            ) {
                this.setState({
                    terms: account.terms.latest
                });
                ZfApi.publish(this.props.modalId, "open");
            } else {
                ZfApi.publish(this.props.modalId, "close");
            }
        }
    }

    onConfirm = () => {
        const {currentAccount} = this.props;
        const {terms, termsAccepted} = this.state;

        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock();
        } else if (terms && termsAccepted && currentAccount) {
            const account = ChainStore.getAccount(currentAccount);

            if (account) {
                CryptoBridgeActions.updateTerms(account, terms.version)
                    .then(() => {
                        ZfApi.publish(this.props.modalId, "close");
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        }
    };

    onTermsAcceptChange = () => {
        this.setState({termsAccepted: !this.state.termsAccepted});
    };

    onTermsAndConditionsClick = e => {
        e.stopPropagation();
    };

    render() {
        const {terms, termsAccepted} = this.state;

        return (
            <BaseModal id={this.props.modalId} overlay={true}>
                <div className="grid-block vertical">
                    <div style={{marginBottom: "1rem", marginTop: "1rem"}}>
                        {terms ? (
                            <div>
                                <iframe
                                    src={terms.link}
                                    style={{
                                        width: "100%",
                                        height: 500,
                                        border: 0,
                                        marginBottom: "1rem"
                                    }}
                                />

                                <label
                                    htmlFor={"termsAccepted"}
                                    onClick={this.onTermsAcceptChange.bind(
                                        this
                                    )}
                                >
                                    <input
                                        id={"termsAccepted"}
                                        type="checkbox"
                                        checked={termsAccepted}
                                        style={{pointerEvents: "none"}}
                                    />
                                    <Translate
                                        content="cryptobridge.account.terms_and_conditions_accept"
                                        with={{
                                            cryptobridge_terms_and_conditions: (
                                                <a
                                                    href={terms.link}
                                                    target={"_blank"}
                                                    onClick={
                                                        this
                                                            .onTermsAndConditionsClick
                                                    }
                                                >
                                                    <Translate content="cryptobridge.account.terms_and_conditions" />
                                                </a>
                                            )
                                        }}
                                    />
                                </label>
                            </div>
                        ) : null}
                    </div>
                    <div className="button-group no-overflow">
                        <a
                            className={`button primary ${
                                !termsAccepted ? "disabled" : ""
                            }`}
                            onClick={this.onConfirm}
                        >
                            <Translate content="global.confirm" />
                        </a>
                        <Trigger close={this.props.modalId}>
                            <div className="button primary hollow">
                                <Translate content="account.perm.cancel" />
                            </div>
                        </Trigger>
                    </div>
                </div>
            </BaseModal>
        );
    }
}

TosModal.defaultProps = {
    modalId: "tos_modal"
};

TosModal.propTypes = {
    modalId: PropTypes.string.isRequired
};

export default connect(TosModal, {
    listenTo() {
        return [AccountStore, WalletUnlockStore, CryptoBridgeStore];
    },
    getProps() {
        return {
            currentAccount:
                AccountStore.getState().currentAccount ||
                AccountStore.getState().passwordAccount,
            locked: WalletUnlockStore.getState().locked,
            accounts: CryptoBridgeStore.getState().accounts
        };
    }
});
