import React from "react/addons";
let Perf = React.addons.Perf;
import {Link} from "react-router";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes"

@BindToChainState()
class Footer extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    }
    constructor() {
        super();
        this.state = {perf: false};    
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.dynGlobalObject !== this.props.dynGlobalObject
            || nextProps.rpc_connection_status !== this.props.rpc_connection_status;
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
        let block_height = this.props.dynGlobalObject.get('head_block_number')
        return (
            <div className="grid-block shrink footer">
                <div className="align-justify grid-block">
                    <div onClick={this._triggerPerf.bind(this)} className="grid-block">
                        <div className="logo">
                            <Translate content="footer.title" />
                        </div>
                    </div>
                    {this.props.rpc_connection_status === "closed" ? <div className="grid-block shrink txtlabel error">No Blockchain connection &nbsp; &nbsp;</div> : null}
                    {block_height ?
                        (<div className="grid-block shrink">
                            <Translate content="footer.block" /> &nbsp;
                            <pre>#{block_height}</pre>
                        </div>) :
                        <div className="grid-block shrink"><Translate content="footer.loading" /></div>}
                </div>
            </div>
        );
    }
}

export default Footer;
