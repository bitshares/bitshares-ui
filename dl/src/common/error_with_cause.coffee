###* Exception nesting.  ###
class ErrorWithCause
    
    constructor: (@message, cause)->
        if cause?.message
            @message = "cause\t#{cause.message}\t" + @message
        
        stack = (new Error).stack
        if cause?.stack
            stack = "caused by\n\t#{cause.stack}\t" + stack
        
        @stack = @message + "\n" + stack

    ErrorWithCause.throw = (message, cause)->
        throw new ErrorWithCause message, cause
    
module.exports = ErrorWithCause
