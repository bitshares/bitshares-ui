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

class AssetSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        assets: React.PropTypes.array, // a translation key for the label
        onChange: React.PropTypes.func
    }

    constructor(props) {
        super(props)
    }

    onChange(event) {
        this.props.onChange(ChainStore.getAsset(event.target.value))
    }

    render() {
        if(this.props.assets.length === 0) return null;
        var options = this.props.assets.map(function (value) {
            return <AssetOption asset={value} asset_id={value}/>
        });
        return (
            <select defaultValue={this.props.value} className="form-control" onChange={this.onChange.bind(this)}>
                {options}
            </select>
        );
    }

}

@BindToChainState() class AmountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainObject, // selected asset by default
        assets: React.PropTypes.array,
        amount: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        display_balance: React.PropTypes.object,
        tabIndex: React.PropTypes.number
    }

    // constructor(props) {
    //     super(props)
    //     this.state = {
    //         amount: "",
    //         selected_asset: props.asset
    //     }
    // }

    // componentWillReceiveProps(nextProps) {
    //     if (nextProps.asset && nextProps.asset != this.props.asset && !this.state.asset) {
    //         this.props.onChange({amount: this.state.amount, asset: nextProps.asset});
    //     }
    // }

    formatAmount(v) {
        // TODO: use asset's precision to format the number
        if (!v) v = "";
        let value = v.trim().replace(/,/g, "");
        while (value.substring(0, 2) == "00")
            value = value.substring(1);
        if (value[0] === ".") value = "0" + value;
        else if (value.length) {
            let n = Number(value)
            if (isNaN(n)) {
                value = parseFloat(value);
                if (isNaN(value)) return "";
            }
            let parts = (value + "").split('.');
            value = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts.length > 1) value += "." + parts[1];
        }
        return value;
    }

    _onChange(event) {
        let amount = event.target.value
        this.setState({amount})
        this.props.onChange({amount: amount, asset: this.props.asset})
    }

    onAssetChange(selected_asset) {
        this.setState({selected_asset})
        this.props.onChange({amount: this.props.amount, asset: selected_asset})
    }

    render() {
        let value = this.formatAmount(this.props.amount);
        return (
            <div className="amount-selector">
                <div className="float-right">{this.props.display_balance}</div>
                <Translate component="label" content={this.props.label}/>
                <div className="inline-label">
                    <input type="text"
                           value={value}
                           placeholder={this.props.placeholder}
                           onChange={this._onChange.bind(this) }
                           tabIndex={this.props.tabIndex}/>
                   <span className="form-label select">
                       <AssetSelector
                           assets={this.props.assets}
                           onChange={this.onAssetChange.bind(this)}/>
                   </span>
                </div>
            </div>
        )
    }

}

export default AmountSelector;
