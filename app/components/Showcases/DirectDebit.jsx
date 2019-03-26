import React, {Component} from "react";
import {Apis} from "bitsharesjs-ws";
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
import AccountStore from "stores/AccountStore";
import {ChainStore} from "bitsharesjs";
import utils from "common/utils";
import DirectDebitModal from "../Modal/DirectDebitModal";
import DirectDebitClaimModal from "../Modal/DirectDebitClaimModal";
import debounceRender from "react-debounce-render";
import {connect} from "alt-react";
import LinkToAssetById from "../Utility/LinkToAssetById";

class DirectDebit extends Component {
    constructor() {
        super();
        this.state = {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,

            amount_counter: [],
            amount_index: 0,

            proposal_fee: 0,
            isModalVisible: false,
            isClaimModalVisible: false,
            filterString: "",
            operationData: "",
            operationClaimData: "",
            withdraw_permission_list: []
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.currentAccount != nextProps.currentAccount) {
            this._update(nextProps.currentAccount);
        }
    }

    _update(account = null) {
        let currentAccount = ChainStore.getAccount(
            account == null ? this.props.currentAccount : account
        );
        // fetch full accounts, contains withdraw, whcih is a list of permission objects. requires bitsharesjs in current develop branch

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
            console.log("withdraw_permission_list", withdraw_permission_list);

            this.setState({
                withdraw_permission_list: withdraw_permission_list
            });
        });
    }

    componentDidMount() {
        this._update();
    }

    showModal = operation => () => {
        this.setState({
            isModalVisible: true,
            operationData: operation
        });
    };

    showClaimModal = operation => () => {
        this.setState({
            isClaimModalVisible: true,
            operationClaimData: operation
        });
    };

    hideModal = () => {
        this.setState({
            isModalVisible: false,
            operation: null
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

    handleDeleteProposal = () => {
        // TODO:
        console.log("delete");
    };

    render() {
        const {
            isModalVisible,
            isClaimModalVisible,
            withdraw_permission_list,
            operationData,
            operationClaimData
        } = this.state;
        let currentAccount = ChainStore.getAccount(this.props.currentAccount);

        // let smallScreen = window.innerWidth < 850 ? true : false;

        let dataSource = null;
        if (withdraw_permission_list.length) {
            dataSource = withdraw_permission_list
                .map(item => {
                    const asset = ChainStore.getObject(
                        item.withdrawal_limit.asset_id,
                        false
                    );
                    try {
                        // to trigger caching for modal
                        ChainStore.getAccount(item.authorized_account, false);
                        ChainStore.getAccount(
                            item.withdraw_from_account,
                            false
                        );
                    } catch (err) {}
                    const authorizedAccountName = ChainStore.getAccountName(
                        item.authorized_account
                    );
                    const withdrawFromAccountName = ChainStore.getAccountName(
                        item.withdraw_from_account
                    );
                    let period_start = new Date(item.period_start_time + "Z");
                    let now = new Date();
                    let full_intervals = Math.floor(
                        (now.getTime() - period_start.getTime()) /
                            1000 /
                            item.withdrawal_period_sec
                    );
                    // set period_start to current period end
                    period_start.setSeconds(
                        period_start.getSeconds() +
                            (full_intervals + 1) * item.withdrawal_period_sec
                    );
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
                        until: counterpart.localize(period_start, {
                            type: "date",
                            format: "full"
                        }),
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
                })
                .filter(item => {
                    return (
                        item.authorized &&
                        item.authorized.indexOf(this.state.filterString) !== -1
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
                                    onClick={this.handleDeleteProposal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={this.showModal({
                                        type: "update",
                                        payload: record.rawData
                                    })}
                                >
                                    Update
                                </Button>
                            </span>
                        ) : (
                            <span
                                onClick={this.showClaimModal({
                                    type: "claim",
                                    payload: record.rawData
                                })}
                            >
                                <Button>Collect</Button>
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
                                >
                                    {counterpart.translate(
                                        "showcases.direct_debit.create_new_mandate"
                                    )}
                                </Button>
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

DirectDebit = debounceRender(DirectDebit, 50, {leading: false});

export default connect(
    DirectDebit,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount:
                    AccountStore.getState().currentAccount ||
                    AccountStore.getState().passwordAccount
            };
        }
    }
);
