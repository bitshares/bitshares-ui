import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";

class ExplorerCard extends React.Component {

    render() {

        return (
            <div className="grid-content">
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
            <div className="grid-block page-layout" style={{alignItems: "flex-start"}}>
                <div className="grid-block regular-padding small-up-1 medium-up-2 large-up-3">
                        <ExplorerCard>
                            <Link to="blocks">
                                <div>
                                    <Icon name="blocks" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.blocks.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        <ExplorerCard>
                            <Link to="assets">
                                <div>
                                    <Icon name="assets" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.assets.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        <ExplorerCard>
                            <Link to="accounts">
                                <div>
                                    <Icon name="accounts" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.accounts.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        <ExplorerCard>
                            <Link to="witnesses">
                                <div>
                                    <Icon name="witnesses" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.witnesses.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        <ExplorerCard>
                            <Link to="delegates">
                                <div>
                                    <Icon name="delegates" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.delegates.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        {/*<ExplorerCard>
                            <Link to="blocks">
                                <div>
                                    <Icon name="workers" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.workers.title" />
                                </div>
                            </Link>
                        </ExplorerCard>
                        <ExplorerCard>
                            <Link to="blocks">
                                <div>
                                    <Icon name="proposals" size="5x" fillClass="fill-black"/>
                                </div>
                                <div className="card-divider text-center">
                                    <Translate component="span" content="explorer.proposals.title" />
                                </div>
                            </Link>
                        </ExplorerCard>*/}
                    </div>

            </div>
        );
    }
}

export default Explorer;
