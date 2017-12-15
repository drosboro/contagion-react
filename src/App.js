import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import World from './components/world';
import 'typeface-roboto';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">
            <img src={logo} className="App-logo" alt="logo" />
            Contagion
          </h1>
        </header>
        <World />
      </div>
    );
  }
}

export default App;
