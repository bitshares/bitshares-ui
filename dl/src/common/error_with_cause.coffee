###* Exception nesting.  ###
class ErrorWithCause
    
    constructor: (@message, cause)->
        if cause?.message
            @message = "cause\t#{cause.message}\t" + @message
        
        stack = ""#(new Error).stack
        if cause?.stack
            stack = "caused by\n\t#{cause.stack}\t" + stack
        
        @stack = @message + "\n" + stack

    ErrorWithCause.throw = (message, cause)->
        msg = message
        msg += "\t cause: #{cause.message} " if cause?.message
        msg += "\n stack: #{cause.stack} " if cause?.stack
        throw new Error(msg)
    
module.exports = ErrorWithCause
