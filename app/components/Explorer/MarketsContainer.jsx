import React from "react";
import Explorer from "./Explorer";
import RealMarketsContainer from "../Exchange/MarketsContainer"


class MarketsContainer extends React.Component {

    render() {

        let content = <RealMarketsContainer/>;

        return (<Explorer tab="markets" content={content}/>);

    }
}

export default MarketsContainer;