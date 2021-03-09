import React from "react";
import {Helmet} from "react-helmet";
import {getMetaTag} from "../../services/MetaTags.js";
import PropTypes from "prop-types";

class MetaTag extends React.Component {
    static propTypes = {
        path: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
    }
    render() {
        const metaTag = getMetaTag("blocks");
        return (
            <div>
                {metaTag && (
                    <Helmet>
                        <title>{metaTag.title}</title>
                        <meta name={metaTag.name} content={metaTag.content} />
                    </Helmet>
                )}
            </div>
        );
    }
}
export default MetaTag;
