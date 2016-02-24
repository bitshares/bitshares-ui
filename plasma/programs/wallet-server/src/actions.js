import rfc822Email from "./rfc822Email"

export function requestCode({ email }) {
    if( ! rfc822Email(email) ) throw ["invalid email", email]
    return { type: "requestCode", email }
}

export function createWallet({ code, encrypted_data, signature }) {
    req(encrypted_data, 'encrypted_data')
    req(signature, 'signature')
    return { type: "createWallet", code, encrypted_data, signature }
}

export function fetchWallet({ public_key, local_hash }) {
    req(public_key, 'public_key')
    return { type: "fetchWallet", public_key, local_hash }
}

export function saveWallet({ original_local_hash, encrypted_data, signature }) {
    req(original_local_hash, 'original_local_hash')
    req(encrypted_data, 'encrypted_data')
    req(signature, 'signature')
    return { type: "saveWallet", original_local_hash, encrypted_data, signature }
}

export function changePassword({ original_local_hash, original_signature, new_encrypted_data, new_signature }) {
    req(original_local_hash, 'original_local_hash')
    req(original_signature, 'original_signature')
    req(new_encrypted_data, 'new_encrypted_data')
    req(new_signature, 'new_signature')
    return { type: "changePassword", original_local_hash, original_signature, new_encrypted_data, new_signature }
}

export function deleteWallet({ local_hash, signature }) {
    req(local_hash, 'local_hash')
    req(signature, 'signature')
    return { type: "deleteWallet", local_hash, signature }
}

function req(data, field_name) {
    if( data == null ) throw new Error("Missing required field: " + field_name)
    return data
}