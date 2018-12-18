import React from "react";
import Immutable from "immutable";
import Operation from "../Blockchain/Operation";
import utils from "common/utils";

class OperationDisplay extends React.Component {
    constructor(props) {
        super(props);
        let trxIndex = 0;
        let operations = this.props.latestTransactions
            .filter(a => {
                return a.block_num == this.props.maxBlock;
            })
            .map(trx => {
                let opIndex = 0;
                return trx.operations
                    .map(op => {
                        let optxt = JSON.stringify(op);
                        return (
                            /*
                            <Operation
                                key={trxIndex++}
                                op={op}
                                result={trx.operation_results[opIndex++]}
                                block={trx.block_num}
                                hideFee={true}
                                hideOpLabel={false}
                                current={"1.2.0"}
                                hideDate
                                hidePending
                            />
                            */

                            <tr key={trxIndex++}>
                                <td>{optxt}</td>
                            </tr>
                        );
                    })
                    .filter(a => !!a);
            })
            .toArray();
        this.state = {
            totalOps: operations.length,
            operations: operations,
            operationsDisplay: [],
            maxBlock: this.props.maxBlock
        };
    }
    componentDidUpdate() {
        if (this.state.totalOps > 0 && this.state.operations.length > 0) {
            const scroll = () => {
                let od = this.state.operationsDisplay.slice();
                let o = this.state.operations.slice();
                od.push(o.pop());
                if (od.length > 15) {
                    od.shift();
                }
                this.setState({
                    operationsDisplay: od,
                    operations: o
                });
            };
            setTimeout(scroll, 3100 / this.state.totalOps);
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state !== nextState) {
            return true;
        } else {
            return false;
        }
    }
    static getDerivedStateFromProps(props, state) {
        // Re-run the filter whenever the list array or filter text change.
        // Note we need to store prevPropsList and prevFilterText to detect changes.
        if (props.maxBlock !== state.maxBlock) {
            let trxIndex = 0;
            let operations = props.latestTransactions
                .filter(a => {
                    return a.block_num == props.maxBlock;
                })
                .map(trx => {
                    let opIndex = 0;
                    return trx.operations
                        .map(op => {
                            let optxt = JSON.stringify(op);
                            return (
                                /*
                                    <Operation
                                        key={trxIndex++}
                                        op={op}
                                        result={trx.operation_results[opIndex++]}
                                        block={trx.block_num}
                                        hideFee={true}
                                        hideOpLabel={false}
                                        current={"1.2.0"}
                                        hideDate
                                        hidePending
                                    />
                                    */

                                <tr key={trxIndex++}>
                                    <td>{optxt}</td>
                                </tr>
                            );
                        })
                        .filter(a => !!a);
                })
                .toArray();

            return {
                totalOps: operations.length,
                operations: operations,
                operationsDisplay: state.operationsDisplay,
                maxBlock: props.maxBlock
            };
        }
        return null;
    }
    render() {
        let displayed = this.state.operationsDisplay.slice().reverse();

        return (
            <table className="table fixed-height-2rem">
                <tbody>{displayed}</tbody>
            </table>
        );
    }
}

export default OperationDisplay;
