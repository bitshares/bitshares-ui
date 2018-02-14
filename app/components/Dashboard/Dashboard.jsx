import React from "react";
import Translate from "react-translate-component";
import MarketCard from "./MarketCard";
import utils from "common/utils";
import { Apis } from "bitsharesjs-ws";
import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import { connect } from "alt-react";

class Dashboard extends React.Component {

    constructor(props) {
        super();
        let marketsByChain = {
            "4018d784":[
                ["USD", "BTS"],
                ["USD", "OPEN.BTC"],
                ["USD", "OPEN.USDT"],
                ["USD", "OPEN.ETH"],
                ["USD", "OPEN.DASH"],
                ["USD", "GOLD"],
                ["USD", "HERO"],
                ["USD", "GDEX.BTC"],
                ["USD", "GDEX.ETH"],
                ["USD", "GDEX.EOS"],
                ["USD", "GDEX.BTO"],
                ["CNY", "BTS"],
                ["CNY", "OPEN.BTC"],
                ["CNY", "USD"],
                ["CNY", "OPEN.ETH"],
                ["CNY", "YOYOW"],
                ["CNY", "OCT"],
		        ["CNY", "GDEX.BTC"],
                ["CNY", "GDEX.ETH"],
                ["CNY", "GDEX.EOS"],
                ["CNY", "GDEX.BTO"],
                ["CNY", "GDEX.BTM"],
                ["OPEN.BTC", "BTS"],
                ["OPEN.BTC", "OPEN.ETH"],
                ["OPEN.BTC", "OPEN.DASH"],
                ["OPEN.BTC", "BLOCKPAY"],
                ["OPEN.BTC", "OPEN.DGD"],
                ["OPEN.BTC", "OPEN.STEEM"],
                ["BTS", "OPEN.ETH"],
                ["BTS", "OPEN.EOS"],
                ["BTS", "PPY"],
                ["BTS", "OPEN.STEEM"],
                ["BTS", "OBITS"],
                ["BTS", "RUBLE"],
                ["BTS", "HERO"],
                ["BTS", "OCT"],
                ["BTS", "SILVER"],
                ["BTS", "GOLD"],
                ["BTS", "BLOCKPAY"],
                ["BTS", "BTWTY"],
                ["BTS", "SMOKE"],
		        ["BTS", "GDEX.BTC"],
                ["BTS", "GDEX.ETH"],
                ["BTS", "GDEX.EOS"],
                ["BTS", "GDEX.BTO"],
                ["KAPITAL", "OPEN.BTC"],
                ["USD", "OPEN.STEEM"],
                ["USD", "OPEN.MAID"],
                ["OPEN.USDT", "OPEN.BTC"],
                ["OPEN.BTC", "OPEN.MAID"],
                ["BTS", "OPEN.MAID"],
                ["BTS", "OPEN.HEAT"],
                ["BTS", "OPEN.INCENT"],
                ["HEMPSWEET", "OPEN.BTC"],
                ["KAPITAL", "BTS"]
            ],
            "39f5e2ed": [
                ["TEST", "PEG.FAKEUSD"],
                ["TEST", "BTWTY"]
            ]
        };
        let chainID = Apis.instance().chain_id;
        if (chainID) chainID = chainID.substr(0, 8);

        this.state = {
            width: null,
            featuredMarkets: marketsByChain[chainID] || marketsByChain["4018d784"],
            newAssets: [

            ]
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, {capture: false, passive: true});
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextState.featuredMarkets, this.state.featuredMarkets) ||
            !utils.are_equal_shallow(nextProps.lowVolumeMarkets, this.props.lowVolumeMarkets) ||
            !utils.are_equal_shallow(nextState.newAssets, this.state.newAssets) ||
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.passwordAccount !== this.props.passwordAccount ||
            nextState.width !== this.state.width ||
            nextProps.accountsReady !== this.props.accountsReady
        );
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions);
    }

    _setDimensions() {
        let width = window.innerWidth;

        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    render() {
        let { linkedAccounts, myIgnoredAccounts, accountsReady, passwordAccount } = this.props;
        let { featuredMarkets, newAssets} = this.state;

        if (passwordAccount && !linkedAccounts.has(passwordAccount)) {
            linkedAccounts = linkedAccounts.add(passwordAccount);
        }
        let names = linkedAccounts.toArray().sort();
        if (passwordAccount && names.indexOf(passwordAccount) === -1) names.push(passwordAccount);

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size + (passwordAccount ? 1 : 0);

        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        let validMarkets = 0;

        let markets = featuredMarkets
        .map(pair => {
            let isLowVolume = this.props.lowVolumeMarkets.get(pair[1] + "_" + pair[0]) || this.props.lowVolumeMarkets.get(pair[0] + "_" + pair[1]);
            if (!isLowVolume) validMarkets++;
            let className = "";
            if (validMarkets > 24) {
                return null;
            } else if (validMarkets > 15) {
                className += " show-for-large";
            } else if (validMarkets > 6) {
                className += " show-for-medium";
            }

            return (
                <MarketCard
                    key={pair[0] + "_" + pair[1]}
                    marketId={pair[1] + "_" + pair[0]}
                    new={newAssets.indexOf(pair[1]) !== -1}
                    className={className}
                    quote={pair[0]}
                    base={pair[1]}
                    invert={pair[2]}
                    isLowVolume={isLowVolume}
                />
            );
        }).filter(a => !!a);

        if (!accountCount) {
            return <LoginSelector />;
        }

        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div ref="container" className="grid-container" style={{padding: "2rem 8px"}}>
                    {this.props.onlyAccounts ? null : <div className="block-content-header" style={{marginBottom: 15, paddingTop: 0}}>
                        <Translate content="exchange.featured"/>
                    </div>}
                    {this.props.onlyAccounts ? null : <div className="grid-block small-up-1 medium-up-3 large-up-4 no-overflow fm-outer-container">
                        {markets}
                    </div>}
                </div>
            </div>
        );
    }
}

let DashboardWrapper = (props) => {
    return <Dashboard {...props} />;
};

export default DashboardWrapper = connect(DashboardWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
