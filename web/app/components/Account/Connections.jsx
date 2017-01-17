import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";

class Connections extends React.Component {

    render() {
        let {organizations, blackList, isMyAccount} = this.props;
        let knownBy = organizations ? organizations.map((account, i) => {
            if (i< 5) {
                return <li key={account}>X: <Link to={`/account/${account}/overview/`}>{account}</Link></li>;
            }
        }) : null;

        let unwanted = blackList ? blackList.map((account, i) => {
            if (i< 5) {
                return <li key={account}>X: <Link to={`/account/${account}/overview/`}>{account}</Link></li>;
            }
        }) : null;

        return (
            <div>
              <h5><Translate component="span" content="account.connections.known" /></h5>
              <ul style={{listStyle: "none", marginLeft: "0.25rem"}}>
                {knownBy}
              </ul>
              <hr/>
              <h5 className="inline-block"><Translate component="span" content="account.connections.black" /></h5> {isMyAccount ? <button className="hollow button tiny">Claim</button> : null}
              <ul style={{listStyle: "none", marginLeft: "0.25rem"}}>
                {unwanted}
              </ul>
            </div>
        );
    }
}

export default Connections;
