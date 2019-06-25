import React from "react";
import PropTypes from "prop-types";
import AssetActions from "actions/AssetActions";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router-dom";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LinkToAccountById from "../Utility/LinkToAccountById";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetName from "../Utility/AssetName";
import {ChainStore} from "bitsharesjs";
import utils from "common/utils";
import ls from "common/localStorage";
import {Apis} from "bitsharesjs-ws";
import {Radio, Table, Select, Icon} from "bitshares-ui-style-guide";
import {List} from "antd";
import SearchInput from "../Utility/SearchInput";

let accountStorage = new ls("__graphene__");

class Assets extends React.Component {
    constructor(props) {
        super();

        let chainID = Apis.instance().chain_id;
        if (chainID) chainID = chainID.substr(0, 8);
        else chainID = "4018d784";

        this.state = {
            chainID,
            foundLast: false,
            lastAsset: "",
            isLoading: false,
            totalAssets:
                typeof accountStorage.get(`totalAssets_${chainID}`) != "object"
                    ? accountStorage.get(`totalAssets_${chainID}`)
                    : chainID && chainID === "4018d784"
                        ? 3000
                        : 50, // mainnet has 3000+ assets, other chains may not have that many
            assetsFetched: 0,
            activeFilter: "market",
            filterSearch: props.filterSearch || "",
            rowsOnPage: "25"
        };

        this._toggleFilter = this._toggleFilter.bind(this);
        this.handleRowsChange = this.handleRowsChange.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    componentWillMount() {
        this._checkAssets(this.props.assets, true);
    }

    handleFilterChange(e) {
        this.setState({
            filterSearch: (e.target.value || "").toUpperCase()
        });
    }

    handleRowsChange(rows) {
        this.setState({
            rowsOnPage: rows
        });
    }

    _checkAssets(assets, force) {
        this.setState({isLoading: true});
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

        if (assets.size > this.state.totalAssets) {
            accountStorage.set(
                `totalAssets_${this.state.chainID}`,
                assets.size
            );
        }

        if (this.state.assetsFetched >= this.state.totalAssets - 100) {
            this.setState({isLoading: false});
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.assets !== this.props.assets) {
            this._checkAssets(nextProps.assets);
        }
    }

    linkToAccount(name_or_id) {
        if (!name_or_id) {
            return <span>-</span>;
        }

        return <LinkToAccountById account={name_or_id} />;
    }

    _toggleFilter(e) {
        this.setState({
            activeFilter: e.target.value
        });
    }

    _onFilter(type, e) {
        this.setState({[type]: e.target.value.toUpperCase()});
        SettingsActions.changeViewSetting({
            [type]: e.target.value.toUpperCase()
        });
    }

    render() {
        let {assets} = this.props;
        let {activeFilter} = this.state;

        let placeholder = counterpart.translate("markets.filter").toUpperCase();
        let coreAsset = ChainStore.getAsset("1.3.0");

        let pm;

        let dataSource = [];
        let columns = [];

        // Default sorting of the ant table is defined through defaultSortOrder prop

        if (activeFilter == "user") {
            columns = [
                {
                    key: "symbol",
                    title: "symbol",
                    dataIndex: "symbol",
                    defaultSortOrder: "ascend",
                    sorter: (a, b) => {
                        return a.symbol > b.symbol
                            ? 1
                            : a.symbol < b.symbol
                                ? -1
                                : 0;
                    },
                    render: item => {
                        return (
                            <Link to={`/asset/${item}`}>
                                <AssetName name={item} />
                            </Link>
                        );
                    }
                },
                {
                    key: "issuer",
                    title: "issuer",
                    dataIndex: "issuer",
                    sorter: (a, b) => {
                        let issuerA = ChainStore.getAccount(a.issuer, false);
                        let issuerB = ChainStore.getAccount(b.issuer, false);
                        if (issuerA) issuerA = issuerA.get("name");
                        if (issuerB) issuerB = issuerB.get("name");
                        if (issuerA > issuerB) return 1;
                        if (issuerA < issuerB) return -1;
                        return 0;
                    },
                    render: item => {
                        return this.linkToAccount(item);
                    }
                },
                {
                    key: "currentSupply",
                    title: "Supply",
                    dataIndex: "currentSupply",
                    sorter: (a, b) => {
                        a.currentSupply = parseFloat(a.currentSupply);
                        b.currentSupply = parseFloat(b.currentSupply);
                        return a.currentSupply > b.currentSupply
                            ? 1
                            : a.currentSupply < b.currentSupply
                                ? -1
                                : 0;
                    },
                    render: (item, record) => {
                        return (
                            <FormattedAsset
                                amount={record.currentSupply}
                                asset={record.assetId}
                                hide_asset={true}
                            />
                        );
                    }
                },
                {
                    key: "marketId",
                    title: "",
                    dataIndex: "marketId",
                    render: item => {
                        return (
                            <Link to={`/market/${item}`}>
                                <Icon type={"line-chart"} />{" "}
                                <Translate content="header.exchange" />
                            </Link>
                        );
                    }
                }
            ];

            assets
                .filter(a => {
                    return (
                        !a.market_asset &&
                        a.symbol.indexOf(this.state.filterSearch) !== -1
                    );
                })
                .map(asset => {
                    let description = assetUtils.parseDescription(
                        asset.options.description
                    );

                    let marketID =
                        asset.symbol +
                        "_" +
                        (description.market
                            ? description.market
                            : coreAsset
                                ? coreAsset.get("symbol")
                                : "BTS");

                    dataSource.push({
                        symbol: asset.symbol,
                        issuer: asset.issuer,
                        currentSupply: asset.dynamic.current_supply,
                        assetId: asset.id,
                        marketId: marketID
                    });
                });
        }

        if (activeFilter == "market") {
            columns = [
                {
                    key: "symbol",
                    title: "symbol",
                    dataIndex: "symbol",
                    defaultSortOrder: "ascend",
                    sorter: (a, b) => {
                        return a.symbol > b.symbol
                            ? 1
                            : a.symbol < b.symbol
                                ? -1
                                : 0;
                    },
                    render: item => {
                        return (
                            <Link to={`/asset/${item}`}>
                                <AssetName name={item} />
                            </Link>
                        );
                    }
                },
                {
                    key: "issuer",
                    title: "issuer",
                    dataIndex: "issuer",
                    sorter: (a, b) => {
                        let issuerA = ChainStore.getAccount(a.issuer, false);
                        let issuerB = ChainStore.getAccount(b.issuer, false);
                        if (issuerA) issuerA = issuerA.get("name");
                        if (issuerB) issuerB = issuerB.get("name");
                        if (issuerA > issuerB) return 1;
                        if (issuerA < issuerB) return -1;
                        return 0;
                    },
                    render: item => {
                        return this.linkToAccount(item);
                    }
                },
                {
                    key: "currentSupply",
                    title: "Supply",
                    dataIndex: "currentSupply",
                    sorter: (a, b) => {
                        a.currentSupply = parseFloat(a.currentSupply);
                        b.currentSupply = parseFloat(b.currentSupply);
                        return a.currentSupply > b.currentSupply
                            ? 1
                            : a.currentSupply < b.currentSupply
                                ? -1
                                : 0;
                    },
                    render: (item, record) => {
                        return (
                            <FormattedAsset
                                amount={record.currentSupply}
                                asset={record.assetId}
                                hide_asset={true}
                            />
                        );
                    }
                },
                {
                    key: "marketId",
                    title: "",
                    dataIndex: "marketId",
                    render: item => {
                        return (
                            <Link to={`/market/${item}`}>
                                <Icon type={"line-chart"} />{" "}
                                <Translate content="header.exchange" />
                            </Link>
                        );
                    }
                }
            ];

            assets
                .filter(a => {
                    return (
                        a.bitasset_data &&
                        !a.bitasset_data.is_prediction_market &&
                        a.symbol.indexOf(this.state.filterSearch) !== -1
                    );
                })
                .map(asset => {
                    let description = assetUtils.parseDescription(
                        asset.options.description
                    );

                    let marketID =
                        asset.symbol +
                        "_" +
                        (description.market
                            ? description.market
                            : coreAsset
                                ? coreAsset.get("symbol")
                                : "BTS");

                    dataSource.push({
                        symbol: asset.symbol,
                        issuer: asset.issuer,
                        currentSupply: asset.dynamic.current_supply,
                        assetId: asset.id,
                        marketId: marketID
                    });
                });
        }

        if (activeFilter == "prediction") {
            pm = assets
                .filter(a => {
                    let description = assetUtils.parseDescription(
                        a.options.description
                    );

                    return (
                        a.bitasset_data &&
                        a.bitasset_data.is_prediction_market &&
                        (a.symbol
                            .toLowerCase()
                            .indexOf(this.state.filterSearch.toLowerCase()) !==
                            -1 ||
                            description.main
                                .toLowerCase()
                                .indexOf(
                                    this.state.filterSearch.toLowerCase()
                                ) !== -1)
                    );
                })
                .sort((a, b) => {
                    if (a.symbol < b.symbol) {
                        return -1;
                    } else if (a.symbol > b.symbol) {
                        return 1;
                    } else {
                        return 0;
                    }
                })
                .map(asset => {
                    let description = assetUtils.parseDescription(
                        asset.options.description
                    );
                    let marketID =
                        asset.symbol +
                        "_" +
                        (description.market
                            ? description.market
                            : coreAsset
                                ? coreAsset.get("symbol")
                                : "BTS");

                    return {
                        asset,
                        description,
                        marketID
                    };
                })
                .toArray();
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-block vertical">
                    <div className="grid-block main-content small-12 medium-10 medium-offset-1 main-content vertical">
                        <div className="generic-bordered-box">
                            <div
                                style={{
                                    textAlign: "left",
                                    marginBottom: "24px"
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "0px",
                                        marginTop: "2px",
                                        float: "left",
                                        fontSize: "18px"
                                    }}
                                >
                                    {this.state.isLoading ? (
                                        <Icon type="loading" />
                                    ) : null}
                                </span>
                                <SearchInput
                                    value={this.state.filterSearch}
                                    style={{width: "200px"}}
                                    onChange={this.handleFilterChange}
                                />
                                <Radio.Group
                                    value={this.state.activeFilter}
                                    onChange={this._toggleFilter}
                                    style={{
                                        marginBottom: "7px",
                                        marginLeft: "24px"
                                    }}
                                >
                                    <Radio value={"market"}>
                                        <Translate content="explorer.assets.market" />
                                    </Radio>
                                    <Radio value={"user"}>
                                        <Translate content="explorer.assets.user" />
                                    </Radio>
                                    <Radio value={"prediction"}>
                                        <Translate content="explorer.assets.prediction" />
                                    </Radio>
                                </Radio.Group>

                                <Select
                                    style={{width: "150px", marginLeft: "24px"}}
                                    value={this.state.rowsOnPage}
                                    onChange={this.handleRowsChange}
                                >
                                    <Select.Option key={"10"}>
                                        10 rows
                                    </Select.Option>
                                    <Select.Option key={"25"}>
                                        25 rows
                                    </Select.Option>
                                    <Select.Option key={"50"}>
                                        50 rows
                                    </Select.Option>
                                    <Select.Option key={"100"}>
                                        100 rows
                                    </Select.Option>
                                    <Select.Option key={"200"}>
                                        200 rows
                                    </Select.Option>
                                </Select>
                            </div>

                            {activeFilter == "prediction" ? (
                                <List
                                    style={{paddingBottom: 20}}
                                    size="large"
                                    itemLayout="horizontal"
                                    dataSource={pm}
                                    renderItem={item => (
                                        <List.Item
                                            key={item.asset.id.split(".")[2]}
                                            actions={[
                                                <Link
                                                    className="button outline"
                                                    to={`/market/${
                                                        item.marketID
                                                    }`}
                                                >
                                                    <Translate content="header.exchange" />
                                                </Link>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                title={
                                                    <div>
                                                        <span
                                                            style={{
                                                                paddingTop: 10,
                                                                fontWeight:
                                                                    "bold"
                                                            }}
                                                        >
                                                            <Link
                                                                to={`/asset/${
                                                                    item.asset
                                                                        .symbol
                                                                }`}
                                                            >
                                                                <AssetName
                                                                    name={
                                                                        item
                                                                            .asset
                                                                            .symbol
                                                                    }
                                                                />
                                                            </Link>
                                                        </span>
                                                        {item.description
                                                            .condition ? (
                                                            <span>
                                                                {" "}
                                                                (
                                                                {
                                                                    item
                                                                        .description
                                                                        .condition
                                                                }
                                                                )
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                }
                                                description={
                                                    <span>
                                                        {item.description ? (
                                                            <div
                                                                style={{
                                                                    padding:
                                                                        "10px 20px 5px 0",
                                                                    lineHeight:
                                                                        "18px"
                                                                }}
                                                            >
                                                                {
                                                                    item
                                                                        .description
                                                                        .main
                                                                }
                                                            </div>
                                                        ) : null}
                                                        <span
                                                            style={{
                                                                padding:
                                                                    "0 20px 5px 0",
                                                                lineHeight:
                                                                    "18px"
                                                            }}
                                                        >
                                                            <LinkToAccountById
                                                                account={
                                                                    item.asset
                                                                        .issuer
                                                                }
                                                            />
                                                            <span>
                                                                {" "}
                                                                -{" "}
                                                                <FormattedAsset
                                                                    amount={
                                                                        item
                                                                            .asset
                                                                            .dynamic
                                                                            .current_supply
                                                                    }
                                                                    asset={
                                                                        item
                                                                            .asset
                                                                            .id
                                                                    }
                                                                />
                                                            </span>
                                                            {item.description
                                                                .expiry ? (
                                                                <span>
                                                                    {" "}
                                                                    -{" "}
                                                                    {
                                                                        item
                                                                            .description
                                                                            .expiry
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                    </span>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                    pagination={{
                                        position: "bottom",
                                        pageSize: 6
                                    }}
                                />
                            ) : (
                                <Table
                                    style={{width: "100%", marginTop: "16px"}}
                                    rowKey="symbol"
                                    columns={columns}
                                    dataSource={dataSource}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Assets.defaultProps = {
    assets: {}
};

Assets.propTypes = {
    assets: PropTypes.object.isRequired
};

export default Assets;
