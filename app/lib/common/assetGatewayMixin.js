import React from "react";
import Translate from "react-translate-component";
import Icon from "../../components/Icon/Icon";

function _getAvailableGateways(selectedAsset){
    let {gatewayStatus} = this.state;

    for (let g in gatewayStatus) { gatewayStatus[g].enabled = false; }

    for (let g in gatewayStatus) {
        this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
            if(g == "OPEN" && selectedAsset == c.backingCoinType && c.depositAllowed && c.isAvailable) { gatewayStatus.OPEN.enabled = true; }
            if(g == "RUDEX" && selectedAsset == c.backingCoin && c.depositAllowed) { gatewayStatus.RUDEX.enabled = true; }
        });
    }
    return gatewayStatus;
}

function _openGatewaySite() {
    let {selectedGateway, gatewayStatus} = this.state;
    let win = window.open(gatewayStatus[selectedGateway].support_url, "_blank");
    win.focus();
}

function _getNumberAvailableGateways(){
    const { gatewayStatus, selectedAsset } = this.state;

    var nAvailableGateways = 0;
    for (let g in gatewayStatus) {
        this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
            if(g == "OPEN" && selectedAsset == c.backingCoinType && c.depositAllowed && c.isAvailable) { nAvailableGateways++; }
            if(g == "RUDEX" && selectedAsset == c.backingCoin && c.depositAllowed) { nAvailableGateways++; }
        });
    }

    return nAvailableGateways;
}

function _onAssetSelected(selectedAsset) {
    // Preselect gateway on single choise
    let gatewayStatus = _getAvailableGateways.call(this, selectedAsset);

    let selectedGateway = null;
    let nAvailable = 0;

    for(let g in gatewayStatus) { if(gatewayStatus[g].enabled) { nAvailable++; } }
    if(nAvailable >= 1 && !selectedGateway || (this.state.selectedAsset != selectedAsset)) { 
      for(let g in gatewayStatus) { 
        if(gatewayStatus[g].enabled) { 
          selectedGateway = g; 
          break;
        } 
      } 
    }

    // Fetch address if we have a selected gateway
    else {
        this.setState({
            selectedAsset,
            selectedGateway,
            backingAsset: null,
            gatewayStatus
        });
    }

    return { selectedAsset, selectedGateway }
}

function gatewaySelector(args){
    let { selectedGateway, gatewayStatus, nAvailableGateways, error, onGatewayChanged } = args;

    return <div className="container-row">
        <div className="no-margin no-padding">
            <section className="block-list">
                <label className="left-label"><Translate content="modal.deposit_withdraw.gateway" />
                    {selectedGateway ? <span style={{cursor: "pointer"}}>&nbsp;<Icon name="question-circle" onClick={_openGatewaySite.bind(this)}/></span> : null}
                    <span className="floatRight error-msg">
                        {selectedGateway && !gatewayStatus[selectedGateway].enabled ? <Translate content="modal.deposit_withdraw.disabled" /> : null}
                        {error ? <Translate content="modal.deposit_withdraw.wallet_error" /> : null}
                        {!selectedGateway && nAvailableGateways == 0 ? <Translate content="modal.deposit_withdraw.no_gateway_available" /> : null}
                    </span>
                </label>

                <div className="inline-label input-wrapper">
                    <select role="combobox" className="selectWrapper" value={!selectedGateway ? "" : selectedGateway} onChange={onGatewayChanged} id="gatewaySelector">
                        {!selectedGateway && nAvailableGateways != 0 ? <Translate component="option" value="" content="modal.deposit_withdraw.select_gateway" /> : null}
                        {gatewayStatus.RUDEX.enabled ? <option value="RUDEX">{gatewayStatus.RUDEX.name}</option> : null}
                        {gatewayStatus.OPEN.enabled ? <option value="OPEN">{gatewayStatus.OPEN.name}</option> : null}
                    </select>
                    <Icon name="chevron-down" style={{position: "absolute", right: "10px", top: "10px"}} />
                </div>
            </section>
        </div>
    </div>
}

export { _getAvailableGateways, gatewaySelector, _getNumberAvailableGateways, _onAssetSelected }
