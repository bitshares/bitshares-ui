import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router-dom";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import BlockTime from "./BlockTime";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore, ChainTypes as grapheneChainTypes} from "tuscjs";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import PropTypes from "prop-types";
import {Tooltip} from "bitshares-ui-style-guide";

const {operations} = grapheneChainTypes;
import opComponents from "./operations";
require("./operations.scss");

let ops = Object.keys(operations);
// let listings = account_constants.account_listing;

class TransactionLabel extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.color !== this.props.color ||
            nextProps.type !== this.props.type
        );
    }
    render() {
        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("label", this.props.color || "info");
        return (
            <span className={labelClass}>{trxTypes[ops[this.props.type]]}</span>
        );
    }
}

class Row extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0",
        tempComponent: "tr"
    };

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        let {block, dynGlobalObject} = this.props;
        let last_irreversible_block_num = dynGlobalObject.get(
            "last_irreversible_block_num"
        );

        return (
            nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
            block > last_irreversible_block_num ||
            this.props.color !== nextProps.color
        );
    }

    render() {
        let {block, fee, color, type, hideOpLabel, hidePending} = this.props;

        let last_irreversible_block_num = this.props.dynGlobalObject.get(
            "last_irreversible_block_num"
        );
        let pending = null;
        if (!hidePending && block > last_irreversible_block_num) {
            pending = (
                <span>
                    (
                    <Translate
                        content="operation.pending"
                        blocks={block - last_irreversible_block_num}
                    />
                    )
                </span>
            );
        }

        fee.amount = parseInt(fee.amount, 10);

        return (
            <tr>
                {this.props.includeOperationId ? (
                    <td style={{textAlign: "left"}}>
                        {/* {this.props.block}#{this.props.txIndex}<br /> */}
                        {this.props.operationId}
                    </td>
                ) : null}
                {hideOpLabel ? null : (
                    <td
                        style={{textAlign: "left"}}
                        className="left-td column-hide-tiny"
                    >
                        <Tooltip
                            placement="bottom"
                            title={counterpart.translate("tooltip.show_block", {
                                block: utils.format_number(this.props.block, 0)
                            })}
                        >
                            <Link
                                className="inline-block"
                                to={`/block/${this.props.block}/${this.props.txIndex}`}
                            >
                                <TransactionLabel color={color} type={type} />
                            </Link>
                        </Tooltip>
                    </td>
                )}

                <td style={{padding: "8px 5px", textAlign: "left"}}>
                    <div>
                        <span>{this.props.info}</span>
                    </div>
                    <div style={{fontSize: 14, paddingTop: 5}}>
                        {/*<span>{counterpart.translate("explorer.block.title").toLowerCase()} <Link to={`/block/${block}`}>{utils.format_number(block, 0)}</Link></span>*/}
                        {/*{!this.props.hideFee ? (
                            <span className="facolor-fee">
                                {" "}
                                -{" "}
                                <FormattedAsset
                                    amount={fee.amount}
                                    asset={fee.asset_id}
                                />
                            </span>
                        ) : null}*/}
                        {pending ? <span> - {pending}</span> : null}
                    </div>
                </td>
                {!this.props.hideFee && (
                    <td style={{textAlign: "left"}}>
                        <FormattedAsset
                            amount={fee.amount}
                            asset={fee.asset_id}
                        />
                    </td>
                )}
                <td>
                    {!this.props.hideDate ? (
                        <BlockTime
                            block_number={block}
                            fullDate={this.props.fullDate}
                        />
                    ) : null}
                </td>
            </tr>
        );
    }
}

Row = BindToChainState(Row);

class Operation extends React.Component {
    state = {
        labelColor: "info"
    };

    static defaultProps = {
        op: [],
        current: "",
        block: null,
        hideOpLabel: false,
        csvExportMode: false
    };

    static propTypes = {
        op: PropTypes.array.isRequired,
        current: PropTypes.string,
        block: PropTypes.number,
        csvExportMode: PropTypes.bool
    };

    componentWillReceiveProps(np) {
        if (np.marketDirections !== this.props.marketDirections) {
            this.forceUpdate();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.op || !nextProps.op) {
            return false;
        }
        return (
            !utils.are_equal_shallow(nextProps.op[1], this.props.op[1]) ||
            nextProps.marketDirections !== this.props.marketDirections ||
            this.state.labelColor !== nextState.labelColor
        );
    }

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

    changeColor = newColor => {
        const {labelColor} = this.state;
        if (labelColor !== newColor) {
            this.setState({labelColor: newColor});
        }
    };

    render() {
        let {op, block} = this.props;
        let line = null,
            column = null;

        column = opComponents(ops[op[0]], this.props, {
            fromComponent: "operation",
            linkToAccount: this.linkToAccount,
            linkToAsset: this.linkToAsset,
            changeColor: this.changeColor
        });

        if (this.props.csvExportMode) {
            const globalObject = ChainStore.getObject("2.0.0");
            const dynGlobalObject = ChainStore.getObject("2.1.0");
            const block_time = utils.calc_block_time(
                block,
                globalObject,
                dynGlobalObject
            );
            return (
                <div>
                    <div>{block_time ? block_time.toLocaleString() : ""}</div>
                    <div>{ops[op[0]]}</div>
                    <div>{column}</div>
                    <div>
                        <FormattedAsset
                            amount={parseInt(op[1].fee.amount, 10)}
                            asset={op[1].fee.asset_id}
                        />
                    </div>
                </div>
            );
        }

        line = column ? (
            <Row
                operationId={this.props.operationId}
                txIndex={this.props.txIndex}
                includeOperationId={this.props.includeOperationId}
                block={block}
                type={op[0]}
                color={this.state.labelColor}
                fee={op[1].fee}
                hideOpLabel={this.props.hideOpLabel}
                hideDate={this.props.hideDate}
                info={column}
                hideFee={this.props.hideFee}
                hidePending={this.props.hidePending}
                fullDate={this.props.fullDate}
            />
        ) : null;

        return line ? line : <tr />;
    }
}

Operation = connect(
    Operation,
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

export default Operation;
