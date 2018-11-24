import counterpart from "counterpart";
import typesCheck from "./types";

/** * * * *
 *
 * MESSAGES
 *
 * * * * * */

export const Messages = {
    Required: (name = "") => {
        if (name)
            return counterpart.translate("validation.messages.requiredNamed", {
                name: name
            });
        return counterpart.translate("validation.messages.required");
    },

    Type: (type = "", name = "") => {
        if (name)
            return counterpart.translate(
                `validation.messages.types.${type}Named`,
                {name: name, type: type}
            );
        return counterpart.translate(`validation.messages.types.${type}`, {
            type: type
        });
    },

    Range: (min, max, name) => {
        if (name)
            return counterpart.translate(`validation.messages.rangeNamed`, {
                name: name,
                min: min,
                max: max
            });
        return counterpart.translate(`validation.messages.range`, {
            min: min,
            max: max
        });
    },

    Min: (min, name) => {
        if (name)
            return counterpart.translate(`validation.messages.minNamed`, {
                name: name,
                min: min
            });
        return counterpart.translate(`validation.messages.min`, {min: min});
    },

    Max: (max, name) => {
        if (name)
            return counterpart.translate(`validation.messages.maxNamed`, {
                name: name,
                max: max
            });
        return counterpart.translate(`validation.messages.max`, {max: max});
    },

    Number: name => {
        if (name)
            return counterpart.translate(`validation.messages.numberNamed`, {
                name: name
            });
        return counterpart.translate(`validation.messages.number`);
    },

    Integer: name => {
        if (name)
            return counterpart.translate(`validation.messages.integerNamed`, {
                name: name
            });
        return counterpart.translate(`validation.messages.integer`);
    },

    Float: name => {
        if (name)
            return counterpart.translate(`validation.messages.floatNamed`, {
                name: name
            });
        return counterpart.translate(`validation.messages.float`);
    },

    Email: name => {
        if (name)
            return counterpart.translate(`validation.messages.emailNamed`, {
                name: name
            });
        return counterpart.translate(`validation.messages.email`);
    },

    Url: name => {
        if (name)
            return counterpart.translate(`validation.messages.urlNamed`, {
                name: name
            });
        return counterpart.translate(`validation.messages.url`);
    },

    OneOf: (name, list) => {
        if (name)
            return counterpart.translate(`validation.messages.oneOfNamed`, {
                name: name,
                list: list
            });
        return counterpart.translate(`validation.messages.oneOf`, {list: list});
    }
};

/** * * * *
 *
 * RULES
 *
 * * * * * */

