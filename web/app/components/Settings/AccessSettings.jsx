import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "actions/SettingsActions";

class ApiNode extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            hovered: false  
        };
    }

    setHovered(){
        this.setState({hovered: true});
    }

    clearHovered(){
        this.setState({hovered: false});
    }

    activate(){
        SettingsActions.changeSetting({setting: "apiServer", value: this.props.url });
        setTimeout(this._onReloadClick, 250);

        if (window.electron) {
            window.location.hash = "";
            window.remote.getCurrentWindow().reload();
        }
        else window.location.href = __BASE_URL__;
    }

    remove(url, name, e){
        this.props.triggerModal(e, url, name);
    }

    render(){
        const { props, state } = this;
        const { allowActivation, allowRemoval, automatic, name, url, displayUrl, ping, up } = props;

        var color;
        var green = "#00FF00";
        var yellow = "yellow";
        var red = "red";

        if(ping < 100) color = green;
        if(ping >= 100 && ping < 200) color = yellow;
        if(ping >= 200) color = red;

        var Status = <div className="api-status" style={{position: "absolute", textAlign: "right", right: "1em", top: "0.5em"}}>
          <Translate style={{color: up ? green : red, marginBottom: 0}} component="h3" content={"settings." + (up ? "node_up" : "node_down")} />
          {up && <span style={{color}}>{ping}ms</span>}
          {!up && <span style={{color: "red"}}>__</span>}
        </div>

        return <div 
            className="api-node" 
            style={{border: "1px solid #fff", position: "relative", padding: "0.5em 1em 0.5em 1em"}} 
            onMouseEnter={this.setHovered.bind(this)} 
            onMouseLeave={this.clearHovered.bind(this)}
        >
            <h3 style={{marginBottom: 0, marginTop: 0}}>{name}</h3>
            <p style={{marginBottom: 0}}>{displayUrl}</p>

            {(!allowActivation && !allowRemoval && !automatic) && Status}

            {allowActivation && allowRemoval && !automatic && !state.hovered && Status}

            {(allowActivation || allowRemoval) && state.hovered && 
                <div style={{position: "absolute", right: "1em", top: "1.2em"}}>
                    {allowRemoval && <div className="button" onClick={this.remove.bind(this, url, name)}><Translate id="remove" content="settings.remove" /></div>}
                    {allowActivation && <div className="button" onClick={this.activate.bind(this)}><Translate content="settings.activate" /></div>}
                </div>
            }
        </div>
    }
}

ApiNode.defaultProps = {
    name: "Test node",
    url: "wss://testnode.net/wss",
    displayUrl: "wss://testnode.net/wss",
    up: true,
    ping: 50,
    allowActivation: false,
    allowRemoval: false
}

class AccessSettings extends React.Component {
    constructor(props){
        super(props);
    }

    onChange(key){

    }

    getCurrentNodeIndex(){
        const { props } = this;
        let currentNode = null;
        for(var i=0;i<props.nodes.length;i++){
            let node = props.nodes[i];
            if(node.url == props.currentNode){
                currentNode = i;
                break;
            }
        }

        return currentNode;
    }

    getNode(node){
        const { props } = this;

        return {
            name: node.location,
            url: node.url,
            up: node.url in props.apiLatencies,
            ping: props.apiLatencies[node.url]
        }
    }

    renderNode(node, allowActivation){
        const { props } = this;

        let automatic = node.url === "wss://fake.automatic-selection.com";

        let displayUrl = automatic ? "..." : node.url;

        let name = typeof(node.name) === "object" ? <Translate component="span" content={node.name.translate} /> : node.name;
        let allowRemoval = !automatic ? true : false;

        return <ApiNode {...node} automatic={automatic} allowActivation={allowActivation} allowRemoval={allowActivation && allowRemoval} key={node.url} name={name} displayUrl={displayUrl} triggerModal={props.triggerModal} />
    }

    render(){
        const { props } = this;

        let getNode = this.getNode.bind(this);   
        let renderNode = this.renderNode.bind(this);    
        let currentNodeIndex = this.getCurrentNodeIndex.call(this);

        let nodes = props.nodes.map((node)=>{
            return getNode(node)
        });


        let activeNode = getNode(props.nodes[currentNodeIndex] || props.nodes[0]);

        nodes = nodes.slice(0, currentNodeIndex).concat(nodes.slice(currentNodeIndex+1));

        return <div style={{paddingTop: "1em"}}>
            <Translate component="p" content="settings.active_node" />
            <div className="active-node" style={{marginBottom: "2em"}}>
                { renderNode(activeNode, false) }
            </div>

            <div className="available-nodes" style={{position: "relative", marginBottom: "2em"}}>
                <Translate component="p" content="settings.available_nodes" />
                <a href="#" onClick={props.triggerModal.bind(this)} style={{position: "absolute", right: 0, top: "5px"}} >
                    <Translate id="add" component="span" content="settings.add_api" />
                </a>
                { 
                    nodes.map((node)=>{ 
                        return renderNode(node, true);
                    })
                }
            </div>

            <h3><Translate content="settings.faucet_address" /></h3>
            <input type="text" defaultValue={props.faucet} onChange={this.props.onChange.bind(this, 'faucet_address')}/>
        </div> 
    }
}

export default AccessSettings;
