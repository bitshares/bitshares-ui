import React from "react";
import Explorer from "./Explorer";
import RealFeesContainer from "../Blockchain/FeesContainer"


class FeesContainer extends React.Component {

    render() {

        let content = <RealFeesContainer/>;

        return (<Explorer tab="fees" content={content}/>);

    }
}

export default FeesContainer;