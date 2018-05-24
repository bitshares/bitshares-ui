import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "components/Utility/BindToChainState";
import {widechainAPIs} from "api/apiConfig";
import PropTypes from "prop-types";

class WinexRecentTransactions extends React.Component {
    static propTypes = {
        account: PropTypes.string,
        action: PropTypes.string
    };

    constructor(props) {
        super();
        this.state = {
            trans_history: []
        };
    }

    _history(account, action) {
        let url = "";
        if (action === "deposit") {
            url =
                widechainAPIs.BASE +
                widechainAPIs.DEPOSIT_HISTORY +
                "?account=" +
                account;
        } else {
            url =
                widechainAPIs.BASE +
                widechainAPIs.WITHDRAW_HISTORY +
                "?account=" +
                account;
        }

        var head = {
            method: "GET",
            headers: new Headers({Accept: "application/json"}),
            mode: "cors",
            cache: "default"
        };

        fetch(url, head)
            .then(function(res) {
                if (res.ok) {
                    return res.json();
                } else {
                    {
                        this.LogError(res);
                    }
                }
            })
            .then(function(json) {
                return json;
            })
            .then(function(datas) {
                return datas;
            })
            .then(e => {
                this.setState({
                    trans_history: e
                });
            });
    }

    componentWillMount() {
        let {account, action} = this.props;
        this._history(account, action);
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextProps.action !== this.props.action) {
            this._history(nextProps.account, nextProps.action);
            return true;
        }
        return false;
    }

    LogError(res) {
        console.error("服务器繁忙,请稍后重试; \r\nCode:" + res.status);
    }

    render() {
        let {trans_history} = this.state;

        let account_record = [];
        trans_history.forEach((record, i) => {
            account_record.push(
                <tr key={i}>
                    <td>
                        <div className="blocktrades-bridge">
                            <div className="inline-block">
                                <div>{record.status}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>{record.amount + record.inputCoinType}</div>
                    </td>
                    <td>
                        <div>
                            <a
                                href={
                                    "https://www.cryptofresh.com/tx/" +
                                    record.txid
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {record.txid}
                            </a>
                        </div>
                    </td>
                    <td>{record.createDate}</td>
                </tr>
            );
        });

        return (
            <div>
                <div className="block-content-header">
                    <span>
                        {this.props.action ? (
                            <Translate
                                content={"gateway.recent_" + this.props.action}
                            />
                        ) : (
                            <Translate content="account.recent" />
                        )}
                    </span>
                </div>

                <table className="table">
                    <thead>
                        {account_record.length <= 0 ? (
                            <tr key="no_recent">
                                <td colSpan="2">
                                    <Translate content="operation.no_recent" />
                                </td>
                            </tr>
                        ) : null}
                        <tr>
                            {/*<th>Translate content="gateway.deposit" /></th>*/}
                            <th>状态</th>
                            <th>
                                {this.props.action === "deposit"
                                    ? "充值数量"
                                    : "提现数量"}
                            </th>
                            <th>流水号</th>
                            <th>创建时间</th>
                        </tr>
                    </thead>
                    <tbody>{account_record}</tbody>
                </table>
            </div>
        );
    }
}

export default BindToChainState(WinexRecentTransactions);
