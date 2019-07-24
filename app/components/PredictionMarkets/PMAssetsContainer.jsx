import React from "react";
import AssetStore from "stores/AssetStore";
import MarketsStore from "stores/MarketsStore";
import AltContainer from "alt-container";
import PredictionMarkets from "./PredictionMarkets";

class PMAssetsContainer extends React.Component {
    render() {
        return <PredictionMarkets />;
    }
}

export default PMAssetsContainer;
