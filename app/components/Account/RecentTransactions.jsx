import React from "react";
import Translate from "react-translate-component";
import {saveAs} from "file-saver";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import {
    ChainTypes as grapheneChainTypes,
    FetchChain,
    ChainStore
} from "bitsharesjs";
import ps from "perfect-scrollbar";
import counterpart from "counterpart";
import cnames from "classnames";
import PropTypes from "prop-types";
import PaginatedList from "../Utility/PaginatedList";
const {operations} = grapheneChainTypes;
import report from "bitshares-report";
import LoadingIndicator from "../LoadingIndicator";
import {Tooltip, Select, Icon} from "bitshares-ui-style-guide";
const ops = Object.keys(operations);
import {Link} from "react-router-dom";
import FormattedAsset from "../Utility/FormattedAsset";
import BlockTime from "../Blockchain/BlockTime";
import OperationAnt from "../Blockchain/OperationAnt";
import SettingsStore from "stores/SettingsStore";
import {connect} from "alt-react";
const operation = new OperationAnt();

const Option = Select.Option;

function compareOps(b, a) {
    if (a.block_num === b.block_num) {
        return a.virtual_op - b.virtual_op;
    } else {
        return a.block_num - b.block_num;
    }
}

// function textContent(n) {
//     return n ? `"${n.textContent.replace(/[\s\t\r\n]/gi, " ")}"` : "";
// }

class RecentTransactions extends React.Component {
    static propTypes = {
        accountsList: ChainTypes.ChainAccountsList.isRequired,
        compactView: PropTypes.bool,
        limit: PropTypes.number,
        maxHeight: PropTypes.number,
        fullHeight: PropTypes.bool,
        showFilters: PropTypes.bool
    };

    static defaultProps = {
        limit: 25,
        maxHeight: 500,
        fullHeight: false,
        showFilters: false
    };

    constructor(props) {
        super();
        this.state = {
            limit: props.limit,
            fetchingAccountHistory: false,
            headerHeight: 85,
            filter: "all",
            accountHistoryError: false,
            rows: []
        };
        this.getDataSource = this.getDataSource.bind(this);
    }

    componentDidMount() {
        if (!this.props.fullHeight) {
            let t = this.refs.transactions;
            ps.initialize(t);

            this._setHeaderHeight();
        }
    }

