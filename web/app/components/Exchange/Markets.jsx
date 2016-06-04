import React from "react";
import MarketCard from "./MarketCard";
import MarketRow from "./MarketRow";
import MyMarkets from "./MyMarkets";
import Translate from "react-translate-component";
import {Link} from "react-router";
import SettingsActions from "actions/SettingsActions";
import MarketsActions from "actions/MarketsActions";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import debounce from "lodash.debounce";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LoadingIndicator from "../LoadingIndicator";

class Markets extends React.Component {

    constructor() {
        super();
        this.state = {
            height: null
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentWillMount() {
        window.addEventListener("resize", this._setDimensions, false);
    }

    componentDidMount() {
        this._setDimensions();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions, false);
    }

    _setDimensions() {
        let height = this.refs.wrapper.offsetHeight;

        console.log("wrapper height:", this.refs.wrapper.offsetHeight);

        if (height !== this.state.height) {
            this.setState({height});
        }
    }

    render() {
        let {starredMarkets} = this.props;
        let assets = [];

        return (
            <div
                ref="wrapper"
                className="grid-block page-layout no-overflow">
                <MyMarkets
                    style={{width: "100%", padding: 20}}
                    listHeight={this.state.height ? this.state.height - 82 : null}
                    className="no-overflow"
                    headerStyle={{paddingTop: 0, borderTop: "none"}}
                    columns={
                        [
                            {name: "star", index: 1},
                            {name: "market", index: 2},
                            {name: "quoteSupply", index: 3},
                            {name: "vol", index: 4},
                            {name: "price", index: 5},
                            {name: "change", index: 6}
                        ]
                    }
                />
            </div>
        );
    }
}

export default Markets;
