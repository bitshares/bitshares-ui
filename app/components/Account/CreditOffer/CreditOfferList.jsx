import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import utils from "../../../lib/common/utils";
import AccountStore from "stores/AccountStore";
import {
    Tooltip,
    Button,
    Table,
    Icon as AntIcon
} from "bitshares-ui-style-guide";
import Translate from "react-translate-component";
import CreateModal from "./CreateModal";
import EditModal from "./EditModal";
import CreditOfferActions, {
    FEE_RATE_DENOM,
    parsingTime
} from "../../../actions/CreditOfferActions";
import CreditOfferStore from "../../../stores/CreditOfferStore";
import LinkToAssetById from "../../Utility/LinkToAssetById";
import FormattedAsset from "../../Utility/FormattedAsset";
import moment from "moment";
import IntlStore from "stores/IntlStore";

class CreditOfferList extends React.Component {
    constructor(props) {
        super();

        this.showCreateModal = this.showCreateModal.bind(this);
        this._getColumns = this._getColumns.bind(this);
    }

    componentDidMount() {
        this._loadList(true);
    }

    _loadList(isFirst = false) {
        CreditOfferActions.getCreditOffersByOwner({
            name_or_id: this.props.account.get("id"),
            flag: isFirst ? "first" : false
        });
    }

    showCreateModal() {
        if (this.create_modal) this.create_modal.showModal();
    }

    showEditModal(data) {
        // console.log("data: ", data);
        if (this.edit_modal) {
            this.edit_modal.initModal(data);
        }
    }

    _showCreateButton() {
        let {currentAccount, passwordAccount, account} = this.props;
        let account_name = account.get("name");
        if (
            account_name === currentAccount ||
            account_name === passwordAccount
        ) {
            return (
                <div className="generic-bordered-box">
                    <div className="header-selector">
                        <div className="filter inline-block">
                            <Button
                                style={{marginRight: "30px"}}
                                onClick={this.showCreateModal}
                            >
                                <Translate content="credit_offer.create" />
                            </Button>
                        </div>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    _getColumns() {
        let header = [
            {
                title: "ID",
                dataIndex: "id"
                // render: (text) => `#${text.split(".")[2]}`,
            },
            {
                title: counterpart.translate("credit_offer.asset"),
                dataIndex: "asset_type",
                render: text => <LinkToAssetById asset={text} />
            },
            {
                title: counterpart.translate("credit_offer.total_amount"),
                dataIndex: "total_balance",
                align: "right",
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.available_amount"),
                dataIndex: "current_balance",
                align: "right",
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.min_borrow"),
                dataIndex: "min_deal_amount",
                align: "right",
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.fee_rate"),
                dataIndex: "fee_rate",
                align: "right",
                render: item =>
                    `${utils.format_number(
                        (parseFloat(item) / parseFloat(FEE_RATE_DENOM)) * 100,
                        2,
                        false
                    )}%`
            },
            {
                title: counterpart.translate("credit_offer.repay_period"),
                dataIndex: "max_duration_seconds",
                render: item => {
                    return parsingTime(item, this.props.locale);
                }
            },
            {
                title: counterpart.translate("credit_offer.validity_period"),
                dataIndex: "auto_disable_time",
                render: text =>
                    moment
                        .utc(text)
                        .local()
                        .format("YYYY-MM-DD HH:mm:ss")
            },
            {
                title: counterpart.translate("credit_offer.mortgage_assets"),
                dataIndex: "acceptable_collateral",
                render: item => {
                    return item.map(v => (
                        <div key={v[0]}>
                            <LinkToAssetById asset={v[0]} />
                        </div>
                    ));
                }
            },
            {
                title: counterpart.translate("credit_offer.status"),
                dataIndex: "enabled",
                render: item => {
                    let cls = "label " + (item ? "success" : "info");
                    return (
                        <span className={cls}>
                            {item
                                ? counterpart.translate("credit_offer.active")
                                : counterpart.translate("credit_offer.closed")}
                        </span>
                    );
                }
            }
        ];
        let {account, currentAccount} = this.props;
        if (account.get("name") == currentAccount) {
            header.push({
                title: counterpart.translate("credit_offer.operate"),
                key: "action",
                render: (_, row) => {
                    return (
                        <span style={{fontSize: 20}}>
                            <Tooltip
                                title={counterpart.translate(
                                    "credit_offer.operate_edit"
                                )}
                            >
                                <AntIcon
                                    type="edit"
                                    style={{
                                        cursor: "pointer",
                                        marginRight: "20px"
                                    }}
                                    onClick={() => {
                                        this.showEditModal(row);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip
                                title={
                                    row.enabled
                                        ? counterpart.translate(
                                              "credit_offer.closed"
                                          )
                                        : counterpart.translate(
                                              "credit_offer.active"
                                          )
                                }
                            >
                                <AntIcon
                                    type={row.enabled ? "poweroff" : "reload"}
                                    style={{
                                        cursor: "pointer",
                                        marginRight: "20px"
                                    }}
                                    onClick={() => {
                                        CreditOfferActions.disabled({
                                            owner_account: row.owner_account,
                                            offer_id: row.id,
                                            enabled: !row.enabled
                                        });
                                    }}
                                />
                            </Tooltip>
                            <Tooltip
                                title={counterpart.translate(
                                    "credit_offer.operate_delete"
                                )}
                            >
                                <AntIcon
                                    type="delete"
                                    style={{cursor: "pointer"}}
                                    onClick={() =>
                                        CreditOfferActions.delete({
                                            owner_account: row.owner_account,
                                            offer_id: row.id
                                        })
                                    }
                                />
                            </Tooltip>
                        </span>
                    );
                }
            });
        }
        return header;
    }

    render() {
        let {listByOwner} = this.props;
        // let a=ChainStore.getObject("1.2.9518",true,false,true);
        // console.log("a: ",a);
        return (
            <div className="grid-content no-overflow no-padding">
                <CreateModal
                    id="credit_offer_create_modal"
                    refCallback={e => {
                        if (e) this.create_modal = e;
                    }}
                    account={this.props.account}
                />
                <EditModal
                    id="credit_offer_edit_modal"
                    account={this.props.account}
                    refCallback={e => {
                        if (e) this.edit_modal = e;
                    }}
                />
                {this._showCreateButton()}
                <div className="generic-bordered-box">
                    <div className="grid-wrapper">
                        <Table
                            rowKey="id"
                            columns={this._getColumns()}
                            dataSource={listByOwner}
                            pagination={{
                                hideOnSinglePage: true,
                                pageSize: 10
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

CreditOfferList = connect(CreditOfferList, {
    listenTo() {
        return [AccountStore, CreditOfferStore, IntlStore];
    },
    getProps(props) {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            passwordAccount: AccountStore.getState().passwordAccount,
            listByOwner: CreditOfferStore.getState().listByOwner,
            locale: IntlStore.getState().currentLocale
        };
    }
});

export default CreditOfferList;
