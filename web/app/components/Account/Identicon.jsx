import React from "react";
import {PropTypes, Component} from "react";
import sha256 from "js-sha256";
import jdenticon from "jdenticon";

class Identicon extends Component {
  shouldComponentUpdate(nextProps) {
      return nextProps.size.height !== this.props.size.height || nextProps.size.width !== this.props.size.width || nextProps.account !== this.props.account;
  }

  render() {
      let {account} = this.props;
      let {height, width} = this.props.size;
      let hash = account ? sha256(account) : null;
      
      return (
        <div>
          {hash ?
            <canvas id={"identicon_" + account} style={{height: height, width: width}} width={width * 2} height={height * 2} data-jdenticon-hash={hash} /> :
            <div style={{height: height, width: width}} width={width * 2} height={height * 2}/>}
        </div>
      );
  }

  componentDidMount() {
      if (this.props.account) {
          jdenticon.updateById("identicon_" + this.props.account);
      }
  }

  componentDidUpdate() {
      if (this.props.account) {
          jdenticon.updateById("identicon_" + this.props.account);
      }
  }
}

Identicon.propTypes = {
  size: PropTypes.object.isRequired,
  account: PropTypes.string.isRequired
};

export default Identicon;
