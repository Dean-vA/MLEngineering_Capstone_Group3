import React, { Fragment, useState, useRef } from "react";
import bard from "./bard_transparent.png";
import blank from "./blank_transparent.png";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Webcam from "react-webcam";


function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const [language, setLanguage] = useState({ id: "en", name: "English" });
  const [user, setUser] = useState('Unknown User');

  const [loggedIn, setLoggedIn] = useState(false);

  const webcamRef = React.useRef(null);
  const [predictionResult, setPredictionResult] = React.useState(null);

  const ShadesOfGreen = {
    0: 'bg-green-50',
    1: 'bg-green-100',
    2: 'bg-green-200',
    3: 'bg-green-300',
    4: 'bg-green-400',
    5: 'bg-green-500',
    6: 'bg-green-600',
    7: 'bg-green-700',
    8: 'bg-green-800',
    9: 'bg-green-900'
  };
  
  const [scoredWords, setScoredWords] = useState([]);


  const capture = React.useCallback(
    () => {
      if (webcamRef.current && webcamRef.current.getScreenshot) {
        const imageSrc = webcamRef.current.getScreenshot();
        return imageSrc;
      }
      return null;
    },
    [webcamRef]
  );

  // Login function
  const handleLogin = async () => {
    const imageSrc = capture();

    // If there's no image, don't proceed
    if (!imageSrc) {
        console.error("No image captured");
        return;
    }

    var base64Image = imageSrc.split(',')[1];
    const imgdata = JSON.stringify({ image : base64Image });
    var data = JSON.stringify({
      "instances": [
        {
          "image": base64Image
        }
      ]
    });
    
    console.log("Request Data: ", data);

    await fetch(`https://middleman-auth-dlkyfi4jza-uc.a.run.app/face_classifier/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: imgdata,
      //body: data,
    })
    .then((response) => {
      console.log("Response status:", response.status);
      return response.json(); // This returns a promise
    })
    .then((result) => {
      console.log("Response content:", result);
      // Update the prediction result state variable
      setPredictionResult(result.predictions[0].prediction);
      // Only set loggedIn to true if the server's prediction was 1
      if (result.predictions[0].prediction === 1) {
        setLoggedIn(true);
      }
      if (result.predictions[0].prediction === 0) {
        alert("Face not recognized. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
    //setLoggedIn(true);

  };

  // Register face function placeholder
  const handleRegisterFace = () => {
    alert('Registering face...');
  };
    

  const handleStartRecording = () => {
    setOutput("");
    // Create a new MediaRecorder instance.
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Start recording and set up event listeners.
      mediaRecorderRef.current.start();
      setRecording(true);

      const audioChunks = [];
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        // Here, you could create a new FormData instance and append the audioBlob as a file,
        // then send the FormData with a fetch() or axios request to your speech-to-text API.
        // Define the audio variable
        const audio = new File([audioBlob], "audio.mp3", {
          type: "audio/mpeg",
        });

        // Create a new FormData instance
        var data = new FormData();

        // Add the audio file to the form data
        data.append("audio", audio);

        // Use fetch to send the audio file to your server
        //await fetch(`${process.env.REACT_APP_STT_APP_API_URL}/transcribe`, {
        await fetch(
          `https://middleman-auth-dlkyfi4jza-uc.a.run.app/transcribe/${language.id}`,
          {
            method: "POST",
            body: data,
          }
        )
          .then((response) => response.json())
          .then((result) => {
            console.log("Success:", result);
            // Set the transcribed text in the state
            setInput(result.transcription);
          })
          .catch((error) => {
            console.error("Error:", error);
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
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });

      // Re-enable the button by setting the recording state to false
      //setRecording(false);
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = () => {
    const words = input.split(' ');
    const scoredWords = words.map(word => ({
      word,
      score: Math.floor(Math.random() * 10),
    }));

    setScoredWords(scoredWords);
    console.log("Scored words:", scoredWords);
    const url =
      "https://middleman-auth-dlkyfi4jza-uc.a.run.app/classifier/predict";
    const data = { text: input };
    console.log("Request Data: ", data);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        const prediction = data.predictions[0];
        const verdict = prediction.label;
        const confidence = prediction.score;

        setPrediction(prediction);
        setOutput("");
      })
      .catch((error) => {
        console.error("Error:", error);
        setOutput("Error occurred while making prediction.");
      });
  };

  // Conditional rendering
  if (!loggedIn) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
        />
        <Button className="mt-4" label="Login" onClick={handleLogin}  />
        <Button className="mt-4 bg-green-600 hover:bg-green-500" label="Register Face" onClick={handleRegisterFace}  />
  
        {/* Display the prediction result */}
        {predictionResult !== null && (
          <p>Prediction result: {predictionResult}</p>
        )}
      </div>
    );
  }
  

  return (
    <>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mt-12">
        <Header />
        <SectionTitle label={"Input"} />
        <div className="mt-4">
          <Select selected={language} setSelected={setLanguage} />
          <div class="mt-4">
            <label
              for="comment"
              class="block text-sm font-medium leading-6 text-gray-900"
            >
              Add your text.
            </label>
            <div class="mt-4">
              <textarea
                value={input}
                onChange={handleInputChange}
                rows="4"
                name="comment"
                id="comment"
                class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              ></textarea>
            </div>
          </div>
        </div>
        <Button className="mt-4 px-4" label="Submit" onClick={handleSubmit} />

        <div>
          <div className="flex items-center justify-center">
            <Button
              className="mr-4 hover:bg-red-500 bg-red-600 text-white font-bold py-4 px-8 rounded-full"
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              onTouchStart={handleStartRecording}
              onTouchEnd={handleStopRecording}
              label={recording ? "Release to stop 🤐" : "Push to talk 🎤"}
              style={{ minWidth: "140px", userSelect: "none"}}
            ></Button>
          </div>
          <div className="flex items-center justify-center">
            <div>{audioURL && <audio src={audioURL} controls />}</div>
          </div>
        </div>
        <SectionTitle label={"Analysis"} />
        <div className="mt-4 flex items-center justify-center">
          <p>
            {scoredWords.map(({ word, score }, index) => (
              <span key={index} className={`p-1 ${ShadesOfGreen[score]} m-1 rounded`}>
                {word}
              </span>
            ))}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center">
          {prediction
            ? `Verdict: ${prediction.label} ---> confidence: ${prediction.score}`
            : output || "No prediction available"}
        </div>
        <div className="mt-4 flex items-center justify-center">
          <img
            src={blank}
            alt="blank"
            style={{ height: "150px", width: "150px" }}
          />
          <ProgressBar
            score={prediction ? computeNormedScore(prediction) : 0}
            label={prediction ? prediction.label : ""}
          />
          <img
            src={bard}
            alt="bard"
            style={{ height: "150px", width: "150px" }}
          />
        </div>
        <div className="mt-4 flex items-center justify-center">
          <p>
              "gpt response here"
          </p>
        </div>
      </div>
    </>
  );
}

