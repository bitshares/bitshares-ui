import React, {Component} from "react";
import Showcase from "./Showcase";
import {connect} from "alt-react";
import {ChainStore} from "tuscjs";
import AccountStore from "../../stores/AccountStore";
import {createPaperWalletAsPDF} from "common/paperWallet";

class ShowcaseGrid extends Component {
    constructor() {
        super();
        this.state = {currentAccount: null};
    }

    componentWillMount() {
        this.setState({
            currentAccount: ChainStore.getAccount(this.props.currentAccount)
        });
    }

    componentWillReceiveProps(np) {
        if (np.currentAccount !== this.props.currentAccount) {
            this.setState({
                currentAccount: ChainStore.getAccount(np.currentAccount)
            });
        }
    }

    render() {
        let hasAccount = this.state.currentAccount !== null;

        let thiz = this;
        const tiles = [
            {
                title: "showcases.paper_wallet.title",
                target: () => {
                    if (hasAccount) {
                        createPaperWalletAsPDF(this.state.currentAccount);
                    }
                },
                description: "showcases.paper_wallet.description",
                icon: "wallet", // see Icons app/compoentns/Icon/Icon
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.voting.title",
                target: event => {
                    if (hasAccount) {
                        thiz.props.history.push(
                            "/account/" +
                                this.state.currentAccount.get("name") +
                                "/voting"
                        );
                    }
                },
                description: "showcases.voting.description",
                icon: "voting",
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.barter.title",
                target: event => {
                    thiz.props.history.push("/barter");
                },
                description: "showcases.barter.description",
                icon: "barter",
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.borrow.title",
                target: () => {
                    if (hasAccount) {
                        thiz.props.history.push("/borrow");
                    }
                },
                description: "showcases.borrow.description",
                icon: "borrow",
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.direct_debit.title",
                target: event => {
                    thiz.props.history.push("/direct-debit");
                },
                description: "showcases.direct_debit.description",
                icon: "direct_debit",
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.htlc.title",
                target: event => {
                    thiz.props.history.push("/htlc");
                },
                description: "showcases.htlc.description",
                icon: "htlc",
                disabled: hasAccount
                    ? false
                    : "Please login to use this functionality"
            },
            {
                title: "showcases.prediction_market.title",
                target: event => {
                    thiz.props.history.push("/prediction");
                },
                description: "showcases.prediction_market.description",
                icon: "prediction",
                disabled: "Visit bitshares-ui issue #2717 to check progress",
                comingSoon: true
            },
            {
                title: "showcases.timed_transfer.title",
                target: () => {},
                description: "showcases.timed_transfer.description",
                icon: "alarm",
                disabled: true,
                comingSoon: true
            }
            // .... even more tiles in this list
        ];
        return (
            <div
                className="overflow-visible showcases-grid"
                style={{
                    align: "center"
                }}
            >
                <div className="showcases-grid--wrapper">
                    {tiles.map(tile => {
                        return (
                            <div
                                key={tile.title}
                                className="showcases-grid--wrapper--item"
                            >
                                {!!tile.disabled ? (
                                    <Showcase
                                        target={tile.target}
                                        title={tile.title}
                                        description={tile.description}
                                        icon={tile.icon}
                                        disabled={tile.disabled}
                                        comingSoon={tile.comingSoon || false}
                                    />
                                ) : (
                                    <Showcase
                                        target={tile.target}
                                        title={tile.title}
                                        description={tile.description}
                                        icon={tile.icon}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

ShowcaseGrid = connect(
    ShowcaseGrid,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount:
                    AccountStore.getState().currentAccount ||
                    AccountStore.getState().passwordAccount
            };
        }
    }
);

export default ShowcaseGrid;
