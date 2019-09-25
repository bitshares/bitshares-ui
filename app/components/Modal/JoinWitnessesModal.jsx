import React from "react";
import Translate from "react-translate-component";
import AccountSelector from "../Account/AccountSelector";
import AccountActions from "actions/AccountActions";
import counterpart from "counterpart";
import {Modal, Button, Input, Select, Form} from "bitshares-ui-style-guide";
import Icon from "../Icon/Icon";
import {PublicKey} from "tuscjs";
import sanitize from "sanitize";

class JoinWitnessesModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    getInitialState(props) {
        return {
            witnessAccount: props.account,
            signingKey: "",
            url: ""
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            this.state.url !== ns.visible ||
            this.props.visible !== np.visible ||
            this.state.signingKey !== ns.signingKey ||
            this.state.witnessAccount !== ns.witnessAccount
        );
    }

    onAddWitness() {
        const {witnessAccount, signingKey, url} = this.state;

        if (witnessAccount && signingKey) {
            AccountActions.createWitness({
                account: witnessAccount,
                url,
                signingKey
            });
        }
        this.props.hideModal();
    }

    onChangeCommittee(account) {
        this.setState({
            witnessAccount: account
        });
    }

    onMemoKeyChanged(e) {
        this.setState({
            signingKey: e.target.value
        });
    }

    onUrlChanged(e) {
        this.setState({
            url: sanitize(e.target.value.toLowerCase(), {
                whiteList: [], // empty, means filter out all tags
                stripIgnoreTag: true // filter out all HTML not in the whilelist
            })
        });
    }

    isValidPubKey = value => {
        return !PublicKey.fromPublicKeyString(value);
    };

    render() {
        const {witnessAccount, signingKey, url} = this.state;

        return (
            <Modal
                title={counterpart.translate("modal.witness.create_witness")}
                onCancel={this.props.hideModal}
                visible={this.props.visible}
                footer={[
                    <Button
                        key="submit"
                        type="primary"
                        onClick={this.onAddWitness.bind(this)}
                    >
                        {counterpart.translate("modal.witness.confirm")}
                    </Button>,
                    <Button
                        key="cancel"
                        style={{marginLeft: "8px"}}
                        onClick={this.props.hideModal}
                    >
                        {counterpart.translate("modal.cancel")}
                    </Button>
                ]}
            >
                <Form className="full-width" layout="vertical">
                    <AccountSelector
                        label="modal.witness.witness_account"
                        accountName={
                            (witnessAccount && witnessAccount.get("name")) ||
                            account.get("name")
                        }
                        account={witnessAccount}
                        onAccountChanged={this.onChangeCommittee.bind(this)}
                        size={35}
                        typeahead={true}
                    />
                    <Translate
                        content="modal.witness.text"
                        unsafe
                        component="p"
                    />
                    <Form.Item
                        label={counterpart.translate("modal.witness.url")}
                    >
                        <Input
                            value={url}
                            onChange={this.onUrlChanged.bind(this)}
                            placeholder={counterpart.translate(
                                "modal.witness.web_example"
                            )}
                        />
                    </Form.Item>
                    <Form.Item
                        label={counterpart.translate(
                            "modal.witness.public_signing_key"
                        )}
                    >
                        {this.isValidPubKey(signingKey) ? (
                            <label
                                className="right-label"
                                style={{
                                    marginTop: "-30px",
                                    position: "static"
                                }}
                            >
                                <Translate content="modal.witness.invalid_key" />
                            </label>
                        ) : null}

                        <Input
                            addonBefore={
                                <Icon name="key" title="icons.key" size="1x" />
                            }
                            value={signingKey}
                            onChange={this.onMemoKeyChanged.bind(this)}
                            placeholder={counterpart.translate(
                                "modal.witness.enter_public_signing_key"
                            )}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        );
    }
}

export default JoinWitnessesModal;
