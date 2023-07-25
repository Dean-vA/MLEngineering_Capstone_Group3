// import logo from './logo.svg';
import bardFront from './bard_transparent.png';
import bardBack from './blank_transparent.png';
import './App.css';
import React, { useState, useRef } from "react";

function App() {
  const [input, setInput] = useState('your text here...');
  const [output, setOutput] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null); 
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState('Unknown User');
  
  const handleStartRecording = () => {
    setOutput("" );
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

        mediaRecorderRef.current.addEventListener("stop", async () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);

          // Here, you could create a new FormData instance and append the audioBlob as a file,
          // then send the FormData with a fetch() or axios request to your speech-to-text API.
          // Define the audio variable
          const audio = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });

          // Create a new FormData instance
          var data = new FormData();
          
          // Add the audio file to the form data
          data.append('audio', audio);

          // Use fetch to send the audio file to your server
          //await fetch(`${process.env.REACT_APP_STT_APP_API_URL}/transcribe`, {
            await fetch(`https://middleman-auth-dlkyfi4jza-uc.a.run.app/transcribe/${language}`, {
            method: 'POST',
            body: data,
          })
          .then(response => response.json())
          .then(result => {
            console.log('Success:', result);
            // Set the transcribed text in the state
            setInput(result.transcription);
          })
          .catch(error => {
            console.error('Error:', error);
            setOutput(error.message);
          });
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
      
      // Re-enable the button by setting the recording state to false
      //setRecording(false);
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
    const url = 'https://middleman-auth-dlkyfi4jza-uc.a.run.app/classifier/predict';
    const data = {text: input};

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => response.json())
    .then((data) => {
      const prediction = data.predictions[0];
      const verdict = prediction.label;
      const confidence = prediction.score;

      setOutput(`Verdict: ${verdict} ---> confidence: ${confidence}`);
    })
    .catch((error) => {
      console.error('Error:', error);
      setOutput('Error occurred while making prediction.');
    });
  };

  const inputStyle = {
    color: input === 'your text here...' ? 'gray' : 'black',
  };

  return (
    <>
    <div className="App">
      <header className="App-header">
        <h1>Blank to Bard</h1>
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <div className="flip-card-container">
          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img src={bardFront} alt="Front" style={{width: '100%', height: '100%'}}/>
              </div>
              <div className="flip-card-back">
                <img src={bardBack} alt="Back" style={{width: '100%', height: '100%'}}/>
              </div>
            </div>
          </div>
        </div>
      </header>
      <h1>Hello {user}</h1> 
      <p>Please select your language and speak or enter text below:</p>
      <select className="select" value={language} onChange={event => setLanguage(event.target.value)}>
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="nl">Dutch</option>
      </select>

      <div className="input-group">
        <textarea value={input} onChange={handleInputChange} onFocus={handleInputFocus} style={inputStyle} rows="3" cols="50" />
      </div>
    
      <button className="button" onClick={handleSubmit}>Submit</button>

      <div>
      <div>
        <button
          className={`recording-button ${recording ? 'recording' : ''}`} 
          //onClick={handleStartRecording} disabled={recording}
          onMouseDown={handleStartRecording}
          onMouseUp={handleStopRecording}
          onTouchStart={handleStartRecording}
          onTouchEnd={handleStopRecording}
          >
          {/* {recording ? 'Release to stop' : 'Push to talk'} */}
        </button>
        {/* <button onClick={handleStopRecording} disabled={!recording}>
          Stop recording
        </button> */}
      </div>
      <p>{recording ? 'Release to stop' : 'Push to talk'}</p>
      <div>
        {audioURL && <audio src={audioURL} controls />}
      </div>
      </div>
        <h1>Output</h1>
        <p>{output}</p>
      </div>
      </>
  );
}

export default App;