export const Rules = {
    /**
     * Validation to check required Field
     * @param {string} props - name of field to use in translation
     * @param {Object} props
     * @param props.name - name of field to use in translation
     * @returns {{required: boolean, message: *}}
     */

    required: function(props = {}) {
        let name = "";

        if (typeof props === "string") {
            name = props;
        } else {
            name = props && props.name;
        }

        return {
            required: true,
            message: Messages.Required(name)
        };
    },

    /**
     * Validation to check field to match specific type
     * @param {string} props - type of field
     * @param {Object} props
     * @param {string} props.type - type of field
     * @param {string} [props.name] - name of field to use in translation
     * @returns {{validator: validator, message: *}}
     */

    type: function(props) {
        let type = "";
        let name = "";

        if (typeof props === "string") type = props;

        if (props && props.type) type = props.type;

        if (props && props.name) name = props.name;

        if (type === "")
            throw new Error(
                "[Validation] Rules.Type the property type is missed"
            );

        if (!typesCheck[type])
            throw new Error(
                `[Validation] Rules.Type the property type '${props &&
                    props.type}' is not listed in supported types`
            );

        return {
            validator: (rule, value, callback) => {
                if (typesCheck[type](value)) return callback();

                return callback(false);
            },
            message: Messages.Type(type, name)
        };
    },

    /**
     * Validation to check
     * @param {Object} props
     * @param {number} props.min - min value
     * @param {number} props.max - max value
     * @param {string} [props.name] - name of field to use in translation
     * @returns {{validator: validator, message: *}}
     */

    range: function(props = {}) {
        let max = Number(props.max);
        let min = Number(props.min);

        if (max === undefined || isNaN(max))
            throw new Error(
                `[Validation] Rules.Range the property max '${props &&
                    props.max}' is incorrect. Should be a number`
            );

        if (min === undefined || isNaN(min))
            throw new Error(
                `[Validation] Rules.Range the property min '${props &&
                    props.min}' is incorrect. Should be a number`
            );

        if (max < min)
            throw new Error(
                `[Validation] Rules.Range the property min '${props &&
                    props.min}' cannot be higher than max '${props &&
                    props.max}'`
            );

        return {
            validator: (rule, value, callback) => {
                value = Number(value);

                if (isNaN(value) || value < min || value > max)
                    return callback(false);

                return callback();
            },
            message: Messages.Range(min, max, props.name || "")
        };
    },

    /**
     * Validation for min value
     * @param {number} props - min value
     * @param {Object} props
     * @param {number} props.min
     * @param {string} [props.name]
     * @returns {{validator: validator, message: *}}
     */

    min: function(props) {
        let min;

        if (typeof props === "object") {
            min = Number(props && props.min);
        } else {
            min = Number(props);
        }

        if (min === undefined || isNaN(min))
            throw new Error(
                `[Validation] Rules.Min the property min '${props &&
                    props.min}' is incorrect. Should be a number`
            );

        return {
            validator: (rule, value, callback) => {
                value = Number(value);

                if (isNaN(value) || value < min) return callback(false);

                return callback();
            },
            message: Messages.Min(min, props.name || "")
        };
    },

    /**
     * Validation for max value
     * @param {number} props - max value
     * @param {Object} props
     * @param {number} props.max
     * @param {string} [props.name]
     * @returns {{validator: validator, message: *}}
     */

    max: function(props) {
        let max;

        if (typeof props === "object") {
            max = Number(props && props.max);
        } else {
            max = Number(props);
        }

        if (max === undefined || isNaN(max))
            throw new Error(
                `[Validation] Rules.Min the property max '${props &&
                    props.max}' is incorrect. Should be a number`
            );

        return {
            validator: (rule, value, callback) => {
                value = Number(value);

                if (isNaN(value) || value > max) return callback(false);

                return callback();
            },
            message: Messages.Max(max, props.name || "")
        };
    },

    /**
     * Validate field to be number
     * @param {string} [name]
     * @returns {{validator: validator, message: *}}
     */

    number: function(name) {
        return {
            validator: (rule, value, callback) => {
                if (!typesCheck.number(value)) return callback(false);

                return callback();
            },
            message: Messages.Number(name || "")
        };
    },

    /**
     * Validate field to be integer
     * @param {string} [name]
     * @returns {{validator: validator, message: *}}
     */

    integer: function(name) {
        return {
            validator: (rule, value, callback) => {
                if (!typesCheck.integer(value)) return callback(false);

                return callback();
            },
            message: Messages.Integer(name || "")
        };
    },

    /**
     * Validate field to be float
     * @param {string} [name]
     * @returns {{validator: validator, message: *}}
     */

    float: function(name) {
        return {
            validator: (rule, value, callback) => {
                if (!typesCheck.float(value)) return callback(false);

                return callback();
            },
            message: Messages.Float(name || "")
        };
    },

    /**
     * Validate field to be email
     * @param {string} [name]
     * @returns {{validator: validator, message: *}}
     */

    email: function(name) {
        return {
            validator: (rule, value, callback) => {
                if (!typesCheck.email(value)) return callback(false);

                return callback();
            },
            message: Messages.Email(name || "")
        };
    },

    /**
     * Validate field to be url
     * @param {string} [name]
     * @returns {{validator: validator, message: *}}
     */

    url: function(name) {
        return {
            validator: (rule, value, callback) => {
                if (!typesCheck.url(value)) return callback(false);

                return callback();
            },
            message: Messages.Url(name || "")
        };
    },

    /**
     * Validate field to be oneOf
     * @param {Object} props
     * @param {Array} props.list
     * @param {string} [props.name]
     * @returns {{validator: validator, message: *}}
     */

    oneOf: function(props = {}) {
        let list;

        if (!Array.isArray(props && props.list)) {
            throw new Error(
                `[Validation] Rules.oneOf the property list is missed or incorrect`
            );
        }

        list = props.list;

        return {
            validator: (rule, value, callback) => {
                if (list.indexOf(value) === -1) return callback(false);

                return callback();
            },
            message: Messages.OneOf(
                (props && props.name) || "",
                list.toString().replace(/,([a-z])/g, ", $1")
            )
        };
    }
};

/** * * * *
 *
 * VALIDATION
 *
 * * * * * */

export const Validation = {
    Rules: Rules
};
