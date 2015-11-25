import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";        
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import utils from "common/utils";
import Translate from "react-translate-component";

export default class IndicatorModal extends React.Component {

    show() {
        let modalId = "modal_indicators";
        ZfApi.publish(modalId, "open");
    }

    render() {
        let {indicators, indicatorSettings} = this.props;

        let available = Object.keys(indicators);
        // console.log("available:", available, "values:", indicators);

        let toggles = available.map((indicator, index) => {

            let indicatorKeys = Object.keys(indicatorSettings[indicator]);

            let options = indicatorKeys.map((setting, index) => {
                return (
                    <tr key={indicator + "_" + setting} style={{fontSize: "0.9rem"}}>
                        <td style={index === indicatorKeys.length - 1 ? {} : {border: "none"}}>
                            <Translate content={"exchange." + setting} />
                        </td>
                        <td style={index === indicatorKeys.length - 1 ? {} : {border: "none"}}>
                            <input
                                onChange={this.props.onChangeSetting.bind(this, indicator, setting)}
                                type="number"
                                value={indicatorSettings[indicator][setting]}
                                style={{fontSize: "0.9rem", height: "2rem", padding: "2px 8px"}}
                            />
                        </td>
                    </tr>
                )
            });

            return (
                <table key={"table_" + indicator} className="table">
                    <tbody>
                    <tr>
                        <td style={{border: "none", width: "80%"}}><Translate style={{fontWeight: "bold"}} content={`exchange.${indicator}`} />:</td>
                        <td style={{border: "none"}}>
                            <div className="switch" style={{marginBottom: "10px"}} onClick={this.props.onChangeIndicator.bind(this, indicator)}>
                                <input type="checkbox" checked={indicators[indicator]} />
                                <label />
                            </div>
                        </td>
                    </tr>
                    {indicators[indicator] ? options : null}
                    </tbody>
                </table>
            )
        })


        return (
            <Modal id={"modal_indicators"} overlay={true}>
                <Trigger close={"modal_indicators"}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <Translate component="h3" content="exchange.indicators" />
                <div className="grid-block vertical">
                    {toggles}
                    <div className="button-group" style={{paddingTop: "2rem"}}>
                        <Trigger close={"modal_indicators"}>
                            <input className="button success" type="submit" value="Close" />
                        </Trigger>
                    </div>
                </div>
            </Modal>
        );
    }
}
