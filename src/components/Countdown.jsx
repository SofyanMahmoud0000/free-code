import { useState, useEffect, useRef } from 'react';
import { formatTime, storage } from '../utils';
import './Countdown.css';

export default function Countdown() {
  const loadInitial = () => {
    const running = storage.get('isCountdownRunning') === 'true';
    const targetTime = parseInt(storage.get('countdownTargetTime', '0'));
    if (running && targetTime) {
      const remaining = targetTime - Date.now();
      if (remaining > 0) return { seconds: Math.floor(remaining / 1000), running: true, targetTime };
      storage.remove('countdownTargetTime');
      storage.remove('isCountdownRunning');
      setTimeout(() => alert('Countdown finished!'), 0);
    }
    return { seconds: parseInt(storage.get('countdownSeconds', '0')) || 0, running: false, targetTime: null };
  };

  const initial = loadInitial();
  const [seconds, setSeconds] = useState(initial.seconds);
  const [running, setRunning] = useState(initial.running);
  const [showModal, setShowModal] = useState(false);
  const targetTimeRef = useRef(initial.targetTime);
  const intervalRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            targetTimeRef.current = null;
            setTimeout(() => alert('Countdown finished!'), 0);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    storage.set('countdownSeconds', seconds);
    storage.set('isCountdownRunning', running);
    if (running && targetTimeRef.current) {
      storage.set('countdownTargetTime', targetTimeRef.current);
    } else {
      storage.remove('countdownTargetTime');
    }
  }, [seconds, running]);

  const toggle = (e) => {
    e.stopPropagation();
    if (running) {
      clearInterval(intervalRef.current);
      targetTimeRef.current = null;
      setRunning(false);
    } else {
      if (seconds === 0) { setShowModal(true); return; }
      targetTimeRef.current = Date.now() + seconds * 1000;
      setRunning(true);
    }
  };

  const reset = (e) => {
    e.stopPropagation();
    e.preventDefault();
    clearInterval(intervalRef.current);
    targetTimeRef.current = null;
    setRunning(false);
    setSeconds(0);
  };

  const startFromModal = () => {
    const h = parseInt(hoursRef.current?.value) || 0;
    const m = parseInt(minutesRef.current?.value) || 0;
    const total = h * 3600 + m * 60;
    if (total <= 0) { alert('Please enter a valid time'); return; }
    setShowModal(false);
    setSeconds(total);
    targetTimeRef.current = Date.now() + total * 1000;
    setRunning(true);
  };

  return (
    <>
      <div className={`countdown${running ? ' running' : ''}`}>
        <span className="countdown-time" onClick={toggle}>{formatTime(seconds)}</span>
        <span className="countdown-reset" onClick={reset}>↺</span>
      </div>

      {showModal && (
        <div className="countdown-modal" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="countdown-modal-content">
            <h3>Set Countdown Timer</h3>
            <div className="countdown-inputs">
              <div className="countdown-input-group">
                <label>Hours</label>
                <input ref={hoursRef} type="number" min="0" max="23" defaultValue="0" />
              </div>
              <div className="countdown-input-group">
                <label>Minutes</label>
                <input ref={minutesRef} type="number" min="0" max="59" defaultValue="5" />
              </div>
            </div>
            <div className="countdown-modal-buttons">
              <button className="countdown-start-btn" onClick={startFromModal}>Start</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
