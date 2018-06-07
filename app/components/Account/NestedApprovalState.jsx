import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Utility/LinkToAccountById";
import pu from "common/permission_utils";
import {cloneDeep} from "lodash-es";
import {ChainStore} from "bitsharesjs/es";
import {
    AuthorityDepthOverflowWarning,
    ChildAuthorityDepthOverflowWarning,
    Pending,
    Review,
    Failed,
    ExpandButton,
    ApprovedIcon,
    KeyPermissionBranch,
    hasAuthorityDepthProblem,
    isApproved,
    statusText,
    notNestdWeight
} from "./NestedApprovalStateLib";
import PropTypes from "prop-types";

class AccountPermissionTree extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: !!props.expanded};
    }
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        accounts: ChainTypes.ChainAccountsList,
        level: PropTypes.number.isRequired
    };

    static defaultProps = {
        level: 0
    };

    handleExpandToggle = () => {
        this.setState({expanded: !this.state.expanded});
    };

    render() {
        const {
            account,
            available,
            availableKeys,
            permission,
            threshold,
            level,
            maxAuthorityDepth,
            hideRoot
        } = this.props;
        const {expanded} = this.state;

        const isOK = isApproved(permission, available, availableKeys);
        const isNested = permission.isNested();
        const isMultiSig = permission.isMultiSig();

        const notNestedWeight =
            notNestdWeight(permission.weight, threshold) || 1;

        const nestedWeight = statusText(permission, available, availableKeys);

        const authorityDepthOverflow = level >= maxAuthorityDepth;

        const rootPerm =
            !isNested && !isMultiSig ? (
                <tr>
                    <td colSpan="2">
                        <ApprovedIcon approved={isOK} />
                        <LinkToAccountById
                            subpage="permissions"
                            account={account.get("id")}
                        />
                    </td>
                    <td>
                        {!isNested && notNestedWeight
                            ? `${
                                  notNestedWeight &&
                                  notNestedWeight.length === 2
                                      ? "\u00A0\u00A0"
                                      : ""
                              }${notNestedWeight} `
                            : null}
                    </td>
                </tr>
            ) : (
                <tr>
                    <td colSpan="2">
                        <ApprovedIcon approved={isOK} />
                        <LinkToAccountById
                            subpage="permissions"
                            account={account.get("id")}
                        />
                    </td>
                    <td>
                        {expanded ? (
                            <span className={isOK ? "success-text" : ""}>
                                {notNestedWeight}
                            </span>
                        ) : (
                            notNestedWeight &&
                            `${
                                notNestedWeight && notNestedWeight.length === 2
                                    ? "\u00A0\u00A0"
                                    : ""
                            }${notNestedWeight} `
                        )}
                        <ExpandButton
                            onToggle={this.handleExpandToggle}
                            expanded={expanded}
                        />
                        {expanded && (
                            <span className="appended">({nestedWeight})</span>
                        )}
                        {authorityDepthOverflow ? (
                            <AuthorityDepthOverflowWarning />
                        ) : (
                            hasAuthorityDepthProblem(
                                maxAuthorityDepth,
                                permission,
                                level
                            ) &&
                            !expanded && <ChildAuthorityDepthOverflowWarning />
                        )}
                    </td>
                </tr>
            );

        const status = [];

        if ((isNested || isMultiSig) && expanded) {
            permission.accounts.forEach(subAccount => {
                status.push(
                    <BoundAccountPermissionTree
                        key={subAccount.id}
                        account={subAccount.id}
                        accounts={subAccount.accounts}
                        permission={subAccount}
                        available={available}
                        availableKeys={availableKeys}
                        threshold={permission.threshold}
                        level={level + 1}
                        maxAuthorityDepth={maxAuthorityDepth}
                    />
                );
            });

            if (permission.keys.length) {
                permission.keys.forEach(key =>
                    status.push(
                        <KeyPermissionBranch
                            key={key.id}
                            permission={key}
                            available={availableKeys}
                            level={level + (hideRoot ? 0 : 1)}
                            weight={notNestdWeight(key.weight, threshold)}
                        />
                    )
                );
            }
        }

        return status.length > 0 ? (
            <tbody>
                {hideRoot || rootPerm}
                <tr>
                    <td colSpan="3" className="heading-perm">
                        <div className={hideRoot ? "" : "table-container"}>
                            <table>{status}</table>
                        </div>
                        {expanded && level === 0 && <div className="spacer" />}
                    </td>
                </tr>
            </tbody>
        ) : (
            <tbody>{rootPerm}</tbody>
        );
    }
}
const BoundAccountPermissionTree = BindToChainState(AccountPermissionTree);