    _setHeaderHeight() {
        let height = this.refs.header.offsetHeight;

        if (height !== this.state.headerHeight) {
            this.setState({
                headerHeight: height
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (
            !utils.are_equal_shallow(
                this.props.accountsList,
                nextProps.accountsList
            )
        )
            return true;
        if (this.props.maxHeight !== nextProps.maxHeight) return true;
        if (this.state.headerHeight !== nextState.headerHeight) return true;
        if (this.state.filter !== nextState.filter) return true;
        if (this.props.customFilter) {
            if (
                !utils.are_equal_shallow(
                    this.props.customFilter.fields,
                    nextProps.customFilter.fields
                ) ||
                !utils.are_equal_shallow(
                    this.props.customFilter.values,
                    nextProps.customFilter.values
                )
            ) {
                return true;
            }
        }

        if (this.props.maxHeight !== nextProps.maxHeight) return true;
        if (
            nextState.limit !== this.state.limit ||
            nextState.fetchingAccountHistory !==
                this.state.fetchingAccountHistory
        )
            return true;
        for (let key = 0; key < nextProps.accountsList.length; ++key) {
            let npa = nextProps.accountsList[key];
            let nsa = this.props.accountsList[key];
            if (npa && nsa && npa.get("history") !== nsa.get("history"))
                return true;
        }
        return false;
    }

    _onIncreaseLimit() {
        this.setState({
            limit: this.state.limit + 30
        });
    }

    _getHistory(accountsList, filterOp, customFilter) {
        let history = [];
        let seen_ops = new Set();
        for (let account of accountsList) {
            if (account) {
                let h = account.get("history");
                if (h)
                    history = history.concat(
                        h
                            .toJS()
                            .filter(
                                op =>
                                    !seen_ops.has(op.id) && seen_ops.add(op.id)
                            )
                    );
            }
        }
        if (filterOp) {
            history = history.filter(a => {
                return a.op[0] === operations[filterOp];
            });
        }

        if (customFilter) {
            history = history.filter(a => {
                let finalValue = customFilter.fields.reduce((final, filter) => {
                    switch (filter) {
                        case "asset_id":
                            return (
                                final &&
                                a.op[1]["amount"][filter] ===
                                    customFilter.values[filter]
                            );
                            break;
                        default:
                            return (
                                final &&
                                a.op[1][filter] === customFilter.values[filter]
                            );
                            break;
                    }
                }, true);
                return finalValue;
            });
        }
        return history;
    }

    _getAccountHistoryES(account_id, limit, start) {
        var esNode = "https://wrapper.elasticsearch.bitshares.ws";

        console.log(
            "query",
            esNode +
                "/get_account_history?account_id=" +
                account_id +
                "&from_=" +
                start +
                "&size=" +
                limit +
                "&sort_by=block_data.block_time&type=data&agg_field=operation_type"
        );
        return new Promise(function(resolve, reject) {
            fetch(
                esNode +
                    "/get_account_history?account_id=" +
                    account_id +
                    "&from_=" +
                    start +
                    "&size=" +
                    limit +
                    "&sort_by=block_data.block_time&type=data&agg_field=operation_type"
            )
                .then(res => res.json())
                .then(result => {
                    var ops = result.map(r => {
                        return {
                            id: r.account_history.operation_id,
                            op: {
                                type: r.operation_type,
                                data: r.operation_history.op_object
                            },
                            result: JSON.parse(
                                r.operation_history.operation_result
                            ),
                            block_num: r.block_data.block_num,
                            block_time: r.block_data.block_time + "Z"
                        };
                    });
                    resolve(ops);
                })
                .catch(err => {
                    console.warn("query failed", err);
                    resolve([]);
                });
        });
    }

    async _generateCSV() {
        if (__DEV__) {
            console.log("intializing fetching of ES data");
        }
        this.setState({fetchingAccountHistory: true});
        let start = 0,
            limit = 150;
        let account = this.props.accountsList[0].get("id");
        let accountName = (await FetchChain("getAccount", account)).get("name");
        let recordData = {};

        function pad(number, length) {
            let str = "" + number;
            while (str.length < length) {
                str = "0" + str;
            }
            return str;
        }

        while (true) {
            let res = await this._getAccountHistoryES(account, limit, start);
            if (!res.length) break;

            await report.resolveBlockTimes(res);

            /* Before parsing results we need to know the asset info (precision) */
            await report.resolveAssets(res);

            res.map(function(record) {
                const trx_id = record.id;
                // let timestamp = api.getBlock(record.block_num);
                const type = ops[record.op.type];
                const data = record.op.data;

                switch (type) {
                    case "vesting_balance_withdraw":
                        data.amount = data.amount_;
                        break;

                    case "transfer":
                        data.amount = data.amount_;
                        break;
                }
                switch (type) {
                    default:
                        recordData[trx_id] = {
                            timestamp: new Date(record.block_time),
                            type,
                            data
                        };
                }
            });

            start += res.length;
        }
        if (!Object.keys(recordData).length) {
            return this.setState({
                fetchingAccountHistory: false,
                accountHistoryError: true
            });
        }
        recordData = report.groupEntries(recordData);
        let parsedData = report.parseData(recordData, account, accountName);

        let formatDate = function(d) {
            return (
                ("0" + d.getDate()).slice(-2) +
                "." +
                ("0" + (d.getMonth() + 1)).slice(-2) +
                "." +
                d.getFullYear() +
                " " +
                ("0" + d.getHours()).slice(-2) +
                ":" +
                ("0" + d.getMinutes()).slice(-2) +
                ":" +
                ("0" + d.getSeconds()).slice(-2) +
                " GMT" +
                ((d.getTimezoneOffset() < 0 ? "+" : "-") + // Note the reversed sign!
                    pad(
                        parseInt(
                            Math.floor(Math.abs(d.getTimezoneOffset() / 60))
                        ),
                        2
                    ) +
                    pad(Math.abs(d.getTimezoneOffset() % 60), 2))
            );
        };

        let csvString = "";
        for (let line of parsedData) {
            if (line.length >= 11 && line[10] instanceof Date) {
                line[10] = formatDate(line[10]);
            }
            csvString += line.join(",") + "\n";
        }
        let blob = new Blob([csvString], {type: "text/csv;charset=utf-8"});
        let today = new Date();
        saveAs(
            blob,
            "bitshares-account-history-" +
                accountName +
                "-" +
                today.getFullYear() +
                "-" +
                ("0" + (today.getMonth() + 1)).slice(-2) +
                "-" +
                ("0" + today.getDate()).slice(-2) +
                "-" +
                ("0" + today.getHours()).slice(-2) +
                ("0" + today.getMinutes()).slice(-2) +
                ".csv"
        );
        this.setState({
            fetchingAccountHistory: false,
            accountHistoryError: null
        });
    }

    _onChangeFilter(value) {
        this.setState({
            filter: value
        });
    }

    getDataSource(o, current_account_id) {
        let fee = o.op[1].fee;
        let trxTypes = counterpart.translate("transaction.trxTypes");
        const info = operation.getColumn(
            o.op,
            current_account_id,
            o.block_num,
            o.result,
            this.props.marketDirections
        );
        fee.amount = parseInt(fee.amount, 10);
        const dynGlobalObject = ChainStore.getObject("2.1.0");
        let last_irreversible_block_num = dynGlobalObject.get(
            "last_irreversible_block_num"
        );
        let pending = null;
        if (o.block_num > last_irreversible_block_num) {
            pending = (
                <span>
                    (
                    <Translate
                        content="operation.pending"
                        blocks={o.block_num - last_irreversible_block_num}
                    />
                    )
                </span>
            );
        }
        return {
            key: o.id,
            id: o.id,
            type: (
                <Link
                    className="inline-block"
                    data-place="bottom"
                    data-tip={counterpart.translate("tooltip.show_block", {
                        block: utils.format_number(o.block_num, 0)
                    })}
                    to={`/block/${o.block_num}/${o.trx_in_block}`}
                >
                    <span className={cnames("label", info.color || "info")}>
                        {trxTypes[ops[o.op[0]]]}
                    </span>
                </Link>
            ),
            info: (
                <div>
                    <div>
                        <span>{info.column}</span>
                    </div>
                    <div style={{fontSize: 14, paddingTop: 5}}>
                        {pending ? <span> - {pending}</span> : null}
                    </div>
                </div>
            ),
            fee: <FormattedAsset amount={fee.amount} asset={fee.asset_id} />,
            time: <BlockTime block_number={o.block_num} fullDate={true} />
        };
    }

    render() {
        let {
            accountsList,
            compactView,
            filter,
            customFilter,
            style,
            maxHeight
        } = this.props;
        let {limit, headerHeight} = this.state;
        let current_account_id =
            accountsList.length === 1 && accountsList[0]
                ? accountsList[0].get("id")
                : null;
        let history = this._getHistory(
            accountsList,
            this.props.showFilters && this.state.filter !== "all"
                ? this.state.filter
                : filter,
            customFilter
        ).sort(compareOps);
        let historyCount = history.length;

        style = style ? style : {width: "100%", height: "100%"};

        let options = null;
        if (true || this.props.showFilters) {
            options = [
                "all",
                "transfer",
                "limit_order_create",
                "limit_order_cancel",
                "fill_order",
                "account_create",
                "account_update",
                "asset_create",
                "witness_withdraw_pay",
                "vesting_balance_withdraw"
            ].map(type => {
                return (
                    <Option value={type} key={type}>
                        {counterpart.translate("transaction.trxTypes." + type)}
                    </Option>
                );
            });
        }

        let hideFee = false;

        let display_history = history.length
            ? history.slice(0, limit).map(o => {
                  return this.getDataSource(o, current_account_id);
              })
            : [];
        let action = (
            <tr className="total-value" key="total_value">
                <td style={{textAlign: "center"}}>&nbsp;</td>
                <td />
                <td />
                <td />
                <td />
            </tr>
        );

        return (
            <div className="recent-transactions no-overflow" style={style}>
                <div className="generic-bordered-box">
                    {this.props.dashboard ? null : (
                        <div ref="header">
                            <div className="block-content-header">
                                <span>
                                    {this.props.title ? (
                                        this.props.title
                                    ) : (
                                        <Translate content="account.recent" />
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="header-selector">
                        <div className="filter inline-block">
                            {this.props.showFilters ? (
                                <Tooltip
                                    placement="bottom"
                                    title={counterpart.translate(
                                        "tooltip.filter_ops"
                                    )}
                                >
                                    <Select
                                        style={{
                                            width: "210px"
                                        }}
                                        value={this.state.filter}
                                        onChange={this._onChangeFilter.bind(
                                            this
                                        )}
                                    >
                                        {options}
                                    </Select>
                                </Tooltip>
                            ) : null}

                            {historyCount > 0 ? (
                                <Tooltip
                                    placement="bottom"
                                    title={counterpart.translate(
                                        "transaction.csv_tip"
                                    )}
                                >
                                    <Icon
                                        type="file-excel"
                                        theme="filled"
                                        style={{
                                            verticalAlign: "bottom",
                                            fontSize: "29px",
                                            marginLeft: "1rem",
                                            paddingBottom: "2px"
                                        }}
                                        onClick={this._generateCSV.bind(this)}
                                    />
                                </Tooltip>
                            ) : null}
                        </div>
                        {this.state.accountHistoryError && (
                            <div
                                className="has-error"
                                style={{paddingLeft: "0.75rem"}}
                            >
                                <Translate content="account.history_error" />
                            </div>
                        )}
                    </div>
                    <PaginatedList
                        withTransition
                        className={
                            "table table-striped " +
                            (compactView ? "compact" : "") +
                            (this.props.dashboard
                                ? " dashboard-table table-hover"
                                : "")
                        }
                        header={[
                            {
                                title: (
                                    <Translate content="account.transactions.id" />
                                ),
                                dataIndex: "id",
                                align: "left",
                                render: item => {
                                    return (
                                        <span style={{whiteSpace: "nowrap"}}>
                                            {item}
                                        </span>
                                    );
                                }
                            },
                            !compactView
                                ? {
                                      title: (
                                          <Translate content="account.transactions.type" />
                                      ),
                                      dataIndex: "type",
                                      align: "left"
                                  }
                                : {},
                            {
                                title: (
                                    <Translate content="account.transactions.info" />
                                ),
                                dataIndex: "info",
                                align: "left",
                                render: item => {
                                    return (
                                        <span
                                            style={{
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            {item}
                                        </span>
                                    );
                                }
                            },
                            !hideFee
                                ? {
                                      title: (
                                          <Translate content="account.transactions.fee" />
                                      ),
                                      dataIndex: "fee",
                                      align: "left",
                                      render: item => {
                                          return (
                                              <span
                                                  style={{
                                                      whiteSpace: "nowrap"
                                                  }}
                                              >
                                                  {item}
                                              </span>
                                          );
                                      }
                                  }
                                : {},
                            {
                                title: (
                                    <Translate
                                        style={{whiteSpace: "nowrap"}}
                                        content="account.transactions.time"
                                    />
                                ),
                                dataIndex: "time",
                                render: item => {
                                    return (
                                        <span style={{whiteSpace: "nowrap"}}>
                                            {item}
                                        </span>
                                    );
                                }
                            }
                        ]}
                        rows={display_history}
                        label="utility.total_x_operations"
                        extraRow={action}
                    />

                    {this.state.fetchingAccountHistory && <LoadingIndicator />}
                </div>
            </div>
        );
    }
}
RecentTransactions = BindToChainState(RecentTransactions);

RecentTransactions = connect(
    RecentTransactions,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                marketDirections: SettingsStore.getState().marketDirections
            };
        }
    }
);

class TransactionWrapper extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
        to: ChainTypes.ChainAccount.isRequired,
        fromAccount: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        asset: "1.3.0"
    };

    render() {
        return (
            <span className="wrapper">{this.props.children(this.props)}</span>
        );
    }
}
TransactionWrapper = BindToChainState(TransactionWrapper);

export {RecentTransactions, TransactionWrapper};
