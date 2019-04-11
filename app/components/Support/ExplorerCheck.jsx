/**
 * ExplorerCheck component
 *
 * Renders a component with clickable Coin Explorer URL, if it exists.
 */
import React from "react";
import Translate from "react-translate-component";
import {IssuesEnum} from "./Constants";

/**
 * Gets the Explorer URL for a specific coin
 *
 * @param props
 * @returns {string}
 */
const getExplorerUrl = props => {
    const {selectedCoin, data, transferType} = props;

    if (!selectedCoin || !selectedCoin.explorer) {
        return "";
    }

    const {baseUrl, transactionsUrl, addressesUrl} = selectedCoin.explorer;

    try {
        if (data !== "" && selectedCoin !== null && transferType !== -1) {
            if (transferType === IssuesEnum.DEPOSIT) {
                return `${baseUrl}${transactionsUrl}`.replace(
                    /\${txId}/g,
                    data
                );
            } else if (transferType === IssuesEnum.WITHDRAWAL) {
                return `${baseUrl}${addressesUrl}`.replace(
                    /\${address}/g,
                    data
                );
            } else {
                log(
                    `ExplorerCheck.jsx:getExplorerUrl() - invalid IssueTypeID (${transferType})`
                );
            }
        }
    } catch (error) {
        log(`ExplorerCheck.jsx:getExplorerUrl() - ${error}`);
    }

    return "";
};

class ExplorerCheck extends React.Component {
    state = {};

    render() {
        const explorerUrl = getExplorerUrl(this.props);

        return (
            explorerUrl !== "" && (
                <div className="modal-new-ticket__blockchain-check">
                    <Translate
                        content="cryptobridge.support.explorer_instructions"
                        component="p"
                        className="instructions"
                    />
                    <a
                        href={explorerUrl}
                        className="modal-new-ticket__blockchain-url"
                    >
                        {explorerUrl}
                    </a>
                    <Translate
                        content="cryptobridge.support.not_see_transaction"
                        component="button"
                        className="modal-new-ticket__transaction-not-found-button"
                        onClick={this.props.onNotFound}
                    />
                </div>
            )
        );
    }
}

export default ExplorerCheck;
