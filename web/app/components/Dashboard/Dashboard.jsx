import React from "react";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import { RecentTransactions } from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import MarketCard from "./MarketCard";
import utils from "common/utils";
import { Apis } from "bitsharesjs-ws";
var logo = require("assets/logo-ico-blue.png");
import LoadingIndicator from "../LoadingIndicator";

class Dashboard extends React.Component {

    constructor() {
        super();
        let marketsByChain = {
            "4018d784":[
                ["BTS", "CNY"],
                ["CNY", "OPEN.BTC"],
                ["CNY", "USD"],
                ["OPEN.BTC", "BTS", false],
                ["USD", "OPEN.BTC"],
                ["USD", "OPEN.USDT"],
                ["BTS", "USD"],
                ["BTS", "GOLD"],
                ["BTS", "BLOCKPAY"],
                ["OPEN.BTC", "BLOCKPAY", false],
                ["BTS", "OBITS"],
                ["KAPITAL", "OPEN.BTC", false],
                ["BTS", "SILVER"],
                ["OPEN.BTC", "OPEN.DGD", false],
                ["BTS", "BTWTY"],
                ["BTS", "OPEN.ETH"],
                ["BTS", "ICOO"],
                ["OPEN.BTC", "OPEN.STEEM"],
                ["OPEN.USDT", "OPEN.BTC", false],
                ["BTS", "OPEN.STEEM"],
                ["OPEN.BTC", "ICOO"],
                ["OPEN.BTC", "OPEN.MAID"],
                ["BTS", "OPEN.MAID"],
                ["BTS", "OPEN.HEAT"],
                ["BTS", "OPEN.INCENT"],
                ["OPEN.BTC", "OBITS", false],
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
            showIgnored: false,
            featuredMarkets: marketsByChain[chainID] || marketsByChain["4018d784"],
            newAssets: [

            ]
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextState.featuredMarkets, this.state.featuredMarkets) ||
            !utils.are_equal_shallow(nextProps.lowVolumeMarkets, this.props.lowVolumeMarkets) ||
            !utils.are_equal_shallow(nextState.newAssets, this.state.newAssets) ||
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextState.width !== this.state.width ||
            nextProps.accountsReady !== this.props.accountsReady ||
            nextState.showIgnored !== this.state.showIgnored
        );
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions, false);
    }

    _setDimensions() {
        let width = window.innerWidth;

        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    _onToggleIgnored() {
        this.setState({
            showIgnored: !this.state.showIgnored
        });
    }

    render() {
        let { linkedAccounts, myIgnoredAccounts, accountsReady } = this.props;
        let {width, showIgnored, featuredMarkets, newAssets} = this.state;
        let names = linkedAccounts.toArray().sort();
        let ignored = myIgnoredAccounts.toArray().sort();

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size;

        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        let validMarkets = 0;

        let markets = featuredMarkets
        .map(pair => {
            let isLowVolume = this.props.lowVolumeMarkets.get(pair[1] + "_" + pair[0]) || this.props.lowVolumeMarkets.get(pair[0] + "_" + pair[1]);
            if (!isLowVolume) validMarkets++;
            let className = "";
            if (validMarkets > 9) {
                className += ` show-for-${!accountCount ? "xlarge" : "large"}`;
            } else if (validMarkets > 6) {
                className += ` show-for-${!accountCount ? "large" : "medium"}`;
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
                    hide={validMarkets > 16}
                />
            );
        }).filter(a => !!a);

        if (!accountCount) {
            return (
                <div ref="wrapper" className="grid-block page-layout vertical">
                    <div ref="container" className="grid-block vertical medium-horizontal"  style={{padding: "25px 10px 0 10px"}}>
                        <div className="grid-block vertical small-12 medium-5">
                            <div className="Dashboard__intro-text">
                                <h4><img style={{position: "relative", top: -15, margin: 0}} src={logo}/><Translate content="account.intro_text_title" /></h4>

                                <Translate unsafe content="account.intro_text_1" component="p" />
                                <Translate unsafe content="account.intro_text_2" component="p" />
                                <Translate unsafe content="account.intro_text_3" component="p" />
                                <Translate unsafe content="account.intro_text_4" component="p" />

                                <div className="button create-account" onClick={() => {this.props.router.push("create-account");}}>
                                    <Translate content="header.create_account" />
                                </div>
                            </div>
                        </div>
                        <div className="grid-container small-12 medium-7" style={{paddingTop: 44}}>
                            <Translate content="exchange.featured" component="h4" style={{paddingLeft: 30}}/>
                            <div className="grid-block small-up-1 large-up-3 xlarge-up-4 no-overflow fm-outer-container">
                                {markets}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div ref="container" className="grid-container" style={{padding: "25px 10px 0 10px"}}>
                    <Translate content="exchange.featured" component="h4" />
                    <div className="grid-block small-up-1 medium-up-3 large-up-4 no-overflow fm-outer-container">
                        {markets}
                    </div>

                    {accountCount ? <div className="generic-bordered-box" style={{marginBottom: 5}}>
                        <div className="block-content-header" style={{marginBottom: 15}}>
                            <Translate content="account.accounts" />
                        </div>
                        <div className="box-content">
                            <DashboardList
                                accounts={Immutable.List(names)}
                                ignoredAccounts={Immutable.List(ignored)}
                                width={width}
                                onToggleIgnored={this._onToggleIgnored.bind(this)}
                                showIgnored={showIgnored}
                            />
                            {/* {showIgnored ? <DashboardList accounts={Immutable.List(ignored)} width={width} /> : null} */}
                        </div>
                    </div> : null}

                    {accountCount ? <RecentTransactions
                        style={{marginBottom: 20, marginTop: 20}}
                        accountsList={this.props.linkedAccounts}
                        limit={10}
                        compactView={false}
                        fullHeight={true}
                        showFilters={true}
                    /> : null}

                </div>
            </div>
        );
    }
}

export default Dashboard;
