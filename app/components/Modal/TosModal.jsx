import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import {getAuthKey} from "common/AccountUtils";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletUnlockStore from "stores/WalletUnlockStore";
import CryptoBridgeStore from "stores/CryptoBridgeStore";
import CryptoBridgeActions from "actions/CryptoBridgeActions";
import PropTypes from "prop-types";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs";
import sha256 from "js-sha256";
import LoadingIndicator from "../LoadingIndicator";
import notify from "actions/NotificationActions";

class TosModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            termsLatest: null,
            termsAccount: null,
            termsRequired: false,
            termsAccepted: false,
            termsAcceptedDisclaimer: false,
            us_citizen: null,
            us_citizenRequired: false,
            kyc: null,
            kycRequired: false,
            kycPending: false
        };

        CryptoBridgeActions.getLatestTerms();
    }

    componentWillReceiveProps(nextProps) {
        this.updateWithNextProps(nextProps);
    }

    updateWithNextProps(nextProps) {
        if (nextProps.terms !== this.state.termsLatest) {
            this.setState({
                termsLatest: nextProps.terms
            });
        }

        const currentAccount = ChainStore.getAccount(nextProps.currentAccount);

        if (nextProps.currentAccount && !currentAccount) {
            if (!this.updateWithNextPropsTimeout) {
                this.updateWithNextPropsTimeout = setTimeout(() => {
                    this.updateWithNextProps(nextProps);
                }, 1000);
            }

            return;
        }

        if (
            !this.isFetchingAccount &&
            !nextProps.locked &&
            nextProps.currentAccount &&
            currentAccount &&
            !nextProps.accounts.get(nextProps.currentAccount) &&
            getAuthKey(currentAccount)
        ) {
            this.isFetchingAccount = true;
            CryptoBridgeActions.getAccount(currentAccount).catch(err => {
                notify.addNotification({
                    message: err,
                    level: "error",
                    autoDismiss: 10
                });
            });
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
                (account.terms.status !== "complete" ||
                    (account.kyc.required === true &&
                        account.kyc.status !== "complete"))
            ) {
                this.setState({
                    termsAccount: account.terms,
                    termsRequired: account.terms.status !== "complete",
                    termsDisclaimerRequired: !account.terms.accepted,
                    us_citizen: null,
                    us_citizenRequired:
                        account.us_citizen !== true &&
                        account.us_citizen !== false,
                    kyc: account.kyc,
                    kycRequired:
                        account.kyc.required === true &&
                        account.kyc.status !== "complete",
                    kycPending:
                        account.kyc.required === true &&
                        account.kyc.status === "pending",
                    kycEnforced:
                        account.kyc.required === true &&
                        account.kyc.status !== "complete" &&
                        account.kyc.expired
                });

                if (
                    account.terms.status !== "complete" ||
                    (account.kyc.required === true &&
                        account.kyc.status !== "complete" &&
                        account.kyc.status !== "pending")
                ) {
                    ZfApi.publish(this.props.modalId, "open");
                }
            } else {
                ZfApi.publish(this.props.modalId, "close");
            }
        }
    }

    onKycStart = (link, e) => {
        e.preventDefault();
        window.open(link, "_blank");
    };

    onTosConfirm = () => {
        const {currentAccount} = this.props;
        const {
            termsAccount,
            termsLatest,
            termsRequired,
            termsAccepted,
            us_citizen,
            us_citizenRequired,
            termsDisclaimerRequired,
            termsAcceptedDisclaimer
        } = this.state;

        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock();
        } else if (
            currentAccount &&
            termsAccount &&
            termsLatest &&
            termsRequired &&
            termsAccepted &&
            (termsAcceptedDisclaimer || !termsDisclaimerRequired)
        ) {
            const account = ChainStore.getAccount(currentAccount);

            if (account) {
                CryptoBridgeActions.updateAccount(
                    account,
                    Object.assign(
                        {
                            terms_version: termsLatest.version,
                            terms_hash: sha256(termsLatest.payload),
                            waiver:
                                termsAcceptedDisclaimer ||
                                !termsDisclaimerRequired
                        },
                        us_citizenRequired ? {us_citizen} : {}
                    )
                )
                    .then(() => {
                        CryptoBridgeActions.getAccount(account);
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

    onTermsAcceptDisclaimerChange = () => {
        this.setState({
            termsAcceptedDisclaimer: !this.state.termsAcceptedDisclaimer
        });
    };

    onTermsAndConditionsClick = e => {
        e.stopPropagation();
    };

    onCitizenshipChange = value => {
        this.setState({
            us_citizen: value === true
        });
    };

    render() {
        const {
            termsAccount,
            termsLatest,
            termsRequired,
            termsAccepted,
            termsAcceptedDisclaimer,
            termsDisclaimerRequired,
            us_citizen,
            us_citizenRequired,
            kyc,
            kycRequired,
            kycPending,
            kycEnforced
        } = this.state;

        const kycDeadlineDateString =
            kyc && kyc.deadline
                ? new Date(kyc.deadline).toLocaleDateString()
                : null;

        return (
            <BaseModal id={this.props.modalId} overlay={true}>
                <div className="grid-block vertical">
                    <div style={{marginBottom: "1rem", marginTop: "1rem"}}>
                        {termsRequired ? (
                            <div>
                                <div
                                    style={{
                                        height: 500,
                                        overflowY: "scroll",
                                        position: "relative",
                                        marginBottom: "1rem",
                                        padding: "1rem",
                                        border: "1px solid #aaa"
                                    }}
                                >
                                    {termsLatest ? (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: termsLatest.payload
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                marginLeft: -10,
                                                marginTop: -10
                                            }}
                                        >
                                            <LoadingIndicator type={"circle"} />
                                        </div>
                                    )}
                                </div>

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
                                        onChange={() => {}}
                                        style={{pointerEvents: "none"}}
                                    />
                                    <Translate
                                        content="cryptobridge.account.terms_and_conditions_accept"
                                        with={{
                                            cryptobridge_terms_and_conditions: (
                                                <a
                                                    href={termsAccount.link}
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
                                {termsDisclaimerRequired ? (
                                    <label
                                        htmlFor={"termsAcceptedDisclaimer"}
                                        onClick={this.onTermsAcceptDisclaimerChange.bind(
                                            this
                                        )}
                                    >
                                        <input
                                            id={"termsAcceptedDisclaimer"}
                                            type="checkbox"
                                            checked={termsAcceptedDisclaimer}
                                            onChange={() => {}}
                                            style={{pointerEvents: "none"}}
                                        />
                                        <Translate content="cryptobridge.account.terms_and_conditions_accept_disclaimer" />
                                    </label>
                                ) : null}

                                {us_citizenRequired ? (
                                    <section style={{padding: "1rem 0"}}>
                                        <label className="left-label">
                                            <Translate
                                                content="cryptobridge.account.are_you_us_citizen"
                                                with={{
                                                    flagImg: (
                                                        <img
                                                            height={20}
                                                            width={20}
                                                            style={{
                                                                marginLeft: 5
                                                            }}
                                                            src={`${__BASE_URL__}language-dropdown/US.png`}
                                                        />
                                                    )
                                                }}
                                            />
                                        </label>
                                        <label
                                            htmlFor="us_citizen_yes"
                                            style={{
                                                display: "inline-block",
                                                marginRight: "1rem"
                                            }}
                                            onClick={this.onCitizenshipChange.bind(
                                                this,
                                                true
                                            )}
                                        >
                                            <input
                                                name="us_citizen"
                                                id="us_citizen_yes"
                                                type="radio"
                                                value="true"
                                                onChange={() => {}}
                                                checked={us_citizen === true}
                                                style={{pointerEvents: "none"}}
                                            />
                                            <Translate content="settings.yes" />
                                        </label>
                                        <label
                                            htmlFor="us_citizen_no"
                                            style={{display: "inline-block"}}
                                            onClick={this.onCitizenshipChange.bind(
                                                this,
                                                false
                                            )}
                                        >
                                            <input
                                                name="us_citizen"
                                                id="us_citizen_no"
                                                type="radio"
                                                value="false"
                                                onChange={() => {}}
                                                checked={us_citizen === false}
                                                style={{pointerEvents: "none"}}
                                            />
                                            <Translate content="settings.no" />
                                        </label>
                                    </section>
                                ) : null}
                            </div>
                        ) : kycRequired ? (
                            <div>
                                {kycPending ? (
                                    <Translate content="cryptobridge.account.kyc_info_pending" />
                                ) : kycEnforced ? (
                                    <Translate content="cryptobridge.account.kyc_info" />
                                ) : (
                                    <Translate
                                        content="cryptobridge.account.kyc_info_grace"
                                        with={{
                                            deadlineDate: kycDeadlineDateString
                                        }}
                                    />
                                )}
                            </div>
                        ) : null}
                    </div>
                    <div className="button-group no-overflow">
                        {termsRequired ? (
                            <a
                                className={`button primary ${
                                    !termsAccepted ||
                                    (!termsAcceptedDisclaimer &&
                                        termsDisclaimerRequired) ||
                                    (us_citizenRequired && us_citizen === null)
                                        ? "disabled"
                                        : ""
                                }`}
                                onClick={this.onTosConfirm}
                            >
                                <Translate content="global.confirm" />
                            </a>
                        ) : kycRequired ? (
                            <a
                                className="button primary"
                                onClick={this.onKycStart.bind(this, kyc.link)}
                            >
                                <Translate
                                    content={
                                        kycPending
                                            ? "cryptobridge.gateway.account_kyc_action_pending"
                                            : "cryptobridge.gateway.account_kyc_action_required"
                                    }
                                />
                            </a>
                        ) : null}
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
        const currentAccount =
            AccountStore.getState().currentAccount ||
            AccountStore.getState().passwordAccount;

        return {
            currentAccount,
            locked: WalletUnlockStore.getState().locked,
            accounts: CryptoBridgeStore.getState().accounts,
            terms: CryptoBridgeStore.getLatestTerms()
        };
    }
});
