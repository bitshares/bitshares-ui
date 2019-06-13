import React, {Component} from "react";
import counterpart from "counterpart";
import PredictionMarketsOverviewTable from "./PredictionMarketsOverviewTable";
import SearchInput from "../Utility/SearchInput";
import HelpContent from "../Utility/HelpContent";

import {Button} from "bitshares-ui-style-guide";

const STUB_ACCOUNT_ID = "1.2.23882";

const STUB_MARKETS = [
    {
        asset_id: "1.3.0",
        issuer: STUB_ACCOUNT_ID,
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    },
    {
        asset_id: "1.3.1",
        issuer: "1.2.23881",
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    },
    {
        asset_id: "1.3.2",
        issuer: "1.2.23881",
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    }
];

export default class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            markets: STUB_MARKETS,
            searchTerm: ""
        };
    }

    onMarketAction({market, action}) {
        console.log(market);
        console.log(action);
    }

    onSearch(event) {
        this.setState({searchTerm: event.target.value});
    }

    onRowAction = dataItem => {
        return {
            onClick: this.onClick.bind(this, dataItem)
        };
    };

    onCreatePredictionMarket() {
        console.log("Create prediction market");
    }

    render() {
        return (
            <div
                className="grid-block vertical"
                style={{overflow: "visible", margin: "15px"}}
            >
                <div
                    className="grid-block small-12 shrink"
                    style={{overflow: "visible"}}
                >
                    <HelpContent path={"components/PredictionMarkets"} />
                </div>
                <div style={{paddingTop: "20px"}}>
                    <SearchInput
                        style={{width: "60%", float: "left"}}
                        onChange={this.onSearch.bind(this)}
                        onClear={() => {
                            this.setState({searchTerm: ""});
                        }}
                        value={this.state.searchTerm}
                        maxLength={256}
                        autoComplete="off"
                        placeholder={counterpart.translate("exchange.filter")}
                    />
                    <Button
                        style={{float: "right"}}
                        onClick={this.onCreatePredictionMarket.bind(this)}
                    >
                        Create Prediction Market
                    </Button>
                </div>
                <PredictionMarketsOverviewTable
                    markets={STUB_MARKETS}
                    currentAccountId={STUB_ACCOUNT_ID}
                    onMarketAction={this.onMarketAction.bind(this)}
                />
            </div>
        );
    }
}
