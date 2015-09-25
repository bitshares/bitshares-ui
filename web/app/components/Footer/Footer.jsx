import React from "react/addons";
let Perf = React.addons.Perf;
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import BlockchainStore from "stores/BlockchainStore";
import TimeAgo from "../Utility/TimeAgo";
import Icon from "../Icon/Icon";

@BindToChainState({keep_updating: true})
class Footer extends React.Component {

    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);
        this.state = {perf: false, rpc_connection_status: BlockchainStore.getState().rpc_connection_status};
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        BlockchainStore.listen(this.onChange);
    }

    componentWillUnmount() {
        BlockchainStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState({rpc_connection_status: state.rpc_connection_status});
    }

    shouldComponentUpdate(nextProps, nextState) {
       // return true
        return (
            nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
            nextState.rpc_connection_status !== this.state.rpc_connection_status
        );
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
        let block_height = this.props.dynGlobalObject.get("head_block_number");
        let block_time = this.props.dynGlobalObject.get("time") + "+00:00";
        let bt = new Date(block_time).getTime() / 1000;
        let now = new Date().getTime() / 1000
        return (
            <div className="show-for-medium grid-block shrink footer">
                <div className="align-justify grid-block">
                    <div onClick={this._triggerPerf.bind(this)} className="grid-block">
                        <div className="logo">
                            <Translate content="footer.title" />
                        </div>
                    </div>
                    {this.state.rpc_connection_status === "closed" ? <div className="grid-block shrink txtlabel error">No Blockchain connection &nbsp; &nbsp;</div> : null}
                    {block_height ?
                        (<div className="grid-block shrink">
                            <Translate content="footer.block" /> &nbsp;
                            <pre>#{block_height} </pre> &nbsp;
                            { now - bt > 5 ? <TimeAgo ref="footer_head_timeago" time={block_time} /> : <span data-tip="Synchronized" data-place="left"><Icon name="checkmark-circle" /></span> }
                        </div>) :
                        <div className="grid-block shrink"><Translate content="footer.loading" /></div>}
                </div>
            </div>
        );
    }
}

export default Footer;
