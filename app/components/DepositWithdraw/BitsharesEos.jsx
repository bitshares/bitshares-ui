import React from "react";
import Translate from "react-translate-component";

class BitsharesEos extends React.Component {
    render() {
        return (
            <div>
                <button
                    style={{marginRight: 10}}
                    className="button"
                    type="submit"
                >
                    <Translate content="gateway.bitshares_beos.create_account" />
                </button>
                <button className="button" type="submit">
                    <Translate content="gateway.bitshares_beos.transfer" />
                </button>
            </div>
        );
    }
}

export default BitsharesEos;
