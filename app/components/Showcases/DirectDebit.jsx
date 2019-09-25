import React, {Component} from "react";
import {Apis} from "tuscjs-ws";
import {
    Input,
    Card,
    Col,
    Row,
    Button,
    Switch,
    Tooltip,
    Icon,
    Table
} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import {ChainStore} from "tuscjs";
import utils from "common/utils";
import DirectDebitModal from "../Modal/DirectDebitModal";
import DirectDebitClaimModal from "../Modal/DirectDebitClaimModal";
import LinkToAssetById from "../Utility/LinkToAssetById";
import ApplicationApi from "../../api/ApplicationApi";
import {bindToCurrentAccount, hasLoaded} from "../Utility/BindToCurrentAccount";

class DirectDebit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: false,
            isClaimModalVisible: false,
            filterString: "",
            operationData: "",
            operationClaimData: "",
            withdraw_permission_list: []
        };
    }

    _update() {
        let currentAccount = this.props.currentAccount;

        if (hasLoaded(currentAccount)) {
            // for now, fetch manually
            Promise.all([
                Apis.instance()
                    .db_api()
                    .exec("get_withdraw_permissions_by_giver", [
                        currentAccount.get("id"),
                        "1.12.0",
                        100
                    ]),
                Apis.instance()
                    .db_api()
                    .exec("get_withdraw_permissions_by_recipient", [
                        currentAccount.get("id"),
                        "1.12.0",
                        100
                    ])
            ]).then(results => {
                let withdraw_permission_list = [];
                withdraw_permission_list = withdraw_permission_list.concat(
                    results[0]
                );
                withdraw_permission_list = withdraw_permission_list.concat(
                    results[1]
                );
                withdraw_permission_list.forEach(item => {
                    try {
                        // to trigger caching for modal
                        ChainStore.getAccount(item.authorized_account, false);
                        ChainStore.getAccount(
                            item.withdraw_from_account,
                            false
                        );
                    } catch (err) {}
                });
                this.setState({
                    withdraw_permission_list: withdraw_permission_list
                });
            });
        }
    }

    componentDidMount() {
        this._update();
    }

    componentWillReceiveProps() {
        // always update, relies on push from backend when account permission change
        this._update();
    }

    showModal = operation => () => {
        this.setState({
            isModalVisible: true,
            operationData: operation
        });
    };

    hideModal = () => {
        this.setState({
            isModalVisible: false,
            operation: null
        });
    };

    showClaimModal = operation => () => {
        this.setState({
            isClaimModalVisible: true,
            operationClaimData: operation
        });
    };

    hideClaimModal = () => {
        this.setState({
            isClaimModalVisible: false
        });
    };

    _onFilter = e => {
        e.preventDefault();
        this.setState({filterString: e.target.value.toLowerCase()});
    };

    handleDeleteProposal = permission => {
        console.log("delete permissin");
        ApplicationApi.deleteWithdrawPermission(
            permission.id,
            permission.withdraw_from_account,
            permission.authorized_account
        )
            .then(() => {
                // nothing to do, user will see popup
            })
            .catch(err => {
                this.setState({errorMessage: err.toString()});
                console.error(err);
            });
    };

    render() {
        const {
            isModalVisible,
            isClaimModalVisible,
            withdraw_permission_list,
            operationData,
            operationClaimData,
            filterString
        } = this.state;
        let currentAccount = this.props.currentAccount;

        let dataSource = null;

        if (withdraw_permission_list.length) {
            dataSource = withdraw_permission_list.map(item => {
                const asset = ChainStore.getObject(
                    item.withdrawal_limit.asset_id,
                    false
                );
                const authorizedAccountName = ChainStore.getAccountName(
                    item.authorized_account
                );
                const withdrawFromAccountName = ChainStore.getAccountName(
                    item.withdraw_from_account
                );
                const period_start = new Date(
                    item.period_start_time + "Z"
                ).getTime();
                const now = new Date().getTime();
                const timePassed = now - period_start;
                let currentPeriodExpires = "";
                const periodMs = item.withdrawal_period_sec * 1000;

                if (timePassed < 0) {
                    console.log("first period is not started");
                } else {
                    const currentPeriodNum = Math.ceil(timePassed / periodMs);
                    currentPeriodExpires =
                        period_start + periodMs * currentPeriodNum;
                }

                return {
                    key: item.id,
                    id: item.id,
                    type:
                        item.authorized_account == currentAccount.get("id")
                            ? "payee"
                            : "payer",
                    authorized: authorizedAccountName,
                    from: withdrawFromAccountName,
                    to: authorizedAccountName,
                    limit: (
                        <span>
                            {utils.get_asset_amount(
                                item.withdrawal_limit.amount,
                                asset
                            ) + " "}
                            <LinkToAssetById
                                asset={item.withdrawal_limit.asset_id}
                            />
                        </span>
                    ),
                    until: currentPeriodExpires
                        ? counterpart.localize(new Date(currentPeriodExpires), {
                              type: "date",
                              format: "full"
                          })
                        : counterpart.translate(
                              "showcases.direct_debit.first_period_not_started"
                          ),
                    expires: counterpart.localize(
                        new Date(item.expiration + "Z"),
                        {
                            type: "date",
                            format: "full"
                        }
                    ),
                    claimed:
                        item.claimed_this_period == 0 ? (
                            "-"
                        ) : (
                            <span>
                                {utils.get_asset_amount(
                                    item.claimed_this_period,
                                    asset
                                ) + " "}
                                <LinkToAssetById
                                    asset={item.withdrawal_limit.asset_id}
                                />
                            </span>
                        ),
                    rawData: {
                        ...item
                    }
                };
            });
            dataSource.length &&
                dataSource.filter(item => {
                    // if filter is chained to map, possible bugs with initial render of table
                    return (
                        item.authorized &&
                        item.authorized.indexOf(filterString) !== -1
                    );
                });
        }

        const columns = [
            {
                title: "#",
                dataIndex: "id",
                key: "id",
                sorter: (a, b) => {
                    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
                }
            },
            {
                title: "From",
                dataIndex: "from",
                key: "from",
                sorter: (a, b) => {
                    return a.from > b.from ? 1 : a.from < b.from ? -1 : 0;
                }
            },
            {
                title: "To",
                dataIndex: "to",
                key: "to",
                sorter: (a, b) => {
                    return a.to > b.to ? 1 : a.to < b.to ? -1 : 0;
                }
            },
            {
                title: counterpart.translate(
                    "showcases.direct_debit.current_period_expires"
                ),
                dataIndex: "until",
                key: "until",
                sorter: (a, b) => {
                    return a.until > b.until ? 1 : a.until < b.until ? -1 : 0;
                }
            },
            {
                title: "Limit",
                dataIndex: "limit",
                key: "limit",
                sorter: (a, b) => {
                    const limit1 = a.rawData.withdrawal_limit.amount;
                    const limit2 = b.rawData.withdrawal_limit.amount;

                    return limit1 - limit2;
                }
            },
            {
                title: "Claimed",
                dataIndex: "claimed",
                key: "claimed",
                sorter: (a, b) => {
                    const available1 = a.rawData.claimed_this_period;
                    const available2 = a.rawData.claimed_this_period;
                    return available2 - available1;
                }
            },
            {
                title: counterpart.translate("showcases.direct_debit.expires"),
                dataIndex: "expires",
                key: "expires",
                sorter: (a, b) => {
                    return a.expires > b.expires
                        ? 1
                        : a.expires < b.expires
                        ? -1
                        : 0;
                }
            },
            {
                title: "Actions",
                dataIndex: "action",
                key: "action",
                render: (text, record) => {
                    if (record.type) {
                        return record.type === "payer" ? (
                            <span>
                                <Button
                                    style={{marginRight: "10px"}}
                                    onClick={() =>
                                        this.handleDeleteProposal(
                                            record.rawData
                                        )
                                    }
                                >
                                    {counterpart.translate(
                                        "showcases.direct_debit.delete"
                                    )}
                                </Button>
                                <Button
                                    onClick={this.showModal({
                                        type: "update",
                                        payload: record.rawData
                                    })}
                                >
                                    {counterpart.translate(
                                        "showcases.direct_debit.update"
                                    )}
                                </Button>
                            </span>
                        ) : (
                            <span
                                onClick={this.showClaimModal({
                                    type: "claim",
                                    payload: record.rawData
                                })}
                            >
                                <Button>
                                    {counterpart.translate(
                                        "showcases.direct_debit.claim"
                                    )}
                                </Button>
                            </span>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        return (
            <div className="direct-debit-view">
                <Card className="direct-debit-table-card">
                    <Row>
                        <Col span={24} style={{padding: "10px"}}>
                            {/* TABLE HEADER */}
                            <div
                                style={{
                                    marginBottom: "30px"
                                }}
                            >
                                <Input
                                    className="direct-debit-table__filter-input"
                                    placeholder={counterpart.translate(
                                        "explorer.witnesses.filter_by_name"
                                    )}
                                    onChange={this._onFilter}
                                    style={{
                                        width: "200px",
                                        marginRight: "30px"
                                    }}
                                    addonAfter={<Icon type="search" />}
                                />
                                <Button
                                    onClick={this.showModal({
                                        type: "create",
                                        payload: null
                                    })}
                                    style={{
                                        marginRight: "30px"
                                    }}
                                >
                                    {counterpart.translate(
                                        "showcases.direct_debit.create_new_mandate"
                                    )}
                                </Button>
                                {!!this.state.errorMessage && (
                                    <span className="red">
                                        {this.state.errorMessage}
                                    </span>
                                )}
                            </div>

                            <Table
                                columns={columns}
                                dataSource={dataSource}
                                pagination={false}
                                className="direct-debit-table"
                            />
                        </Col>
                    </Row>

                    <DirectDebitModal
                        isModalVisible={isModalVisible}
                        hideModal={this.hideModal}
                        operation={operationData}
                    />
                    <DirectDebitClaimModal
                        isModalVisible={isClaimModalVisible}
                        hideModal={this.hideClaimModal}
                        operation={operationClaimData}
                    />
                </Card>
            </div>
        );
    }
}

DirectDebit = bindToCurrentAccount(DirectDebit);

export default DirectDebit;
