import { useEffect, useRef, useState } from "react";
import React from "react";

function WebCamRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const streamRef = useRef<null | MediaStream>(null);
  const [downloadLink, setDownloadLink] = useState("");
  const streamRecorderRef = useRef<null | MediaRecorder>(null);
  const [audioSource, setAudioSource] = useState<string>("");
  const [videoSource, setVideoSource] = useState<string>("");
  const [audioSourceOptions, setAudioSourceOptions] = useState<
    Record<string, string>[]
  >([]);
  const [videoSourceOptions, setVideoSourceOptions] = useState<
    Record<string, string>[]
  >([]);
  const [error, setError] = useState<null | Error>(null);
  const chunks = useRef<any[]>([]);

  function startRecording() {
    if (isRecording) {
      return;
    }
    if (!streamRef.current) {
      return;
    }
    streamRecorderRef.current = new MediaRecorder(streamRef.current);
    streamRecorderRef.current.start();
    streamRecorderRef.current.ondataavailable = function (event: BlobEvent) {
      if (chunks.current) {
        chunks.current.push(event.data);
      }
    };
    setIsRecording(true);
  }

  useEffect(
    function () {
      if (isRecording) {
        return;
      }
      if (chunks.current.length === 0) {
        return;
      }
      const blob = new Blob(chunks.current, {
        type: "video/x-matroska;codecs=avc1,opus"
      });
      setDownloadLink(URL.createObjectURL(blob));
      chunks.current = [];
    },
    [isRecording]
  );

  function stopRecording() {
    if (!streamRecorderRef.current) {
      return;
    }
    streamRecorderRef.current.stop();
    setIsRecording(false);
  }

  function uploadVideo(mediaBlob: string | URL) {
    {
      //load blob
      var xhr_get_audio = new XMLHttpRequest();
      xhr_get_audio.open("GET", mediaBlob, true);
      xhr_get_audio.responseType = "blob";
      xhr_get_audio.onload = function (e) {
        if (this.status == 200) {
          var vblob = this.response;
          //send the blob to the server
          var xhr_send = new XMLHttpRequest();
          var filename = new Date().toISOString();
          xhr_get_audio.onload = function (e) {
            if (this.readyState === 4) {
              console.log("Server returned: ", e.target.responseText);
            }
          };
          var fd = new FormData();
          fd.append("audio_data", vblob, filename);
          xhr_send.open("POST", "http://localhost/uploadAudio", true);
          xhr_send.send(fd);
        }
      };
      xhr_get_audio.send();
    }
  }

  useEffect(function () {
    async function prepareStream() {
      function gotStream(stream: MediaStream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      async function getStream() {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }
        const constraints = {
          audio: {
            deviceId: audioSource !== "" ? { exact: audioSource } : undefined
          },
          video: {
            deviceId: videoSource !== "" ? { exact: videoSource } : undefined
          }
        };
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          gotStream(stream);
        } catch (error) {
          setError(error);
        }
      }

      function getDevices() {
        return navigator.mediaDevices.enumerateDevices();
      }

      function gotDevices(deviceInfos: MediaDeviceInfo[]) {
        const audioSourceOptions = [];
        const videoSourceOptions = [];
        for (const deviceInfo of deviceInfos) {
          if (deviceInfo.kind === "audioinput") {
            audioSourceOptions.push({
              value: deviceInfo.deviceId,
              label: deviceInfo.label || `Microphone ${deviceInfo.deviceId}`
            });
          } else if (deviceInfo.kind === "videoinput") {
            videoSourceOptions.push({
              value: deviceInfo.deviceId,
              label: deviceInfo.label || `Camera ${deviceInfo.deviceId}`
            });
          }
        }
        setAudioSourceOptions(audioSourceOptions);
        setVideoSourceOptions(videoSourceOptions);
      }

      await getStream();
      const mediaDevices = await getDevices();
      gotDevices(mediaDevices);
    }
    prepareStream();
  }, []);
  return (
    <div>
      <div>
        <select id="videoSource" name="videoSource" value={videoSource}>
          {videoSourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select id="audioSource" name="audioSource" value={audioSource}>
          {audioSourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <video ref={videoRef} autoPlay muted playsInline></video>
      </div>
      <div>
        {downloadLink && <video src={downloadLink} controls></video>}
        {downloadLink && (
          <a href={downloadLink} download="file.mp4">
            Download Video
          </a>
        )}
      </div>

      <div>
        <button onClick={startRecording} uploadVideo={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} enabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={uploadVideo()}> Submit Video</button>
      </div>
      <div>{error && <p>{error.message}</p>}</div>
    </div>
  );
}

export default WebCamRecorder;
