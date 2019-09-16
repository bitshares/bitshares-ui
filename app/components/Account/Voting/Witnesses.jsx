import React, {Component} from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import VotingAccountsList from "../VotingAccountsList";
import cnames from "classnames";
import {Input, Icon as AntIcon, Button} from "bitshares-ui-style-guide";
import JoinWitnessesModal from "../../Modal/JoinWitnessesModal";
import SearchInput from "../../Utility/SearchInput";

export default class Witnesses extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showCreateWitnessModal: false
        };
    }

    render() {
        const showWitnessModal = () => {
            this.setState({
                showCreateWitnessModal: !this.state.showCreateWitnessModal
            });
        };

        const onFilterChange = this.props.onFilterChange;
        const validateAccountHandler = this.props.validateAccountHandler;
        const addWitnessHandler = this.props.addWitnessHandler;
        const removeWitnessHandler = this.props.removeWitnessHandler;

        const {showCreateWitnessModal} = this.state;
        const {
            all_witnesses,
            proxy_witnesses,
            witnesses,
            proxy_account_id,
            hasProxy,
            globalObject,
            filterSearch,
            account
        } = this.props;
        return (
            <div>
                <div className={cnames("content-block")}>
                    <div className="header-selector">
                        <div style={{float: "right"}}>
                            <Button onClick={showWitnessModal}>
                                <Translate content="account.votes.join_witnesses" />
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
                        </div>
                    </div>
                    <VotingAccountsList
                        type="witness"
                        label="account.votes.add_witness_label"
                        items={all_witnesses}
                        validateAccount={validateAccountHandler}
                        onAddItem={addWitnessHandler}
                        onRemoveItem={removeWitnessHandler}
                        tabIndex={hasProxy ? -1 : 2}
                        supported={hasProxy ? proxy_witnesses : witnesses}
                        active={globalObject.get("active_witnesses")}
                        proxy={proxy_account_id}
                        filterSearch={filterSearch}
                    />
                </div>
                <JoinWitnessesModal
                    visible={showCreateWitnessModal}
                    account={account}
                    hideModal={showWitnessModal}
                />
            </div>
        );
    }
}
