import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
import AccountActions from "actions/AccountActions";
import FormattedAsset from "../Utility/FormattedAsset";
import {debounce} from "lodash-es";
import LoadingIndicator from "../LoadingIndicator";
import IssueModal from "../Modal/IssueModal";
import {connect} from "alt-react";
import assetUtils from "common/asset_utils";
import {Map, List} from "immutable";
import AssetWrapper from "../Utility/AssetWrapper";
import {Tabs, Tab} from "../Utility/Tabs";
import Icon from "../Icon/Icon";

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
            isIssueAssetModalVisible: false,
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

        this.showIssueAssetModal = this.showIssueAssetModal.bind(this);
        this.hideIssueAssetModal = this.hideIssueAssetModal.bind(this);
    }

    showIssueAssetModal() {
        this.setState({
            isIssueAssetModalVisible: true
        });
    }

    hideIssueAssetModal() {
        this.setState({
            isIssueAssetModalVisible: false
        });
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

    _issueButtonClick(asset_id, symbol, e) {
        e.preventDefault();
        let {issue} = this.state;
        issue.asset_id = asset_id;
        issue.symbol = symbol;
        this.setState({issue: issue});
        this.showIssueAssetModal();
    }

    _editButtonClick(symbol, account_name, e) {
        e.preventDefault();
        this.props.history.push(
            `/account/${account_name}/update-asset/${symbol}`
        );
    }

    _createButtonClick(account_name) {
        this.props.history.push(`/account/${account_name}/create-asset`);
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
                        <td style={{textAlign: "left"}}>
                            <Link to={`/asset/${asset.symbol}`}>
                                {asset.symbol}
                            </Link>
                        </td>
                        <td style={{textAlign: "left"}}>
                            {"bitasset" in asset ? (
                                asset.bitasset.is_prediction_market ? (
                                    <Translate content="account.user_issued_assets.pm" />
                                ) : (
                                    <Translate content="account.user_issued_assets.mpa" />
                                )
                            ) : (
                                "User Issued Asset"
                            )}
                        </td>
                        <td style={{textAlign: "right"}}>
                            {dynamicObject ? (
                                <FormattedAsset
                                    hide_asset
                                    amount={parseInt(
                                        dynamicObject.get("current_supply"),
                                        10
                                    )}
                                    asset={asset.id}
                                />
                            ) : null}
                        </td>
                        <td style={{textAlign: "right"}}>
                            <FormattedAsset
                                hide_asset
                                amount={parseInt(asset.options.max_supply, 10)}
                                asset={asset.id}
                            />
                        </td>
                        <td>
                            {!asset.bitasset_data_id ? (
                                <a
                                    onClick={this._issueButtonClick.bind(
                                        this,
                                        asset.id,
                                        asset.symbol
                                    )}
                                >
                                    <Icon
                                        name="cross-circle"
                                        className="rotate45"
                                    />
                                </a>
                            ) : null}
                        </td>

                        <td>
                            <a
                                onClick={this._editButtonClick.bind(
                                    this,
                                    asset.symbol,
                                    account_name
                                )}
                            >
                                <Icon name="dashboard" />
                            </a>
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
                                    <table className="table dashboard-table">
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: "left"}}>
                                                    <Translate content="account.user_issued_assets.symbol" />
                                                </th>
                                                <th style={{textAlign: "left"}}>
                                                    <Translate content="explorer.asset.summary.asset_type" />
                                                </th>
                                                <Translate
                                                    component="th"
                                                    content="markets.supply"
                                                    style={{textAlign: "right"}}
                                                />
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="account.user_issued_assets.max_supply" />
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    <Translate content="transaction.trxTypes.asset_issue" />
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    <Translate content="transaction.trxTypes.asset_update" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>{myAssets}</tbody>
                                    </table>
                                </div>

                                <div className="content-block">
                                    <button
                                        className="button"
                                        onClick={this._createButtonClick.bind(
                                            this,
                                            account_name
                                        )}
                                    >
                                        <Translate content="transaction.trxTypes.asset_create" />
                                    </button>
                                </div>
                            </Tab>
                        </Tabs>
                    </div>

                    <IssueModal
                        visible={this.state.isIssueAssetModalVisible}
                        hideModal={this.hideIssueAssetModal}
                        showModal={this.showIssueAssetModal}
                        asset_to_issue={this.state.issue.asset_id}
                    />
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

export default connect(
    AccountAssets,
    {
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
    }
);
