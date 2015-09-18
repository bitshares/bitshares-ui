import React from "react";
import Panel from "react-foundation-apps/src/panel";
import Trigger from "react-foundation-apps/src/trigger";
import {Link} from "react-router";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore";

class MobileMenu extends React.Component {
    constructor() {
        super();
    }

    onClick() {
        ZfApi.publish("mobile-menu", "close");
    }

    render() {
        let {id, isUnlocked} = this.props;
        let accounts = null;
        let linkedAccounts = AccountStore.getState().linkedAccounts;
        // if (!linkedAccounts.size) {
        //   return null;
        // }
        if(linkedAccounts.size > 1) {
            accounts = linkedAccounts.map( a => {
                return <li key={a} onClick={this.onClick}><Link to="account-overview" params={{account_name: a}}>{a}</Link></li>;
            });
        }  else if (linkedAccounts.size) {
            accounts = <li key="account" onClick={this.onClick}><Link to="account-overview" params={{account_name: linkedAccounts.first()}}><Translate component="span" content="header.account" /></Link></li>;
        }

        return (
            <Panel id={id} position="left">
              <div className="grid-content">
              <Trigger close={id}>
                <a className="close-button">&times;</a>
              </Trigger>
                  <section style={{marginTop: "3rem"}} className="block-list">
                      <ul>
                          <li onClick={this.onClick}><Link to="transfer"><Translate component="span" content="header.payments"/></Link></li>
                      </ul>
                  </section>

              <section style={{marginTop: "3rem"}} className="block-list">
                <header>Accounts</header>
                <ul>
                    {accounts}
                    {/*<li onClick={this.onClick}><Link to="explorer"><Translate component="span" content="header.explorer" /></Link></li>
                    <li onClick={this.onClick}><Link to="markets"><Translate component="span" content="header.exchange" /></Link></li>*/}
                </ul>
                </section>
                </div>
            </Panel>
        );
    }
}

export default MobileMenu;
