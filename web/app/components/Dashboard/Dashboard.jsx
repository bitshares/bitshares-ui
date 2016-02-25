import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";
import AccountsList from "./AccountsList";
import RecentTransactions from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import Proposals from "components/Account/Proposals";
import ps from "perfect-scrollbar";

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
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.initialize(c);

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

    componentDidUpdate() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.update(c);
    }

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

        let outerClass = "grid-block page-layout no-overflow " + (width < 750 ? "vertical" : "horizontal");
        let firstDiv = "grid-block no-overflow " + (width < 750 ? "" : "shrink");

        return (
            <div ref="wrapper" className={outerClass}>
                <div className={firstDiv} style={{minWidth: "50%"}}>
                    <div ref="container" className="grid-content" style={{paddingLeft: "0.25rem", paddingRight: "0.25rem"}}>
                        <h4 style={{paddingLeft: "1rem"}}><Translate content="account.overview" /></h4>
                        <AccountsList accounts={Immutable.List(names)} width={width} />
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
                        {showIgnored ? <AccountsList compact accounts={Immutable.List(ignored)} width={width} /> : null}
                    </div>
                </div>
                <div className="grid-block right-column no-overflow">
                    <div className="grid-content no-overflow" style={{paddingLeft: "0.5rem", paddingRight: "0.25rem", paddingBottom: 0}}>
                        <RecentTransactions maxHeight={height ? height - 20 - 5 : null} accountsList={this.props.linkedAccounts} limit={25} compactView={true}/>
                    </div>
                </div>
            </div>);
    }
}

export default Dashboard;
