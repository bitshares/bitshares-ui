import React from "react";
import ReactDOMServer from "react-dom/server";
import {IntlProvider} from "react-intl";
import intlData from "../Utility/intlData";
import Translate from "react-translate-component";
import {saveAs} from "common/filesaver.js";
import Operation from "../Blockchain/Operation";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import {chain_types} from "@graphene/chain";
let {operations} = chain_types;

function compareOps(b, a) {
    if (a.block_num < b.block_num) return -1;
    if (a.block_num === b.block_num) {
        if (a.trx_in_block < b.trx_in_block) return -1;
        if (a.trx_in_block === b.trx_in_block) {
            if (a.op_in_trx < b.op_in_trx) return -1;
            if (a.op_in_trx === b.op_in_trx) return 0;
        }
    }
    return 1;
}

function textContent(n) {
    return n ? `"${n.textContent.replace(/[\s\t\r\n]/gi, " ")}"` : "";
}

@BindToChainState({keep_updating: true})
class RecentTransactions extends React.Component {

    static propTypes = {
        accountsList: ChainTypes.ChainAccountsList.isRequired,
        compactView: React.PropTypes.bool,
        limit: React.PropTypes.number
    };

    constructor(props) {
        super();
        this.state = {
            limit: props.limit ? Math.max(20, props.limit) : 20,
            csvExport: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(!utils.are_equal_shallow(this.props.accountsList, nextProps.accountsList)) return true;
        if (nextState.limit !== this.state.limit || nextState.csvExport !== this.state.csvExport) return true;
        for(let key = 0; key < nextProps.accountsList.length; ++key) {
            let npa = nextProps.accountsList[key];
            let nsa = this.props.accountsList[key];
            if(npa && nsa && (npa.get("history") !== nsa.get("history"))) return true;
        }
        return false;
    }

    componentDidUpdate() {
        if (this.state.csvExport) {
            this.state.csvExport = false;
            const csv_export_container = document.getElementById("csv_export_container");
            const nodes = csv_export_container.childNodes;
            let csv = "";
            for (const n of nodes) {
                //console.log("-- RecentTransactions._downloadCSV -->", n);
                const cn = n.childNodes;
                if (csv !== "") csv += "\n";
                csv += [textContent(cn[0]), textContent(cn[1]), textContent(cn[2]), textContent(cn[3])].join(",");
            }
            var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            var today = new Date();
            saveAs(blob, "btshist-" + today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + ".csv");
        }
    }

    _onIncreaseLimit() {
        this.setState({
            limit: this.state.limit + 30
        });
    }

    _getHistory(accountsList, filter) {
        let history = [];
        let seen_ops = new Set();
        for (let account of accountsList) {
            if(account) {
                let h = account.get("history");
                if (h) history = history.concat(h.toJS().filter(op => !seen_ops.has(op.id) && seen_ops.add(op.id)));
            }
        }
        if (filter) {
            history = history.filter(a => {
                return a.op[0] === operations[filter];
            });
        }
        return history;
    }

    _downloadCSV() {
        this.setState({csvExport: true});
    }

    render() {
        let {accountsList, compactView, filter} = this.props;
        let {limit} = this.state;
        let current_account_id = accountsList.length === 1 && accountsList[0] ? accountsList[0].get("id") : null;
        let history = this._getHistory(accountsList, filter).sort(compareOps);
        let historyCount = history.length;

        const display_history = history.length ?
            history.slice(0, limit)
            .map(o => {
                return (
                    <Operation
                        key={o.id}
                        op={o.op}
                        result={o.result}
                        block={o.block_num}
                        current={current_account_id}
                        hideFee
                        inverted={false}
                        hideOpLabel={compactView}
                    />
                );
            }) : <tr><td colSpan={compactView ? "2" : "3"}><Translate content="operation.no_recent" /></td></tr>;

        return (
            <div className="recent-transactions" style={this.props.style}>
                {historyCount > 0 &&
                    <button
                        className="button outline float-right"
                        onClick={this._downloadCSV.bind(this)}
                        style={{marginTop: "0.5rem"}}
                        data-tip="Download as CSV"
                        data-place="left"
                        data-type="light"
                    >
                        <span>CSV</span>
                    </button>}
                <h3><Translate content="account.recent" /></h3>
                <table className={"table" + (compactView ? " compact" : "")}>
                    <thead>
                    <tr>
                        {compactView ? null : <th><Translate content="explorer.block.op" /></th>}
                        <th><Translate content="account.votes.info" /></th>
                    </tr>
                    </thead>
                    <tbody>
                        {display_history}
                    </tbody>
                </table>
                {this.props.showMore && historyCount > 20 && limit < historyCount ? (
                    <div className="account-info more-button">
                        <button className="button outline" onClick={this._onIncreaseLimit.bind(this)}>
                            <Translate content="account.more" />
                        </button>
                    </div>
                    ) : null}
                {
                    historyCount > 0 && this.state.csvExport &&
                    <div id="csv_export_container" style={{display: "none"}}>
                        <div>
                            <div>DATE</div>
                            <div>OPERATION</div>
                            <div>MEMO</div>
                            <div>AMOUNT</div>
                        </div>
                        {
                            history.map(o => {
                                return (
                                    <Operation
                                        key={o.id}
                                        op={o.op}
                                        result={o.result}
                                        block={o.block_num}
                                        inverted={false}
                                        csvExportMode
                                    />
                                );
                            })
                        }
                    </div>
                }
            </div>
        );
    }
}

export default RecentTransactions;
