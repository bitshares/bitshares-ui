import React from "react";
import utils from "common/utils";
import Translate from "react-translate-component";
import {Modal, Button} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

export default class ConfirmModal extends React.Component {
    constructor(props) {
        super(props);

        this.submit = this.submit.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    _onForce(value, e) {
        e.preventDefault();

        this.props.hideModal();

        if (value) this.props.onForce();
    }

    submit(e) {
        this._onForce(true, e);
    }

    cancel(e) {
        this._onForce(false, e);
    }

    render() {
        let {type, diff, hasOrders} = this.props;

        const footer = [
            <Button key="submit" onClick={this.submit}>
                {counterpart.translate("settings.yes")}
            </Button>,
            <Button key="cancel" type="primary" onClick={this.cancel}>
                {counterpart.translate("settings.no")}
            </Button>
        ];

        return (
            <Modal
                footer={footer}
                visible={this.props.visible}
                onCancel={this.cancel}
                title={counterpart.translate("transaction.confirm")}
            >
                <div className="grid-block vertical">
                    {!hasOrders ? (
                        <Translate
                            content={"exchange.confirm_no_orders_" + type}
                        />
                    ) : (
                        <Translate
                            content={"exchange.confirm_" + type}
                            diff={utils.format_number(diff, 2)}
                        />
                    )}
                </div>
            </Modal>
        );
    }
}
