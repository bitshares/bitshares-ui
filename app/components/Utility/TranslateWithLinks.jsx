import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import {Link} from "react-router-dom";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";

/**
 *  Given a string and a list of interpolation parameters, this component
 *  will translate that string and replace the following:
 *
 *  account ids/names with links to accounts
 *  asset ids/names with links to assets
 *  amounts with fully formatted amounts with asset symbol
 *  prices with fully formatted prices with symbols
 *
 *  Expected Properties:
 *     string:  translation string key. Objects to interpolate should be wrapped in curly brackets: {amount}
 *     keys: array of objects to interpolate in the string.
 *         lookup goes by arg, which should match the name given inside the curly brackets in the translation string
 *         example:
 *         [{
 *             type: "account"|"amount"|"asset"|"price",
 *             value: "1.2.1"|{amount: 10, asset_id: "1.3.0"}|"1.3.1"|{base: {amount: 1, asset_id: "1.3.0"}, quote: {amount: 100, asset_id: "1.3.20"}}},
 *             arg: "account"|"amount"|"asset"|"price",
 *             decimalOffset: 1 (optional, only used for amounts)
 *         }
 *         ]
 *     params: object contaning simple strings to be interpolated using standard counterpart syntax: %(string)s
 *
 */

export default class TranslateWithLinks extends React.Component {
    shouldComponentUpdate(nextProps) {
        return !utils.are_equal_shallow(nextProps.keys, this.props.keys);
    }

    linkToAccount(name_or_id) {
        const {noLink} = this.props;
        if (!name_or_id) return <span>-</span>;
        return utils.is_object_id(name_or_id) ? (
            <LinkToAccountById account={name_or_id} noLink={noLink} />
        ) : noLink ? (
            <span>{name_or_id}</span>
        ) : (
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>
        );
    }

    linkToAsset(symbol_or_id) {
        const {noLink, noTip} = this.props;
        if (!symbol_or_id) return <span>-</span>;
        return utils.is_object_id(symbol_or_id) ? (
            <LinkToAssetById asset={symbol_or_id} noLink={noLink} />
        ) : noLink ? (
            <AssetName name={symbol_or_id} dataPlace="top" noTip={noTip} />
        ) : (
            <Link to={`/asset/${symbol_or_id}`}>
                <AssetName name={symbol_or_id} dataPlace="top" noTip={noTip} />
            </Link>
        );
    }

