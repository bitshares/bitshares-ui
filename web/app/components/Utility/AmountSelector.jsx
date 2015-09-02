import React from "react";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class AssetOption extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainObject,
        asset_id: React.PropTypes.string
    }
    render() {
        let symbol = this.props.asset ? this.props.asset.get("symbol") : this.props.asset_id;
        return (<option value={this.props.asset_id}>{symbol}</option>);
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
        this.props.onChange( ChainStore.getAsset(event.target.value) )
    }

    render() {
        var options = this.props.assets.map(function(value) {
            return <AssetOption asset={value} asset_id={value}/>
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
        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainObject,
        assets: React.PropTypes.array,
        amount: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    }

    constructor(props){
       super(props)
       this.state = { 
          amount:"",
          selected_asset: props.asset
       }
    }

    formatAmount() {
      return this.state.amount 
    }

    onChange( event )
    {
       let amount = event.target.value
       this.setState( {amount} )
       this.props.onChange({amount: amount, asset: this.state.selected_asset})
    }

    onAssetChange( selected_asset ) {
        this.setState( {selected_asset} )
        this.props.onChange({amount: this.state.amount, asset: selected_asset})
    }

    render() {
         return (
             <div className="amount-selector">
                 <div className="float-right">[TODO: show balance]</div>
                 <Translate component="label" content={this.props.label}/>
                 <div className="inline-label">
                    <input type="text"
                     value={this.formatAmount()}
                     placeholder={this.props.placeholder}
                     onChange={this.onChange.bind(this) }
                   />
                   <span className="form-label select">
                       <AssetSelector
                         assets={this.props.assets}
                         onChange={this.onAssetChange.bind(this)}
                       />
                   </span>
                 </div>
             </div>
          )
    }
}

export default AmountSelector;
