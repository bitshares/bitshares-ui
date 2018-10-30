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
                title: "Some title",
                target: () => {},
                description: "Some longer but not too long text",
                icon: "dashboard" // see Icons app/compoentns/Icon/Icon
            },
            {
                title: "Off the book trade",
                target: () => {},
                description: "Trade directly with another user (swap assets)",
                icon: "dashboard"
            }
            // .... even more tiles in this list
        ];
        return (
            <div className="grid-block overflow-visible">
                {tiles.map(tile => {
                    return (
                        <div className="grid-block no-overflow wrap shrink">
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
