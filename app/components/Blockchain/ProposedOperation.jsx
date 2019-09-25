import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import {ChainStore, ChainTypes as grapheneChainTypes} from "tuscjs";
// import account_constants from "chain/account_constants";
const {operations} = grapheneChainTypes;
import PropTypes from "prop-types";
import opComponents from "./operations";
import TranslateWithLinks from "../Utility/TranslateWithLinks";

require("./operations.scss");

let ops = Object.keys(operations);
// let listings = account_constants.account_listing;

export const TransactionIDAndExpiry = ({id, expiration, style}) => {
    const endDate = counterpart.localize(new Date(expiration), {
        format: "short"
    });
    return (
        <b style={style}>
            <span>{id} | </span>
            <span>
                <Translate content="proposal.expires" />: {endDate}
            </span>
        </b>
    );
};

class Row extends React.Component {
    constructor(props) {
        super(props);
        this.showDetails = this.showDetails.bind(this);
    }

    showDetails(e) {
        e.preventDefault();
        this.props.history.push(`/block/${this.props.block}`);
    }

    render() {
        let {id, fee, hideFee, hideExpiration, expiration} = this.props;

        fee.amount = parseInt(fee.amount, 10);

        return (
            <div style={{padding: "5px 0", textAlign: "left"}}>
                <span>
                    {this.props.info}
                    &nbsp;
                    {hideFee ? null : (
                        <span className="facolor-fee">
                            (
                            <FormattedAsset
                                amount={fee.amount}
                                asset={fee.asset_id}
                            />{" "}
                            fee)
                        </span>
                    )}
                </span>
                {!hideExpiration && this.props.expiration && (
                    <TransactionIDAndExpiry
                        id={id}
                        expiration={expiration}
                        style={{
                            paddingTop: 5,
                            fontSize: "0.85rem",
                            paddingBottom: "0.5rem",
                            display: "block"
                        }}
                    />
                )}
            </div>
        );
    }
}

class ProposedOperation extends React.Component {
    state = {
        label_color: "info"
    };

    static defaultProps = {
        op: [],
        current: "",
        block: null,
        hideDate: false,
        hideFee: false,
        hideOpLabel: false,
        csvExportMode: false,
        collapsed: true
    };

    static propTypes = {
        op: PropTypes.array.isRequired,
        current: PropTypes.string,
        block: PropTypes.number,
        hideDate: PropTypes.bool,
        hideFee: PropTypes.bool,
        csvExportMode: PropTypes.bool,
        collapsed: PropTypes.bool
    };

    linkToAccount(name_or_id) {
        if (!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ? (
            <LinkToAccountById account={name_or_id} />
        ) : (
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>
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
        const {label_color} = this.state;
        if (label_color !== newColor) {
            this.setState({label_color: newColor});
        }
    };

    // TODO: add scu

    render() {
        let {
            op,
            proposer,
            block,
            hideExpiration,
            index,
            csvExportMode
        } = this.props;
        const {label_color} = this.state;
        let line = null,
            column = null;

        column = opComponents(ops[op[0]], this.props, {
            fromComponent: "proposed_operation",
            linkToAccount: this.linkToAccount,
            linkToAsset: this.linkToAsset,
            changeColor: this.changeColor
        });

        if (!!proposer && index == 0) {
            column = (
                <div className="inline-block">
                    <div style={{paddingBottom: "0.5rem"}}>
                        <TranslateWithLinks
                            string="operation.proposal_create"
                            keys={[
                                {
                                    type: "account",
                                    value: proposer,
                                    arg: "account"
                                }
                            ]}
                        />
                        :
                    </div>
                    <div style={{marginLeft: "0.5rem"}}>{column}</div>
                </div>
            );
        }

        if (csvExportMode) {
            const globalObject = ChainStore.getObject("2.0.0");
            const dynGlobalObject = ChainStore.getObject("2.1.0");
            const block_time = utils.calc_block_time(
                block,
                globalObject,
                dynGlobalObject
            );
            return (
                <div key={this.props.key}>
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
                index={index}
                id={this.props.id}
                block={block}
                type={op[0]}
                color={label_color}
                fee={op[1].fee}
                hideDate={this.props.hideDate}
                hideFee={this.props.hideFee}
                hideOpLabel={this.props.hideOpLabel}
                info={column}
                expiration={this.props.expiration}
                hideExpiration={hideExpiration}
            />
        ) : null;

        return line ? line : <div />;
    }
}

export default ProposedOperation;
