import {connect} from "alt-react";
import React from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "bitsharesjs";
import ChainTypes from "../Utility/ChainTypes";
import AccountStore from "stores/AccountStore";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import TimeAgo from "../Utility/TimeAgo";
import {settingsAPIs} from "api/apiConfig";
import {Table} from "bitshares-ui-style-guide";

class AccountReferralsTable extends React.Component {
    constructor(prop) {
        super(prop);

        this.state = {
            referralsIndex: [],
            referralsCount: null,
            errorLoading: null
        };
    }

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        gprops: ChainTypes.ChainObject.isRequired,
        dprops: ChainTypes.ChainObject.isRequired,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        gprops: "2.0.0",
        dprops: "2.1.0",
        core_asset: "1.3.0"
    };

    componentDidMount() {
        this._getReferrals(0, true);
    }

    componentDidUpdate(nextProps, nextState) {
        if (nextProps.account !== this.props.account) {
            this._getReferrals(0, true);
        }
    }

    async _getReferrals(page = 0, isAccountChanged = false) {
        let {myHiddenAccounts, myActiveAccounts} = this.props;
        let {referralsIndex, referralsCount} = this.state;

        if (settingsAPIs.ES_WRAPPER_LIST.length == 0) return;

        // fixme access to ES could be wrapped in a store or something else
        const esNode = settingsAPIs.ES_WRAPPER_LIST[0].url;

        if (isAccountChanged) {
            referralsCount = null;
            referralsIndex = [];
        }

        try {
            if (!referralsCount) {
                let referralsCountResponse = await fetch(
                    esNode +
                        "/referrer_count?account_id=" +
                        this.props.account.get("id")
                );
                if (!referralsCountResponse.ok) {
                    throw new Error(
                        "Could not reach referrer_count endpoint on ES wrapper" +
                            esNode
                    );
                }
                this.setState({
                    referralsCount: await referralsCountResponse.json()
                });
            }

            let referralsIndexResponse = await fetch(
                esNode +
                    "/all_referrers?account_id=" +
                    this.props.account.get("id") +
                    "&page=" +
                    page
            );
            if (!referralsIndexResponse.ok) {
                throw new Error(
                    "Could not reach all_referrers endpoint on ES wrapper" +
                        esNode
                );
            }
            let results = await referralsIndexResponse.json();

            let objectsToFetch = [];
            results.map(ref => {
                objectsToFetch.push(ref.account_id);
            });
            // Fetch Account Data
            // console.log("Fetch Chain", objectsToFetch);
            objectsToFetch.forEach(id_to_fetch => {
                FetchChain("getAccount", id_to_fetch).then(account => {
                    account = account.toJS();

                    let network_fee = account.network_fee_percentage / 100;
                    let lifetime_fee =
                        account.lifetime_referrer_fee_percentage / 100;
                    let referrer_total_fee = 100 - network_fee - lifetime_fee;
                    let referrer_fee =
                        (referrer_total_fee *
                            account.referrer_rewards_percentage) /
                        10000;
                    let registrar_fee =
                        100 - referrer_fee - lifetime_fee - network_fee;

                    referralsIndex.push({
                        id: account.id,
                        name: account.name,
                        lifetime_ref: {
                            name: account.lifetime_referrer_name,
                            value: lifetime_fee
                        },
                        registrar_ref: {
                            name: account.registrar_name,
                            value: registrar_fee
                        },
                        affiliate_ref: {
                            name: account.referrer_name,
                            value: referrer_fee
                        },
                        network: network_fee,
                        statistics: account.statistics,
                        membership_expiration: null
                    });
                    this.setState({
                        referralsIndex: referralsIndex
                    });
                });
            });
        } catch (err) {
            console.error(err);
            this.setState({
                errorLoading: true
            });
        }
    }

    onPaginationChange(page) {
        this._getReferrals(page - 1);
    }

    render() {
        // fixme access to ES could be wrapped in a store or something else
        if (settingsAPIs.ES_WRAPPER_LIST.length == 0) return null;

        let account = this.props.account.toJS();

        let ltr = ChainStore.getAccount(account.lifetime_referrer, false);
        if (ltr) account.lifetime_referrer_name = ltr.get("name");
        let ref = ChainStore.getAccount(account.referrer, false);
        if (ref) account.referrer_name = ref.get("name");
        let reg = ChainStore.getAccount(account.registrar, false);
        if (reg) account.registrar_name = reg.get("name");

        let refData = this.state.referralsIndex;

        let refColumns = [
            {
                key: "name",
                title: "Name",
                render: dataItem => {
                    return (
                        <span>
                            <Link to={`/account/${dataItem.name}`}>
                                {dataItem.name}
                            </Link>
                        </span>
                    );
                }
            },
            {
                key: "statistics",
                title: <Translate content="account.member.fees_paid" />,
                render: dataItem => {
                    return (
                        <Statistics
                            plainText
                            stat_object={dataItem.statistics}
                        />
                    );
                }
            },
            {
                key: "network",
                title: (
                    <Translate content="account.member.network_percentage" />
                ),
                render: dataItem => {
                    return <span>{dataItem.network}%</span>;
                }
            },
            {
                key: "lifetime_ref",
                title: <Translate content="account.member.lifetime_referrer" />,
                render: dataItem => {
                    return (
                        <span>
                            {dataItem.lifetime_ref.value}% (
                            <Link to={`/account/${dataItem.lifetime_ref.name}`}>
                                {dataItem.lifetime_ref.name}
                            </Link>
                            )
                        </span>
                    );
                }
            },
            {
                key: "registrar_ref",
                title: <Translate content="account.member.registrar" />,
                render: dataItem => {
                    return (
                        <span>
                            {dataItem.registrar_ref.value}% (
                            <Link
                                to={`/account/${dataItem.registrar_ref.name}`}
                            >
                                {dataItem.registrar_ref.name}
                            </Link>
                            )
                        </span>
                    );
                }
            },
            {
                key: "affiliate_ref",
                title: <Translate content="account.member.referrer" />,
                render: dataItem => {
                    return (
                        <span>
                            {dataItem.affiliate_ref.value}% (
                            <Link
                                to={`/account/${dataItem.affiliate_ref.name}`}
                            >
                                {dataItem.affiliate_ref.name}
                            </Link>
                            )
                        </span>
                    );
                }
            }
        ];
        if (this.state.errorLoading) {
            return <Translate content="errors.loading_from_es" />;
        }
        return (
            <Table
                rowKey="accountReferrals"
                columns={refColumns}
                dataSource={refData}
                pagination={{
                    pageSize: Number(20),
                    total:
                        this.state.referralsCount <=
                        this.state.referralsIndex.length
                            ? this.state.referralsIndex.length
                            : this.state.referralsIndex.length + 20,
                    onChange: this.onPaginationChange.bind(this),
                    showTotal: () => {
                        return (
                            <Translate
                                content="account.member.total_ref"
                                total={this.state.referralsCount}
                            />
                        );
                    }
                }}
            />
        );
    }
}

AccountReferralsTable = BindToChainState(AccountReferralsTable);

AccountReferralsTable = connect(
    AccountReferralsTable,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                myActiveAccounts: AccountStore.getState().myActiveAccounts,
                myHiddenAccounts: AccountStore.getState().myHiddenAccounts
            };
        }
    }
);

export default AccountReferralsTable;
