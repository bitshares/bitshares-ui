import React from "react";
import Icon from "../Icon/Icon";
import utils from "common/utils";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import {Tooltip as AntTooltip} from "bitshares-ui-style-guide";

export class Tooltip extends React.Component {
    render() {
        const {className, children, dataTip, content} = this.props;
        return (
            <AntTooltip
                title={
                    (dataTip && dataTip.trim()) ||
                    counterpart.translate(content)
                }
            >
                <span className={"tooltip " + className}>{children}</span>
            </AntTooltip>
        );
    }
}

export const AuthorityDepthOverflowWarning = () => (
    <Tooltip
        className="error appended"
        content="explorer.proposals.authority_depth_warning"
    >
        /!\
    </Tooltip>
);

export const ChildAuthorityDepthOverflowWarning = () => (
    <Tooltip
        className="error appended"
        content="explorer.proposals.children_authority_depth_warning"
    >
        /!\
    </Tooltip>
);

export const Pending = () => (
    <Tooltip className="warning" content="explorer.proposals.pending_approval">
        <Translate content="explorer.proposals.pending" />
    </Tooltip>
);

export const Review = () => (
    <Tooltip className="warning" content="explorer.proposals.pending_review">
        <Translate content="explorer.proposals.review" />
    </Tooltip>
);

export const Failed = ({reason}) => (
    <Tooltip
        className="error"
        dataTip={reason}
        content="explorer.proposals.no_reason_available_switch_node"
    >
        <Translate content="explorer.proposals.failed" />
    </Tooltip>
);

export const ExpandButton = ({onToggle, expanded}) => (
    <a className="expand-button" onClick={onToggle}>
        [{expanded ? "-" : "+"}]
    </a>
);

export const ApprovedIcon = ({approved}) =>
    approved ? (
        <Icon
            name="checkmark-circle"
            size="1x"
            className="success"
            title="icons.checkmark_circle.operation_succeed"
        />
    ) : (
        <Icon
            name="cross-circle"
            size="1x"
            className="error"
            title="icons.cross_circle.operation_failed"
        />
    );

export const KeyPermissionBranch = ({available, permission, weight, level}) => (
    <tbody>
        <tr>
            <td colSpan="2">
                <ApprovedIcon approved={permission.isAvailable(available)} />
                {permission.id.substr(0, 20 - 4 * level)}
                ...
            </td>
            <td>{weight}</td>
        </tr>
    </tbody>
);

export const hasAuthorityDepthProblem = (
    maxAuthorityDepth,
    permission,
    level = 0
) => {
    if (level > maxAuthorityDepth) {
        return true;
    } else if (!permission.isNested() && !permission.isMultiSig()) {
        return false;
    } else {
        return permission.accounts.some(subAccount =>
            hasAuthorityDepthProblem(maxAuthorityDepth, subAccount, level + 1)
        );
    }
};

export const getStatus = (permission, available, availableKeys) =>
    permission.accounts.reduce(
        (amount, subPermission) =>
            amount +
            (isApproved(subPermission, available, availableKeys)
                ? subPermission.weight
                : 0),

        0
    ) +
    permission.keys.reduce(
        (amount, key) =>
            amount + (key.isAvailable(availableKeys) ? key.weight : 0),
        0
    );

export const isApproved = (permission, available, availableKeys) =>
    permission.isNested() || permission.isMultiSig()
        ? getStatus(permission, available, availableKeys) >=
          permission.threshold
        : permission.isAvailable(available);

export const statusText = (permission, available, availableKeys) =>
    permission && permission.threshold > 10
        ? `${utils.get_percentage(
              permission.getStatus(available, availableKeys),
              permission.threshold
          )} / 100%`
        : `${permission.getStatus(available, availableKeys)} / ${
              permission.threshold
          }`;

export const notNestdWeight = (weight, threshold) =>
    threshold && threshold > 10
        ? utils.get_percentage(weight, threshold)
        : weight;
