import React from "react";
import Translate from "react-translate-component";
import Icon from "../../components/Icon/Icon";
import {Link} from "react-router-dom";
import {Select} from "bitshares-ui-style-guide";

class GatewaySelector extends React.Component {
    constructor() {
        super();
    }

    render() {
        let {
            gatewayStatus,
            selectedGateway,
            error,
            nAvailableGateways
        } = this.props;

        let selectGatewayList = 
            Object.keys(gatewayStatus)
                .sort((function(a, b) {
                    if (a > b) {
                        return 1;
                    } else if (a < b) {
                        return -1;
                    } else {
                        return 0;
                    }
                })).map((key) => {
                    let inAllowedItems = gatewayStatus[key].options.enabled ? true : false;

                    if(this.props.allowedGateways) {
                        Object.keys(this.props.allowedGateways).map((key2) => {
                            if(this.props.allowedGateways[key2] == gatewayStatus[key].id) {
                                inAllowedItems = true;
                            }
                        });
                    }

                    if (inAllowedItems) {
                        return (
                            <Select.Option
                                value={gatewayStatus[key].id}
                                key={gatewayStatus[key].id}
                            >
                                {gatewayStatus[key].name}
                            </Select.Option>
                        );
                    }
                });

        let supportLink = !!selectedGateway ? (
            <Link 
                to={
                    "/help/gateways/" + 
                    gatewayStatus[selectedGateway].name.toLowerCase().replace("-", "")
                } 
                style={{marginLeft: "1em"}}
            >
                <Icon
                    style={{cursor: "pointer"}}
                    name="question-circle"
                    title="icons.question_circle"
                />
            </Link>
        ) : null;

        let errorMessage = null;

        if (!error &&
            selectedGateway &&
            gatewayStatus[selectedGateway] &&
            !gatewayStatus[selectedGateway].options.enabled) 
        {
            errorMessage = <Translate content="modal.deposit_withdraw.disabled"/>;
        } 
        
        if (error) {
            errorMessage = <Translate content="modal.deposit_withdraw.wallet_error" />;
        }

        if (!selectedGateway && nAvailableGateways == 0) {
            errorMessage = <Translate content="modal.deposit_withdraw.no_gateway_available" />;
        }

        return (
            <div style={this.props.style}>
                <div className="no-margin no-padding">
                    <section className="block-list">
                        <label className="left-label">
                            <span className="floatRight error-msg">
                                {errorMessage}
                            </span>
                            <h6 style={{margin: 0}}>
                                <Translate content="modal.deposit_withdraw.gateway" />
                                {supportLink ? supportLink : null}
                            </h6>
                            
                        </label>
    
                        <div className="inline-label input-wrapper">
                            <Select
                                showSearch 
                                optionFilterProp="children" 
                                style={{width: "100%"}} 
                                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                value={!selectedGateway ? "" : selectedGateway}
                                onChange={this.props.onGatewayChanged}
                                placeholder={"Select Gateway"}      //FIXME: Translate
                                notFoundContent={"Nothing Found"}   //FIXME: Translate
                            >
                                {selectGatewayList}
                            </Select>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
}

export default GatewaySelector;