import React, {Component} from "react";
import {
    Input,
    Card,
    Col,
    Row,
    Button,
    Icon,
    Table,
    Tooltip
} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import {ChainStore, FetchChainObjects} from "tuscjs";
import utils from "common/utils";
import HtlcModal from "../Modal/HtlcModal";
import LinkToAssetById from "../Utility/LinkToAssetById";
import {bindToCurrentAccount, hasLoaded} from "../Utility/BindToCurrentAccount";
import HtlcActions from "../../actions/HtlcActions";

class Htlc extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: false,
            filterString: "",
            operationData: undefined,
            htlc_list: [],
            tableIsLoading: false
        };
        this.hasLoadedOnce = null;
    }

    async _update() {
        let currentAccount = this.props.currentAccount;

        if (
            hasLoaded(currentAccount) &&
            this.hasLoadedOnce !== currentAccount.get("id")
        ) {
            if (__DEV__) {
                console.log("Loading HTLC table for", currentAccount.get("id"));
            }
            this.hasLoadedOnce = currentAccount.get("id");
            this.setState({
                tableIsLoading: true
            });
            let htlc_list = await HtlcActions.getHTLCs(
                currentAccount.get("id")
            );

            for (let i = 0; i < htlc_list.length; i++) {
                let item = htlc_list[i];
                try {
                    await FetchChainObjects(
                        ChainStore.getObject,
                        [item.transfer.asset_id],
                        undefined,
                        {}
                    );
                    await FetchChainObjects(ChainStore.getAccountName, [
                        item.transfer.from,
                        item.transfer.to
                    ]);
                } catch (err) {}
            }

            this.setState({
                htlc_list,
                tableIsLoading: false
            });
        }
    }

    componentDidMount() {
        this._update();
    }

    componentDidUpdate(prevProps) {
        // always update, relies on push from backend when account permission change
        this._update();
    }

    showModal = operation => async () => {
        if (operation.payload) {
            // cache for modal
            await FetchChainObjects(
                ChainStore.getAccount,
                [operation.payload.transfer.to],
                undefined,
                {}
            );
            await FetchChainObjects(
                ChainStore.getAccount,
                [operation.payload.transfer.from],
                undefined,
                {}
            );
            await FetchChainObjects(ChainStore.getAsset, [
                operation.payload.transfer.asset_id
            ]);
        }
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

    _onFilter = e => {
        e.preventDefault();
        this.setState({filterString: e.target.value.toLowerCase()});
    };

    render() {
        const {
            isModalVisible,
            htlc_list,
            operationData,
            filterString
        } = this.state;
        let currentAccount = this.props.currentAccount;

        let dataSource = null;

        if (htlc_list.length) {
            dataSource = htlc_list.map(item => {
                const to = item.transfer.to;
                const from = item.transfer.from;
                const amount = {
                    amount: item.transfer.amount,
                    asset_id: item.transfer.asset_id
                };
                const expiration = new Date(
                    item.conditions.time_lock.expiration
                );
                const asset = ChainStore.getAsset(amount.asset_id, false);
                const toAccountName = ChainStore.getAccountName(to) || to;
                const fromAccountName = ChainStore.getAccountName(from) || from;
                return {
                    key: item.id,
                    id: item.id,
                    type: to == currentAccount.get("id") ? "payee" : "payer",
                    from: fromAccountName,
                    to: toAccountName,
                    amount: (
                        <span>
                            {asset
                                ? utils.get_asset_amount(amount.amount, asset) +
                                  " "
                                : null}
                            <LinkToAssetById asset={amount.asset_id} />
                        </span>
                    ),
                    hash: (
                        <Tooltip
                            title={counterpart.translate(
                                "htlc.preimage_hash_explanation"
                            )}
                        >
                            <span>
                                {"(" +
                                    item.conditions.hash_lock.preimage_size +
                                    "," +
                                    item.conditions.hash_lock.preimage_hash[0] +
                                    "): " +
                                    item.conditions.hash_lock.preimage_hash[1]}
                            </span>
                        </Tooltip>
                    ),
                    expires: counterpart.localize(expiration, {
                        type: "date",
                        format: "full"
                    }),
                    rawData: {
                        ...item
                    }
                };
            });
            dataSource.length &&
                dataSource.filter(item => {
                    // if filter is chained to map, possible bugs with initial render of table
                    return item.to && item.to.indexOf(filterString) !== -1;
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
                title: counterpart.translate("showcases.htlc.from"),
                dataIndex: "from",
                key: "from",
                sorter: (a, b) => {
                    return a.from > b.from ? 1 : a.from < b.from ? -1 : 0;
                }
            },
            {
                title: counterpart.translate("showcases.htlc.to"),
                dataIndex: "to",
                key: "to",
                sorter: (a, b) => {
                    return a.to > b.to ? 1 : a.to < b.to ? -1 : 0;
                }
            },
            {
                title: counterpart.translate("showcases.htlc.amount"),
                dataIndex: "amount",
                key: "amount",
                sorter: (a, b) => {
                    const limit1 = a.rawData.op[1].amount.amount;
                    const limit2 = b.rawData.op[1].amount.amount;

                    return limit1 - limit2;
                }
            },
            {
                title: counterpart.translate("showcases.htlc.hash"),
                dataIndex: "hash",
                key: "hash"
            },
            {
                title: counterpart.translate("showcases.htlc.expires"),
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
                title: counterpart.translate("showcases.htlc.actions"),
                dataIndex: "action",
                key: "action",
                render: (text, record) => {
                    if (record.type) {
                        return record.type === "payer" ? (
                            <span>
                                <Button
                                    style={{marginRight: "10px"}}
                                    onClick={this.showModal({
                                        type: "extend",
                                        payload: record.rawData
                                    })}
                                >
                                    {counterpart.translate(
                                        "showcases.htlc.extend"
                                    )}
                                </Button>
                            </span>
                        ) : (
                            <span
                                onClick={this.showModal({
                                    type: "redeem",
                                    payload: record.rawData
                                })}
                            >
                                <Button>
                                    {counterpart.translate(
                                        "showcases.htlc.redeem"
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
                                        "showcases.htlc.create_htlc"
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
                                loading={this.state.tableIsLoading}
                            />
                        </Col>
                    </Row>

                    <HtlcModal
                        isModalVisible={isModalVisible}
                        hideModal={this.hideModal}
                        operation={operationData}
                        fromAccount={this.props.currentAccount}
                    />
                </Card>
            </div>
        );
    }
}

Htlc = bindToCurrentAccount(Htlc);

export default Htlc;
