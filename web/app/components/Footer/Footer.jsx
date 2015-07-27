import React from "react/addons";
let Perf = React.addons.Perf;
import BaseComponent from "../BaseComponent";
import BlockchainStore from "stores/BlockchainStore";
import {Link} from "react-router";
import Translate from "react-translate-component";

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
            console.log("Inclusive prints the overall time taken. If no argument's passed, defaults to all the measurements from the last recording. This prints a nicely formatted table in the console, like so:");
            Perf.printInclusive();
            console.log("Wasted time is spent on components that didn't actually render anything, e.g. the render stayed the same, so the DOM wasn't touched.");
            Perf.printWasted();
            console.log("Exclusive times don't include the times taken to mount the components: processing props, getInitialState, call componentWillMount and componentDidMount, etc.");
            Perf.printExclusive();
            Perf.printDOM();
        }
        this.setState({perf: !this.state.perf});
    }

    render() {
        let block_height = this.state.dynGlobalObject.head_block_number;
        return (
            <div className="grid-block shrink footer">
                <div className="align-justify grid-block">
                    <div onClick={this._triggerPerf.bind(this)} className="grid-block">
                        <div className="logo">
                            <Translate content="footer.title" />
                        </div>
                    </div>
                    { block_height ?
                        (<div className="grid-block shrink">
                            <Translate content="footer.block" /> &nbsp;
                            <pre>#<Link to="block" params={{ height: block_height }}>{block_height}</Link></pre>
                        </div>) :
                        <div className="grid-block shrink">Loading..</div>}
                </div>
            </div>
        );
    }
}

export default Footer;
