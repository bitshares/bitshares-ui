import React from "react";
import utils from "common/utils"
import validation from "common/validation"
import AccountImage from "../Account/AccountImage";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class LabelAssetById extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainObject,
        asset_id: React.PropTypes.string
    }
    render() {
        let symbol = this.props.asset ? this.props.asset.get("symbol") : this.props.asset_id
        return (<span key={this.props.asset_id}>{symbol}</span>);
    }
}


@BindToChainState()
class AssetSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        assets: React.PropTypes.array, // a translation key for the label
        onChange: React.PropTypes.func
    }

    constructor(props) {
       super(props)
    }

    onChange( event ) {
        this.props.onChange( event.target.value )
    }

    render() {
        var options = this.props.assets.map(function(value) {
                                            console.log( "value: ",value )
            return (<option key={value} value={value}><LabelAssetById asset={value} asset_id={value}/></option>)
            //return (<option key={value} value={value}>{value}</option>)
        });
        return (
            <select defaultValue={this.props.value} className="form-control" onChange={this.onChange.bind(this)}>
                {options}
            </select>
        );
    }
}

@BindToChainState()
class AmountSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        onChange: React.PropTypes.func
    }

    constructor(props){
       super(props)
       this.state = { 
          amount:"",
          selected_asset:props.asset
       }
    }

    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainObject,
        assets: React.PropTypes.array, // a translation key for the label
        amount: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        onChange: React.PropTypes.func
    }

    formatAmount() {
      return this.state.amount 
    }

    onChange( event )
    {
       let amount = event.target.value
       this.setState( {amount} )
       this.props.onChange(amount)
    }

    onAssetChange( selected_asset ) { this.setState( {selected_asset} ) }


    render() {
         return ( 
                <div>
                <input type="text"
                 value={this.formatAmount()}
                 placeholder={this.props.placeholder}
                 onChange={this.onChange.bind(this) }
               />
               <AssetSelector
                 assets={this.props.assets}
                 onChange={this.onAssetChange.bind(this)}
               />
               </div>
          )
    }
}

export default AmountSelector;
