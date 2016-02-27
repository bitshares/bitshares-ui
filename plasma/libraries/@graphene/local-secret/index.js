import secureRandom from "secure-random"

const { npm_config__graphene_local_secret_secret } = process.env

export default ()=> {
    if( ! npm_config__graphene_local_secret_secret ) {
        const buf = secureRandom(256, {type: 'Buffer'})
        const local_secret = buf.toString('base64')
        console.error("# WARN you need to lock-in your secret, add the following to ./.npmrc")
        console.error("@graphene/local-secret:secret = '%s'", local_secret)
        console.error()
        process.env.npm_config__graphene_local_secret_secret = local_secret
    }
    return process.env.npm_config__graphene_local_secret_secret
}