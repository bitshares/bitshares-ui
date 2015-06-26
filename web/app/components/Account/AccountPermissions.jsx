import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Tabs from "react-foundation-apps/lib/tabs";

class AccountPermissions extends React.Component {

    render() {
        let active_permissions = (
            <tr>
                <td>Key</td>
                <td>Address</td>
                <td>Weight</td>
            </tr>
        );
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Account Permissions</h3>
                    <Tabs>
                        <Tabs.Tab title="Active">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Address</th>
                                        <th>Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {active_permissions}
                                </tbody>
                            </table>
                        </Tabs.Tab>
                        <Tabs.Tab title="Owner">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Key 1</th>
                                    <th>Address 1</th>
                                    <th>Weight 1</th>
                                </tr>
                                </thead>
                                <tbody>
                                {active_permissions}
                                {active_permissions}
                                {active_permissions}
                                {active_permissions}
                                </tbody>
                            </table>
                        </Tabs.Tab>
                    </Tabs>
                </div>
            </div>
        );
    }
}

export default AccountPermissions;
