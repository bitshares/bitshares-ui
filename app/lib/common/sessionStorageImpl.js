var ss_key_exists = function _ss_key_exists(key,ls) { return (key in ls); }
export {ss_key_exists};
export default (typeof sessionStorage === "undefined" ? null : sessionStorage);
