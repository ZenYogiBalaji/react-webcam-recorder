import "./App.css";
import WebCamRecorder from "./WebCamRecorder";
import { useState } from "react";
import ReactDOM from "react-dom";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <WebCamRecorder />
      </header>
    </div>
  );
}

export default App;
