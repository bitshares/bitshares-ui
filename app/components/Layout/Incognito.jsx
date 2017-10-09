import React from "react";
import Translate from "react-translate-component";

class Incognito extends React.Component {
    render(){
        return (
            <div id="incognito" style={{width: "100%", height: "100%", textAlign: "center", position: "absolute", background: "black"}}>
                <div style={{height: "50%", float: "left", marginBottom: "-150px", width: "100%"}}></div>
                <Translate content="incognito.no_support" style={{clear: "both", display: "block", fontSize: "3em", width: "50%", lineHeight: "1.5em", margin: "0 auto 1em auto"}} />
                <button onClick={this.props.onClickIgnore} style={{display: "block", margin: "0 auto", width: "50%", borderRadius: "10px", padding: "1em", color: "black"}}><Translate content="incognito.ignore" /></button>
            </div>
        );
    }
}

export default Incognito;
