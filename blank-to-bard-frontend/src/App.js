import logo from './logo.svg';
import './App.css';
import React, { useState, useRef } from "react";

function App() {
  const [input, setInput] = useState('your text here...');
  const [output, setOutput] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null); 
  
  const handleStartRecording = () => {
    // Create a new MediaRecorder instance.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);

        // Start recording and set up event listeners.
        mediaRecorderRef.current.start();
        setRecording(true);

        const audioChunks = [];
        mediaRecorderRef.current.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorderRef.current.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);

          // Here, you could create a new FormData instance and append the audioBlob as a file,
          // then send the FormData with a fetch() or axios request to your speech-to-text API.
        });
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      // Get the MediaStreamTracks and stop each one.
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleInputFocus = (event) => {
    if (input === 'your text here...') {
      setInput('');
    }
  };

  const handleSubmit = () => {
    // TODO: Call API here with the user input, and update the output state with the response.

    // For now, let's just echo the user input in the output.
    setOutput(input);
  };

  const inputStyle = {
    color: input === 'your text here...' ? 'gray' : 'black',
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Blank to Bard</h1>
        <img src={logo} className="App-logo" alt="logo" />
        {/* <p>
          Edit <code>src/App.js</code> and save to reload.
        </p> */}
        {/* <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
      <h1>Input Text Here</h1>

      <div className="input-group">
        <textarea value={input} onChange={handleInputChange} onFocus={handleInputFocus} style={inputStyle} rows="10" cols="50" />
      </div>
      
      <div className="button-group">
        <button onClick={handleSubmit}>Submit</button>
      </div>

      <div>
      <div>
        <button onClick={handleStartRecording} disabled={recording}>
          Start recording
        </button>
        <button onClick={handleStopRecording} disabled={!recording}>
          Stop recording
        </button>
      </div>
      <div>
        {audioURL && <audio src={audioURL} controls />}
      </div>
    </div>

      <h1>Output</h1>
      <p>{output}</p>
    </div>
  );
}

export default App;
