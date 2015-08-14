import React from "react";
import {PropTypes, Component} from "react";
import sha256 from "js-sha256";
import jdenticon from "jdenticon";

var canvas_id_count = 0

class Identicon extends Component {

  constructor(props) {
      super(props);
      this.canvas_id = "identicon_" + (this.props.account||"") + (++canvas_id_count);
  }

  shouldComponentUpdate(nextProps) {
      return nextProps.size.height !== this.props.size.height || nextProps.size.width !== this.props.size.width || nextProps.account !== this.props.account;
  }

  render() {
      let {account} = this.props;
      let {height, width} = this.props.size;
      let hash = account ? sha256(account) : null;
      return (
           <canvas id={this.canvas_id} ref="canvas" style={{height: height, width: width}} width={width * 2} height={height * 2} data-jdenticon-hash={hash} />
      );
  }

  repaint() {
      if(this.props.account) jdenticon.updateById(this.canvas_id);
      else {
          let ctx = React.findDOMNode(this.refs.canvas).getContext('2d');
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          let size = ctx.canvas.width;
          ctx.clearRect(0, 0, size, size);
          ctx.fillRect(0, 0, size, size);
          ctx.clearRect(0+1, 0+1, size-2, size-2);
          ctx.font = `${size}px sans-serif`;
          ctx.fillText("?", size/4, size - size/6);
      }
  }

  componentDidMount() {
      this.repaint();
  }

  componentDidUpdate() {
      this.repaint();
  }
}

Identicon.propTypes = {
  size: PropTypes.object.isRequired,
  account: PropTypes.string
};

export default Identicon;
