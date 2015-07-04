import React, {Component} from 'react'

import Apis from "rpc_api/ApiInstances"
import ApplicationApi from "rpc_api/ApplicationApi"
import WalletApi from "rpc_api/WalletApi"
import DebugApi from "rpc_api/DebugApi"

function evalInContext(js) {
    
    var db = Apis.instance().db_api(),
        net = Apis.instance().network_api(),
        app = new ApplicationApi(),
        wallet = new WalletApi(),
        debug = new DebugApi()
    
    var $g = {
        db, net, app, wallet, debug
    }
    return JSON.stringify(eval(js)) 
}

export default class Console extends Component {

    constructor() {
        super()
        this.state = {
            cmd_console: []
        }
    }
    
    render() {
        return <div className="grid-content">
            <form onSubmit={this.on_cmd_submit.bind(this)} >
                <label>Console</label>
                <div>{this.state.cmd_console}</div>
                <input id="console-input"
                    onChange={this.on_cmd_change.bind(this)}
                    value={this.state.cmd} placeholder="Command"
                />
                <p>
                    <code onClick={this.clear.bind(this)}>clear</code>
                </p>
            </form>
        </div>
    }
    
    clear() {
        this.setState({cmd_console:[]})
    }
    
    on_cmd_change(evt) {
        var cmd = evt.target.value
        this.setState({cmd})
    }
    
    on_cmd_submit(evt) {
        evt.preventDefault()
        var cmd_console = this.state.cmd_console
        cmd_console.push(
            <div className="console-result monospace">&gt;&nbsp;{this.state.cmd}</div>
        )
        function cmd_console_result(result) {
            cmd_console.push(
                <div className="console-result monospace">{result}</div>
            )
        }
        try {
            var result = evalInContext(this.state.cmd)
            if(result["then"]) {
                result.then( result => {
                    cmd_console_result(result)
                })
                result.catch( error => {
                    throw error
                })
            }
            else {
                cmd_console_result(result)
                
            }
        } catch(e) {
            console.log("user console command error", e)
            cmd_console.push(
                <div className="console-error monospace">{e.message}</div>
            )
        }
        this.setState({cmd_console, cmd:""})
    }

}