    render() {
        let {string, params, keys} = this.props;

        let text = counterpart.translate(string, params);
        let splitText = utils.get_translation_parts(text);

        keys.forEach(key => {
            if (splitText.indexOf(key.arg)) {
                let value;
                switch (key.type) {
                    case "account":
                        value = this.linkToAccount(key.value);
                        break;

                    case "amount":
                        value = (
                            <span>
                                <FormattedAsset
                                    amount={key.value.amount}
                                    asset={key.value.asset_id}
                                    decimalOffset={key.decimalOffset}
                                    hide_asset
                                />
                                &nbsp;
                                {this.linkToAsset(key.value.asset_id)}
                            </span>
                        );

                        break;

                    case "price":
                        value = (
                            <FormattedPrice
                                base_asset={key.value.base.asset_id}
                                base_amount={key.value.base.amount}
                                quote_asset={key.value.quote.asset_id}
                                quote_amount={key.value.quote.amount}
                            />
                        );
                        break;

                    case "asset":
                        value = this.linkToAsset(key.value);
                        break;

                    case "translate":
                        value = <Translate content={key.value} />;
                        break;

                    case "link":
                        value = (
                            <Link
                                to={key.value}
                                data-intro={
                                    key.dataIntro ? key.dataIntro : null
                                }
                            >
                                <Translate content={key.translation} />
                            </Link>
                        );
                        break;

                    case "icon":
                        let title = name.replace("-", "_");
                        value = (
                            <Icon
                                className={key.className}
                                name={key.value}
                                title={title}
                            />
                        );
                        break;

                    case "change":
                        if (key.value && Object.keys(key.value).length > 0) {
                            const {votes, active, owner, memo} = key.value;
                            const voteDiv = votes && (
                                <div>
                                    <Translate content={"proposal.votes"} />
                                    {votes.minus.length ? (
                                        <div>
                                            {"- " +
                                                counterpart.translate(
                                                    "proposal.remove"
                                                ) +
                                                " "}{" "}
                                            {votes.minus.join(", ")}
                                        </div>
                                    ) : null}
                                    {votes.plus.length ? (
                                        <div>
                                            {"- " +
                                                counterpart.translate(
                                                    "proposal.add"
                                                ) +
                                                " "}{" "}
                                            {votes.plus.join(", ")}
                                        </div>
                                    ) : null}
                                </div>
                            );
                            const warning = (active || owner || memo) && (
                                <div>
                                    <Translate
                                        content={"proposal.permission_changes"}
                                    />
                                    {", "}
                                    <Translate
                                        style={{color: "red"}}
                                        content={"proposal.danger_operation"}
                                    />
                                    {"!"}
                                </div>
                            );
                            const activeDiv = active && (
                                <React.Fragment>
                                    <Translate
                                        content={"proposal.changes_to_active"}
                                    />
                                    <div style={{marginLeft: "0.5rem"}}>
                                        {active.keys.plus.length > 0 ||
                                            (active.accounts.plus.length >
                                                0 && (
                                                <div>
                                                    {"- " +
                                                        counterpart.translate(
                                                            "proposal.add"
                                                        ) +
                                                        " "}
                                                    {active.keys.plus.join(
                                                        ", "
                                                    )}{" "}
                                                    {active.accounts.plus.map(
                                                        _tmp => (
                                                            <span key={_tmp}>
                                                                {this.linkToAccount(
                                                                    _tmp
                                                                )}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        {active.keys.minus.length > 0 ||
                                            (active.accounts.minus.length >
                                                0 && (
                                                <div>
                                                    {"- " +
                                                        counterpart.translate(
                                                            "proposal.remove"
                                                        ) +
                                                        " "}
                                                    {active.keys.minus.join(
                                                        ", "
                                                    )}{" "}
                                                    {active.accounts.minus.map(
                                                        _tmp => (
                                                            <span key={_tmp}>
                                                                {this.linkToAccount(
                                                                    _tmp
                                                                )}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        {active.weight_threshold && (
                                            <div>
                                                {"- " +
                                                    counterpart.translate(
                                                        "proposal.set_threshold",
                                                        {
                                                            threshold:
                                                                active.weight_threshold
                                                        }
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                            const ownerDiv = owner && (
                                <React.Fragment>
                                    <Translate
                                        content={"proposal.changes_to_owner"}
                                    />
                                    <div style={{marginLeft: "0.5rem"}}>
                                        {owner.keys.plus.length > 0 ||
                                            (owner.accounts.plus.length > 0 && (
                                                <div>
                                                    {"- " +
                                                        counterpart.translate(
                                                            "proposal.add"
                                                        ) +
                                                        " "}
                                                    {owner.keys.plus.join(", ")}{" "}
                                                    {owner.accounts.plus.map(
                                                        _tmp => (
                                                            <span key={_tmp}>
                                                                {this.linkToAccount(
                                                                    _tmp
                                                                )}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        {owner.keys.minus.length > 0 ||
                                            (owner.accounts.minus.length >
                                                0 && (
                                                <div>
                                                    {"- " +
                                                        counterpart.translate(
                                                            "proposal.remove"
                                                        ) +
                                                        " "}
                                                    {owner.keys.minus.join(
                                                        ", "
                                                    )}{" "}
                                                    {owner.accounts.minus.map(
                                                        _tmp => (
                                                            <span key={_tmp}>
                                                                {this.linkToAccount(
                                                                    _tmp
                                                                )}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        {owner.weight_threshold && (
                                            <div>
                                                {"- " +
                                                    counterpart.translate(
                                                        "proposal.set_threshold",
                                                        {
                                                            threshold:
                                                                owner.weight_threshold
                                                        }
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                            const memoDiv = memo &&
                                (memo.keys.plus.length > 0 ||
                                    memo.keys.minus.length > 0) && (
                                    <div>
                                        <Translate
                                            content={"proposal.changes_to_memo"}
                                        />
                                        {memo.keys.plus.length > 0 && (
                                            <div>
                                                {" "}
                                                + {memo.keys.plus.join(", ")}
                                            </div>
                                        )}
                                        {memo.keys.minus.length > 0 && (
                                            <div>
                                                {" "}
                                                - {memo.keys.minus.join(", ")}
                                            </div>
                                        )}
                                    </div>
                                );
                            value = (
                                <div
                                    style={{
                                        marginLeft: "0.5rem",
                                        marginTop: "0.5rem"
                                    }}
                                >
                                    {warning}
                                    {voteDiv}
                                    {activeDiv}
                                    {ownerDiv}
                                    {memoDiv}
                                </div>
                            );
                        } else {
                            value = "";
                        }
                        break;
                    case "date":
                        if (key.value === null) {
                            value = "-";
                        } else {
                            value = counterpart.localize(key.value, {
                                type: "date",
                                format: "full"
                            });
                        }
                        break;

                    default:
                        value = key.value;
                        break;
                }

                splitText[splitText.indexOf(key.arg)] = value;
            }
        });

        let finalText = splitText.map((text, index) => {
            return <span key={index}>{text}</span>;
        });

        return <span>{finalText}</span>;
    }
}
