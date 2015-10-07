import React, {Component} from "react/addons";
let Perf = React.addons.Perf;
import AltContainer from "alt/AltContainer"
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import CachedPropertyStore from "stores/CachedPropertyStore"
import CachedPropertyActions from "actions/CachedPropertyActions"
import {backupToBin} from "actions/BackupActions"
import BlockchainStore from "stores/BlockchainStore";
import TimeAgo from "../Utility/TimeAgo";
import Icon from "../Icon/Icon";

@BindToChainState({keep_updating: true})
class Footer extends React.Component {

    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        synced: React.PropTypes.bool.isRequired
    }

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);
        this.state = {perf: false};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
               nextProps.backup_recommended !== this.props.backup_recommended ||
               nextProps.rpc_connection_status !== this.props.rpc_connection_status ||
               nextProps.synced !== this.props.synced;
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
                    {this.props.synced ? null : <div className="grid-block shrink txtlabel error">Blockchain is out of sync, please wait until it's synchronized.. &nbsp; &nbsp;</div>}
                    {this.props.rpc_connection_status === "closed" ? <div className="grid-block shrink txtlabel error">No Blockchain connection &nbsp; &nbsp;</div> : null}
                    { this.props.backup_recommended ? <span>
                        <div className="grid-block shrink txtlabel success" onClick={this.onBackup.bind(this)}>Backup recommended &nbsp; &nbsp;</div>
                    </span> : null}
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
    
    onBackup() {
        backupToBin()
    }
}

class AltFooter extends Component {
    
    render() {
        return <AltContainer
            stores={[CachedPropertyStore, BlockchainStore]}
            inject ={{
                backup_recommended: ()=> CachedPropertyStore.get("backup_recommended"),
                rpc_connection_status: ()=> BlockchainStore.getState().rpc_connection_status
            }}
            ><Footer {...this.props}/>
        </AltContainer>
    }
}

export default AltFooter;
