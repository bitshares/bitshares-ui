import { createToken } from "@graphene/time-token"
import { spawn } from "child_process"

export default function emailToken(mail_to, payload) {
    let token = createToken(payload)
    const mail_from = process.env.npm_package_config_mail_from
    const mail_subject = process.env.npm_package_config_mail_subject
    const mail_script = process.env.npm_package_config_mail_script
    const mail_token_url = process.env.npm_package_config_mail_token_url.replace("${token}", token)
    return spawn(mail_script, [mail_from, mail_to, token, mail_token_url, mail_subject])
}
