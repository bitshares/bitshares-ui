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
        this.state = {width: null};
        this._setWidth = this._setWidth.bind(this);
    }


    componentDidMount() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.initialize(c);
        let t = ReactDOM.findDOMNode(this.refs.transactions);
        ps.initialize(t);
    }

    componentDidUpdate() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.update(c);
        let t = ReactDOM.findDOMNode(this.refs.transactions);
        ps.update(t);        
    }

    componentDidMount() {
        this._setWidth();

        window.addEventListener("resize", this._setWidth, false);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setWidth, false);
    }

    _setWidth() {
        let width = window.innerWidth;
        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    render() {
        let {width} = this.state;
        let names = this.props.linkedAccounts.toArray().sort();

        let outerClass = "grid-block page-layout no-overflow " + (width < 750 ? "vertical" : "horizontal");
        let firstDiv = "grid-block no-overflow " + (width < 750 ? "" : "shrink");
        return (
            <div className={outerClass}>
                <div className={firstDiv} style={{minWidth: "50%"}}>
                    <div ref="container" className="grid-content" style={{paddingLeft: "0.25rem", paddingRight: "0.25rem"}}>
                        <h4 style={{paddingLeft: "1rem"}}><Translate content="account.overview" /></h4>
                        <AccountsList accounts={Immutable.List(names)} width={width} />
                    </div>
                </div>
                <div className="grid-block right-column no-overflow">
                    <div ref="transactions" className="grid-content" style={{paddingLeft: "0.5rem", paddingRight: "0.25rem"}}>
                        <RecentTransactions accountsList={this.props.linkedAccounts} limit={25} compactView={true}/>
                    </div>
                </div>
            </div>);
    }
}

export default Dashboard;
