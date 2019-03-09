const pattern = {
    // http://emailregex.com/
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    url: new RegExp(
        "^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$",
        "i"
    ),
    hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i
};

export const types = {
    integer(value) {
        return types.number(value) && parseInt(value, 10) === Number(value);
    },
    float(value) {
        return types.number(value) && !types.integer(value);
    },
    array(value) {
        return Array.isArray(value);
    },
    regexp(value) {
        if (value instanceof RegExp) {
            return true;
        }
        try {
            return !!new RegExp(value);
        } catch (e) {
            return false;
        }
    },
    date(value) {
        return (
            typeof value.getTime === "function" &&
            typeof value.getMonth === "function" &&
            typeof value.getYear === "function"
        );
    },
    number(value) {
        if (isNaN(value) || isNaN(Number(value))) {
            return false;
        }
        return typeof Number(value) === "number";
    },
    object(value) {
        return typeof value === "object" && !types.array(value);
    },
    method(value) {
        return typeof value === "function";
    },
    email(value) {
        return (
            typeof value === "string" &&
            !!value.match(pattern.email) &&
            value.length < 255
        );
    },
    url(value) {
        return typeof value === "string" && !!value.match(pattern.url);
    },
    hex(value) {
        return typeof value === "string" && !!value.match(pattern.hex);
    },
    string(value) {
        return typeof value === "string";
    },
    boolean(value) {
        return typeof value === "boolean";
    },
    enum(value, list) {
        return Array.isArray(list) && list.indexOf(value) >= -1;
    }
};

export default types;
