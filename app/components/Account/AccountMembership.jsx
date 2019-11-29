import React from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import accountUtils from "common/account_utils";
import {Tabs, Tab} from "../Utility/Tabs";
import {getWalletName} from "branding";
import {getWalletURL} from "../../branding";
import {Button} from "bitshares-ui-style-guide";
import AccountReferralsTable from "./AccountReferralsTable";
import {settingsAPIs} from "../../api/apiConfig";

class AccountMembership extends React.Component {
    constructor(prop) {
        super(prop);
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

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "account_upgrade");
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            this.setState({referralsIndex: []});
        }
    }

    render() {
        let {gprops, dprops, core_asset} = this.props;

        let account = this.props.account.toJS();

        let ltr = ChainStore.getAccount(account.lifetime_referrer, false);
        if (ltr) account.lifetime_referrer_name = ltr.get("name");
        let ref = ChainStore.getAccount(account.referrer, false);
        if (ref) account.referrer_name = ref.get("name");
        let reg = ChainStore.getAccount(account.registrar, false);
        if (reg) account.registrar_name = reg.get("name");

        let account_name = account.name;

        let network_fee = account.network_fee_percentage / 100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage / 100;
        let referrer_total_fee = 100 - network_fee - lifetime_fee;
        let referrer_fee =
            (referrer_total_fee * account.referrer_rewards_percentage) / 10000;
        let registrar_fee = 100 - referrer_fee - lifetime_fee - network_fee;

        let lifetime_cost =
            (gprops.getIn([
                "parameters",
                "current_fees",
                "parameters",
                8,
                1,
                "membership_lifetime_fee"
            ]) *
                gprops.getIn(["parameters", "current_fees", "scale"])) /
            10000;

        let member_status = ChainStore.getAccountMemberStatus(
            this.props.account
        );
        let membership = "account.member." + member_status;
        let expiration = null;
        if (member_status === "annual")
            expiration = (
                <span>
                    (<Translate content="account.member.expires" />{" "}
                    <TimeAgo time={account.membership_expiration_date} />)
                </span>
            );
        let expiration_date = account.membership_expiration_date;
        if (expiration_date === "1969-12-31T23:59:59")
            expiration_date = "Never";
        else if (expiration_date === "1970-01-01T00:00:00")
            expiration_date = "N/A";

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            segmented={false}
                            setting="membershipTab"
                            className="account-tabs"
                            tabsClass="account-overview bordered-header content-block"
                            contentClass="padding"
                        >
                            <Tab title="account.member.membership">
                                <h3>
                                    <Translate content={membership} />{" "}
                                    {expiration}
                                </h3>

                                <div className="content-block no-margin">
                                    <div className="no-margin grid-block vertical large-horizontal">
                                        <div className="grid-block large-12">
                                            <div className="grid-content">
                                                <div className="grid-content">
                                                    <div className="grid-block">
                                                        {member_status ===
                                                        "lifetime" ? (
                                                            <div
                                                                className="small-12 large-6"
                                                                style={{
                                                                    paddingRight: 10
                                                                }}
                                                            >
                                                                <div className="asset-card">
                                                                    <div className="card-divider">
                                                                        <Translate content="account.member.lifetime_title" />
                                                                    </div>
                                                                    <Translate
                                                                        component="p"
                                                                        content="account.member.referral_info"
                                                                        feesCashback={
                                                                            100 -
                                                                            network_fee
                                                                        }
                                                                    />
                                                                    <Translate
                                                                        component="h4"
                                                                        content="account.member.referral_link"
                                                                    />
                                                                    <Translate
                                                                        component="p"
                                                                        content="account.member.referral_text"
                                                                        wallet_name={getWalletName()}
                                                                    />
                                                                    <h5>
                                                                        {getWalletURL() +
                                                                            `/?r=${
                                                                                account.name
                                                                            }`}
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="small-12 large-6"
                                                                style={{
                                                                    paddingRight:
                                                                        "10px !important"
                                                                }}
                                                            >
                                                                <HelpContent
                                                                    path="components/AccountMembership"
                                                                    section="lifetime"
                                                                    feesCashback={
                                                                        100 -
                                                                        network_fee
                                                                    }
                                                                    price={{
                                                                        amount: lifetime_cost,
                                                                        asset: core_asset
                                                                    }}
                                                                />
                                                                <br />
                                                                <Button
                                                                    type="primary"
                                                                    onClick={this.upgradeAccount.bind(
                                                                        this,
                                                                        account.id,
                                                                        true
                                                                    )}
                                                                >
                                                                    <Translate content="account.member.upgrade_lifetime" />
                                                                </Button>{" "}
                                                                &nbsp; &nbsp;
                                                                {true ||
                                                                member_status ===
                                                                    "annual" ? null : (
                                                                    <Button
                                                                        type="primary"
                                                                        onClick={this.upgradeAccount.bind(
                                                                            this,
                                                                            account.id,
                                                                            false
                                                                        )}
                                                                    >
                                                                        <Translate content="account.member.subscribe" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="small-12 large-6">
                                                            <div className="asset-card">
                                                                <div className="card-divider">
                                                                    <Translate content="account.member.fee_allocation" />
                                                                </div>

                                                                <table className="table key-value-table">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <Translate content="account.member.network_percentage" />
                                                                            </td>
                                                                            <td>
                                                                                {
                                                                                    network_fee
                                                                                }

                                                                                %
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                <Translate content="account.member.lifetime_referrer" />{" "}
                                                                                &nbsp;
                                                                                (
                                                                                <Link
                                                                                    to={`/account/${
                                                                                        account.lifetime_referrer_name
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        account.lifetime_referrer_name
                                                                                    }
                                                                                </Link>

                                                                                )
                                                                            </td>
                                                                            <td>
                                                                                {
                                                                                    lifetime_fee
                                                                                }

                                                                                %
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                <Translate content="account.member.registrar" />{" "}
                                                                                &nbsp;
                                                                                (
                                                                                <Link
                                                                                    to={`/account/${
                                                                                        account.registrar_name
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        account.registrar_name
                                                                                    }
                                                                                </Link>

                                                                                )
                                                                            </td>
                                                                            <td>
                                                                                {
                                                                                    registrar_fee
                                                                                }

                                                                                %
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                <Translate content="account.member.referrer" />{" "}
                                                                                &nbsp;
                                                                                (
                                                                                <Link
                                                                                    to={`/account/${
                                                                                        account.referrer_name
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        account.referrer_name
                                                                                    }
                                                                                </Link>

                                                                                )
                                                                            </td>
                                                                            <td>
                                                                                {
                                                                                    referrer_fee
                                                                                }

                                                                                %
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                <Translate content="account.member.membership_expiration" />{" "}
                                                                            </td>
                                                                            <td>
                                                                                {
                                                                                    expiration_date
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="asset-card">
                                                                <div className="card-divider">
                                                                    <Translate content="account.member.fees_cashback" />
                                                                </div>
                                                                <table className="table key-value-table">
                                                                    <Statistics
                                                                        stat_object={
                                                                            account.statistics
                                                                        }
                                                                    />
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid-block large-12">
                                            <div className="grid-content">
                                                <div className="grid-content">
                                                    <div className="grid-block">
                                                        <div className="small-12 large-6">
                                                            <div className="asset-card">
                                                                <div className="card-divider">
                                                                    <Translate content="account.member.fee_pending" />
                                                                </div>
                                                                <Translate
                                                                    component="p"
                                                                    content="account.member.fee_pending_text"
                                                                    account={
                                                                        account_name
                                                                    }
                                                                    maintenanceInterval={gprops.getIn(
                                                                        [
                                                                            "parameters",
                                                                            "maintenance_interval"
                                                                        ]
                                                                    )}
                                                                    nextMaintenanceTime={dprops.get(
                                                                        "next_maintenance_time"
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="asset-card">
                                                                <div className="card-divider">
                                                                    <Translate content="account.member.fee_vesting" />
                                                                </div>
                                                                <Translate
                                                                    component="p"
                                                                    content="account.member.fee_vesting_text"
                                                                    account={
                                                                        account_name
                                                                    }
                                                                    vestingThresholdAmount={
                                                                        gprops.getIn(
                                                                            [
                                                                                "parameters",
                                                                                "cashback_vesting_threshold"
                                                                            ]
                                                                        ) /
                                                                        Math.pow(
                                                                            10,
                                                                            core_asset.get(
                                                                                "precision"
                                                                            )
                                                                        )
                                                                    }
                                                                    vestingThresholdAsset={core_asset.get(
                                                                        "symbol"
                                                                    )}
                                                                    vestingPeriod={
                                                                        gprops.getIn(
                                                                            [
                                                                                "parameters",
                                                                                "cashback_vesting_period_seconds"
                                                                            ]
                                                                        ) /
                                                                        60 /
                                                                        60 /
                                                                        24
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="small-12 large-6">
                                                            <div className="asset-card">
                                                                <div className="card-divider">
                                                                    <Translate content="account.member.fee_division" />
                                                                </div>
                                                                <Translate
                                                                    component="p"
                                                                    content="account.member.fee_division_text.paragraph_1"
                                                                    account={
                                                                        account_name
                                                                    }
                                                                    fee_share_network={
                                                                        network_fee
                                                                    }
                                                                    fee_share_ltm={
                                                                        lifetime_fee
                                                                    }
                                                                    fee_share_affiliate={
                                                                        referrer_fee
                                                                    }
                                                                    fee_share_registrar={
                                                                        registrar_fee
                                                                    }
                                                                />
                                                                <Translate
                                                                    component="p"
                                                                    content="account.member.fee_division_text.paragraph_2"
                                                                    account={
                                                                        account_name
                                                                    }
                                                                    fee_share_network={
                                                                        network_fee
                                                                    }
                                                                    fee_share_ltm={
                                                                        lifetime_fee
                                                                    }
                                                                    fee_share_affiliate={
                                                                        referrer_fee
                                                                    }
                                                                    fee_share_registrar={
                                                                        registrar_fee
                                                                    }
                                                                />

                                                                <Link
                                                                    to={`/account/${account_name}/vesting`}
                                                                >
                                                                    <Translate
                                                                        component="p"
                                                                        content="account.member.fee_division_text.paragraph_3"
                                                                    />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {member_status == "lifetime" &&
                                settingsAPIs.ES_WRAPPER_LIST.length > 0 ? ( // fixme access to ES could be wrapped in a store or something else
                                    <div className="asset-card">
                                        <div className="card-divider">
                                            <Translate content="account.member.ref_distribution" />
                                        </div>
                                        <AccountReferralsTable
                                            account={account_name}
                                        />
                                    </div>
                                ) : null}
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}
AccountMembership = BindToChainState(AccountMembership);

export default AccountMembership;
