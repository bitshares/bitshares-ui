import React, {Component} from "react";
import Showcase from "./Showcase";
import {connect} from "alt-react";
import {ChainStore} from "bitsharesjs";
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
                icon: "wallet" // see Icons app/compoentns/Icon/Icon
            },
            {
                title: "showcases.barter_transaction.title",
                target: () => {},
                description: "showcases.barter_transaction.description",
                icon: "barter"
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
                icon: "voting"
            },
            {
                title: "showcases.borrow.title",
                target: () => {},
                description: "showcases.borrow.description",
                icon: "borrow"
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
                                <Showcase
                                    target={tile.target}
                                    title={tile.title}
                                    description={tile.description}
                                    icon={tile.icon}
                                />
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
