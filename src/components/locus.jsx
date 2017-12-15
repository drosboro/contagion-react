import React, { Component } from 'react';

class Locus extends Component {
  render () {
    var face = ""
    switch (this.props.status) {
      case "healthy":
        face = '\uD83D\uDE42'
        break
      case "sick":
        face = '\uD83E\uDD22'
        break
      case "dead":
        face = '\u2620'
        break
      case "immune":
        face = '\uD83D\uDE0E'
        break
      default:
        face = '\u25cf'
        break
    }

    return (
      <div className="locus">{face}</div>
    )
  }
}

export default Locus