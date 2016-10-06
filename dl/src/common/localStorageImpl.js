var ls_key_exists = function _ls_key_exists(key,ls) { return (key in ls); }
export {ls_key_exists};
export default (typeof localStorage === "undefined" ? null : localStorage);
