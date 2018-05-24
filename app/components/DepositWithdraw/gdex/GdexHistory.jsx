import React from "react";
import Translate from "react-translate-component";
import utils from "common/utils";
import Icon from "../../Icon/Icon";
import {getTransactionRecordList} from "../../../lib/common/gdexMethods";
import PropTypes from "prop-types";

const DEPOSIT_STATUS = {
    1: "confirming",
    2: "waiting",
    3: "transfering",
    4: "success",
    5: "fail"
};
const WITHDRAW_STATUS = {
    1: "confirming",
    2: "auditing",
    3: "audited",
    4: "refused",
    5: "transfering",
    6: "success",
    7: "fail"
};

class GdexHistory extends React.Component {
    static propTypes = {
        compactView: PropTypes.bool,
        maxHeight: PropTypes.number,
        fullHeight: PropTypes.bool,
        userId: PropTypes.number,
        assetId: PropTypes.number,
        assetName: PropTypes.string,
        recordType: PropTypes.number,
        userAccount: PropTypes.string
    };

    static defaultProps = {
        maxHeight: 500,
        fullHeight: false,
        pageSize: 10
    };

    constructor(props) {
        super();
        this.state = {
            headerHeight: 85,
            pageNum: 0,
            totalNum: 0,
            nextPageEnabled: false,
            allData: {},
            historyStatusType:
                props.recordType == 1
                    ? "deposit_history_status"
                    : "withdraw_history_status",
            historyStatusValue:
                props.recordType == 1 ? DEPOSIT_STATUS : WITHDRAW_STATUS
        };
    }

    componentWillMount() {
        this.getTransactionHistory();
    }

    componentWillReceiveProps(nextProps) {
        if (
            this.props.recordType != nextProps.recordType ||
            this.props.assetId != nextProps.assetId ||
            this.props.assetName != nextProps.assetName ||
            this.props.userId != nextProps.userId ||
            this.props.userAccount != nextProps.userAccount
        ) {
            this._getTransactionHistory(
                nextProps.userId,
                nextProps.assetId,
                nextProps.assetName,
                nextProps.recordType,
                nextProps.userAccount,
                true
            );
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!utils.are_equal_shallow(this.props.userId, nextProps.userId)) {
            return true;
        }
        if (this.state.allData != nextState.allData) {
            return true;
        }
        if (this.state.pageNum != nextState.pageNum) return true;
        return false;
    }

    _getTransactionHistory(
        userId,
        assetId,
        assetName,
        recordType,
        userAccount,
        force = false
    ) {
        let pageSize = this.props.pageSize;
        let {
            pageNum,
            allData,
            historyStatusValue,
            historyStatusType
        } = this.state;
        if (force == true) {
            pageNum = 1;
            allData = {};
            historyStatusType =
                recordType == 1
                    ? "deposit_history_status"
                    : "withdraw_history_status";
            historyStatusValue =
                recordType == 1 ? DEPOSIT_STATUS : WITHDRAW_STATUS;
        } else {
            pageNum += 1;
        }

        var _this = this;
        getTransactionRecordList(
            {
                uid: userId,
                assetId: assetId,
                pageNum: pageNum,
                pageSize: pageSize,
                userAccount: userAccount
            },
            recordType
        )
            .then(res => {
                if (res.records) {
                    res.records.forEach(item => {
                        allData[item.txid] = {
                            txid: item.txid,
                            amount: item.amount,
                            time: item.ctime,
                            unixtime: Date.parse(item.ctime),
                            status: [
                                "gateway",
                                historyStatusType,
                                historyStatusValue[item.status]
                            ].join("."),
                            failReason: item.failReason,
                            assetName: assetName
                        };
                    });

                    _this.setState({
                        totalNum: res.total,
                        nextPageEnabled: res.total > pageNum * pageSize,
                        allData: allData,
                        pageNum: pageNum,
                        historyStatusType: historyStatusType,
                        historyStatusValue: historyStatusValue
                    });
                }
            })
            .catch(() => {
                _this.setState({
                    totalNum: 0,
                    nextPageEnabled: false,
                    allData: {},
                    pageNum: 0
                });
            });
    }
    getTransactionHistory() {
        let {userId, assetId, assetName, recordType, userAccount} = this.props;
        this._getTransactionHistory(
            userId,
            assetId,
            assetName,
            recordType,
            userAccount,
            false
        );
    }

    render() {
        let {assetName, compactView, style, maxHeight} = this.props;
        let {headerHeight, allData} = this.state;

        let history = [];
        Object.keys(allData).forEach(item => {
            history.push(allData[item]);
        });
        history.sort((a, b) => {
            return b.unixtime - a.unixtime;
        });
        style = style ? style : {};
        style.width = "100%";
        style.height = "100%";

        if (allData.length == 0) {
        }
        let display_history = history.length
            ? history.map(o => {
                  return (
                      <tr key={o.txid}>
                          <td
                              style={{textAlign: "left"}}
                              className="left-td column-hide-tiny"
                          >
                              <Translate content={o.status} />
                          </td>
                          <td
                              style={{
                                  padding: "8px 5px",
                                  textAlign: "left",
                                  fontSize: 14
                              }}
                          >
                              <Translate
                                  content="gateway.transaction_history_info"
                                  amount={o.amount}
                                  assetName={assetName}
                                  txid={o.txid}
                              />
                          </td>
                          <td>{o.time}</td>
                      </tr>
                  );
              })
            : [
                  <tr key="no_recent">
                      <td colSpan={compactView ? "2" : "3"}>
                          <Translate content="operation.no_recent" />
                      </td>
                  </tr>
              ];
        display_history.push(
            <tr className="total-value" key="total_value">
                <td className="column-hide-tiny" />
                <td />
                <td style={{textAlign: "center"}}>
                    &nbsp;{this.state.nextPageEnabled ? (
                        <a onClick={this.getTransactionHistory.bind(this)}>
                            <Icon
                                name="chevron-down"
                                title="icons.chevron_down.transactions"
                                className="icon-14px"
                            />
                        </a>
                    ) : null}
                </td>
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

                    <div
                        className="box-content grid-block no-margin"
                        style={
                            !this.props.fullHeight
                                ? {
                                      maxHeight: maxHeight - headerHeight
                                  }
                                : null
                        }
                        ref="transactions"
                    >
                        <table
                            className={
                                "table" +
                                (compactView ? " compact" : "") +
                                (this.props.dashboard ? " dashboard-table" : "")
                            }
                        >
                            <thead>
                                <tr key="history_header">
                                    <th>
                                        <Translate content="gateway.status" />
                                    </th>
                                    <th>
                                        <Translate content="gateway.info" />
                                    </th>
                                    <th>
                                        <Translate content="gateway.time" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>{display_history}</tbody>
                        </table>
                        {/*<buton name="下一页"  />*/}
                    </div>
                </div>
            </div>
        );
    }
}

export default GdexHistory;
