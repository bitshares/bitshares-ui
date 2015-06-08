import React from "react";
import Panel from "react-foundation-apps/lib/panel";
import Trigger from "react-foundation-apps/lib/trigger";
import {Link} from "react-router";
import ZfApi from "react-foundation-apps/lib/utils/foundation-api";
import Translate from "react-translate-component";

class MobileMenu extends React.Component {
    constructor() {
        super();
    }

    onClick() {
        ZfApi.publish("mobile-menu", "close");
    }

    render() {
        let {id, isUnlocked} = this.props;
        return (
            <Panel id={id} position="left">
              <div className="grid-content">
              <Trigger close={id}>
                <a className="close-button">&times;</a>
              </Trigger>

              <section style={{marginTop: "3rem"}} className="block-list">
                <ul>
                    <li onClick={this.onClick}><Link to="dashboard"><Translate component="span" content="header.dashboard" /></Link></li>
                    <li onClick={this.onClick}><Link to="discover"><Translate component="span" content="header.explorer" /></Link></li>
                    <li onClick={this.onClick}><Link to="markets"><Translate component="span" content="header.exchange" /></Link></li>
                    <li onClick={this.onClick}><Link to="transfer"><Translate component="span" content="header.payments" /></Link></li>
                    {isUnlocked ? <li onClick={this.onClick}><Link to="settings">Settings</Link></li> : null}
                </ul>
                </section>
                </div>
            </Panel>
        );
    }
}

export default MobileMenu;
