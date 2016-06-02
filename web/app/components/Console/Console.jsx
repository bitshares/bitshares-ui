import React, {Component} from 'react'
import ReactDOM from "react-dom";
import {Apis} from "graphenejs-lib";
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
    return eval(js)
}

var keyCode = {
    enter: 13,
    up: 38,
    down: 40
}

var cmd_history = [""], cmd_history_position = 0

export default class Console extends Component {

    constructor() {
        super()
        this.state = {
            cmd_console: []
        }
    }
    
    render() {
        return <div className="grid-content" ref="console_div">
            <form ref="console_form" onSubmit={this.on_cmd_submit.bind(this)} >
                <div>{this.state.cmd_console}</div>&nbsp;
                <textarea id="console_input" ref="console_input"
                    onChange={this.on_cmd_change.bind(this)}
                    onKeyDown={this.on_cmd_keydown.bind(this)}
                    onKeyUp={this.on_cmd_keyup.bind(this)}
                    value={this.state.cmd}
                    placeholder="Console Command"
                />
                <p>
                    <code onClick={this.run.bind(this)}>run</code>
                    { ! this.state.cmd_console.length ? "" :
                        <code onClick={this.clear.bind(this)}>clear</code>
                    }
                    { cmd_history.length == 1 ? "" :
                         <code onClick={this.clear_history.bind(this)}>clear history</code>
                    }
                </p>
            </form>
        </div>
    }
    
    componentDidUpdate() {
        ReactDOM.findDOMNode(this.refs.console_input).focus()
        var node = ReactDOM.findDOMNode(this.refs.console_div)
        node.scrollTop = node.scrollHeight
    }
    
    clear() {
        this.setState({cmd_console:[]})
    }
    
    clear_history() {
        cmd_history = [""]
        cmd_history_position = 0
        this.forceUpdate()
    }
    
    on_cmd_change(evt) {
        var cmd = evt.target.value
        this.setState({cmd})
    }
    
    on_cmd_keydown(evt) {
        // DEBUG console.log('... on_cmd_keydown', evt.type, evt.which, evt)
        switch(evt.which) {
        case keyCode.enter:
            console.log('... evt',evt)
            if( ! evt.shiftKey) {
                this.on_cmd_submit(evt)
                break
            }
        case keyCode.up:
            if( cmd_history_position == 0)
                return
            cmd_history_position--
            this.setState({cmd:cmd_history[cmd_history_position]})
            break
        case keyCode.down:
            if(cmd_history_position < cmd_history.length - 1){
                cmd_history_position++
                this.setState({cmd:cmd_history[cmd_history_position]})
                break
            }
            if( cmd_history.length - 1 == cmd_history_position &&
                this.state.cmd != ""
            ) {
                cmd_history.pushState("")
                cmd_history_position++
                this.setState({cmd:""})
                break
            }
        default:
            // input field was altered, on_cmd_keyup will have the value
            cmd_history_position = cmd_history.length - 1
            return
        }
        evt.preventDefault();
        evt.stopPropagation();
    }
    
    on_cmd_keyup() {
        cmd_history[cmd_history_position] =
            this.refs.console_input.props.value
    }
    
    on_cmd_submit(evt) {
        evt.preventDefault()
        this.run()
    }
    
    run() {
        if(this.state.cmd.trim() == "")
            return
        
        
        // if pasted, it will not be in history via 'on_cmd_keyup'
        cmd_history[cmd_history_position] =
            this.refs.console_input.props.value
        
        var cmd_console = this.state.cmd_console
        cmd_console.push(
            <div>
                <br/>
                <div className="console_result monospace">&gt;&nbsp;{this.state.cmd}</div>
            </div>
        )
        try {
            var result = evalInContext(this.state.cmd)
            if(result && result["then"]) {
                result.then( result => {
                    this.cmd_console_result(result)
                }).catch( error => {
                    this.cmd_console_error(error)
                })
            }
            else {
                this.cmd_console_result(result)
            }
        } catch(error) {
            this.cmd_console_error(error)
        }
        // prevent immediate duplicats in history
        if(
            cmd_history_position && 
            cmd_history[cmd_history_position - 1] == this.state.cmd
        )
            cmd_history.pop()
        
        while(cmd_history[cmd_history.length - 1] == "")
            cmd_history.pop()
        
        cmd_history_position = cmd_history.length
        cmd_history.pushState("")
        this.setState({cmd_console, cmd:""})
    }
    
    cmd_console_result(result) {
        // DEBUG console.log('... cmd_console_result result',result)
        var cmd_console = this.state.cmd_console
        var result_stringify = JSON.stringify(result)
        cmd_console.push(
            <div className="console_result monospace">{result_stringify}</div>
        )
        this.forceUpdate()
    }
    
    cmd_console_error(error) {
        // DEBUG console.log("user console command error", error)
        var cmd_console = this.state.cmd_console
        var message = error.message ? error.message : error
        cmd_console.push(
            <div className="console-error monospace has-error">{message}</div>
        )
        this.forceUpdate()
    }
}

