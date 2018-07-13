import React from "react";
import {Tabs, Tab} from "../Utility/Tabs";
import Witnesses from "./Witnesses";
import CommitteeMembers from "./CommitteeMembers";
import FeesContainer from "../Blockchain/FeesContainer";
import BlocksContainer from "./BlocksContainer";
import AssetsContainer from "./AssetsContainer";
import AccountsContainer from "./AccountsContainer";
import MarketsContainer from "../Exchange/MarketsContainer";

class Explorer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tabs: [
                {
                    name: "blocks",
                    link: "/explorer/blocks",
                    translate: "explorer.blocks.title",
                    content: BlocksContainer
                },
                {
                    name: "assets",
                    link: "/explorer/assets",
                    translate: "explorer.assets.title",
                    content: AssetsContainer
                },
                {
                    name: "accounts",
                    link: "/explorer/accounts",
                    translate: "explorer.accounts.title",
                    content: AccountsContainer
                },
                {
                    name: "witnesses",
                    link: "/explorer/witnesses",
                    translate: "explorer.witnesses.title",
                    content: Witnesses
                },
                {
                    name: "committee_members",
                    link: "/explorer/committee-members",
                    translate: "explorer.committee_members.title",
                    content: CommitteeMembers
                },
                {
                    name: "markets",
                    link: "/explorer/markets",
                    translate: "markets.title",
                    content: MarketsContainer
                },
                {
                    name: "fees",
                    link: "/explorer/fees",
                    translate: "fees.title",
                    content: FeesContainer
                }
            ]
        };
    }

    render() {
        let {tab} = this.props.match.params;
        let defaultActiveTab = this.state.tabs.findIndex(t => t.name === tab);

        let tabs = [];

        for (var i = 0; i < this.state.tabs.length; i++) {
            let currentTab = this.state.tabs[i];

            let TabContent = currentTab.content;
            let isLinkTo = defaultActiveTab == i ? "" : currentTab.link;

            tabs.push(
                <Tab key={i} title={currentTab.translate} isLinkTo={isLinkTo}>
                    <TabContent />
                </Tab>
            );
        }

        return (
            <Tabs
                defaultActiveTab={defaultActiveTab}
                segmented={false}
                setting="explorer-tabs"
                className="account-tabs"
                tabsClass="account-overview bordered-header content-block"
                contentClass="tab-content padding"
            >
                {tabs}
            </Tabs>
        );
    }
}

export default Explorer;
