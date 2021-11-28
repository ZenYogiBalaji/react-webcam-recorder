import "./App.css";
import WebCamRecorder from "./WebCamRecorder";
import { useState } from "react";

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
