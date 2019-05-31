import React from "react";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore";

class TradingCompetitionPage extends React.Component {
    render() {
        const account = AccountStore.getState().currentAccount || "";
        return (
            <div>
                <div className="padding">
                    <Translate
                        component="h2"
                        content={"cryptobridge.competition.page.header"}
                    />
                    <Translate
                        component="p"
                        content={"cryptobridge.competition.page.intro"}
                        unsafe
                    />
                </div>
                <div className="grid-block vertical medium-horizontal">
                    <div className="medium-6 padding">
                        <iframe
                            src={`https://widgets.crypto-bridge.org/leaderboard/?type=trading&pageSize=10&me=${account}`}
                            style={{width: "100%", height: "600px"}}
                            frameBorder="0"
                        >
                            Browser not compatible.
                        </iframe>
                    </div>
                    <div className="medium-6 padding">
                        <Translate
                            component="h3"
                            content={
                                "cryptobridge.competition.page.leaderboard_title"
                            }
                        />
                        <Translate
                            component="p"
                            content={
                                "cryptobridge.competition.page.leaderboard_body1"
                            }
                        />
                        <Translate
                            component="p"
                            content={
                                "cryptobridge.competition.page.leaderboard_body2"
                            }
                        />
                        <p>
                            <a
                                href={`https://widgets.crypto-bridge.org/leaderboard/?type=trading&pageSize=10&me=${account}&modal=true`}
                                target="_blank"
                            >
                                <Translate
                                    content={
                                        "cryptobridge.competition.page.leaderboard_yourWidget"
                                    }
                                />
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default TradingCompetitionPage;
