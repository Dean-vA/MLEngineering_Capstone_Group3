import React, { Fragment, useState, useRef } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

function App() {
  const [input, setInput] = useState("your text here...");
  const [output, setOutput] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const [language, setLanguage] = useState({ id: "en", name: "English" });

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
          `https://middleman-auth-dlkyfi4jza-uc.a.run.app/transcribe/${language}`,
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

  const handleInputFocus = (event) => {
    if (input === "your text here...") {
      setInput("");
    }
  };

  const handleSubmit = () => {
    const url =
      "https://middleman-auth-dlkyfi4jza-uc.a.run.app/classifier/predict";
    const data = { text: input };

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

        setOutput(`Verdict: ${verdict} ---> confidence: ${confidence}`);
      })
      .catch((error) => {
        console.error("Error:", error);
        setOutput("Error occurred while making prediction.");
      });
  };

  const inputStyle = {
    color: input === "your text here..." ? "gray" : "black",
  };

  return (
    <>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mt-8">
        <Header />
        <div className="mt-8">
          <Select selected={language} setSelected={setLanguage} />
        </div>
        <div className="mt-4">
          <textarea
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            style={inputStyle}
            rows="3"
            cols="50"
          />
        </div>

        <button className="button" onClick={handleSubmit}>
          Submit
        </button>

        <div>
          <div>
            <button
              className={`recording-button ${recording ? "recording" : ""}`}
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
          <p>{recording ? "Release to stop" : "Push to talk"}</p>
          <div>{audioURL && <audio src={audioURL} controls />}</div>
        </div>
        <h1>Output</h1>
        <p>{output}</p>
      </div>
    </>
  );
}

export default App;

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
