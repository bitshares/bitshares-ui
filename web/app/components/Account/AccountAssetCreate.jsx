import React from "react";

class AccountAssetCreate extends React.Component {

    static contextTypes = { router: React.PropTypes.func.isRequired }

    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    }

    render() {

        return <div></div>;
    }

}

export default AccountAssetCreate;