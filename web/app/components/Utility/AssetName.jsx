import React from "react";
import utils from "common/utils";

export default class AssetName extends React.Component {

	static propTypes = {
		replace: React.PropTypes.bool.isRequired,
		name: React.PropTypes.string.isRequired
	};

	static defaultProps = {
		replace: true
	};

	shouldComponentUpdate(nextProps) {
		return (
			nextProps.replace !== this.props.replace ||
			nextProps.name !== this.props.replace
		);
	}

	render() {
		let {name, replace} = this.props;

		let replacedName = utils.replaceName(name);
		if (replace && replacedName !== this.props.name) {
			return <span className="tooltip" data-tip={name} data-place="bottom" data-type="light">{replacedName}</span>
		} else {
			return <span>{name}</span>
		}

	}
}
