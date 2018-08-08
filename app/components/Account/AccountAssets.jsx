import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
import AccountActions from "actions/AccountActions";
import BaseModal from "../Modal/BaseModal";
import FormattedAsset from "../Utility/FormattedAsset";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import utils from "common/utils";
import {debounce} from "lodash-es";
import LoadingIndicator from "../LoadingIndicator";
import IssueModal from "../Modal/IssueModal";
import ReserveAssetModal from "../Modal/ReserveAssetModal";
import {connect} from "alt-react";
import assetUtils from "common/asset_utils";
import {Map, List} from "immutable";
import AssetWrapper from "../Utility/AssetWrapper";
import {Tabs, Tab} from "../Utility/Tabs";

class AccountAssets extends React.Component {
    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    };

    static propTypes = {
        symbol: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            create: {
                symbol: "",
                name: "",
                description: "",
                max_supply: 1000000000000000,
                precision: 4
            },
            issue: {
                amount: 0,
                to: "",
                to_id: "",
                asset_id: "",
                symbol: ""
            },
            errors: {
                symbol: null
            },
            isValid: false,
            searchTerm: ""
        };

        this._searchAccounts = debounce(this._searchAccounts, 150);
    }

    _checkAssets(assets, force) {
        if (this.props.account.get("assets").size) return;
        let lastAsset = assets
            .sort((a, b) => {
                if (a.symbol > b.symbol) {
                    return 1;
                } else if (a.symbol < b.symbol) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .last();

        if (assets.size === 0 || force) {
            AssetActions.getAssetList.defer("A", 100);
            this.setState({assetsFetched: 100});
        } else if (assets.size >= this.state.assetsFetched) {
            AssetActions.getAssetList.defer(lastAsset.symbol, 100);
            this.setState({assetsFetched: this.state.assetsFetched + 99});
        }
    }

    componentWillReceiveProps(nextProps) {
        this._checkAssets(nextProps.assets);
    }

    componentWillMount() {
        this._checkAssets(this.props.assets, true);
    }

    _onIssueInput(value, e) {
        let key = e.target.id;
        let {issue} = this.state;

        if (key === "to") {
            this._searchAccounts(e.target.value);
            issue.to = e.target.value;
            let account = this.props.searchAccounts.findEntry(name => {
                return name === e.target.value;
            });

            issue.to_id = account ? account[0] : null;
        } else {
            issue[value] = e.target.value;
        }

        this.setState({issue: issue});
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    _issueAsset(account_id, e) {
        e.preventDefault();
        ZfApi.publish("issue_asset", "close");
        let {issue} = this.state;
        let asset = this.props.assets.get(issue.asset_id);
        issue.amount *= utils.get_asset_precision(asset.precision);
        AssetActions.issueAsset(account_id, issue).then(result => {
            if (result) {
                notify.addNotification({
                    message: `Successfully issued ${utils.format_asset(
                        issue.amount,
                        this.props.assets.get(issue.asset_id)
                    )}`, //: ${this.state.wallet_public_name}
                    level: "success",
                    autoDismiss: 10
                });

                // Update the data for the asset
                ChainStore.getAsset(issue.asset_id);
            } else {
                notify.addNotification({
                    message: "Failed to issue asset", //: ${this.state.wallet_public_name}
                    level: "error",
                    autoDismiss: 10
                });
            }
        });
    }

    _reserveButtonClick(assetId, e) {
        e.preventDefault();
        this.setState({reserve: assetId});
        ZfApi.publish("reserve_asset", "open");
    }

    _reserveAsset(account_id, e) {
        e.preventDefault();
        ZfApi.publish("reserve_asset", "close");
        let {issue} = this.state;
        let asset = this.props.assets.get(issue.asset_id);
        issue.amount *= utils.get_asset_precision(asset.precision);
        AssetActions.issueAsset(account_id, issue);
    }

    _issueButtonClick(asset_id, symbol, e) {
        e.preventDefault();
        let {issue} = this.state;
        issue.asset_id = asset_id;
        issue.symbol = symbol;
        this.setState({issue: issue});
        ZfApi.publish("issue_asset", "open");
    }

    _editButtonClick(symbol, account_name, e) {
        e.preventDefault();
        this.props.history.push(
            `/account/${account_name}/update-asset/${symbol}`
        );
    }

    _onAccountSelect(account_name) {
        let {issue} = this.state;
        issue.to = account_name;
        issue.to_id = this.props.account_name_to_id[account_name];
        this.setState({issue: issue});
    }

    render() {
        let {account, account_name, assets, assetsList} = this.props;

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle" />;
        } else if (account.notFound) {
            accountExists = false;
        }
        if (!accountExists) {
            return (
                <div className="grid-block">
                    <h5>
                        <Translate
                            component="h5"
                            content="account.errors.not_found"
                            name={account_name}
                        />
                    </h5>
                </div>
            );
        }

        if (assetsList.length) {
            assets = assets.clear();
            assetsList.forEach(a => {
                if (a) assets = assets.set(a.get("id"), a.toJS());
            });
        }
        let myAssets = assets
            .filter(asset => {
                return asset.issuer === account.get("id");
            })
            .sort((a, b) => {
                return (
                    parseInt(a.id.substring(4, a.id.length), 10) -
                    parseInt(b.id.substring(4, b.id.length), 10)
                );
            })
            .map(asset => {
                let description = assetUtils.parseDescription(
                    asset.options.description
                );
                let desc = description.short_name
                    ? description.short_name
                    : description.main;

                if (desc.length > 100) {
                    desc = desc.substr(0, 100) + "...";
                }

                const dynamicObject = this.props.getDynamicObject(
                    asset.dynamic_asset_data_id
                );

                return (
                    <tr key={asset.symbol}>
                        <td>
                            <Link to={`/asset/${asset.symbol}`}>
                                {asset.symbol}
                            </Link>
                        </td>
                        <td style={{maxWidth: "250px"}}>{desc}</td>
                        <td>
                            {dynamicObject ? (
                                <FormattedAsset
                                    amount={parseInt(
                                        dynamicObject.get("current_supply"),
                                        10
                                    )}
                                    asset={asset.id}
                                />
                            ) : null}
                        </td>
                        <td>
                            <FormattedAsset
                                amount={parseInt(asset.options.max_supply, 10)}
                                asset={asset.id}
                            />
                        </td>
                        <td>
                            {!asset.bitasset_data_id ? (
                                <button
                                    onClick={this._issueButtonClick.bind(
                                        this,
                                        asset.id,
                                        asset.symbol
                                    )}
                                    className="button"
                                >
                                    <Translate content="transaction.trxTypes.asset_issue" />
                                </button>
                            ) : null}
                        </td>

                        <td>
                            {!asset.bitasset_data_id ? (
                                <button
                                    onClick={this._reserveButtonClick.bind(
                                        this,
                                        asset.id
                                    )}
                                    className="button"
                                >
                                    <Translate content="transaction.trxTypes.asset_reserve" />
                                </button>
                            ) : null}
                        </td>

                        <td>
                            <button
                                onClick={this._editButtonClick.bind(
                                    this,
                                    asset.symbol,
                                    account_name
                                )}
                                className="button"
                            >
                                <Translate content="transaction.trxTypes.asset_update" />
                            </button>
                        </td>
                    </tr>
                );
            })
            .toArray();

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            segmented={false}
                            setting="issuedAssetsTab"
                            className="account-tabs"
                            tabsClass="account-overview bordered-header content-block"
                            contentClass="padding"
                        >
                            <Tab title="account.user_issued_assets.issued_assets">
                                <div className="content-block">
                                    <table className="table dashboard-table table-hover">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <Translate content="account.user_issued_assets.symbol" />
                                                </th>
                                                <th style={{maxWidth: "200px"}}>
                                                    <Translate content="account.user_issued_assets.description" />
                                                </th>
                                                <Translate
                                                    component="th"
                                                    content="markets.supply"
                                                />
                                                <th>
                                                    <Translate content="account.user_issued_assets.max_supply" />
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "center"
                                                    }}
                                                    colSpan="3"
                                                >
                                                    <Translate content="account.perm.action" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>{myAssets}</tbody>
                                    </table>
                                </div>

                                <div className="content-block">
                                    <Link
                                        to={`/account/${account_name}/create-asset/`}
                                    >
                                        <button className="button">
                                            <Translate content="transaction.trxTypes.asset_create" />
                                        </button>
                                    </Link>
                                </div>
                            </Tab>
                        </Tabs>
                    </div>

                    <BaseModal id="issue_asset" overlay={true}>
                        <br />
                        <div className="grid-block vertical">
                            <IssueModal
                                asset_to_issue={this.state.issue.asset_id}
                                onClose={() => {
                                    ZfApi.publish("issue_asset", "close");
                                }}
                            />
                        </div>
                    </BaseModal>

                    <BaseModal id="reserve_asset" overlay={true}>
                        <br />
                        <div className="grid-block vertical">
                            <ReserveAssetModal
                                assetId={this.state.reserve}
                                account={account}
                                onClose={() => {
                                    ZfApi.publish("reserve_asset", "close");
                                }}
                            />
                        </div>
                    </BaseModal>
                </div>
            </div>
        );
    }
}

AccountAssets = AssetWrapper(AccountAssets, {
    propNames: ["assetsList"],
    asList: true,
    withDynamic: true
});

export default connect(AccountAssets, {
    listenTo() {
        return [AssetStore];
    },
    getProps(props) {
        let assets = Map(),
            assetsList = List();
        if (props.account.get("assets", []).size) {
            props.account.get("assets", []).forEach(id => {
                assetsList = assetsList.push(id);
            });
        } else {
            assets = AssetStore.getState().assets;
        }
        return {assets, assetsList};
    }
});
