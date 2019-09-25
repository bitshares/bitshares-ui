import React from "react";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import {ChainStore} from "tuscjs";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Utility/LinkToAccountById";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import sanitize from "sanitize";
import PaginatedList from "components/Utility/PaginatedList";

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
    url = sanitize(url, {
        whiteList: [], // empty, means filter out all tags
        stripIgnoreTag: true // filter out all HTML not in the whilelist
    });
    votes = account ? account.get("total_votes") : votes;
    return {
        url,
        votes,
        id: account.get("id")
    };
}

const accountItemRow = props => {
    let {account, type, action, isActive, idx, proxy, onAction, key} = props;
    let item_id = account.get("id");

    let {url, votes} = getWitnessOrCommittee(type, account);

    let link =
        url && url.length > 0 && url.indexOf("http") === -1
            ? "http://" + url
            : url;
    const isSupported = action === "remove";

    return {
        key,
        num: idx + 1,
        name: account.get("id"),
        about: link && link.indexOf(".") !== -1 ? link : null,
        votes,
        title: `account.votes.${isActive ? "active_short" : "inactive"}`,
        supported: {
            translate: `settings.${isSupported ? "yes" : "no"}`,
            proxy,
            item_id,
            onAction
        },
        toggle: {proxy, isSupported, item_id, onAction}
    };
};

class VotingAccountsList extends React.Component {
    static propTypes = {
        items: ChainTypes.ChainObjectsList,
        onAddItem: PropTypes.func.isRequired,
        onRemoveItem: PropTypes.func.isRequired,
        validateAccount: PropTypes.func,
        label: PropTypes.string.isRequired, // a translation key for the label,
        placeholder: PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: PropTypes.number, // tabindex property to be passed to input tag
        action: PropTypes.string,
        withSelector: PropTypes.bool
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

    getHeader() {
        let cw = ["10%", "20%", "40%", "20%", "10%"];
        return [
            {
                title: "#",
                dataIndex: "num",
                align: "right",
                render: item => {
                    return (
                        <span
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            {item}
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.name" />,
                dataIndex: "name",
                align: "left",
                sorter: (a, b) => {
                    return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
                },
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[1],
                                whiteSpace: "nowrap"
                            }}
                        >
                            <LinkToAccountById account={item} />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.about" />,
                dataIndex: "about",
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[2],
                                whiteSpace: "nowrap"
                            }}
                        >
                            <a
                                href={item}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon name="share" title="icons.share" />
                            </a>
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.votes" />,
                dataIndex: "votes",
                sorter: (a, b) => a.votes - b.votes,
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[3],
                                whiteSpace: "nowrap"
                            }}
                        >
                            <FormattedAsset
                                amount={item}
                                asset="1.3.0"
                                decimalOffset={5}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.status.title" />,
                dataIndex: "title",
                sorter: (a, b) => {
                    return a.title > b.title ? 1 : a.title < b.title ? -1 : 0;
                },
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[4],
                                whiteSpace: "nowrap"
                            }}
                        >
                            <Translate content={item} />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.supported" />,
                dataIndex: "supported",
                align: "center",
                sorter: (a, b) => {
                    return a.supported.translate > b.supported.translate
                        ? 1
                        : a.supported.translate < b.supported.translate
                        ? -1
                        : 0;
                },
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[0],
                                whiteSpace: "nowrap"
                            }}
                            className={item.proxy ? "" : "clickable"}
                            onClick={
                                item.proxy
                                    ? () => {}
                                    : item.onAction.bind(this, item.item_id)
                            }
                        >
                            <Translate content={item.translate} />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.votes.toggle" />,
                dataIndex: "toggle",
                render: item => {
                    return (
                        <span
                            style={{
                                maxWidth: cw[5],
                                whiteSpace: "nowrap"
                            }}
                            className={item.proxy ? "" : "clickable"}
                            onClick={
                                item.proxy
                                    ? () => {}
                                    : item.onAction.bind(this, item.item_id)
                            }
                        >
                            {!item.proxy ? (
                                <Icon
                                    name={
                                        item.isSupported
                                            ? "checkmark-circle"
                                            : "minus-circle"
                                    }
                                    title={
                                        item.isSupported
                                            ? "icons.checkmark_circle.yes"
                                            : "icons.minus_circle.no"
                                    }
                                />
                            ) : (
                                <Icon
                                    name="locked"
                                    title="icons.locked.action"
                                />
                            )}
                        </span>
                    );
                }
            }
        ];
    }

    _decideRowClassName(row, index) {
        return row.toggle.isSupported ? "" : "unsupported";
    }

    render() {
        if (!this.props.items) return null;

        const header = this.getHeader();

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
                return accountItemRow({
                    idx,
                    key: i.get("name"),
                    account: i,
                    type: this.props.type,
                    onAction:
                        action === "add"
                            ? this.props.onAddItem
                            : this.props.onRemoveItem,
                    isSelected: this.props.items.indexOf(i) !== -1,
                    action,
                    isActive,
                    proxy: this.props.proxy
                });
            });

        let error = this.state.error;
        if (
            !error &&
            this.state.selected_item &&
            this.props.items.indexOf(this.state.selected_item) !== -1
        ) {
            error = counterpart.translate("account.votes.already");
        }

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
                    <PaginatedList
                        className="table dashboard-table table-hover"
                        rowClassName={this._decideRowClassName.bind(this)}
                        rows={item_rows}
                        header={header}
                        pageSize={20}
                        label="utility.total_x_assets"
                        leftPadding="1.5rem"
                    />
                ) : null}
            </div>
        );
    }
}

export default BindToChainState(VotingAccountsList);
