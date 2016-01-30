import secureRandom from "secure-random"

const { npm_config__graphene_local_secret_secret } = process.env

if( ! npm_config__graphene_local_secret_secret ) {
    const buf = secureRandom(256, {type: 'Buffer'})
    const local_secret = buf.toString('base64')
    console.error("# WARN you need to run this command to lock-in your secret.")
    console.error("# Add the following to ./.npmrc")
    console.error("@graphene/local-secret:secret = '%s'", local_secret)
    console.error()
    process.env.npm_config__graphene_local_secret_secret = local_secret
}

export default process.env.npm_config__graphene_local_secret_secret