export default App;

function SectionTitle({ label }) {
  return (
    <div class="mt-8 border-b border-gray-200 pb-5">
      <h3 class="text-base font-semibold leading-6 text-gray-900">{label}</h3>
    </div>
  );
}

function Button({ label = "", className = "", ...props }) {
  return (
    <button
      {...props}
      type="button"
      class={
        className +
        " rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      }
    >
      {label}
    </button>
  );
}

function Header() {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-5xl font-bold leading-7 text-gray-900 sm:tracking-tight">
          Blank to Bard
        </h1>
      </div>
    </div>
  );
}

const languages = [
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
  { id: "de", name: "German" },
  { id: "nl", name: "Dutch" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Select({ selected, setSelected }) {
  return (
    <Listbox
      value={selected}
      onChange={setSelected}
      className="col-span-3"
      style={{ width: "200px" }}
    >
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            Language
          </Listbox.Label>
          <div className="relative mt-2" style={{ width: "250px" }}>
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <span className="block truncate">{selected.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {languages.map((person) => (
                  <Listbox.Option
                    key={person.id}
                    className={({ active }) =>
                      classNames(
                        active ? "bg-indigo-600 text-white" : "text-gray-900",
                        "relative cursor-default select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={person}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {person.name}
                        </span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-indigo-600",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}

function ProgressBar({ score, label }) {
  if (score === undefined || score < 50 || score > 100) {
    return <></>;
  }

  let bardWidth, blankWidth;

  if (label === "Bard") {
    bardWidth = `${(score - 50)}%`;
    blankWidth = `${100 - score}%`;
  } else {
    blankWidth = `${(score - 50)}%`;
    bardWidth = `${100 - score}%`;
  }

  return (
    <div className="h-4 w-full bg-gray-200 relative" style={{ overflow: 'hidden', borderRadius: '8px' }}>
      <div 
        className="h-full bg-red-500 transition-all duration-500 absolute"
        style={{ 
          width: blankWidth,
          left: "50%",
          transform: "translateX(-100%)",
          borderRadius: "8px 0 0 8px"
        }}
      />
      <div 
        className="h-full bg-indigo-500 transition-all duration-500 absolute"
        style={{ 
          width: bardWidth,
          right: "50%",
          transform: "translateX(100%)",
          borderRadius: "0 8px 8px 0"
        }}
      />
    </div>
  );
}



function computeNormedScore(prediction) {
  return Math.abs(prediction.score * 100);
}

