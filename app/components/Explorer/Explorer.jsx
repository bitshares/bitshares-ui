import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import {Tabs, Tab} from "../Utility/Tabs";

class Explorer extends React.Component {

    static propTypes = {
        tab: React.PropTypes.string,
        content: React.PropTypes.object
    };

    static defaultProps = {
        tab: "blocks",
        content: null
    };

    constructor(props) {
        super(props);

        this.state = {
            "tabs": [
                {name: "blocks", link: "/explorer/blocks", "translate": "explorer.blocks.title"},
                {name: "assets", link: "/explorer/assets", "translate": "explorer.assets.title"},
                {name: "accounts", link: "/explorer/accounts", "translate": "explorer.accounts.title"},
                {name: "witnesses", link: "/explorer/witnesses", "translate": "explorer.witnesses.title"},
                {name: "committee_members", link: "/explorer/committee-members", "translate": "explorer.committee_members.title"},
                {name: "markets", link: "/explorer/markets", "translate": "markets.title"},
                {name: "fees", link: "/explorer/fees", "translate": "fees.title"}
            ]
        };
    }

    render() {
        
        let defaultActiveTab = this.state.tabs.findIndex(t => t.name === this.props.tab)
        
        let tabs = [];
        
        for (var i = 0; i < this.state.tabs.length; i++) {
            let currentTab = this.state.tabs[i];

            let tabContent = (defaultActiveTab==i)?this.props.content:null;            
            let isLinkTo=(defaultActiveTab==i)?"":currentTab.link;
            
            tabs.push(<Tab key={i} title={currentTab.translate} isLinkTo={isLinkTo}>{tabContent}</Tab>);
        }
        
        
        return (<Tabs defaultActiveTab={defaultActiveTab} segmented={false} setting="explorerTab-{this.props.tab}" className="account-tabs" tabsClass="account-overview no-padding bordered-header content-block">
                    {tabs}
                </Tabs>);
        }
    }

    export default Explorer;
