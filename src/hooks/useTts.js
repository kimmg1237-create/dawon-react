import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTts() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utterRef = useRef(null);
  const paragraphsRef = useRef([]);
  const indexRef = useRef(0);

  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ko'));
      setVoices(v);
      if (v.length > 0 && !selectedVoice) setSelectedVoice(v[0]);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speakParagraph = useCallback((index) => {
    if (index >= paragraphsRef.current.length) {
      setSpeaking(false);
      setCurrentIndex(-1);
      return;
    }
    const utter = new SpeechSynthesisUtterance(paragraphsRef.current[index]);
    utter.lang = 'ko-KR';
    utter.rate = rate;
    utter.pitch = pitch;
    if (selectedVoice) utter.voice = selectedVoice;
    utter.onend = () => {
      indexRef.current = index + 1;
      speakParagraph(index + 1);
    };
    utterRef.current = utter;
    setCurrentIndex(index);
    speechSynthesis.speak(utter);
  }, [rate, pitch, selectedVoice]);

  const play = useCallback((paragraphs, startIdx = 0) => {
    speechSynthesis.cancel();
    paragraphsRef.current = paragraphs;
    indexRef.current = startIdx;
    setSpeaking(true);
    setPaused(false);
    speakParagraph(startIdx);
  }, [speakParagraph]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentIndex(-1);
  }, []);

  return {
    speaking, paused, currentIndex,
    rate, setRate, pitch, setPitch,
    voices, selectedVoice, setSelectedVoice,
    play, pause, resume, stop,
  };
}
