import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import utils from "common/utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {ChainTypes as grapheneChainTypes, ChainStore} from "tuscjs";
import account_constants from "chain/account_constants";
import MemoText from "./MemoText";
import ProposedOperation from "./ProposedOperation";
import marketUtils from "common/market_utils";
import {Tooltip} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

const ShortObjectId = ({objectId}) => {
    if (typeof objectId === "string") {
        const parts = objectId.split(".");
        const {length} = parts;
        if (length > 0) return "#" + parts[length - 1];
    }
    return objectId;
};

class Operation {
    linkToAccount(name_or_id) {
        if (!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ? (
            <LinkToAccountById account={name_or_id} />
        ) : (
            <Link to={`/account/${name_or_id}`}>{name_or_id}</Link>
        );
    }

    linkToAsset(symbol_or_id) {
        if (!symbol_or_id) return <span>-</span>;
        return utils.is_object_id(symbol_or_id) ? (
            <LinkToAssetById asset={symbol_or_id} />
        ) : (
            <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>
        );
    }

    getColumn(op, current, block, result, marketDirections) {
        const {operations} = grapheneChainTypes;
        let ops = Object.keys(operations);
        let listings = account_constants.account_listing;
        let column = null,
            color = "info";
        let memoComponent = null;

        switch (
            ops[op[0]] // For a list of trx types, see chain_types.coffee
        ) {
            case "transfer":
                if (op[1].memo) {
                    memoComponent = <MemoText memo={op[1].memo} />;
                }

                color = "success";
                op[1].amount.amount = parseFloat(op[1].amount.amount);

                column = (
                    <span className="right-td">
                        <TranslateWithLinks
                            string="operation.transfer"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].from,
                                    arg: "from"
                                },
                                {
                                    type: "amount",
                                    value: op[1].amount,
                                    arg: "amount",
                                    decimalOffset:
                                        op[1].amount.asset_id === "1.3.0"
                                            ? 5
                                            : null
                                },
                                {type: "account", value: op[1].to, arg: "to"}
                            ]}
                        />
                        {memoComponent}
                    </span>
                );

                break;

            case "limit_order_create":
                color = "warning";
                let o = op[1];
                /*
                marketName = OPEN.ETH_USD
                if (!inverted) (default)
                    price = USD / OPEN.ETH
                    buy / sell OPEN.ETH
                    isBid = amount_to_sell.asset_symbol = USD
                    amount = to_receive
                if (inverted)
                    price =  OPEN.ETH / USD
                    buy / sell USD
                    isBid = amount_to_sell.asset_symbol = OPEN.ETH
                    amount =
                */
                column = (
                    <span>
                        <BindToChainState.Wrapper
                            base={o.min_to_receive.asset_id}
                            quote={o.amount_to_sell.asset_id}
                        >
                            {({base, quote}) => {
                                const {
                                    marketName,
                                    first,
                                    second
                                } = marketUtils.getMarketName(base, quote);
                                const inverted = marketDirections.get(
                                    marketName
                                );
                                // const paySymbol = base.get("symbol");
                                // const receiveSymbol = quote.get("symbol");

                                const isBid =
                                    o.amount_to_sell.asset_id ===
                                    (inverted
                                        ? first.get("id")
                                        : second.get("id"));

                                let priceBase = isBid
                                    ? o.amount_to_sell
                                    : o.min_to_receive;
                                let priceQuote = isBid
                                    ? o.min_to_receive
                                    : o.amount_to_sell;
                                const amount = isBid
                                    ? op[1].min_to_receive
                                    : op[1].amount_to_sell;
                                let orderId = result
                                    ? typeof result[1] == "string"
                                        ? "#" + result[1].substring(4)
                                        : ""
                                    : "";

                                return (
                                    <TranslateWithLinks
                                        string={
                                            isBid
                                                ? "operation.limit_order_buy"
                                                : "operation.limit_order_sell"
                                        }
                                        keys={[
                                            {
                                                type: "account",
                                                value: op[1].seller,
                                                arg: "account"
                                            },
                                            {
                                                type: "amount",
                                                value: amount,
                                                arg: "amount"
                                            },
                                            {
                                                type: "price",
                                                value: {
                                                    base: priceBase,
                                                    quote: priceQuote
                                                },
                                                arg: "price"
                                            }
                                        ]}
                                        params={{
                                            order: orderId
                                        }}
                                    />
                                );
                            }}
                        </BindToChainState.Wrapper>
                    </span>
                );
                break;

            case "limit_order_cancel":
                color = "cancel";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.limit_order_cancel"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].fee_paying_account,
                                    arg: "account"
                                }
                            ]}
                            params={{
                                order: op[1].order.substring(4)
                            }}
                        />
                    </span>
                );
                break;

            case "call_order_update":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.call_order_update"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].funding_account,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].delta_debt.asset_id,
                                    arg: "debtSymbol"
                                },
                                {
                                    type: "amount",
                                    value: op[1].delta_debt,
                                    arg: "debt"
                                },
                                {
                                    type: "amount",
                                    value: op[1].delta_collateral,
                                    arg: "collateral"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "key_create":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.create_key"
                        />
                    </span>
                );
                break;

            case "account_create":
                column = (
                    <TranslateWithLinks
                        string="operation.reg_account"
                        keys={[
                            {
                                type: "account",
                                value: op[1].registrar,
                                arg: "registrar"
                            },
                            {
                                type: "account",
                                value: op[1].name,
                                arg: "new_account"
                            }
                        ]}
                    />
                );
                break;

            case "account_update":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.update_account"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].account,
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );

                break;

            case "account_whitelist":
                let label =
                    op[1].new_listing === listings.no_listing
                        ? "unlisted_by"
                        : op[1].new_listing === listings.white_listed
                        ? "whitelisted_by"
                        : "blacklisted_by";
                column = (
                    <span>
                        <TranslateWithLinks
                            string={"operation." + label}
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].authorizing_account,
                                    arg: "lister"
                                },
                                {
                                    type: "account",
                                    value: op[1].account_to_list,
                                    arg: "listee"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "account_upgrade":
                column = (
                    <span>
                        <TranslateWithLinks
                            string={
                                op[1].upgrade_to_lifetime_member
                                    ? "operation.lifetime_upgrade_account"
                                    : "operation.annual_upgrade_account"
                            }
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].account_to_upgrade,
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "account_transfer":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.account_transfer"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].account_id,
                                    arg: "account"
                                },
                                {
                                    type: "account",
                                    value: op[1].new_owner,
                                    arg: "to"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_create":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_create"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].issuer,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].symbol,
                                    arg: "asset"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_update":
            case "asset_update_bitasset":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_update"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].issuer,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].asset_to_update,
                                    arg: "asset"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_update_feed_producers":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_update_feed_producers"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].issuer,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].asset_to_update,
                                    arg: "asset"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_issue":
                color = "warning";

                if (op[1].memo) {
                    memoComponent = <MemoText memo={op[1].memo} />;
                }

                op[1].asset_to_issue.amount = parseInt(
                    op[1].asset_to_issue.amount,
                    10
                );
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_issue"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].issuer,
                                    arg: "account"
                                },
                                {
                                    type: "amount",
                                    value: op[1].asset_to_issue,
                                    arg: "amount"
                                },
                                {
                                    type: "account",
                                    value: op[1].issue_to_account,
                                    arg: "to"
                                }
                            ]}
                        />
                        {memoComponent}
                    </span>
                );
                break;

            case "asset_fund_fee_pool":
                color = "warning";

                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_fund_fee_pool"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].from_account,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].asset_id,
                                    arg: "asset"
                                },
                                {
                                    type: "amount",
                                    value: {
                                        amount: op[1].amount,
                                        asset_id: "1.3.0"
                                    },
                                    arg: "amount"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_settle":
                color = "warning";
                const baseAmount = op[1].amount;
                const instantSettleCode = 2;
                if (result && result[0] == instantSettleCode) {
                    const quoteAmount = result[1];
                    column = (
                        <span>
                            <TranslateWithLinks
                                string="operation.asset_settle_instant"
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].account,
                                        arg: "account"
                                    },
                                    {
                                        type: "amount",
                                        value: baseAmount,
                                        arg: "amount"
                                    },
                                    {
                                        type: "price",
                                        value: {
                                            base: baseAmount,
                                            quote: quoteAmount
                                        },
                                        arg: "price"
                                    }
                                ]}
                            />
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            <TranslateWithLinks
                                string="operation.asset_settle"
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].account,
                                        arg: "account"
                                    },
                                    {
                                        type: "amount",
                                        value: op[1].amount,
                                        arg: "amount"
                                    }
                                ]}
                            />
                        </span>
                    );
                }

                break;

            case "asset_global_settle":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_global_settle"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].issuer,
                                    arg: "account"
                                },
                                {
                                    type: "asset",
                                    value: op[1].asset_to_settle,
                                    arg: "asset"
                                },
                                {
                                    type: "price",
                                    value: op[1].settle_price,
                                    arg: "price"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "asset_publish_feed":
                color = "warning";
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.publish_feed"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].publisher,
                                    arg: "account"
                                },
                                {
                                    type: "price",
                                    value: op[1].feed.settlement_price,
                                    arg: "price"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "witness_create":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.witness_create"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].witness_account,
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );

                break;

            case "witness_update":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.witness_update"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].witness_account,
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );

                break;

            case "witness_withdraw_pay":
                console.log("witness_withdraw_pay:", op[1].witness_account);
                if (current === op[1].witness_account) {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="transaction.witness_pay"
                            />
                            &nbsp;
                            <FormattedAsset
                                amount={op[1].amount}
                                asset={"1.3.0"}
                            />
                            <Translate
                                component="span"
                                content="transaction.to"
                            />
                            &nbsp;
                            {this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                } else {
                    column = (
                        <span>
                            <Translate
                                component="span"
                                content="transaction.received"
                            />
                            &nbsp;
                            <FormattedAsset
                                amount={op[1].amount}
                                asset={"1.3.0"}
                            />
                            <Translate
                                component="span"
                                content="transaction.from"
                            />
                            &nbsp;
                            {this.linkToAccount(op[1].witness_account)}
                        </span>
                    );
                }
                break;

            case "proposal_create":
                column = (
                    <div className="inline-block">
                        <span>
                            <TranslateWithLinks
                                string="operation.proposal_create"
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].fee_paying_account,
                                        arg: "account"
                                    },
                                    {
                                        value: result ? (
                                            <ShortObjectId
                                                objectId={result[1]}
                                            />
                                        ) : (
                                            ""
                                        ),
                                        arg: "proposal"
                                    }
                                ]}
                            />
                            :
                        </span>
                        <div>
                            {op[1].proposed_ops.map((o, index) => {
                                return (
                                    <ProposedOperation
                                        op={o.op}
                                        key={index}
                                        index={index}
                                        inverted={false}
                                        hideFee={true}
                                        hideOpLabel={true}
                                        hideDate={true}
                                        proposal={true}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
                break;

            case "proposal_update":
                const fields = [
                    "active_approvals_to_add",
                    "active_approvals_to_remove",
                    "owner_approvals_to_add",
                    "owner_approvals_to_remove",
                    "key_approvals_to_add",
                    "key_approvals_to_remove"
                ];
                column = (
                    <div>
                        <span>
                            <TranslateWithLinks
                                string="operation.proposal_update"
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].fee_paying_account,
                                        arg: "account"
                                    },
                                    {
                                        value: (
                                            <ShortObjectId
                                                objectId={op[1].proposal}
                                            />
                                        ),
                                        arg: "proposal"
                                    }
                                ]}
                            />
                        </span>
                        <div className="proposal-update">
                            {fields.map(field => {
                                if (op[1][field].length) {
                                    return (
                                        <div key={field}>
                                            <Translate
                                                content={`proposal.updated.${field}`}
                                            />
                                            <ul>
                                                {op[1][field].map(value => {
                                                    return (
                                                        <li key={value}>
                                                            {field.startsWith(
                                                                "key"
                                                            )
                                                                ? value
                                                                : this.linkToAccount(
                                                                      value
                                                                  )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    );
                                } else return null;
                            })}
                        </div>
                    </div>
                );
                break;

            case "proposal_delete":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.proposal_delete"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].fee_paying_account,
                                    arg: "account"
                                },
                                {
                                    value: (
                                        <ShortObjectId
                                            objectId={op[1].proposal}
                                        />
                                    ),
                                    arg: "proposal"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "withdraw_permission_create":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.withdraw_permission_create"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;
                        {this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "withdraw_permission_update":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.withdraw_permission_update"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;
                        {this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "withdraw_permission_claim":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.withdraw_permission_claim"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;
                        {this.linkToAccount(op[1].withdraw_to_account)}
                    </span>
                );
                break;

            case "withdraw_permission_delete":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.withdraw_permission_delete"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].withdraw_from_account)}
                        <Translate component="span" content="transaction.to" />
                        &nbsp;
                        {this.linkToAccount(op[1].authorized_account)}
                    </span>
                );
                break;

            case "fill_order":
                color = "success";
                o = op[1];

                /*
                marketName = OPEN.ETH_USD
                if (!inverted) (default)
                    price = USD / OPEN.ETH
                    buy / sell OPEN.ETH
                    isBid = amount_to_sell.asset_symbol = USD
                    amount = to_receive
                if (inverted)
                    price =  OPEN.ETH / USD
                    buy / sell USD
                    isBid = amount_to_sell.asset_symbol = OPEN.ETH
                    amount =

                    const {marketName, first, second} = marketUtils.getMarketName(base, quote);
                    const inverted = this.props.marketDirections.get(marketName);
                    // const paySymbol = base.get("symbol");
                    // const receiveSymbol = quote.get("symbol");

                    const isBid = o.amount_to_sell.asset_id === (inverted ? first.get("id") : second.get("id"));

                    let priceBase = (isBid) ? o.amount_to_sell : o.min_to_receive;
                    let priceQuote = (isBid) ? o.min_to_receive : o.amount_to_sell;
                    const amount = isBid ? op[1].min_to_receive : op[1].amount_to_sell;
                */

                column = (
                    <span>
                        <BindToChainState.Wrapper
                            base={o.receives.asset_id}
                            quote={o.pays.asset_id}
                        >
                            {({base, quote}) => {
                                const {
                                    marketName,
                                    first,
                                    second
                                } = marketUtils.getMarketName(base, quote);
                                const inverted = marketDirections.get(
                                    marketName
                                );
                                const isBid =
                                    o.pays.asset_id ===
                                    (inverted
                                        ? first.get("id")
                                        : second.get("id"));

                                // const paySymbol = base.get("symbol");
                                // const receiveSymbol = quote.get("symbol");
                                let priceBase = isBid ? o.receives : o.pays;
                                let priceQuote = isBid ? o.pays : o.receives;
                                let amount = isBid ? o.receives : o.pays;
                                let receivedAmount =
                                    o.fee.asset_id === amount.asset_id
                                        ? amount.amount - o.fee.amount
                                        : amount.amount;

                                return (
                                    <TranslateWithLinks
                                        string={`operation.fill_order_${
                                            isBid ? "buy" : "sell"
                                        }`}
                                        keys={[
                                            {
                                                type: "account",
                                                value: op[1].account_id,
                                                arg: "account"
                                            },
                                            {
                                                type: "amount",
                                                value: {
                                                    amount: receivedAmount,
                                                    asset_id: amount.asset_id
                                                },
                                                arg: "amount"
                                            },
                                            {
                                                type: "price",
                                                value: {
                                                    base: priceBase,
                                                    quote: priceQuote
                                                },
                                                arg: "price"
                                            }
                                        ]}
                                        params={{
                                            order: o.order_id.substring(4)
                                        }}
                                    />
                                );
                            }}
                        </BindToChainState.Wrapper>
                    </span>
                );
                break;

            case "global_parameters_update":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.global_parameters_update"
                        />
                    </span>
                );
                break;

            case "vesting_balance_create":
                column = (
                    <span>
                        &nbsp;
                        {this.linkToAccount(op[1].creator)}
                        <Translate
                            component="span"
                            content="transaction.vesting_balance_create"
                        />
                        &nbsp;
                        <FormattedAsset
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].owner)}
                    </span>
                );
                break;

            case "vesting_balance_withdraw":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.vesting_balance_withdraw"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].owner,
                                    arg: "account"
                                },
                                {
                                    type: "amount",
                                    value: op[1].amount,
                                    arg: "amount"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "worker_create":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.worker_create"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].owner,
                                    arg: "account"
                                },
                                {
                                    type: "amount",
                                    value: {
                                        amount: op[1].daily_pay,
                                        asset_id: "1.3.0"
                                    },
                                    arg: "pay"
                                }
                            ]}
                            params={{
                                name: op[1].name
                            }}
                        />
                    </span>
                );
                break;

            case "balance_claim":
                color = "success";
                op[1].total_claimed.amount = parseInt(
                    op[1].total_claimed.amount,
                    10
                );
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.balance_claim"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].deposit_to_account,
                                    arg: "account"
                                },
                                {
                                    type: "amount",
                                    value: op[1].total_claimed,
                                    arg: "amount"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "committee_member_create":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.committee_member_create"
                        />
                        &nbsp;
                        {this.linkToAccount(op[1].committee_member_account)}
                    </span>
                );
                break;

            case "transfer_to_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].from)}
                        &nbsp;
                        <Translate
                            component="span"
                            content="transaction.sent"
                        />
                        &nbsp;
                        <FormattedAsset
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                    </span>
                );
                break;

            case "transfer_from_blind":
                column = (
                    <span>
                        {this.linkToAccount(op[1].to)}
                        &nbsp;
                        <Translate
                            component="span"
                            content="transaction.received"
                        />
                        &nbsp;
                        <FormattedAsset
                            amount={op[1].amount.amount}
                            asset={op[1].amount.asset_id}
                        />
                    </span>
                );
                break;

            case "asset_claim_fees":
                color = "success";
                op[1].amount_to_claim.amount = parseInt(
                    op[1].amount_to_claim.amount,
                    10
                );
                column = (
                    <span>
                        {this.linkToAccount(op[1].issuer)}
                        &nbsp;
                        <BindToChainState.Wrapper
                            asset={op[1].amount_to_claim.asset_id}
                        >
                            {({asset}) => (
                                <TranslateWithLinks
                                    string="transaction.asset_claim_fees"
                                    keys={[
                                        {
                                            type: "amount",
                                            value: op[1].amount_to_claim,
                                            arg: "balance_amount"
                                        },
                                        {
                                            type: "asset",
                                            value: asset.get("id"),
                                            arg: "asset"
                                        }
                                    ]}
                                />
                            )}
                        </BindToChainState.Wrapper>
                    </span>
                );
                break;

            case "custom":
                column = (
                    <span>
                        <Translate
                            component="span"
                            content="transaction.custom"
                        />
                    </span>
                );
                break;

            case "asset_reserve":
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.asset_reserve"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].payer,
                                    arg: "account"
                                },
                                {
                                    type: "amount",
                                    value: op[1].amount_to_reserve,
                                    arg: "amount"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "committee_member_update_global_parameters":
                console.log(
                    "committee_member_update_global_parameters op:",
                    op
                );
                column = (
                    <span>
                        <TranslateWithLinks
                            string="operation.committee_member_update_global_parameters"
                            keys={[
                                {
                                    type: "account",
                                    value: "1.2.0",
                                    arg: "account"
                                }
                            ]}
                        />
                    </span>
                );
                break;

            case "override_transfer":
                column = (
                    <TranslateWithLinks
                        string="operation.override_transfer"
                        keys={[
                            {
                                type: "account",
                                value: op[1].issuer,
                                arg: "issuer"
                            },
                            {type: "account", value: op[1].from, arg: "from"},
                            {type: "account", value: op[1].to, arg: "to"},
                            {type: "amount", value: op[1].amount, arg: "amount"}
                        ]}
                    />
                );
                break;

            case "asset_settle_cancel":
                column = (
                    <TranslateWithLinks
                        string="operation.asset_settle_cancel"
                        keys={[
                            {
                                type: "account",
                                value: op[1].account,
                                arg: "account"
                            },
                            {type: "amount", value: op[1].amount, arg: "amount"}
                        ]}
                    />
                );
                break;

            case "asset_claim_pool":
                column = (
                    <TranslateWithLinks
                        string="operation.asset_claim_pool"
                        keys={[
                            {
                                type: "account",
                                value: op[1].issuer,
                                arg: "account"
                            },
                            {
                                type: "asset",
                                value: op[1].asset_id,
                                arg: "asset"
                            },
                            {
                                type: "amount",
                                value: op[1].amount_to_claim,
                                arg: "amount"
                            }
                        ]}
                    />
                );
                break;

            case "asset_update_issuer":
                column = (
                    <TranslateWithLinks
                        string="operation.asset_update_issuer"
                        keys={[
                            {
                                type: "account",
                                value: op[1].issuer,
                                arg: "from_account"
                            },
                            {
                                type: "account",
                                value: op[1].new_issuer,
                                arg: "to_account"
                            },
                            {
                                type: "asset",
                                value: op[1].asset_to_update,
                                arg: "asset"
                            }
                        ]}
                    />
                );
                break;

            case "bid_collateral":
                column = (
                    <TranslateWithLinks
                        string="operation.bid_collateral"
                        keys={[
                            {
                                type: "account",
                                value: op[1].bidder,
                                arg: "bid_account"
                            },
                            {
                                type: "amount",
                                value: op[1].additional_collateral,
                                arg: "collateral"
                            },
                            {
                                type: "amount",
                                value: op[1].debt_covered,
                                arg: "debt"
                            }
                        ]}
                    />
                );
                break;
            case "htlc_create":
                const globalObject = ChainStore.getObject("2.0.0");
                const dynGlobalObject = ChainStore.getObject("2.1.0");
                let block_time = utils.calc_block_time(
                    block,
                    globalObject,
                    dynGlobalObject
                );
                let estimated = false;
                if (!block_time) {
                    block_time = utils.calc_block_time(
                        block,
                        globalObject,
                        dynGlobalObject,
                        true
                    );
                    estimated = true;
                }

                op[1].amount.amount = parseFloat(op[1].amount.amount);

                let expiryTime = new Date();

                expiryTime.setTime(
                    block_time.getTime() + op[1].claim_period_seconds * 1000
                );

                column = (
                    <React.Fragment>
                        <span className="right-td">
                            <TranslateWithLinks
                                string="operation.htlc_create"
                                keys={[
                                    {
                                        type: "date",
                                        arg: "lock_period",
                                        value: expiryTime
                                    },
                                    {
                                        type: "account",
                                        value: op[1].from,
                                        arg: "from"
                                    },
                                    {
                                        type: "amount",
                                        value: op[1].amount,
                                        arg: "amount",
                                        decimalOffset:
                                            op[1].amount.asset_id === "1.3.0"
                                                ? 5
                                                : null
                                    },
                                    {
                                        type: "account",
                                        value: op[1].to,
                                        arg: "to"
                                    }
                                ]}
                            />
                            <Tooltip title={"Estimated"}>
                                {estimated ? "*" : ""}
                            </Tooltip>
                        </span>
                        <div
                            className="memo"
                            style={{paddingTop: 5, cursor: "help"}}
                        >
                            <Tooltip
                                placement="bottom"
                                title={counterpart.translate(
                                    "htlc.preimage_hash_explanation"
                                )}
                            >
                                <span className="inline-block">
                                    {counterpart.translate(
                                        "htlc.preimage_hash"
                                    ) +
                                        " (" +
                                        op[1].preimage_size +
                                        ", " +
                                        op[1].preimage_hash[0] +
                                        "): " +
                                        op[1].preimage_hash[1]}
                                </span>
                            </Tooltip>
                        </div>
                    </React.Fragment>
                );
                break;
            case "htlc_redeem":
                color = "success";
                column = (
                    <React.Fragment>
                        <span className="right-td">
                            <TranslateWithLinks
                                string="operation.htlc_redeem"
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].redeemer,
                                        arg: "redeemer"
                                    },
                                    {
                                        value: op[1].htlc_id,
                                        arg: "htlc_id"
                                    }
                                ]}
                            />
                        </span>
                        <div
                            className="memo"
                            style={{paddingTop: 5, cursor: "help"}}
                        >
                            <Tooltip
                                placement="bottom"
                                title={counterpart.translate(
                                    "htlc.preimage_explanation"
                                )}
                            >
                                <span className="inline-block">
                                    {counterpart.translate("htlc.preimage") +
                                        ": " +
                                        op[1].preimage}
                                </span>
                            </Tooltip>
                        </div>
                    </React.Fragment>
                );
                break;
            case "htlc_extend":
                column = (
                    <span className="right-td">
                        <TranslateWithLinks
                            string="operation.htlc_extend"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].update_issuer,
                                    arg: "update_issuer"
                                },
                                {
                                    type: "amount",
                                    arg: "seconds_to_add",
                                    value: op[1].seconds_to_add
                                },
                                {
                                    value: op[1].htlc_id,
                                    arg: "htlc_id"
                                }
                            ]}
                        />
                    </span>
                );
                break;
            case "htlc_redeemed":
                column = (
                    <span className="right-td">
                        <TranslateWithLinks
                            string="operation.htlc_redeemed"
                            keys={[
                                {
                                    type: "account",
                                    value: op[1].to,
                                    arg: "to"
                                },
                                {
                                    type: "account",
                                    value: op[1].from,
                                    arg: "from"
                                },
                                {
                                    type: "amount",
                                    value: op[1].amount,
                                    arg: "amount",
                                    decimalOffset:
                                        op[1].amount.asset_id === "1.3.0"
                                            ? 5
                                            : null
                                },
                                {
                                    value: op[1].htlc_id,
                                    arg: "htlc_id"
                                }
                            ]}
                        />
                    </span>
                );
                break;
            case "htlc_refund":
                color = "warning";
                column = (
                    <span className="right-td">
                        <TranslateWithLinks
                            string="operation.htlc_refund"
                            keys={[
                                {
                                    value: op[1].htlc_id,
                                    arg: "htlc_id"
                                },
                                {
                                    type: "account",
                                    value: op[1].to,
                                    arg: "to"
                                }
                            ]}
                        />
                    </span>
                );

                break;
            default:
                console.log("unimplemented op '" + ops[op[0]] + "':", op);
                column = (
                    <span>
                        <Link to={`/block/${block}`}>#{block}</Link>
                    </span>
                );
        }
        return {column, color};
    }
}

export default Operation;
