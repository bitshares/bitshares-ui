import React from "react";

class ExchangeInput extends React.Component {
    constructor(){
        super();
    }

    onKeyPress(e){
        var nextValue = e.target.value + e.key;
        var decimal = nextValue.match(/\./g);
        var decimalCount = decimal ? decimal.length : 0;
        if(e.key === '.' && decimalCount > 1) e.preventDefault();

        if(this.props.onKeyPress) this.props.onKeyPress(e);
    }

    render(){
        return <input type="number" {...this.props} onKeyPress={this.onKeyPress.bind(this)} />
    }
}

export default ExchangeInput;
