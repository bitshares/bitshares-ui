import React from "react";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import { RecentTransactions } from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import MarketCard from "./MarketCard";
import utils from "common/utils";
// import { Apis } from "bitsharesjs-ws";
var logo = require("assets/logo-ico-blue.png");

class Dashboard extends React.Component {

    constructor() {
        super();
        this.state = {
            width: null,
            showIgnored: false,
            featuredMarkets: [
                ["BTS", "CNY"],
                ["OPEN.BTC", "BTS", false],
                ["OPEN.BTC", "OPEN.STEEM"],
                ["BTS", "ICOO"],
                ["BTS", "BLOCKPAY"],
                ["BTS", "OBITS"],
                ["BTS", "USD"],
                ["BTS", "GOLD"],
                ["BTS", "SILVER"],
                ["USD", "OPEN.BTC"],
                ["OPEN.BTC", "OPEN.DGD", false],
                ["BTS", "BTWTY"],
                ["USD", "OPEN.USDT"],
                ["OPEN.BTC", "OPEN.INCNT"],
                [ "BTS", "OPEN.ETH"],
                ["CNY", "USD"]
                // ["BTS", "SILVER"]
                // ["BTS", "EUR"]
            ],
            newAssets: [

            ]
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    // componentWillMount() {
    //     fetch(__UI_API__ + `/markets/${Apis.instance().chain_id.substr(0, 10)}`).then( (reply) => {
    //         if (reply.ok) {
    //             return reply.json().then(({markets, newAssets}) => {
    //                 console.log("markets:", markets, newAssets);
    //                 this.setState({
    //                     featuredMarkets: markets.length ? markets: this.state.featuredMarkets,
    //                     newAssets: newAssets.length ? newAssets : this.state.newAssets
    //                 });
    //             });
    //         }
    //     }).catch(err => {
    //         console.log("Markets API not available:", err);
    //     });
    // }

    componentDidMount() {
        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextState.featuredMarkets, this.state.featuredMarkets) ||
            !utils.are_equal_shallow(nextState.newAssets, this.state.newAssets) ||
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextState.width !== this.state.width ||
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
        let {linkedAccounts, myIgnoredAccounts} = this.props;
        let {width, showIgnored, featuredMarkets, newAssets} = this.state;

        let names = linkedAccounts.toArray().sort();
        let ignored = myIgnoredAccounts.toArray().sort();

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size;

        let markets = featuredMarkets.map((pair, index) => {

            let className = "";
            if (index > 5) {
                className += "show-for-medium";
            }
            if (index > 8) {
                className += " show-for-large";
            }

            return (
                <MarketCard
                    key={pair[0] + "_" + pair[1]}
                    new={newAssets.indexOf(pair[1]) !== -1}
                    className={className}
                    quote={pair[0]}
                    base={pair[1]}
                    invert={pair[2]}
                />
            );
        });

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
                                <Translate content="account.intro_text_4" component="p" />

                                <div className="button create-account" onClick={() => {this.props.router.push("create-account");}}>
                                    <Translate content="header.create_account" />
                                </div>
                            </div>
                        </div>
                        <div className="grid-container small-12 medium-7" style={{paddingTop: 44}}>
                            <Translate content="exchange.featured" component="h4" style={{paddingLeft: 30}}/>
                            <div className="grid-block small-up-2 medium-up-3 large-up-4 no-overflow">
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
                    <div className="grid-block small-up-2 medium-up-3 large-up-4 no-overflow">
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
