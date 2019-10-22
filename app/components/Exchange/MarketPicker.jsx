import {connect} from "alt-react";
import {ChainValidation} from "bitsharesjs";
import counterpart from "counterpart";
import {debounce} from "lodash-es";
import React, {Component} from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import {Link} from "react-router-dom";
import AssetActions from "actions/AssetActions";
import utils from "common/utils";
import AssetStore from "stores/AssetStore";
import {Form, Input, Modal, Icon as AntIcon} from "bitshares-ui-style-guide";
import AssetName from "../Utility/AssetName";
import {
    lookupAssets,
    assetFilter,
    fetchIssuerName
} from "./MarketPickerHelpers";

class MarketListItem extends Component {
    static propTypes = {
        onClose: PropTypes.func,
        quoteSymbol: PropTypes.string,
        baseSymbol: PropTypes.string,
        market: PropTypes.array,
        marketPickerAsset: PropTypes.string
    };

    onKeyPress(linkTo, e) {
        if (e.key == "Enter") {
            this.props.history.push(linkTo);
        }
    }

    render() {
        const {quoteSymbol, baseSymbol, market, marketPickerAsset} = this.props;
        const {onClose} = this.props;
        const marketSymbol = market[1]["quote"];
        const linkTo =
            quoteSymbol == marketPickerAsset
                ? `/market/${marketSymbol}_${baseSymbol}`
                : `/market/${quoteSymbol}_${marketSymbol}`;

        return (
            <li
                key={market[0]}
                style={{height: 40}}
                onKeyPress={this.onKeyPress.bind(this, linkTo)}
                tabIndex={this.props.tabIndex}
            >
                <Link style={{display: "flex"}} onClick={onClose} to={linkTo}>
                    <div style={{flex: 2}}>
                        <AssetName name={market[1]["quote"]} />
                    </div>
                    <div style={{flex: 3}}>{market[1].issuer}</div>
                </Link>
            </li>
        );
    }
}

class MarketPickerWrapper extends Component {
    constructor() {
        super();

        this.state = this.initialState();

        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
        this.setState = this.setState.bind(this);
        this._checkAndUpdateMarketList = this._checkAndUpdateMarketList.bind(
            this
        );
    }

    initialState() {
        return {
            marketsList: [],
            lookupQuote: null,
            inputValue: ""
        };
    }

    componentDidMount() {
        this.refs.marketPicker_input.focus();
    }

    componentDidUpdate() {
        this.refs.marketPicker_input.focus();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.marketPickerAsset !== this.props.marketPickerAsset)
            this.setState(this.initialState());