class FirstLevel extends React.Component {
    static propTypes = {
        required: ChainTypes.ChainAccountsList,
        available: ChainTypes.ChainAccountsList
    };

    static defaultProps = {
        type: "active",
        added: null,
        removed: null
    };

    constructor(props) {
        super(props);

        this.state = {
            requiredPermissions: [],
            expanded: props.expanded
        };

        this._updateState = this._updateState.bind(this);
    }

    componentWillMount() {
        this._updateState();

        ChainStore.subscribe(this._updateState);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this._updateState);
    }

    _updateState() {
        let required = pu.listToIDs(this.props.required);
        let available = pu.listToIDs(this.props.available);

        this.setState({
            requiredPermissions: pu.unnest(required, this.props.type),
            required,
            available
        });
    }

    handleExpandToggle = () => this.setState({expanded: !this.state.expanded});

    render() {
        let {
            type,
            added,
            removed,
            availableKeys,
            globalObject,
            reviewPeriodTime,
            noFail
        } = this.props;
        let {requiredPermissions, required, available, expanded} = this.state;

        available = cloneDeep(available);
        availableKeys = availableKeys.toJS();

        if (added) {
            available.push(added);
            availableKeys.push(added);
        }

        if (removed) {
            if (available.indexOf(removed) !== -1) {
                available.splice(available.indexOf(removed), 1);
            }
            if (availableKeys.indexOf(removed) !== -1) {
                availableKeys.splice(availableKeys.indexOf(removed), 1);
            }
        }

        const approvedCount = requiredPermissions.reduce(
            (total, perm) =>
                total + (isApproved(perm, available, availableKeys) ? 1 : 0),
            0
        );
        const approversCount = requiredPermissions.length;
        const isOK = approvedCount === approversCount;

        const failed = isOK && !reviewPeriodTime && !noFail;
        const pendingReview = isOK && reviewPeriodTime;

        const maxAuthorityDepth = globalObject
            .get("parameters")
            .get("max_authority_depth");

        const onePerm = requiredPermissions.length === 1;
        const oPermission = onePerm ? requiredPermissions[0] : null;

        const nestedWeight = !onePerm && `${approvedCount} / ${approversCount}`;

        const rows = requiredPermissions.map(account => (
            <BoundAccountPermissionTree
                key={account.id}
                account={account.id}
                accounts={account.accounts}
                permission={account}
                available={available}
                availableKeys={availableKeys}
                expanded={this.props.expanded || onePerm}
                level={0}
                maxAuthorityDepth={maxAuthorityDepth}
                hideRoot={onePerm}
            />
        ));

        return (
            <div className="nested-approval-state">
                <div className="root-status">
                    {failed ? (
                        <Failed />
                    ) : pendingReview ? (
                        <Review />
                    ) : (
                        <Pending />
                    )}{" "}
                    {!oPermission ? (
                        <span>({nestedWeight})</span>
                    ) : (
                        oPermission.threshold > 1 &&
                        statusText(oPermission, available, availableKeys)
                    )}
                    {(!oPermission ||
                        oPermission.isMultiSig() ||
                        oPermission.isNested()) && (
                        <ExpandButton
                            onToggle={this.handleExpandToggle}
                            expanded={expanded}
                        />
                    )}
                    {!expanded &&
                        requiredPermissions.some(permission =>
                            hasAuthorityDepthProblem(
                                maxAuthorityDepth,
                                permission,
                                0
                            )
                        ) && <ChildAuthorityDepthOverflowWarning />}
                </div>
                {expanded && <table>{rows}</table>}
            </div>
        );
    }
}
FirstLevel = BindToChainState(FirstLevel);

class ProposalWrapper extends React.Component {
    static propTypes = {
        proposal: ChainTypes.ChainObject.isRequired,
        type: PropTypes.string.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        type: "active",
        added: null,
        globalObject: "2.0.0"
    };

    render() {
        let {proposal, type} = this.props;
        let available = proposal.get(`available_${type}_approvals`);
        let availableKeys = proposal.get("available_key_approvals");
        let required = proposal.get(`required_${type}_approvals`);

        return (
            <FirstLevel
                {...this.props}
                required={required}
                available={available}
                availableKeys={availableKeys}
                reviewPeriodTime={proposal.get("review_period_time")}
            />
        );
    }
}

export default BindToChainState(ProposalWrapper);
