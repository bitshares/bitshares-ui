import React from "react";
import Translate from "react-translate-component";

class TradingCompetitionPage extends React.Component {
    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="grid-content" style={{paddingTop: "2rem"}}>
                        <Translate
                            component="h2"
                            content={"cryptobridge.competition.page.title"}
                        />
                        <Translate
                            component="p"
                            content={"cryptobridge.competition.page.intro"}
                        />
                        <div style={{height: "806px"}}>
                            <iframe
                                src={
                                    "https://widgets.crypto-bridge.org/leaderboard/?pageSize=20&tabs=false"
                                }
                                style={{width: "100%", height: "800px"}}
                                frameBorder="0"
                            >
                                Browser not compatible.
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default TradingCompetitionPage;
