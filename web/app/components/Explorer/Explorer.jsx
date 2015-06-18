import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";

class ExplorerCard extends React.Component {

    render() {

        return (
            <div style={{padding: "0.5em 0.5em", minHeight: "15em"}} className="grid-content account-card">
                <div className="card">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

class Explorer extends React.Component {

    render() {

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout" style={{alignItems: "flex-start"}}>
                    <div className="grid-block small-up-1 medium-up-2 large-up-3">
                            <ExplorerCard>
                                <Link to="blocks">
                                    <div>
                                        <Icon name="layers" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.blocks.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard>
                            <ExplorerCard>
                                <Link to="assets">
                                    <div>
                                        <Icon name="database" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.assets.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard>
                            <ExplorerCard>
                                <Link to="blocks">
                                    <div>
                                        <Icon name="users" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.accounts.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard> 
                            <ExplorerCard>
                                <Link to="witnesses">
                                    <div>
                                        <Icon name="search" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.witnesses.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard>
                            <ExplorerCard>
                                <Link to="delegates">
                                    <div>
                                        <Icon name="users" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.delegates.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard> 
                            <ExplorerCard>
                                <Link to="blocks">
                                    <div>
                                        <Icon name="users" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.workers.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard>
                            <ExplorerCard>
                                <Link to="blocks">
                                    <div>
                                        <Icon name="wand" size="5x" fillClass="fill-black"/>
                                    </div>
                                    <div className="card-divider">
                                        <Translate component="span" content="explorer.proposals.title" />
                                    </div>
                                </Link> 
                            </ExplorerCard>
                        </div>
                       
                </div>
            </div>
        );
    }
}

export default Explorer;
