import React from "react";
import Translate from "react-translate-component";
import WorkersList from "../WorkersList";
import {Link} from "react-router-dom";
import AssetName from "../../Utility/AssetName";
import counterpart from "counterpart";
import {EquivalentValueComponent} from "../../Utility/EquivalentValueComponent";
import FormattedAsset from "../../Utility/FormattedAsset";
import {
    Row,
    Col,
    Radio,
    Input,
    Icon as AntIcon,
    Button
} from "bitshares-ui-style-guide";
import SearchInput from "../../Utility/SearchInput";

export default class Workers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newWorkersLength: null,
            activeWorkersLength: null,
            pollsLength: null,
            expiredWorkersLength: null,
            voteThreshold: null,
            workerTableIndex: props.viewSettings.get("workerTableIndex", 1)
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            ns.newWorkersLength !== this.state.newWorkersLength ||
            ns.activeWorkersLength !== this.state.activeWorkersLength ||
            ns.pollsLength !== this.state.pollsLength ||
            ns.expiredWorkersLength !== this.state.expiredWorkersLength ||
            ns.voteThreshold !== this.state.voteThreshold ||
            np.workerTableIndex !== this.state.workerTableIndex
        );
    }

    render() {
        const {
            vote_ids,
            proxy_vote_ids,
            hideLegacy,
            preferredUnit,
            globalObject,
            totalBudget,
            workerBudget,
            hideLegacyProposals,
            hasProxy,
            filterSearch,
            onFilterChange,
            onChangeVotes,
            getWorkerArray
        } = this.props;

        const {
            workerTableIndex,
            newWorkersLength,
            activeWorkersLength,
            pollsLength,
            expiredWorkersLength,
            voteThreshold
        } = this.state;

        const setWorkerTableIndex = e => {
            this.setState({
                workerTableIndex: e.target.value
            });
        };

        return (
            <div>
                <div className="header-selector">
                    <div style={{float: "right"}}>
                        <Button>
                            <Link to="/create-worker">
                                <Translate content="account.votes.create_worker" />
                            </Link>
                        </Button>
                    </div>

                    <div className="selector inline-block">
                        <SearchInput
                            placeholder={counterpart.translate(
                                "explorer.witnesses.filter_by_name"
                            )}
                            value={filterSearch}
                            onChange={onFilterChange}
                        />
                        <Radio.Group
                            defaultValue={1}
                            onChange={setWorkerTableIndex}
                        >
                            <Radio value={0}>
                                {counterpart.translate("account.votes.new", {
                                    count: newWorkersLength
                                })}
                            </Radio>

                            <Radio value={1}>
                                {counterpart.translate("account.votes.active", {
                                    count: activeWorkersLength
                                })}
                            </Radio>

                            {pollsLength ? (
                                <Radio value={3}>
                                    {counterpart.translate(
                                        "account.votes.polls",
                                        {count: pollsLength}
                                    )}
                                </Radio>
                            ) : null}

                            {expiredWorkersLength ? (
                                <Radio value={2}>
                                    <Translate content="account.votes.expired" />
                                </Radio>
                            ) : null}
                        </Radio.Group>
                    </div>

                    {hideLegacy}
                    <br />
                    <br />
                    <Row>
                        <Col span={3}>
                            <Translate content="account.votes.threshold" /> (
                            <AssetName name={preferredUnit} />)
                        </Col>
                        <Col
                            span={3}
                            style={{
                                marginLeft: "10px"
                            }}
                        >
                            <FormattedAsset
                                decimalOffset={4}
                                hide_asset
                                amount={voteThreshold}
                                asset="1.3.0"
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={3}>
                            <Translate content="account.votes.total_budget" /> (
                            <AssetName name={preferredUnit} />)
                        </Col>
                        <Col
                            span={3}
                            style={{
                                marginLeft: "10px"
                            }}
                        >
                            {globalObject ? (
                                <EquivalentValueComponent
                                    hide_asset
                                    fromAsset="1.3.0"
                                    toAsset={preferredUnit}
                                    amount={totalBudget}
                                />
                            ) : null}
                        </Col>
                    </Row>
                </div>
                <WorkersList
                    workerTableIndex={workerTableIndex}
                    preferredUnit={preferredUnit}
                    setWorkersLength={(
                        _newWorkersLength,
                        _activeWorkersLength,
                        _pollsLength,
                        _expiredWorkersLength,
                        _voteThreshold
                    ) => {
                        this.setState({
                            newWorkersLength: _newWorkersLength,
                            activeWorkersLength: _activeWorkersLength,
                            pollsLength: _pollsLength,
                            expiredWorkersLength: _expiredWorkersLength,
                            voteThreshold: _voteThreshold
                        });
                    }}
                    workerBudget={workerBudget}
                    hideLegacyProposals={hideLegacyProposals}
                    hasProxy={hasProxy}
                    proxy_vote_ids={proxy_vote_ids}
                    vote_ids={vote_ids}
                    onChangeVotes={onChangeVotes}
                    getWorkerArray={getWorkerArray}
                    filterSearch={filterSearch}
                />
            </div>
        );
    }
}
