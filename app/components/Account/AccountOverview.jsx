import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import MarginPositionsTable from "./MarginPositionsTable";
import {RecentTransactions} from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "bitsharesjs";
import SettingsActions from "actions/SettingsActions";
import utils from "common/utils";
import {Tabs, Tab} from "../Utility/Tabs";
import AccountOrders from "./AccountOrders";
import cnames from "classnames";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {checkMarginStatus} from "common/accountHelper";
import BalanceWrapper from "./BalanceWrapper";
import AccountTreemap from "./AccountTreemap";
import AssetWrapper from "../Utility/AssetWrapper";
import AccountPortfolioList from "./AccountPortfolioList";
import {Input, Icon, Switch, Tooltip, Button} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import SearchInput from "../Utility/SearchInput";

class AccountOverview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            shownAssets: props.viewSettings.get("shownAssets", "active"),
            alwaysShowAssets: [
                "BTS"
                // "USD",
                // "CNY"
            ],
            hideFishingProposals: true,
            question1: false,
            question2: false,
            question3: false
        };

        this._handleFilterInput = this._handleFilterInput.bind(this);
    }

    _handleFilterInput(e) {
        this.setState({
            filterValue: e.target.value
        });
    }

    componentWillMount() {
        this._checkMarginStatus();
    }

    _checkMarginStatus(props = this.props) {
        checkMarginStatus(props.account).then(status => {
            let globalMarginStatus = null;
            for (let asset in status) {
                globalMarginStatus =
                    status[asset].statusClass || globalMarginStatus;
            }
            this.setState({globalMarginStatus});
        });
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            this._checkMarginStatus(np);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.isMyAccount !== this.props.isMyAccount ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            !utils.are_equal_shallow(nextState, this.state) ||
            this.state.filterValue !== nextState.filterValue ||
            this.state.enabledColumns !== nextState.enabledColumns
        );
    }

    _changeShownAssets(shownAssets = "active") {
        this.setState({
            shownAssets
        });
        SettingsActions.changeViewSetting({
            shownAssets
        });
    }

    _toggleHideProposal() {
        this.setState({
            hideFishingProposals: !this.state.hideFishingProposals
        });
    }

    _toggleQ1() {
        this.setState({
            question1: !this.state.question1
        });
    }

    _toggleQ2() {
        this.setState({
            question2: !this.state.question2
        });
    }

    _toggleQ3() {
        this.setState({
            question3: !this.state.question3
        });
    }

    _showProposals() {
        SettingsActions.changeSetting({
            setting: "showProposedTx",
            value: true
        });
    }

    render() {
        let {account, hiddenAssets, settings, orders} = this.props;
        let {shownAssets} = this.state;

        if (!account) {
            return null;
        }

        const preferredUnit = !settings.get("unit")
            ? this.props.core_asset.get("symbol")
            : settings.get("unit");

        let call_orders = [],
            collateral = {},
            debt = {};

        // Request all balance objects for dashboard view
        ChainStore.requestAllDataForAccount(account.toJS().id, "balance");

        if (account.toJS && account.has("call_orders"))
            call_orders = account.get("call_orders").toJS();
        let includedPortfolioList, hiddenPortfolioList;
        let account_balances = account.get("balances");
        let includedBalancesList = Immutable.List(),
            hiddenBalancesList = Immutable.List();
        call_orders.forEach(callID => {
            let position = ChainStore.getObject(callID);
            if (position) {
                let collateralAsset = position.getIn([
                    "call_price",
                    "base",
                    "asset_id"
                ]);
                if (!collateral[collateralAsset]) {
                    collateral[collateralAsset] = parseInt(
                        position.get("collateral"),
                        10
                    );
                } else {
                    collateral[collateralAsset] += parseInt(
                        position.get("collateral"),
                        10
                    );
                }
                let debtAsset = position.getIn([
                    "call_price",
                    "quote",
                    "asset_id"
                ]);
                if (!debt[debtAsset]) {
                    debt[debtAsset] = parseInt(position.get("debt"), 10);
                } else {
                    debt[debtAsset] += parseInt(position.get("debt"), 10);
                }
            }
        });

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (
                    balanceObject &&
                    (!balanceObject.get("balance") && !orders[index])
                ) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                const asset = ChainStore.getAsset(asset_type);

                let assetName = "";
                let filter = "";

                if (this.state.filterValue) {
                    filter = this.state.filterValue
                        ? String(this.state.filterValue).toLowerCase()
                        : "";
                    assetName = asset.get("symbol").toLowerCase();
                    let {isBitAsset} = utils.replaceName(asset);
                    if (isBitAsset) {
                        assetName = "bit" + assetName;
                    }
                }

                if (
                    hiddenAssets.includes(asset_type) &&
                    assetName.includes(filter)
                ) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else if (assetName.includes(filter)) {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });
        }

        let portfolioHiddenAssetsBalance = (
            <TotalBalanceValue noTip balances={hiddenBalancesList} hide_asset />
        );

        let portfolioActiveAssetsBalance = (
            <TotalBalanceValue
                noTip
                balances={includedBalancesList}
                hide_asset
            />
        );
        let ordersValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                openOrders={orders}
                hide_asset
            />
        );
        let marginValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                collateral={collateral}
                hide_asset
            />
        );
        let debtValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                hide_asset
            />
        );
        let collateralValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                collateral={collateral}
                hide_asset
            />
        );

        const totalValueText = (
            <TranslateWithLinks
                noLink
                string="account.total"
                keys={[{type: "asset", value: preferredUnit, arg: "asset"}]}
            />
        );

        const includedPortfolioBalance = (
            <span key="portfolio" className="total-value">
                {totalValueText}: {portfolioActiveAssetsBalance}
            </span>
        );

        const hiddenPortfolioBalance = (
            <span key="portfolio" className="total-value">
                {totalValueText}: {portfolioHiddenAssetsBalance}
            </span>
        );

        includedPortfolioList = (
            <AccountPortfolioList
                balanceList={includedBalancesList}
                optionalAssets={
                    !this.state.filterValue ? this.state.alwaysShowAssets : null
                }
                visible={true}
                preferredUnit={preferredUnit}
                coreAsset={this.props.core_asset}
                coreSymbol={this.props.core_asset.get("symbol")}
                hiddenAssets={hiddenAssets}
                orders={orders}
                account={this.props.account}
                isMyAccount={this.props.isMyAccount}
                balances={this.props.balances}
                extraRow={includedPortfolioBalance}
                viewSettings={this.props.viewSettings}
                callOrders={call_orders}
            />
        );

        hiddenPortfolioList = (
            <AccountPortfolioList
                balanceList={hiddenBalancesList}
                optionalAssets={
                    !this.state.filterValue ? this.state.alwaysShowAsset : null
                }
                visible={false}
                preferredUnit={preferredUnit}
                coreSymbol={this.props.core_asset.get("symbol")}
                settings={settings}
                hiddenAssets={hiddenAssets}
                orders={orders}
                account={this.props.account}
                isMyAccount={this.props.isMyAccount}
                balances={this.props.balances}
                extraRow={hiddenPortfolioBalance}
                viewSettings={this.props.viewSettings}
                enabledColumns={this.state.enabledColumns}
            />
        );

        // add unicode non-breaking space as subtext to Activity Tab to ensure that all titles are aligned
        // horizontally
        const hiddenSubText = "\u00a0";

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            defaultActiveTab={0}
                            segmented={false}
                            setting="overviewTab"
                            className="account-tabs"
                            tabsClass="account-overview no-padding bordered-header content-block"
                        >
                            <Tab
                                title="account.portfolio"
                                subText={portfolioActiveAssetsBalance}
                            >
                                <div className="header-selector">
                                    <div className="filter inline-block">
                                        <SearchInput
                                            value={this.state.filterValue}
                                            onChange={this._handleFilterInput}
                                        />
                                    </div>
                                    <div
                                        className="selector inline-block"
                                        style={{
                                            position: "relative",
                                            top: "8px"
                                        }}
                                    >
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "active"
                                            })}
                                            onClick={
                                                shownAssets != "active"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "active"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="account.hide_hidden" />
                                        </div>
                                        {hiddenBalancesList.size ? (
                                            <div
                                                className={cnames(
                                                    "inline-block",
                                                    {
                                                        inactive:
                                                            shownAssets !=
                                                            "hidden"
                                                    }
                                                )}
                                                onClick={
                                                    shownAssets != "hidden"
                                                        ? this._changeShownAssets.bind(
                                                              this,
                                                              "hidden"
                                                          )
                                                        : () => {}
                                                }
                                            >
                                                <Translate content="account.show_hidden" />
                                            </div>
                                        ) : null}
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "visual"
                                            })}
                                            onClick={
                                                shownAssets != "visual"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "visual"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="account.show_visual" />
                                        </div>
                                    </div>
                                </div>

                                {shownAssets != "visual" ? (
                                    shownAssets === "hidden" &&
                                    hiddenBalancesList.size ? (
                                        hiddenPortfolioList
                                    ) : (
                                        includedPortfolioList
                                    )
                                ) : (
                                    <AccountTreemap
                                        balanceObjects={includedBalancesList}
                                    />
                                )}
                            </Tab>

                            <Tab
                                title="account.open_orders"
                                subText={ordersValue}
                            >
                                <AccountOrders {...this.props}>
                                    <div className="total-value">
                                        <span className="text">
                                            {totalValueText}
                                        </span>
                                        <span className="value">
                                            {ordersValue}
                                        </span>
                                    </div>
                                </AccountOrders>
                            </Tab>

                            <Tab
                                title="account.collaterals"
                                subText={
                                    <span
                                        className={
                                            this.state.globalMarginStatus
                                        }
                                    >
                                        {marginValue}
                                    </span>
                                }
                            >
                                <div className="content-block">
                                    <div className="generic-bordered-box">
                                        <MarginPositionsTable
                                            preferredUnit={preferredUnit}
                                            className="dashboard-table"
                                            callOrders={call_orders}
                                            account={account}
                                        >
                                            <tr className="total-value">
                                                <td>{totalValueText}</td>
                                                <td />
                                                <td>{debtValue}</td>
                                                <td className="column-hide-medium">
                                                    {collateralValue}
                                                </td>
                                                <td />
                                                <td>{marginValue}</td>
                                                <td className="column-hide-small" />
                                                <td className="column-hide-small" />
                                                <td colSpan="4" />
                                            </tr>
                                        </MarginPositionsTable>
                                    </div>
                                </div>
                            </Tab>

                            <Tab
                                title="account.activity"
                                subText={hiddenSubText}
                            >
                                <RecentTransactions
                                    accountsList={Immutable.fromJS([
                                        account.get("id")
                                    ])}
                                    compactView={false}
                                    showMore={true}
                                    fullHeight={true}
                                    limit={100}
                                    showFilters={true}
                                    dashboard
                                />
                            </Tab>

                            {account.get("proposals") &&
                                account.get("proposals").size && (
                                    <Tab
                                        title="explorer.proposals.title"
                                        subText={String(
                                            account.get("proposals")
                                                ? account.get("proposals").size
                                                : 0
                                        )}
                                    >
                                        {this.props.settings.get(
                                            "showProposedTx"
                                        ) && (
                                            <div
                                                onClick={this._toggleHideProposal.bind(
                                                    this
                                                )}
                                                style={{cursor: "pointer"}}
                                            >
                                                <Tooltip
                                                    title={counterpart.translate(
                                                        "tooltip.propose_unhide"
                                                    )}
                                                    placement="bottom"
                                                >
                                                    <Switch
                                                        style={{margin: 16}}
                                                        checked={
                                                            this.state
                                                                .hideFishingProposals
                                                        }
                                                        onChange={this._toggleHideProposal.bind(
                                                            this
                                                        )}
                                                    />
                                                    <Translate content="account.deactivate_suspicious_proposals" />
                                                </Tooltip>
                                            </div>
                                        )}
                                        {this.props.settings.get(
                                            "showProposedTx"
                                        ) && (
                                            <Proposals
                                                className="dashboard-table"
                                                account={account}
                                                hideFishingProposals={
                                                    this.state
                                                        .hideFishingProposals
                                                }
                                            />
                                        )}
                                        {!this.props.settings.get(
                                            "showProposedTx"
                                        ) && (
                                            <div className="padding">
                                                <div>
                                                    <Translate content="account.proposed_transactions.advanced_feature" />
                                                    :
                                                </div>
                                                <br />
                                                <br />
                                                <div>
                                                    <Translate content="account.proposed_transactions.question1" />
                                                    <Switch
                                                        style={{margin: 16}}
                                                        checked={
                                                            this.state.question1
                                                        }
                                                        onChange={this._toggleQ1.bind(
                                                            this
                                                        )}
                                                        checkedChildren={"Yes"}
                                                        unCheckedChildren={"No"}
                                                    />
                                                </div>
                                                {this.state.question1 && (
                                                    <div>
                                                        <Translate content="account.proposed_transactions.question2" />
                                                        <Switch
                                                            style={{margin: 16}}
                                                            checked={
                                                                this.state
                                                                    .question2
                                                            }
                                                            onChange={this._toggleQ2.bind(
                                                                this
                                                            )}
                                                            checkedChildren={
                                                                "Yes"
                                                            }
                                                            unCheckedChildren={
                                                                "No"
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {this.state.question2 && (
                                                    <div>
                                                        <Translate content="account.proposed_transactions.question3" />
                                                        <Switch
                                                            style={{margin: 16}}
                                                            checked={
                                                                this.state
                                                                    .question3
                                                            }
                                                            onChange={this._toggleQ3.bind(
                                                                this
                                                            )}
                                                            checkedChildren={
                                                                "Yes"
                                                            }
                                                            unCheckedChildren={
                                                                "No"
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                <br />
                                                {this.state.question3 && (
                                                    <div
                                                        style={{
                                                            marginTop: 16,
                                                            marginBottom: 16
                                                        }}
                                                    >
                                                        <Translate content="account.proposed_transactions.answered_no" />
                                                        <Button
                                                            style={{
                                                                marginLeft: 16
                                                            }}
                                                            onClick={this._showProposals.bind(
                                                                this
                                                            )}
                                                        >
                                                            <Translate content="account.proposed_transactions.show_me_proposals" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Tab>
                                )}
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}

AccountOverview = AssetWrapper(AccountOverview, {propNames: ["core_asset"]});

export default class AccountOverviewWrapper extends React.Component {
    render() {
        return <BalanceWrapper {...this.props} wrap={AccountOverview} />;
    }
}
