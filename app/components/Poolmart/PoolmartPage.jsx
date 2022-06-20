import React from "react";
import LiquidityPools from "./LiquidityPools";

class PoolmartPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {
        return (
            <div className="grid-content">
                <div className="grid-wrapper padding">
                    <LiquidityPools />
                </div>
            </div>
        );
    }
}

export default PoolmartPage;
