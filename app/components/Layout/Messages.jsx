import React from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {connect} from "alt-react";
import AccountStore from "../../stores/AccountStore";
import CryptoBridgeStore from "../../stores/CryptoBridgeStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

const logo = require("assets/logo-cryptobridge.png");

class Messages extends React.Component {
    hideImportantMessage(id, e) {
        e.preventDefault();
        SettingsActions.hideImportantMessage(id);
    }

    onKycCheck = e => {
        e.preventDefault();
        ZfApi.publish("tos_modal", "open");
    };

    componentDidUpdate(prevProps) {
        if (
            JSON.stringify(prevProps.rewards) !==
            JSON.stringify(this.props.rewards)
        ) {
            this.forceUpdate();
        }
    }

    render() {
        const {
            hiddenImportantMessages,
            requiresTos,
            requiresKyc,
            kycIsPending,
            rewards,
            currentAccount
        } = this.props;

        const hasUserIdentificationProcessInfo =
            Date.now() < new Date("2019-03-07").getTime() &&
            (!hiddenImportantMessages ||
                !hiddenImportantMessages.includes(
                    "user_identification_process"
                ));

        const hasTradingCompetitionInfo =
            Date.now() < new Date("2019-12-31").getTime() &&
            (!hiddenImportantMessages ||
                !hiddenImportantMessages.includes("trading_competition_info"));

        if (
            !hasTradingCompetitionInfo &&
            !hasUserIdentificationProcessInfo &&
            !requiresTos &&
            !requiresKyc &&
            !rewards
        ) {
            return <div />;
        }

        return (
            <ul className="messages">
                {rewards && rewards.length ? (
                    <li className="notice">
                        <Translate content="cryptobridge.competition.message.title" />{" "}
                        <Link
                            to={`/account/${currentAccount}/overview/bridgecoin-staking`}
                        >
                            <Translate content="cryptobridge.competition.message.action" />
                        </Link>
                    </li>
                ) : null}
                {hasTradingCompetitionInfo ? (
                    <li className="notice">
                        <div
                            className="dismiss"
                            onClick={this.hideImportantMessage.bind(
                                this,
                                "trading_competition_info"
                            )}
                        >
                            &times;
                        </div>
                        <img
                            src={logo}
                            style={{maxWidth: 30, marginRight: "1rem"}}
                        />
                        <span>
                            Win $800 every day in our trading competition!
                        </span>
                        <button
                            className={"button small primary"}
                            style={{marginLeft: "1rem"}}
                            onClick={() => {
                                window.open(
                                    "https://crypto-bridge.org/trading-competition/"
                                );
                            }}
                        >
                            Learn more
                        </button>
                    </li>
                ) : null}
                {hasUserIdentificationProcessInfo ? (
                    <li className="notice">
                        <div
                            className="dismiss"
                            onClick={this.hideImportantMessage.bind(
                                this,
                                "user_identification_process"
                            )}
                        >
                            &times;
                        </div>
                        <strong>
                            <Translate content="cryptobridge.important.title" />
                            {": "}
                        </strong>
                        <Translate
                            content="cryptobridge.important.user_verification"
                            unsafe
                        />
                    </li>
                ) : null}
                {requiresTos || requiresKyc ? (
                    <li className="important">
                        {requiresTos ? (
                            <span>
                                <Translate
                                    content={
                                        "cryptobridge.gateway.account_tos_action_required_label"
                                    }
                                />
                                {". "}
                                <a
                                    href="#"
                                    onClick={() => {
                                        ZfApi.publish("tos_modal", "open");
                                    }}
                                >
                                    <Translate
                                        content={
                                            "cryptobridge.gateway.account_tos_action_required"
                                        }
                                    />
                                </a>
                                {". "}
                            </span>
                        ) : null}
                        {!requiresTos && requiresKyc ? (
                            <span>
                                <Translate
                                    content={
                                        "cryptobridge.gateway.account_kyc_action_required_label"
                                    }
                                />
                                {". "}
                                {kycIsPending ? (
                                    <a
                                        href="#"
                                        onClick={this.onKycCheck.bind(this)}
                                    >
                                        <Translate
                                            content={
                                                "cryptobridge.gateway.account_kyc_action_pending"
                                            }
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href="#"
                                        onClick={() => {
                                            ZfApi.publish("tos_modal", "open");
                                        }}
                                    >
                                        <Translate
                                            content={
                                                "cryptobridge.gateway.account_kyc_action_required"
                                            }
                                        />
                                    </a>
                                )}
                                {". "}
                            </span>
                        ) : null}
                    </li>
                ) : null}
            </ul>
        );
    }
}

export default connect(Messages, {
    listenTo() {
        return [SettingsStore, CryptoBridgeStore, AccountStore];
    },
    getProps() {
        const {hiddenImportantMessages} = SettingsStore.getState();

        const currentAccount =
            AccountStore.getState().currentAccount ||
            AccountStore.getState().passwordAccount;

        const account = CryptoBridgeStore.getState().accounts.get(
            currentAccount,
            null
        );

        return {
            hiddenImportantMessages,
            currentAccount,
            requiresTos:
                account !== null &&
                CryptoBridgeStore.getAccountRequiresTosAction(currentAccount),
            requiresKyc:
                account !== null &&
                CryptoBridgeStore.getAccountRequiresKycAction(currentAccount),
            kycIsPending:
                account !== null &&
                CryptoBridgeStore.getAccountKycIsPending(currentAccount),
            rewards: CryptoBridgeStore.getRewards(currentAccount)
        };
    }
});
