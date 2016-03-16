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
import {chain_types} from "@graphene/chain";
let {operations} = chain_types;
import ChainStore from "api/ChainStore";

let ops = Object.keys(operations);

// Define groups and their corresponding operation ids
let fee_grouping = {
    general  : [0,25,26,27,28,32,33,37,39,40],
    asset    : [10,11,12,13,14,15,16,17,18,19,38],
    market   : [1,2,3,4,17,18],
    account  : [5,6,7,8,9],
    business : [20,21,22,23,24,29,30,31,34,35,36],
};

// Operations that require LTM
let ltm_required = [5, 7, 20, 21, 34];

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
        const core_asset = ChainStore.getAsset("1.3.0");

        let current_fees = globalObject.parameters.current_fees;
        let scale   = current_fees.scale;
        let feesRaw = current_fees.parameters;
        let preferredUnit = settings.get("unit") || core_asset.get("symbol");

        let trxTypes = counterpart.translate("transaction.trxTypes");

        let fees = opIds.map((feeIdx) => {
            if (feeIdx >= feesRaw.length) {
             console.warn("Asking for non-existing fee id %d! Check group settings in Fees.jsx", feeIdx);
             return; // FIXME, if I ask for a fee that does not exist?
            }

            let feeStruct = feesRaw[feeIdx];

            let opId      = feeStruct[0]
            let fee       = feeStruct[1]
            let operation_name = ops[ opId ];
            let feename        = trxTypes[ operation_name ];

            let rows = []
            let headInlucded = false
            let labelClass = classNames("label", "info");

            for (let key in fee) {
                let amount = fee[key]*scale/1e4;
                let feeTypes = counterpart.translate("transaction.feeTypes");
                let assetAmount = amount ? <FormattedAsset amount={amount} asset="1.3.0"/> : feeTypes["_none"];
                let equivalentAmount = amount ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amount} toAsset={preferredUnit}/> : feeTypes["_none"];
                let assetAmountLTM = amount*0.2 ? <FormattedAsset amount={amount*0.2} asset="1.3.0"/> : feeTypes["_none"];
                let equivalentAmountLTM = amount*0.2 ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amount*0.2} toAsset={preferredUnit}/> : feeTypes["_none"];
                let title = null;

                if (!headInlucded) {
                    headInlucded = true
                    title = (<td rowSpan="6" style={{width:"15em"}}>
                               <span className={labelClass}>
                                {feename}
                               </span>
                             </td>)
                }

                if (ltm_required.indexOf(opId)<0) {
                    rows.push(
                            <tr key={opId.toString() + key}>
                                {title}
                                <td>{feeTypes[key]}</td>
                                <td style={{textAlign: "right"}}>{equivalentAmount}</td>
                                <td style={{textAlign: "right"}}>{equivalentAmountLTM}</td>
                            </tr>
                           );
                } else {
                    rows.push(
                            <tr key={opId.toString() + key}>
                                {title}
                                <td>{feeTypes[key]}</td>
                                <td style={{textAlign: "right"}}>- <sup>*</sup></td>
                                <td style={{textAlign: "right"}}>{equivalentAmountLTM}</td>
                            </tr>
                           );
                }
            }
            return (<tbody>{rows}</tbody>);
        })

        return (   
                   <div className="asset-card">
                    <div className="card-divider">{this.props.title}</div>
                    <table className="table">
                     <thead>
                      <tr key={this.props.title}>
                       <th><Translate content={"explorer.block.op"} /></th>
                       <th><Translate content={"explorer.fees.type"} /></th>
                       <th style={{textAlign: "right"}}><Translate content={"explorer.fees.fee"} /></th>
                       <th style={{textAlign: "right"}}><Translate content={"explorer.fees.feeltm"} /></th>
                      </tr>
                     </thead>
                      {fees}
                    </table>
                   </div>
           );
    }
}

class Fees extends React.Component {

    render() {

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
