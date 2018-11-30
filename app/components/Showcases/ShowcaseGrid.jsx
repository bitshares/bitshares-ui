import React, {Component} from "react";
import Showcase from "./Showcase";

export default class ShowcaseGrid extends Component {
    constructor() {
        super();
    }

    render() {
        let thiz = this;
        const tiles = [
            {
                title: "showcases.paper_wallet.title",
                target: () => {},
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
                    thiz.props.history.push(
                        "/account/" + "committee-account" + "/voting"
                    );
                },
                description: "showcases.voting.description",
                icon: "voting"
            },
            {
                title: "showcases.borrow.title",
                target: event => {
                    thiz.props.history.push("/borrow");
                },
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
