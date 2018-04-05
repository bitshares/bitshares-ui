import React from "react";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import {ChainStore} from "bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Utility/LinkToAccountById";
import counterpart from "counterpart";

function getWitnessOrCommittee(type, acct) {
    let url = "",
        votes = 0,
        account;
    if (type === "witness") {
        account = ChainStore.getWitnessById(acct.get("id"));
    } else if (type === "committee") {
        account = ChainStore.getCommitteeMemberById(acct.get("id"));
    }

    url = account ? account.get("url") : url;
    votes = account ? account.get("total_votes") : votes;
    return {
        url,
        votes,
        id: account.get("id")
    };
}

class AccountItemRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object.isRequired,
        onAction: React.PropTypes.func.isRequired
    };

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account !== this.props.account ||
            nextProps.action !== this.props.action ||
            nextProps.isActive !== this.props.isActive ||
            nextProps.idx !== this.props.idx ||
            nextProps.proxy !== this.props.proxy
        );
    }

    onAction(item_id) {
        this.props.onAction(item_id);
    }

    render() {
        let {account, type, action, isActive} = this.props;
        let item_id = account.get("id");

        let {url, votes} = getWitnessOrCommittee(type, account);

        let link =
            url && url.length > 0 && url.indexOf("http") === -1
                ? "http://" + url
                : url;
        const isSupported = action === "remove";

        return (
            <tr className={isSupported ? "" : "unsupported"}>
                <td style={{textAlign: "right"}}>{this.props.idx + 1}</td>
                <td style={{textAlign: "left"}}>
                    <LinkToAccountById account={account.get("id")} />
                </td>
                <td>
                    {link && link.indexOf(".") !== -1 ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Icon name="share" />
                        </a>
                    ) : null}
                </td>
                <td>
                    <FormattedAsset
                        amount={votes}
                        asset="1.3.0"
                        decimalOffset={5}
                        hide_asset
                    />
                </td>
                <td>
                    <Translate
                        content={`account.votes.${
                            isActive ? "active_short" : "inactive"
                        }`}
                    />
                </td>
                <td style={{textAlign: "center"}}>
                    <Translate
                        content={`settings.${isSupported ? "yes" : "no"}`}
                    />
                </td>
                <td
                    className={this.props.proxy ? "" : "clickable"}
                    onClick={
                        this.props.proxy
                            ? () => {}
                            : this.onAction.bind(this, item_id)
                    }
                >
                    {!this.props.proxy ? (
                        <Icon
                            name={
                                isSupported
                                    ? "checkmark-circle"
                                    : "minus-circle"
                            }
                        />
                    ) : (
                        <Icon name="locked" />
                    )}
                </td>
            </tr>
        );
    }
}

class VotingAccountsList extends React.Component {
    static propTypes = {
        items: ChainTypes.ChainObjectsList,
        onAddItem: React.PropTypes.func.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        action: React.PropTypes.string,
        withSelector: React.PropTypes.bool
    };

    static defaultProps = {
        action: "remove",
        withSelector: true,
        autosubscribe: false
    };

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
            error: null
        };
        this.onItemChange = this.onItemChange.bind(this);
        this.onItemAccountChange = this.onItemAccountChange.bind(this);
        this.onAddItem = this.onAddItem.bind(this);
    }

    onItemChange(item_name_input) {
        this.setState({item_name_input});
    }

    onItemAccountChange(selected_item) {
        this.setState({selected_item, error: null});
        if (selected_item && this.props.validateAccount) {
            let res = this.props.validateAccount(selected_item);
            if (res === null) return;
            if (typeof res === "string") this.setState({error: res});
            else res.then(error => this.setState({error: error}));
        }
    }

    onAddItem(item) {
        if (!item) return;
        let next_state = {
            selected_item: null,
            item_name_input: "",
            error: null
        };
        this.setState(next_state);
        this.props.onAddItem(item.get("id"));
    }

    render() {
        if (!this.props.items) return null;

        let item_rows = this.props.items
            .filter(i => {
                if (!i) return false;
                //if (this.state.item_name_input) return i.get("name").indexOf(this.state.item_name_input) !== -1;
                return true;
            })
            .sort((a, b) => {
                let {votes: a_votes} = getWitnessOrCommittee(
                    this.props.type,
                    a
                );
                let {votes: b_votes} = getWitnessOrCommittee(
                    this.props.type,
                    b
                );
                if (a_votes !== b_votes) {
                    return parseInt(b_votes, 10) - parseInt(a_votes, 10);
                } else if (a.get("name") > b.get("name")) {
                    return 1;
                } else if (a.get("name") < b.get("name")) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map((i, idx) => {
                let action =
                    this.props.supported &&
                    this.props.supported.includes(i.get("id"))
                        ? "remove"
                        : "add";
                let isActive = this.props.active.includes(
                    getWitnessOrCommittee(this.props.type, i).id
                );
                return (
                    <AccountItemRow
                        idx={idx}
                        key={i.get("name")}
                        account={i}
                        type={this.props.type}
                        onAction={
                            action === "add"
                                ? this.props.onAddItem
                                : this.props.onRemoveItem
                        }
                        isSelected={this.props.items.indexOf(i) !== -1}
                        action={action}
                        isActive={isActive}
                        proxy={this.props.proxy}
                    />
                );
            });

        let error = this.state.error;
        if (
            !error &&
            this.state.selected_item &&
            this.props.items.indexOf(this.state.selected_item) !== -1
        ) {
            error = counterpart.translate("account.votes.already");
        }

        let cw = ["10%", "20%", "40%", "20%", "10%"];

        return (
            <div>
                {this.props.withSelector ? (
                    <AccountSelector
                        style={{maxWidth: "600px"}}
                        label={this.props.label}
                        error={error}
                        placeholder={this.props.placeholder}
                        account={this.state.item_name_input}
                        accountName={this.state.item_name_input}
                        onChange={this.onItemChange}
                        onAccountChanged={this.onItemAccountChange}
                        onAction={this.onAddItem}
                        action_label="account.votes.add_witness"
                        tabIndex={this.props.tabIndex}
                    />
                ) : null}
                {this.props.title && item_rows.length ? (
                    <h4>{this.props.title}</h4>
                ) : null}
                {item_rows.length ? (
                    <table className="table dashboard-table table-hover">
                        <thead>
                            <tr>
                                <th style={{textAlign: "right"}}>#</th>
                                <th
                                    style={{textAlign: "left", maxWidth: cw[1]}}
                                >
                                    <Translate content="account.votes.name" />
                                </th>
                                <th style={{maxWidth: cw[2]}}>
                                    <Translate content="account.votes.about" />
                                </th>
                                <th style={{maxWidth: cw[3]}}>
                                    <Translate content="account.votes.votes" />
                                </th>
                                <th style={{maxWidth: cw[4]}}>
                                    <Translate content="account.votes.status.title" />
                                </th>
                                <th style={{maxWidth: cw[0]}}>
                                    <Translate content="account.votes.supported" />
                                </th>
                                <th style={{maxWidth: cw[5]}}>
                                    <Translate content="account.votes.toggle" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>{item_rows}</tbody>
                    </table>
                ) : null}
            </div>
        );
    }
}

export default BindToChainState(VotingAccountsList, {keep_updating: true});
