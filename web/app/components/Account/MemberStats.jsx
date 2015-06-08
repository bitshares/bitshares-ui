import React from "react";
import {PropTypes} from "react";
import {FormattedDate, FormattedNumber} from "react-intl";
import {Link} from "react-router";
import Translate from "react-translate-component";

var styles = {
  ulStyle: {
    listStyle: "none",
    marginLeft: "0.25rem"
  },
  inline: {
    display: "inline-block"
  }
};

class MemberStats extends React.Component {

    render() {
        let {referrer, registrar, isMyAccount, isUnlocked, names} = this.props;

        // Fake some values that aren't available atm
        let reg_date = new Date(); 
        let referals = {members: 15, users: 523};
        let rewards = {cashback: 15745, vested: 32144};

        return (
            <div>
              <hr/>
              <h5><Translate component="span" content="account.member.stats" /></h5>
              <ul style={styles.ulStyle}>
                <li><Translate component="span" content="account.member.join" /> <FormattedDate value={reg_date}/>:</li>
                <li><Translate component="span" content="account.member.reg" />: <Link to="account" params={{name: names[registrar]}}>{names[registrar]}</Link></li>
                <li><Translate component="span" content="account.member.ref" />: <Link to="account" params={{name: names[referrer]}}>{names[referrer]}</Link></li>
                <li><Translate component="span" content="account.member.referrals" />: 
                  <ul style={styles.ulStyle}>
                    <li><FormattedNumber value={referals.members}/> members</li>
                    <li><FormattedNumber value={referals.users}/> users</li>
                  </ul>
                </li>
              </ul>
              <h5 style={styles.inline}><Translate component="span" content="account.member.rewards" /></h5> {isMyAccount && isUnlocked ? <button className="hollow button tiny">Claim</button> : null}
              <ul style={styles.ulStyle}>
                <li><Translate component="span" content="account.member.cashback" />: <FormattedNumber value={rewards.cashback}/> BTS</li>
                <li><Translate component="span" content="account.member.vested" />: <FormattedNumber value={rewards.vested}/> BTS</li>
              </ul>
            </div>
        );
    }
}

MemberStats.propTypes = {
  referrer: PropTypes.string.isRequired,
  registrar: PropTypes.string.isRequired,
  isMyAccount: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  names: PropTypes.object.isRequired
};

export default MemberStats;