        if (nextProps.searchAssets !== this.props.searchAssets)
            assetFilter(
                {
                    searchAssets: this.props.searchAssets,
                    marketPickerAsset: this.props.marketPickerAsset,
                    baseAsset: this.props.baseAsset,
                    quoteAsset: this.props.quoteAsset
                },
                {
                    inputValue: this.state.inputValue,
                    lookupQuote: this.state.lookupQuote
                },
                this.setState,
                this._checkAndUpdateMarketList
            );
    }

    shouldComponentUpdate(np, ns) {
        return (
            np.visible !== this.props.visible ||
            np.marketPickerAsset !== this.props.marketPickerAsset ||
            np.searchAssets !== this.props.searchAssets ||
            ns.marketsList !== this.state.marketsList ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    componentWillUnmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    _onInputName(getBackedAssets, e) {
        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);

        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                inputValue: toFind,
                activeSearch: false,
                marketsList: []
            });
            return;
        } else {
            this.setState({
                inputValue: toFind,
                activeSearch: true,
                marketsList: []
            });
        }

        if (this.state.inputValue !== toFind) {
            this.timer && clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            lookupAssets(
                toFind,
                getBackedAssets,
                this.getAssetList,
                this.setState
            );
        }, 1500);
    }

    _checkAndUpdateMarketList(marketsList) {
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => {
            let needFetchIssuer = 0;
            for (let [, market] of marketsList) {
                if (!market.issuer) {
                    market.issuer = fetchIssuerName(market.issuerId);
                    if (!market.issuer) needFetchIssuer++;
                }
            }
            if (needFetchIssuer) return;
            clearInterval(this.intervalId);
            this.setState({
                marketsList,
                activeSearch: false
            });
        }, 300);
    }

    renderSearchBar() {
        const {inputValue} = this.state;

        const labelKey = "exchange.market_picker.find_by_asset";
        const label = counterpart.translate(labelKey).toUpperCase();
        const placeHolderKey = "exchange.market_picker.search";
        return (
            <div id="filter">
                <Form.Item label={label}>
                    <Input
                        type="text"
                        ref="marketPicker_input"
                        value={inputValue}
                        onChange={this._onInputName.bind(this, true)}
                        placeholder={counterpart.translate(placeHolderKey)}
                        maxLength="16"
                        tabIndex={2}
                    />
                </Form.Item>
            </div>
        );
    }

    renderResults() {
        const {marketsList} = this.state;
        const {activeSearch, inputValue} = this.state;
        const loading = activeSearch && inputValue.length != 0;

        let {marketPickerAsset} = this.props;
        let baseSymbol = this.props.baseAsset.get("symbol");
        let quoteSymbol = this.props.quoteAsset.get("symbol");

        if (!loading)
            return (
                <div className="results">
                    <ul style={{marginLeft: 0, minHeight: "20px"}}>
                        {marketsList.map((market, index) => {
                            return (
                                <MarketListItem
                                    key={index}
                                    tabIndex={index + 100}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    market={market}
                                    marketPickerAsset={marketPickerAsset}
                                    history={this.props.history}
                                    onClose={this.props.onClose.bind(this)}
                                />
                            );
                        })}
                    </ul>
                </div>
            );
        return (
            <AntIcon
                style={{marginLeft: "8px"}}
                type="loading"
                theme="outlined"
            />
        );
    }

    render() {
        const {marketPickerAsset} = this.props;
        return (
            <div className="marketPicker">
                <div className="marketPicker__subHeader">
                    <Translate content="exchange.market_picker.sub_title" />
                    &nbsp;
                    <Link
                        to={`/asset/${marketPickerAsset}`}
                        style={{
                            cursor: "pointer",
                            color: "lightblue !important"
                        }}
                    >
                        <AssetName name={marketPickerAsset} />
                    </Link>
                </div>
                {this.renderSearchBar()}
                {this.renderResults()}
            </div>
        );
    }
}

class MarketPicker extends Component {
    constructor() {
        super();

        this.state = {
            open: false,
            smallScreen: false
        };
    }

    componentWillMount() {
        this.setState({
            smallScreen: window.innerWidth <= 800
        });
    }

    componentWillReceiveProps(nextProps) {
        if (
            this.props.quoteAsset.get("id") !==
                nextProps.quoteAsset.get("id") ||
            this.props.baseAsset.get("id") !== nextProps.baseAsset.get("id")
        ) {
            this.onClose();
        }
    }

    show() {
        this.props.showModal();
    }

    onClose() {
        this.props.onToggleMarketPicker(null);
        this.props.hideModal();
    }

    render() {
        return (
            <Modal
                title={counterpart.translate("exchange.market_picker.title")}
                closable={false}
                visible={this.props.visible}
                id={this.props.modalId}
                overlay={true}
                onCancel={this.onClose.bind(this)}
                noHeaderContainer
                footer={null}
                ref={this.props.modalId}
                {...this.props}
            >
                <MarketPickerWrapper
                    onClose={this.onClose.bind(this)}
                    {...this.props}
                />
            </Modal>
        );
    }
}

MarketPicker = connect(
    MarketPicker,
    {
        listenTo() {
            return [AssetStore];
        },
        getProps() {
            return {
                searchAssets: AssetStore.getState().assets,
                assetsLoading: AssetStore.getState().assetsLoading
            };
        }
    }
);

export default MarketPicker;
