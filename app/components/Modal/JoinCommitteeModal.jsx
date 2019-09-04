import React from "react";
import Translate from "react-translate-component";
import AccountSelector from "../Account/AccountSelector";
import AccountActions from "actions/AccountActions";
import counterpart from "counterpart";
import {Modal, Button, Input, Select, Form} from "bitshares-ui-style-guide";
import utils from "common/utils";

class JoinCommitteeModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    getInitialState() {
        return {
            committeeAccount: this.props.account,
            url: ""
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            this.props.visible !== np.visible ||
            this.state.url !== ns.url ||
            this.state.committeeAccount !== ns.committeeAccount
        );
    }

    onAddComittee() {
        const {committeeAccount, url} = this.state;

        if (committeeAccount && url) {
            AccountActions.createCommittee({account: committeeAccount, url});
        }
        this.props.hideModal();
    }

    onChangeCommittee(account) {
        this.setState({
            committeeAccount: account
        });
    }

    onUrlChanged(e) {
        this.setState({
            url: utils.sanitize(e.target.value.toLowerCase())
        });
    }

    onClose() {
        this.setState(this.getInitialState(this.props));
    }

    render() {
        const {url, committeeAccount} = this.state;

        return (
            <Modal
                title={counterpart.translate(
                    "modal.committee.create_committee"
                )}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={[
                    <Button
                        key="submit"
                        type="primary"
                        onClick={this.onAddComittee.bind(this)}
                    >
                        {counterpart.translate("modal.committee.confirm")}
                    </Button>,
                    <Button
                        key="cancel"
                        style={{marginLeft: "8px"}}
                        onClick={this.onClose.bind(this)}
                    >
                        {counterpart.translate("modal.cancel")}
                    </Button>
                ]}
            >
                <Form className="full-width" layout="vertical">
                    <AccountSelector
                        label="modal.committee.from"
                        accountName={
                            (committeeAccount &&
                                committeeAccount.get("name")) ||
                            account.get("name")
                        }
                        account={committeeAccount || account}
                        onAccountChanged={this.onChangeCommittee.bind(this)}
                        size={35}
                        typeahead={true}
                    />
                    <Translate
                        content="modal.committee.text"
                        unsafe
                        component="p"
                    />
                    <Form.Item
                        label={counterpart.translate("modal.committee.url")}
                    >
                        <Input
                            value={url}
                            onChange={this.onUrlChanged.bind(this)}
                            placeholder={counterpart.translate(
                                "modal.committee.web_example"
                            )}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        );
    }
}

export default JoinCommitteeModal;
