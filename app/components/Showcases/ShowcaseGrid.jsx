import React, {Component} from "react";
import PropTypes from "prop-types";
import Showcase from "./Showcase";

export default class ShowcaseGrid extends Component {
    constructor() {
        super();
    }

    render() {
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
