import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function useVoiceDictation({
  language = "en-PK",
  onTranscript,
}) {
  const recognitionRef = useRef(null);

  const [isListening, setIsListening] =
    useState(false);

  const [supported, setSupported] =
    useState(true);

  const [voiceError, setVoiceError] =
    useState("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return undefined;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          "Microphone permission was blocked.",
        );
        return;
      }

      if (event.error === "no-speech") {
        setVoiceError(
          "No speech was detected.",
        );
        return;
      }

      setVoiceError(
        `Voice recognition failed: ${event.error}`,
      );
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const text =
          event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      onTranscript?.({
        finalTranscript:
          finalTranscript.trim(),
        interimTranscript:
          interimTranscript.trim(),
      });
    };

    recognitionRef.current =
      recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language, onTranscript]);

  const startListening = () => {
    if (
      !supported ||
      !recognitionRef.current
    ) {
      setVoiceError(
        "Voice dictation is not supported in this browser.",
      );

      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      // Recognition may already be running.
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    supported,
    voiceError,
    toggleListening,
    stopListening,
  };
}
