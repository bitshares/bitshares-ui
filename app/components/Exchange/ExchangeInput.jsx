import React from "react";

class ExchangeInput extends React.Component {
    constructor(){
        super();
    }

    getSelection(){
        try {
            var text = '';
            if (window.getSelection) {
                text = window.getSelection();
            } else if (document.getSelection) {
                text = document.getSelection();
            } else if (document.selection) {
                text = document.selection.createRange().text;
            }

            return text.toString();
        } catch(e){
            return '';
        }
    }

    isNumeric(obj){
        return !isNaN(obj - parseFloat(obj));
    }

    onKeyPress(e){
        var nextValue = e.target.value + e.key;
        var decimal = nextValue.match(/\./g);
        var decimalCount = decimal ? decimal.length : 0;
        let trailingCut = nextValue.substr(0, nextValue.length-1);
        let selection = this.getSelection();

        if(e.key === '.'){
            if(decimalCount == 2 && selection == trailingCut){ // clearing selected text
            } else if(decimalCount > 1){
                e.preventDefault();
            }
        } else if(!this.isNumeric(e.key)){
            e.preventDefault();
        }

        if(this.props.onKeyPress) this.props.onKeyPress(e);
    }

    render(){
        return <input type="text" {...this.props} onKeyPress={this.onKeyPress.bind(this)} />
    }
}

export default ExchangeInput;
