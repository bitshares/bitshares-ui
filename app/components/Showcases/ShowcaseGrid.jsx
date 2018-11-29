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
            }
            // .... even more tiles in this list
        ];
        return (
            <div
                className="grid-block overflow-visible"
                style={{
                    align: "center"
                }}
            >
                {tiles.map(tile => {
                    return (
                        <div key={tile.title} className="">
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
        );
    }
}
