export default function(context, ZfApi){
    return {
        bindListener: function(){
            context.modalEscapeListener = function(e){
                if(e.keyCode === 27 && this.state.open){
                    this.setState({open: false});
                    ZfApi.publish(this.props.modalId, "close");
                }
            }.bind(context);

            document.addEventListener("keydown", context.modalEscapeListener);
        },
        unbindListener: function(){
            document.removeEventListener("keydown", context.modalEscapeListener);
        }
    }
}
