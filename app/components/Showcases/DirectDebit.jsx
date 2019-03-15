import React, {Component} from "react";
import {Apis} from "bitsharesjs-ws";
import {FetchChain} from "bitsharesjs";
import Translate from "react-translate-component";
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
import AccountSelector from "../Account/AccountSelector";
import counterpart from "counterpart";
import AccountStore from "stores/AccountStore";
import {ChainStore} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelector";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync,
    estimateFeeAsync
} from "common/trxHelper";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import ApplicationApi from "../../api/ApplicationApi";
import DirectDebitModal from "../Modal/DirectDebitModal";
import debounceRender from "react-debounce-render";
import {connect} from "alt-react";
import ChainTypes from "../Utility/ChainTypes";
import PropTypes from "prop-types";

/* 
    table like view with "+" button
    lower component will be with some descriptive text and explanations.
*/

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
            // [{
            //     authorized_account: "1.2.894879",
            //     claimed_this_period: 0,
            //     expiration: "2019-03-30T10:57:53",
            //     id: "1.12.63",
            //     period_start_time: "2019-03-16T10:57:53",
            //     withdraw_from_account: "1.2.886902",
            //     withdrawal_limit: {
            //         amount: 1,
            //         asset_id: "1.3.0"
            //     },
            //     withdrawal_period_sec: 604800
            // }];
            let withdraw_permission_list = [];
            withdraw_permission_list = withdraw_permission_list.concat(
                results[0]
            );
            withdraw_permission_list = withdraw_permission_list.concat(
                results[1]
            );
            this.setState({
                withdraw_permission_list: withdraw_permission_list
            });
        });
    }

    componentWillMount() {
        this._update();
        let currentAccount = ChainStore.getAccount(this.props.currentAccount);

        if (!this.state.from_name) this.setState({from_name: currentAccount});
        estimateFeeAsync("proposal_create").then(fee => {
            this.setState({
                proposal_fee: new Asset({amount: fee}).getAmount({real: true})
            });
        });
        // for peer 1 and peer 2 there is also calculation of memo cost (no memo set atm)
        estimateFeeAsync("transfer").then(fee => {
            this.setState({
                transfer_fee: new Asset({amount: fee}).getAmount({real: true})
            });
        });
    }

    showModal = () => {
        this.setState({
            isModalVisible: true
        });
    };

    hideModal = () => {
        this.setState({
            isModalVisible: false
        });
    };

    _onFilter = e => {
        // TODO:
        e.preventDefault();
    };

    render() {
        const {isModalVisible} = this.state;
        console.log("isModalVisible", isModalVisible);

        let currentAccount = ChainStore.getAccount(this.props.currentAccount);

        let smallScreen = window.innerWidth < 850 ? true : false;

        let dataSource = this.state.withdraw_permission_list.map(item => {
            return {
                key: item.id,
                id: item.id,
                type:
                    item.authorized_account == currentAccount.get("id")
                        ? "payee"
                        : "payer",
                authorized: item.authorized_account,
                limit:
                    item.withdrawal_limit.amount +
                    " " +
                    item.withdrawal_limit.asset_id,
                until: new Date(item.expiration + "Z").toISOString(),
                available:
                    item.withdrawal_limit.amount -
                    item.claimed_this_period +
                    " " +
                    item.withdrawal_limit.asset_id
            };
        });
        dataSource.push({
            key: "1",
            id: 1,
            type: "receiver",
            authorized: "twat124",
            limit: "1000TEST",
            until: JSON.stringify(new Date()),
            available: "10000TEST"
        });

        const columns = [
            {
                title: "#",
                dataIndex: "id",
                key: "id"
            },
            {
                title: "Type",
                dataIndex: "type",
                key: "type"
            },
            {
                title: "Authorized",
                dataIndex: "authorized",
                key: "authorized"
            },
            {
                title: "Limit",
                dataIndex: "limit",
                key: "limit"
            },
            {
                title: "Until",
                dataIndex: "until",
                key: "until"
            },
            {
                title: "Available",
                dataIndex: "available",
                key: "available"
            },
            {
                title: "Actions",
                dataIndex: "action",
                key: "action",
                render: (text, record) => {
                    if (record.type) {
                        return record.type === "payer" ? (
                            <span>
                                <Button style={{marginRight: "10px"}}>
                                    Cancel
                                </Button>
                                <Button>Update</Button>
                            </span>
                        ) : (
                            <span>
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
            <Card>
                <Row>
                    <Col span={24} style={{padding: "10px"}}>
                        {/* TABLE HEADER */}
                        <div
                            style={{
                                marginBottom: "30px"
                            }}
                        >
                            <Input
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
                            <Button onClick={this.showModal}>
                                {counterpart.translate(
                                    "showcases.direct_debit.create_new_mandate"
                                )}
                            </Button>
                        </div>

                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            pagination={false}
                        />
                    </Col>
                </Row>

                <DirectDebitModal
                    isModalVisible={isModalVisible}
                    hideModal={this.hideModal}
                />
            </Card>
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
