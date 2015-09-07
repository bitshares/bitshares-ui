###
    Use locale-en.js as base locale file to compare and add missing keys to other locale files

    @usage:
        coffee locale_compare.coffee

    @output:
        1. missing keys will be printed
        2. new locale file will be generated and saved in utils/locales directory for review
        3. if nothing goes wrong, simply move the newly generated locale file to app/assets/locales directory
###

util      = require('util')
beautify  = require('js-beautify').js_beautify
fs        = require('fs')
UglifyJS  = require('webpack//node_modules/uglify-js')

locale_path = '../../app/assets/locales'

# locale files to work on
other_locales = ['cn', 'de', 'fr', 'ko']

loc=[]
walk_keys=(o, callback)->
    try
        keys = Object.keys o
    catch e
        #console.log e
        return #non object
    return if keys.length is 0
    for key in keys
        loc.push key
        callback loc.join '.'
        walk_keys o[key], callback
        loc.pop key

en_keys=[]
en_locale = (require "#{locale_path}/locale-en.js")
walk_keys en_locale, (key)->en_keys.push key

for other in other_locales
    console.log "Processing locale-#{other}.js"
    other_key = {}
    other_locale = (require "#{locale_path}/locale-#{other}.js")
    walk_keys other_locale, (key)->other_key[key]=on

    if en_keys.length > 0

        for en_key in en_keys
            unless other_key[en_key]

                console.log "#{other}:\tmissing: #{en_key}"
                key_chain  = en_key.split('.')
                other_prop = other_locale
                en_prop    = en_locale

                while key = key_chain.shift()
                    if other_prop[key]
                        other_prop  = other_prop[key]
                        en_prop     = en_prop[key]
                    else
                        other_prop[key] = en_prop[key] if en_prop[key]

        output_str  = "module.exports = #{util.inspect(other_locale, depth:null)};"
        ast = UglifyJS.parse output_str
        stream = UglifyJS.OutputStream beautify: true
        ast.print stream
        output_file = "#{__dirname}/locale-#{other}.js"
        fs.writeFile output_file, stream.toString(), (err, written, string) ->
            if err
                console.log "error occurred: ", err

            console.log "New locale file generated at: #{output_file}"

    else
        console.log "no addition found"

    console.log "---------"