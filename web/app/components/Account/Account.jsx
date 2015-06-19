import React from "react";
import {PropTypes, Component} from "react";
import AccountInfo from "./AccountInfo";
import Immutable from "immutable";
import MemberStats from "./MemberStats";
import Connections from "./Connections";
import {FormattedNumber} from "react-intl";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetActions from "actions/AssetActions";
import AccountActions from "actions/AccountActions";
import Operation from "../Blockchain/Operation";
import Translate from "react-translate-component";
import Trigger from "react-foundation-apps/lib/trigger";
import Modal from "react-foundation-apps/lib/modal";
import ZfApi from "react-foundation-apps/lib/utils/foundation-api";

class Account extends Component {

    componentWillMount() {
        this._getAccount(this.props.accountName);
        if (!this.props.assets.get("1.4.0")) {
            AssetActions.getAsset("1.4.0");
        }
    }

    _getAccount(name) {
        let id = this.props.account_name_to_id[name];
        if (id) {
            AccountActions.getAccount(id, true);
        } else {
            AccountActions.getAccount(name, true);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.accountName !== this.props.accountName) {
            this._getAccount(nextProps.accountName);
            let id = this.props.account_name_to_id[this.props.accountName];
            if (id !== this.props.activeAccount.id) { 
                AccountActions.unSubscribe(id);
            }
        }
    }

    componentWillUnmount() {
        let name = this.props.accountName;
        let id = this.props.account_name_to_id[name];
        if (id !== this.props.activeAccount.id) {
            AccountActions.unSubscribe(id);
        }
    }

    shouldComponentUpdate(nextProps) {
        let id = nextProps.account_name_to_id[nextProps.accountName];
        // console.log("id:", id, "account:", this.props.browseAccounts.get(id), nextProps.browseAccounts.get(id));
        // console.log("browseAccounts is:", !Immutable.is(nextProps.browseAccounts.get(id), this.props.browseAccounts.get(id)));
        // console.log("assets is:", !Immutable.is(nextProps.assets, this.props.assets));

        return (
            !Immutable.is(nextProps.browseAccounts.get(id), this.props.browseAccounts.get(id)) ||
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.accountHistories, this.props.accountHistories) ||
            !Immutable.is(nextProps.balances, this.props.balances) ||
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.settings, this.props.settings) ||
            nextProps.accountName !== this.props.accountName
          );
    }

    upgradeAccountClickHandler(e){
        e.preventDefault();
        let account_id = this.props.account_name_to_id[this.props.accountName];
        AccountActions.upgradeAccount(account_id).then( () => {
            AccountActions.getAccount(account_id);
        });
        ZfApi.publish("confirm_upgrade_modal", "close");
        return false;
    }

    renderUpgradeButtonAndConfirmModal() {
        return (
            <div>
                <Trigger open="confirm_upgrade_modal">
                    <button className="button">Upgrade</button>
                </Trigger>
                <Modal id="confirm_upgrade_modal" overlay={true}>
                    <Trigger close="">
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <div className="grid-block vertical">
                        <div className="shrink grid-content">
                            <p>Please confirm account upgrade</p>
                        </div>
                        <div className="grid-content button-group">
                            <a className="button" href onClick={this.upgradeAccountClickHandler.bind(this)}>Confirm</a>
                            <Trigger close="confirm_upgrade_modal">
                                <a href className="secondary button">Cancel</a>
                            </Trigger>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    render() {

        let accountName = this.props.accountName,
          {browseAccounts, 
            isUnlocked, account_name_to_id, assets, accountHistories, 
            accountBalances, account_id_to_name, witnesses, witness_id_to_name} = this.props, 
          isMember = false,
          balances = [],
          names = null,
          followButton = null,
          connections = null,
          history = null;

        let ba = account_name_to_id[accountName] ? browseAccounts.get(account_name_to_id[accountName]) : null;

        // Get current balances
        if (ba) {
            // console.log("ba:", ba);
            isMember = (ba.id === ba.lifetime_referrer);

            // followButton = isUnlocked && !ba.isMyAccount ? <button className="button">Follow</button> : null;

            connections = (<Connections 
                            blackList={ba.blacklisting_accounts} 
                            organizations={ba.whitelisting_accounts}
                          />);

            if (assets.size > 0) {
                balances = accountBalances.get(ba.id).map((balance) => {
                    balance.amount = parseFloat(balance.amount);
                    return (
                      <tr key={balance.asset_id}>
                        <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                        <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                        <td><FormattedNumber style="percent" value={0.1 * Math.random()}/></td>
                      </tr>
                      );
                });

                if (accountHistories.get(ba.id)) {

                    history = accountHistories.get(ba.id).map((trx, index) => {
                        if (index < 10) {
                            return (
                              <Operation
                                key={index}
                                op={trx.op}
                                block={trx.block_num}
                                accounts={account_id_to_name}
                                assets={assets}
                                current={accountName}
                                witnesses={witnesses}
                                witness_id_to_name={witness_id_to_name}
                                inverted={this.props.settings.get("inverseMarket")}
                                />
                            );
                        }
                    });

                }
            }
        } else {
            return (
                <div className="grid-block page-layout">Loading..</div>
              );
        }

        //{followButton}
        //{isMember && ba ?
        //    <MemberStats
        //        isUnlocked={isUnlocked}
        //        rewards={ba.rewards}
        //        referals={ba.referals}
        //        registrar={ba.registrar}
        //        referrer={ba.referrer}
        //        names={account_id_to_name}
        //        /> : this.renderUpgradeButtonAndConfirmModal() }
        //{connections}

        let leftMenu = (
            <section className="block-list">
                <ul className="account-left-menu">
                    <li className="active"><a href>Overview</a></li>
                    <li><a href>Make Payment</a></li>
                    <li><a href>Member Stats</a></li>
                    <li><a href>History</a></li>
                    <li><a href>Permissions</a></li>
                    <li><a href>Voting</a></li>
                    <li><a href>Orders</a></li>
                </ul>
            </section>
        );

        return (
            <div className="grid-block page-layout">

              <div className="grid-block medium-2 left-column no-padding">
                <div className="grid-content no-overflow">
                    <div className="regular-padding">
                        <AccountInfo account_name={ba.name} account_id={ba.id} image_size={{height: 120, width: 120}}/>
                    </div>
                    {leftMenu}
                </div>
              </div>

              <div className="grid-block medium-10 main-content">
                <div className="grid-content">
                  <table style={{width: "100%"}} className="table text-center table-hover">
                    <thead>
                      <tr>
                        <th><Translate component="span" content="account.assets" /></th>
                        <th><Translate component="span" content="account.value" /></th>
                        <th><Translate component="span" content="account.hour_24" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances}
                    </tbody>
                  </table>

                  <br/>

                  {history ?
                  <table style={{width: "100%"}} className="table text-center table-hover">
                    <caption><h5><Translate component="span" content="account.recent" /></h5></caption>
                    <tbody>
                      {history}
                    </tbody>
                  </table>
                  : null}
                </div>
              </div>
            </div>
        );
    }
}

Account.defaultProps = {
    browseAccounts: {},
    account_name_to_id: {},
    assets: {},
    isUnlocked: false,
    accountName: ""
};

Account.propTypes = {
    browseAccounts: PropTypes.object.isRequired,
    account_name_to_id: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    isUnlocked: PropTypes.bool.isRequired,
    accountName: PropTypes.string.isRequired
};

export default Account;
