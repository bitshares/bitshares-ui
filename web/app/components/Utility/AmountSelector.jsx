import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "./FormattedAsset";

class AssetOption extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainObject,
        asset_id: React.PropTypes.string
    }

    render() {
        let symbol = this.props.asset ? this.props.asset.get("symbol") : this.props.asset_id;
        return (<li onClick={this.props.onClick.bind(this, this.props.asset_id)}><span>{symbol}</span></li>);
    }

}
AssetOption = BindToChainState(AssetOption);

class AssetSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        assets: React.PropTypes.array, // a translation key for the label
        onChange: React.PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            selected: props.value || props.assets[0],
            active: false,
            listener: false
        };

        this.onBodyClick = this.onBodyClick.bind(this);
    }

    componentDidMount() {
        this._setListener();
    }

    _setListener(props = this.props, state = this.state) {
        if(props.assets.length > 1 && !state.listener) {
            document.body.addEventListener("click", this.onBodyClick, false);
            this.setState({listener: true});
        }
    }

    componentWillReceiveProps(np) {
        this._setListener(np);
    }

    componentWillUnmount() {
        document.body.removeEventListener("click", this.onBodyClick);
    }

    onBodyClick(e) {
      let el = e.target;
      let insideActionSheet = false;

      do {
        if(el.classList && el.classList.contains('action-sheet-container') && el.id === this.props.id) {
          insideActionSheet = true;
          break;
        }

      } while ((el = el.parentNode));

      if(!insideActionSheet) {
        this.setState({active: false});
      }
    }

    onChange(value, e) {
        e.preventDefault();
        e.stopPropagation();
        let asset = ChainStore.getAsset(value);
        this.props.onChange(asset);
        this.setState({
            selected: asset ? asset.get("id") : "1.3.0",
            active: false
        });
    }

    _toggleDropdown(e) {
        this.setState({
            active: !this.state.active
        });
    }

    render() {
        let {active} = this.state;
        const currentAsset = ChainStore.getAsset(this.props.value);
        if(this.props.assets.length === 0) return null;
        var options = this.props.assets.map(value => {
            return <AssetOption onClick={this.onChange.bind(this)} key={value} asset={value} asset_id={value}/>;
        });

        if(this.props.assets.length == 1) {
            return (
               <div className={"wrapper-dropdown inactive"}>
                   <div><FormattedAsset asset={this.props.assets[0]} amount={0} hide_amount={true}/></div>
               </div>
           );

        } else {
            return (
                <div onClick={this._toggleDropdown.bind(this)} className={"wrapper-dropdown" + (active ? " active" : "")}>
                    <div style={{paddingRight: 15}}>{currentAsset && currentAsset.get("symbol")}</div>
                    <ul className="dropdown">
                        {options}
                    </ul>
                </div>
                );
        }

    }

}

class AmountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainAsset.isRequired, // selected asset by default
        assets: React.PropTypes.array,
        amount: React.PropTypes.any,
        placeholder: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        tabIndex: React.PropTypes.number
    };

    static defaultProps = {
        disabled: false
    };

    componentDidMount() {
        this.onAssetChange(this.props.asset);
    }

    formatAmount(v) {
        // TODO: use asset's precision to format the number
        if (!v) v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.trim().replace(/,/g, "");
        // value = utils.limitByPrecision(value, this.props.asset.get("precision"));
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
            <div className="amount-selector" style={this.props.style}>
                <label className="right-label">{this.props.display_balance}</label>
                <Translate className="left-label" component="label" content={this.props.label}/>
                <div className="inline-label input-wrapper">
                    <input
                           disabled={this.props.disabled}
                           type="text"
                           value={value || ""}
                           placeholder={this.props.placeholder}
                           onChange={this._onChange.bind(this) }
                           tabIndex={this.props.tabIndex}/>
                   <div className="form-label select asset-selector">
                       <AssetSelector
                           ref={this.props.refCallback}
                           value={this.props.asset.get("id")}
                           assets={this.props.assets}
                           onChange={this.onAssetChange.bind(this)}
                       />
                   </div>
                </div>
            </div>
        )
    }
}
AmountSelector = BindToChainState(AmountSelector);

export default AmountSelector;
