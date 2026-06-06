import { useState, useEffect, useRef } from 'react';
import { formatTime, storage } from '../utils';
import './Stopwatch.css';

export default function Stopwatch() {
  const loadInitial = () => {
    let seconds = parseInt(storage.get('stopwatchSeconds', '0')) || 0;
    const running = storage.get('isStopwatchRunning') === 'true';
    const startTime = parseInt(storage.get('stopwatchStartTime', '0'));
    if (running && startTime) {
      seconds += Math.floor((Date.now() - startTime) / 1000);
    }
    return { seconds, running: running && !!startTime };
  };

  const initial = loadInitial();
  const [seconds, setSeconds] = useState(initial.seconds);
  const [running, setRunning] = useState(initial.running);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(running ? Date.now() : null);

  useEffect(() => {
    if (running) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    storage.set('stopwatchSeconds', seconds);
    storage.set('isStopwatchRunning', running);
    if (running && startTimeRef.current) {
      storage.set('stopwatchStartTime', startTimeRef.current);
    } else {
      storage.remove('stopwatchStartTime');
    }
  }, [seconds, running]);

  const toggle = (e) => {
    e.stopPropagation();
    if (running) {
      startTimeRef.current = null;
    } else {
      startTimeRef.current = Date.now();
    }
    setRunning(r => !r);
  };

  const reset = (e) => {
    e.stopPropagation();
    e.preventDefault();
    clearInterval(intervalRef.current);
    startTimeRef.current = null;
    setRunning(false);
    setSeconds(0);
  };

  return (
    <div className={`stopwatch${running ? ' running' : ''}`}>
      <span className="stopwatch-time" onClick={toggle}>{formatTime(seconds)}</span>
      <span className="stopwatch-reset" onClick={reset}>↺</span>
    </div>
  );
}
