import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import {ChainStore} from "bitsharesjs";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";
import {Button} from "bitshares-ui-style-guide";
import PaginatedList from "components/Utility/PaginatedList";
import SearchInput from "../Utility/SearchInput";
import counterpart from "counterpart";

class AccountVesting extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            vesting_balances: [],
            searchTerm: "",
            loading: false,
            error: false
        };

        this.onSearch = this.onSearch.bind(this);
        this.retrieveVestingBalances = this.retrieveVestingBalances.bind(this);
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentDidUpdate(prevProps) {
        let oldId = prevProps.account.get("id");
        let newId = this.props.account.get("id");

        if (newId !== oldId) {
            this.retrieveVestingBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId) {
        this.setState({
            loading: true
        });
        accountId = accountId || this.props.account.get("id");
        Apis.instance()
            .db_api()
            .exec("get_vesting_balances", [accountId])
            .then(vesting_balances => {
                this.mapVestingBalances(vesting_balances);
                this.setState({
                    loading: false
                });
            })
            .catch(err => {
                console.log("error:", err);
                this.setState({
                    loading: false,
                    error: true
                });
            });
    }

    mapVestingBalances(vb) {
        if (!vb) {
            return null;
        }
        let vesting_balances = vb.filter(item => {
            return item.balance.amount && item.balance.asset_id;
        });
        vesting_balances = vesting_balances.map(item => {
            let cvbAsset,
                balance,
                available_percentage = 0,
                days_earned = 0,
                days_required = 0,
                days_remaining = 0,
                isCoinDays = true,
                canClaim = true;

            if (item) {
                balance = item.balance.amount;
                cvbAsset = ChainStore.getAsset(item.balance.asset_id);

                if (item.policy && item.policy[0] !== 2) {
                    let start = Math.floor(
                        new Date(item.policy[1].start_claim + "Z").getTime() /
                            1000
                    );
                    let now = Math.floor(new Date().getTime() / 1000);

                    if (start > 0) {
                        // Vesting has a specific start date.
                        // Vesting with locked value required to mautre fully before claiming
                        // Full vesting period must pass before it can be claimed.
                        // Calculate days left before a claim is possible
                        // Example asset is BRIDGE.BCO - 1.3.1564

                        isCoinDays = false;

                        let seconds_earned = now - start;
                        let seconds_period = item.policy[1].vesting_seconds;

                        if (seconds_earned < seconds_period) {
                            canClaim = false;
                            days_earned = parseFloat(
                                seconds_earned / 86400
                            ).toFixed(2);
                            days_required = parseFloat(
                                seconds_period / 86400
                            ).toFixed(2);
                            days_remaining = (
                                days_required - days_earned
                            ).toFixed(2);
                            available_percentage = 0;
                        } else {
                            available_percentage = 1;
                        }
                    } else {
                        // Vesting has no start time.
                        // Vesting balances has a vesting with maturing value
                        // If period is 0 we expect a 100% claimable balance
                        // otherwise we expect to be allowed to claim the matured percentage.

                        // Core is lazy calculating the vesting balance object, so we
                        // need to account for the time passed since it was last updated
                        let seconds_last_updated = Math.floor(
                            new Date(
                                item.policy[1].coin_seconds_earned_last_update +
                                    "Z"
                            ).getTime() / 1000
                        );
                        let seconds_earned =
                            parseFloat(item.policy[1].coin_seconds_earned) +
                            balance * (now - seconds_last_updated);
                        let seconds_period = item.policy[1].vesting_seconds;

                        available_percentage =
                            seconds_period === 0
                                ? 1
                                : seconds_earned / (seconds_period * balance);
                        // Make sure we don't go over 1
                        available_percentage =
                            available_percentage > 1 ? 1 : available_percentage;

                        days_earned = utils.format_number(
                            utils.get_asset_amount(
                                seconds_earned / 86400,
                                cvbAsset
                            ),
                            0
                        );
                        days_required = utils.format_number(
                            utils.get_asset_amount(
                                (item.balance.amount * seconds_period) / 86400,
                                cvbAsset
                            ),
                            0
                        );
                        days_remaining = utils.format_number(
                            (seconds_period * (1 - available_percentage)) /
                                86400 || 0,
                            2
                        );
                    }
                } else {
                    if (canClaim) {
                        available_percentage = 1;
                    }
                }
            }
            return {
                key: item.id,
                vestingId: item.id,
                vestingType: item.balance_type,
                vestingBalance: {
                    amount: item.balance.amount,
                    asset: item.balance.asset_id
                },
                coinDaysRequired: {
                    days_required,
                    isCoinDays
                },
                coinDaysEarned: {
                    days_earned,
                    isCoinDays
                },
                coinDaysRemaining: {
                    days_remaining,
                    isCoinDays
                },
                availablePercent: available_percentage,
                canClaim,
                vb: item
            };
        });
        this.setState({vesting_balances});
    }

    getHeader() {
        return [
            {
                title: "#",
                dataIndex: "vestingId",
                align: "left",
                defaultSortOrder: "ascend",
                sorter: (a, b) => {
                    return a.vestingId > b.vestingId
                        ? 1
                        : a.vestingId < b.vestingId
                            ? -1
                            : 0;
                }
            },
            {
                title: <Translate content="account.member.balance_type" />,
                dataIndex: "vestingType",
                align: "left",
                sorter: (a, b) => {
                    return a.vestingType > b.vestingType
                        ? 1
                        : a.vestingType < b.vestingType
                            ? -1
                            : 0;
                },
                render: item => {
                    return (
                        <span>
                            <Translate
                                content={"account.vesting.type." + item}
                            />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.member.cashback" />,
                dataIndex: "vestingBalance",
                align: "left",
                render: item => {
                    return (
                        <FormattedAsset
                            amount={item.amount}
                            asset={item.asset}
                        />
                    );
                }
            },
            {
                title: <Translate content="account.member.required" />,
                dataIndex: "coinDaysRequired",
                align: "left",
                render: item => {
                    return item.days_required ? (
                        <span>
                            {item.days_required}
                            &nbsp;
                            <Translate
                                content={
                                    item.isCoinDays
                                        ? "account.member.coindays"
                                        : "account.member.days"
                                }
                            />
                        </span>
                    ) : null;
                }
            },
            {
                title: <Translate content="account.member.earned" />,
                dataIndex: "coinDaysEarned",
                align: "left",
                render: item => {
                    return item.days_earned ? (
                        <span>
                            {item.days_earned}
                            &nbsp;
                            <Translate
                                content={
                                    item.isCoinDays
                                        ? "account.member.coindays"
                                        : "account.member.days"
                                }
                            />
                        </span>
                    ) : null;
                }
            },
            {
                title: <Translate content="account.member.remaining" />,
                dataIndex: "coinDaysRemaining",
                align: "left",
                render: item => {
                    return item.days_remaining ? (
                        <span>
                            {item.days_remaining}
                            &nbsp;
                            <Translate content="account.member.days" />
                        </span>
                    ) : null;
                }
            },
            {
                title: <Translate content="account.member.available" />,
                dataIndex: "availablePercent",
                align: "left",
                render: item => {
                    return item ? (
                        <span>{(item * 100).toFixed(2)}%</span>
                    ) : null;
                }
            },
            {
                title: <Translate content="account.member.action" />,
                align: "center",
                render: item => {
                    return item.canClaim ? (
                        <Button
                            onClick={() => this.onClaim(item)}
                            type="secondary"
                        >
                            <Translate content="account.member.claim" />
                        </Button>
                    ) : null;
                }
            }
        ];
    }

    onClaim({vb}) {
        const account_id = this.props.account.get("id");
        WalletActions.claimVestingBalance(account_id, vb, false).then(() => {
            this.retrieveVestingBalances();
        });
    }

    onSearch(event) {
        this.setState({
            searchTerm: event.target.value || ""
        });
    }

    render() {
        const header = this.getHeader();

        let vb = this.state.vesting_balances.filter(item => {
            return (
                `${item.vestingId}\0${item.vestingType}`
                    .toUpperCase()
                    .indexOf(this.state.searchTerm.toUpperCase()) !== -1
            );
        });

        return (
            <div className="grid-content vertical">
                <Translate component="h1" content="account.vesting.title" />
                <Translate content="account.vesting.explain" component="p" />
                <div className="header-selector padding">
                    <SearchInput
                        onChange={this.onSearch.bind(this)}
                        value={this.state.searchTerm}
                        autoComplete="off"
                        placeholder={counterpart.translate("exchange.filter")}
                    />
                    {this.state.error && (
                        <Translate
                            className="header-selector--error"
                            content="errors.loading_from_blockchain"
                        />
                    )}
                </div>
                <div>
                    <PaginatedList
                        loading={this.state.loading}
                        rows={vb}
                        header={header}
                        pageSize={10}
                    />
                </div>
            </div>
        );
    }
}

export default AccountVesting;
