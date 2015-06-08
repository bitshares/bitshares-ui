import React from "react/addons";
let Perf = React.addons.Perf;
import BaseComponent from "../BaseComponent";
import BlockchainStore from "stores/BlockchainStore";
import {Link} from "react-router";

class Footer extends BaseComponent {
    constructor(props) {
        super(props, BlockchainStore);
        this.state.perf = false;    
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.dynGlobalObject !== this.state.dynGlobalObject;
    }

    _triggerPerf() {
        if (!this.state.perf) {
            Perf.start();
        } else {
            Perf.stop();
            Perf.printInclusive();
            Perf.printWasted();
        }
        this.setState({perf: !this.state.perf});
    }

    render() {
        let block_height = this.state.dynGlobalObject.head_block_number;
        return (
            <div className="grid-block shrink footer">
                <div className="align-justify grid-block">
                    <div onClick={this._triggerPerf.bind(this)} className="grid-block">_</div>
                    { block_height ? <div className="grid-block shrink">
                        Head block &nbsp;
                        <pre>#<Link to="block" params={{ height: block_height }}>{block_height}</Link></pre>
                    </div> : <div className="grid-block shrink">Loading..</div>}
                </div>
            </div>
        );
    }
}

export default Footer;
