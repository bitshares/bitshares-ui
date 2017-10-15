import React from "react";

export class DecimalChecker extends React.Component {
    onKeyPress(e){
        var nextValue = e.target.value + e.key;
        var decimal = nextValue.match(/\./g);
        var decimalCount = decimal ? decimal.length : 0;
        if(e.key === "." && decimalCount > 1) e.preventDefault();
        if(parseFloat(nextValue) != nextValue) e.preventDefault();

        if(this.props.onKeyPress) this.props.onKeyPress(e);
    }
}

class ExchangeInput extends DecimalChecker {
    constructor(){
        super();
    }

    render(){
        return <input type="text" {...this.props} onKeyPress={this.onKeyPress.bind(this)} />;
    }
}

export default ExchangeInput;
