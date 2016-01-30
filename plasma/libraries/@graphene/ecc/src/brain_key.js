
export function normalize(brain_key) {
    if (typeof brain_key !== 'string') {
        throw new Error("string required for brain_key");
    }
    brain_key = brain_key.trim();
    return brain_key.split(/[\t\n\v\f\r ]+/).join(' ');
}
