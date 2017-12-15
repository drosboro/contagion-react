import React, { Component } from 'react';

class Person extends Component {
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
        face = '\u00b7'
        break
    }

    return (
      <span>{face} Person </span>
    )
  }
}

export default Person