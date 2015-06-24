/*
forked from: https://github.com/cezary/react-webcam/  Version   0.0.1
*/
var React = require('react');

function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

module.exports = React.createClass({
  displayName: 'Webcam',

  getInitialState: function() {
    return {
      on: false
    };
  },
  
  statics: {
      hasGetUserMedia: hasGetUserMedia
  },

  render: function () {
    return (
      <video autoPlay ref='video'></video>
    );
  },

  componentDidMount: function() {
    self = this;
    var video = this.refs.video.getDOMNode();

    if (!hasGetUserMedia()) {
        console.error("react-webcam: browser does not support User Media");
        return;
    }

    navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

    var self = this;
    if (this.props.audioSource && this.props.videoSource) {
      sourceSelected(this.props.audioSource, this.props.videoSource);
    } else {
      MediaStreamTrack.getSources(function(sourceInfos) {
        var audioSource = null;
        var videoSource = null;
        sourceInfos.forEach(function(sourceInfo) {
          if (sourceInfo.kind === 'audio') {
            if( ! self.props.noAudio) {
              console.log(sourceInfo.id, sourceInfo.label || 'microphone');
              audioSource = sourceInfo.id;
            }
          } else if (sourceInfo.kind === 'video') {
            console.log(sourceInfo.id, sourceInfo.label || 'camera');

            videoSource = sourceInfo.id;
          } else {
            console.log('Some other kind of source: ', sourceInfo);
          }
        });
        sourceSelected(audioSource, videoSource);
      });
    }

    function sourceSelected(audioSource, videoSource) {
      var constraints = {
        audio: self.props.noAudio ? false : {
          optional: [{sourceId: audioSource}]
        },
        video: {
          optional: [{sourceId: videoSource}]
        }
      };

      navigator.getUserMedia(constraints, successCallback, errorCallback);
    }

    function successCallback(stream) {
      self.setState({on:true});
      //? var video = this.refs.video.getDOMNode();
      video.src = window.URL.createObjectURL(stream);
    };

    function errorCallback(e) {
      // ? var video = this.refs.video.getDOMNode();
      video.src = self.props.fallbackURL;
    };
  },

  componentWillUnmount() {
      var video = this.refs.video.getDOMNode();
      //https://gist.github.com/danro/5725870
      console.log('... video shutdown')
      video.pause()
      video.src = ''
  },
  
  getScreenshot: function() {
    if (!this.state.on) return;

    var video = this.refs.video.getDOMNode();

    var canvas = document.createElement('canvas');
    canvas.height = video.clientHeight;
    canvas.width = video.clientWidth;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/webp');
  }
});
