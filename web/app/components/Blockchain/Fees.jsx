import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import classNames from "classnames";
import Translate from "react-translate-component";

import HelpContent from "../Utility/HelpContent";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import EquivalentValueComponent from "../Utility/EquivalentValueComponent";
import {operations} from "chain/chain_types";

let ops = Object.keys(operations);
let fee_grouping = {
 general  : [0,25,26,27,28,32,33,37,39,40],
 asset    : [10,11,12,13,14,15,16,17,18,19,38],
 market   : [1,2,3,4,17,18],
 account  : [5,6,7,8,9],
 business : [20,21,22,23,24,29,30,31,34,35,36],
}

class FeeItem extends React.Component {

    render() {
        let amount = this.props.value*this.props.scale/1e4;
        let feeTypes = counterpart.translate("transaction.feeTypes");

        let assetAmount = amount ? <FormattedAsset amount={amount} asset="1.3.0"/> : feeTypes["_none"];
        let equivalentAmount = amount ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amount} toAsset={this.props.preferredUnit}/> : feeTypes["_none"];
        let assetAmountLTM = amount*0.2 ? <FormattedAsset amount={amount*0.2} asset="1.3.0"/> : feeTypes["_none"];
        let equivalentAmountLTM = amount*0.2 ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amount*0.2} toAsset={this.props.preferredUnit}/> : feeTypes["_none"];

        let feeType = feeTypes[this.props.name]

        return (
                <tr>
                    <td style={{width:"20%"}}>{feeType}</td>
                    <td style={{width:"20%", textAlign: "right"}}>{assetAmount}</td>
                    <td style={{width:"20%", textAlign: "right"}}>{equivalentAmount}</td>
                    <td style={{width:"20%", textAlign: "right"}}>{assetAmountLTM}*</td>
                    <td style={{width:"20%", textAlign: "right"}}>{equivalentAmountLTM}*</td>
                </tr>
               );
    }

}

class FeeList extends React.Component {

    render() {
        let fees = this.props.fee;
        let rows = [];

        for (var key in fees) {
            rows.push(<FeeItem key={key} name={key} value={this.props.fee[key]} scale={this.props.scale} preferredUnit={this.props.preferredUnit}/>);
        }

        return (
                <table className="table">
                  <tbody>{rows}</tbody>
                </table>
                );  
    }   

}

@BindToChainState({keep_updating:true})
class FeeGroup extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
    };

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.globalObject, this.props.globalObject)
            );
    }

    render() {
        let {globalObject, settings, opIds} = this.props;
        globalObject = globalObject.toJSON();

        let current_fees = globalObject.parameters.current_fees;
        let scale   = current_fees.scale;
        let feesRaw = current_fees.parameters;
        let preferredUnit = settings.get("unit") || "BTS";

        let trxTypes = counterpart.translate("transaction.trxTypes");
        let labelClass = classNames("label", "info");

        let fees = opIds.map((feeIdx) => {
            if (feeIdx >= feesRaw.length) {
             console.warn("Asking for non-existing fee id %d! Check group settings in Fees.jsx", feeIdx);
             return; // FIXME, if I ask for a fee that does not exist?
            }

            let feeStruct = feesRaw[feeIdx];

            let opId      = feeStruct[0]
            let feeObject = feeStruct[1]
            let operation_name = ops[ opId ];
            let feename        = trxTypes[ operation_name ];

            return (
                    <tr key={opId}>
                        <td>
                         <span className={labelClass}>
                          {feename}
                         </span>
                        </td>
                        <td><FeeList fee={feeObject} scale={scale} preferredUnit={preferredUnit} /></td>
                    </tr>
                );
        })

        return (   
                   <div className="asset-card">
                    <div className="card-divider">{this.props.title}</div>
                    <table className="table">
                     <thead>
                      <tr>
                       <th><Translate content={"explorer.block.op"}/></th>
                       <th><Translate content={"transfer.fee"}/></th>
                      </tr>
                     </thead>
                     <tbody>
                      {fees}
                     </tbody>
                    </table>
                   </div>
           );
    }
}

class Fees extends React.Component {
    render() {

     let arr = [5, 6, 7, 8, 9];


        let FeeGroupsTitle  = counterpart.translate("transaction.feeGroups");
        let feeGroups = []
        for (let groupName in fee_grouping) {
            let groupNameText = FeeGroupsTitle[groupName];
            let feeIds = fee_grouping[groupName];
            feeGroups.push(<FeeGroup settings={this.props.settings} opIds={feeIds} title={groupNameText}/>);
        }

        return(
            <div className="grid-block page-layout">
                <div className="grid-block vertical" style={{overflow:"visible"}}>
                    <div className="grid-block small-12 shrink" style={{ overflow:"visible"}}>
                      <HelpContent path = {"components/Fees"} />
                    </div>
                    <div className="grid-block small-12 " style={{overflow:"visible"}}>
                     <div className="grid-content">
                      {feeGroups}
                     </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Fees;
