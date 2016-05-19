import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import RecentTransactions from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import ps from "perfect-scrollbar";
import AssetName from "../Utility/AssetName";
import assetUtils from "common/asset_utils";
import MarketCard from "./MarketCard";

class Dashboard extends React.Component {


    constructor() {
        super();
        this.state = {
            width: null,
            height: null,
            showIgnored: false
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        // let c = ReactDOM.findDOMNode(this.refs.container);
        // ps.initialize(c);

        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextState.width !== this.state.width ||
            nextState.height !== this.state.height ||
            nextState.showIgnored !== this.state.showIgnored
        );
    }

    // componentDidUpdate() {
    //     let c = ReactDOM.findDOMNode(this.refs.container);
    //     ps.update(c);
    // }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions, false);
    }

    _setDimensions() {
        let width = window.innerWidth;
        let height = this.refs.wrapper.offsetHeight;

        if (width !== this.state.width || height !== this.state.height) {
            this.setState({width, height});
        }
    }

    _onToggleIgnored() {
        this.setState({
            showIgnored: !this.state.showIgnored
        });
    }

    render() {
        let {linkedAccounts, myIgnoredAccounts} = this.props;
        let {width, height, showIgnored} = this.state;

        let names = this.props.linkedAccounts.toArray().sort();
        let ignored = this.props.myIgnoredAccounts.toArray().sort();
        
        let featuredMarkets = [
            ["OPEN.ETH", "OPEN.DAO"],
            ["OPEN.BTC", "MKR"],
            ["OPEN.BTC", "OPEN.DGD"],
            ["OPEN.BTC", "OPEN.ETH"],
            ["OPEN.BTC", "OPEN.STEEM"],
            ["BTS", "BTSR"],
            ["BTS", "OBITS"],
            ["BTS", "USD"],
            ["BTS", "CNY"],
            ["BTC", "BTS"],
            ["BTS", "GOLD"],
            ["BTS", "SILVER"]
            // ["BTS", "EUR"]
        ];

        let newAssets = [
            "OPEN.DAO",
            "OPEN.STEEM",
            "MKR",
            "OPEN.DGD",
            "OPEN.ETH",
            "BTSR"
        ];

        let markets = featuredMarkets.map((pair, index) => {

            let className = "";
            if (index > 3) {
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
                />
            );
        })

        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div ref="container" className="grid-container" style={{paddingTop: 25}}>
                    <Translate content="exchange.featured" component="h4" />
                    <div className="grid-block small-up-1 medium-up-3 large-up-4 no-overflow">
                        {markets}
                    </div>

                    <div className="generic-bordered-box" style={{marginBottom: 5}}>
                        <div className="block-content-header" style={{marginBottom: 15}}>
                            <Translate content="account.accounts" />
                        </div>
                        <div className="box-content">
                            <DashboardList accounts={Immutable.List(names)} width={width} />
                            {myIgnoredAccounts.size ? 
                                <table className="table table-hover" style={{fontSize: "0.85rem"}}>
                                    <tbody>
                                        <tr>
                                            <td colSpan={width < 750 ? "3" : "4"} style={{textAlign: "right"}}>
                                                <div onClick={this._onToggleIgnored.bind(this)}className="button outline">
                                                    <Translate content={`account.${ showIgnored ? "hide_ignored" : "show_ignored" }`} />
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>                                
                                </table> : null}
                            {showIgnored ? <DashboardList compact accounts={Immutable.List(ignored)} width={width} /> : null}
                        </div>
                    </div>

                    <RecentTransactions
                        style={{marginBottom: 20, marginTop: 20}}
                        accountsList={this.props.linkedAccounts}
                        limit={10}
                        compactView={false}
                        fullHeight={true}
                        showFilters={true}
                    />

                </div>
            </div>);
    }
}

export default Dashboard;
