import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import AccountStore from "../../../stores/AccountStore";
import CreditOfferStore from "../../../stores/CreditOfferStore";
import {Table} from "bitshares-ui-style-guide";
import CreditOfferActions, {
    FEE_RATE_DENOM
} from "../../../actions/CreditOfferActions";
import LinkToAccountById from "../../Utility/LinkToAccountById";
import FormattedAsset from "../../Utility/FormattedAsset";
import moment from "moment";

class CreditRightsList extends React.Component {
    constructor(props) {
        super();
    }

    componentDidMount() {
        CreditOfferActions.getCreditDealsByOfferOwner({
            name_or_id: this.props.account.get("id"),
            flag: "first"
        });
    }

    _getColumns() {
        return [
            {
                title: "ID",
                dataIndex: "id"
            },
            {
                title: counterpart.translate(
                    "credit_offer.credit_debt_account"
                ),
                dataIndex: "borrower",
                render: account => <LinkToAccountById account={account} />
            },
            {
                title: counterpart.translate("credit_offer.debt"),
                dataIndex: "debt_asset",
                align: "right",
                render: (text, row) => (
                    <FormattedAsset
                        asset={text}
                        amount={row.debt_amount}
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.fee_rate"),
                align: "right",
                render: (_, row) => (
                    <FormattedAsset
                        asset={row.debt_asset}
                        amount={
                            (parseFloat(row.fee_rate) / FEE_RATE_DENOM) *
                            row.debt_amount
                        }
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.mortgage_assets"),
                align: "right",
                render: (_, row) => (
                    <FormattedAsset
                        asset={row.collateral_asset}
                        amount={row.collateral_amount}
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.repay_period"),
                dataIndex: "latest_repay_time",
                render: time =>
                    moment
                        .utc(time)
                        .local()
                        .format("YYYY-MM-DD HH:mm:ss")
            }
        ];
    }

    render() {
        let {dealsByOfferOwner} = this.props;
        return (
            <div className="grid-content no-overflow no-padding">
                <div className="generic-bordered-box">
                    <div className="grid-wrapper">
                        <Table
                            rowKey="id"
                            columns={this._getColumns()}
                            dataSource={dealsByOfferOwner}
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

CreditRightsList = connect(
    CreditRightsList,
    {
        listenTo() {
            return [AccountStore, CreditOfferStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                dealsByOfferOwner: CreditOfferStore.getState().dealsByOfferOwner
            };
        }
    }
);

export default CreditRightsList;
