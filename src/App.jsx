import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from './utils';
import CodeEditor from './components/CodeEditor';
import FileSwitcher from './components/FileSwitcher';
import Stopwatch from './components/Stopwatch';
import Countdown from './components/Countdown';
import DrawingCanvas from './components/DrawingCanvas';
import DrawToggle from './components/DrawToggle';
import './App.css';

const DEFAULT_FILE = (n) => ({ name: `untitled-${n}.cpp`, content: '', language: 'cpp' });

function loadState() {
  const files = storage.getJSON('files', null);
  const counter = parseInt(storage.get('fileCounter', '1'));
  if (files && Object.keys(files).length > 0) {
    return { files, counter, currentFileId: storage.get('currentFileId') || Object.keys(files)[0] };
  }
  return { files: { 'file-1': DEFAULT_FILE(1) }, counter: 1, currentFileId: 'file-1' };
}

export default function App() {
  const initial = loadState();
  const [files, setFiles] = useState(initial.files);
  const [currentFileId, setCurrentFileId] = useState(initial.currentFileId);
  const [fileCounter, setFileCounter] = useState(initial.counter);
  const [theme, setTheme] = useState(storage.get('editorTheme', 'one-dark-black'));
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drawOpen, setDrawOpen] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const startResize = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    const onMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setEditorWidth(Math.max(20, Math.min(80, pct)));
    };

    const onUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  useEffect(() => {
    storage.setJSON('files', files);
    storage.set('currentFileId', currentFileId);
    storage.set('fileCounter', fileCounter);
  }, [files, currentFileId, fileCounter]);

  useEffect(() => { storage.set('editorTheme', theme); }, [theme]);

  const createFile = useCallback(() => {
    const n = fileCounter + 1;
    const id = `file-${n}`;
    setFileCounter(n);
    setFiles(prev => ({ ...prev, [id]: DEFAULT_FILE(n) }));
    setCurrentFileId(id);
    return id;
  }, [fileCounter]);

  const switchTo = useCallback((fileId) => setCurrentFileId(fileId), []);

  const renameFile = useCallback((fileId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setFiles(prev => ({ ...prev, [fileId]: { ...prev[fileId], name: trimmed } }));
  }, []);

  const closeFile = useCallback((fileId) => {
    setFiles(prev => {
      const ids = Object.keys(prev);
      if (ids.length === 1) { alert('Cannot close the last file'); return prev; }
      const file = prev[fileId];
      if (file?.content?.trim() && !confirm(`Delete "${file.name}"?`)) return prev;
      const next = { ...prev };
      delete next[fileId];
      if (currentFileId === fileId) setCurrentFileId(ids.find(id => id !== fileId));
      return next;
    });
  }, [currentFileId]);

  const updateContent = useCallback((value) => {
    setFiles(prev => ({ ...prev, [currentFileId]: { ...prev[currentFileId], content: value ?? '' } }));
  }, [currentFileId]);

  const updateLanguage = useCallback((lang) => {
    setFiles(prev => ({ ...prev, [currentFileId]: { ...prev[currentFileId], language: lang } }));
  }, [currentFileId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        setSwitcherOpen(o => {
          if (!o) setSelectedIndex(Object.keys(files).indexOf(currentFileId));
          return !o;
        });
        return;
      }
      if (!switcherOpen) return;
      e.preventDefault();
      const ids = Object.keys(files);
      switch (e.key) {
        case 'ArrowDown':
          setSelectedIndex(i => { const n = (i + 1) % ids.length; switchTo(ids[n]); return n; });
          break;
        case 'ArrowUp':
          setSelectedIndex(i => { const n = (i - 1 + ids.length) % ids.length; switchTo(ids[n]); return n; });
          break;
        case 'Enter': case 'Escape':
          setSwitcherOpen(false);
          break;
        case 'n': case 'N':
          createFile();
          break;
        case 'r': case 'R': {
          const fid = ids[selectedIndex];
          if (fid) { const name = prompt('Enter new name:', files[fid].name); if (name) renameFile(fid, name); }
          break;
        }
        case 'd': case 'D': {
          const fid = ids[selectedIndex];
          if (fid) { closeFile(fid); setSelectedIndex(i => Math.max(0, Math.min(i, ids.length - 2))); }
          break;
        }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [switcherOpen, files, currentFileId, selectedIndex, createFile, switchTo, renameFile, closeFile]);

  return (
    <div className="app" style={{ '--overlay-right': drawOpen ? `calc(${100 - editorWidth}% + 10px)` : '10px' }}>
      <div className={`main-content${isDragging ? ' dragging' : ''}`} ref={containerRef}>
        <div className="panel" style={drawOpen ? { flex: `0 0 ${editorWidth}%` } : { flex: 1 }}>
          <CodeEditor
            file={files[currentFileId]}
            theme={theme}
            onContentChange={updateContent}
            onLanguageChange={updateLanguage}
            onThemeChange={setTheme}
          />
        </div>
        {drawOpen && (
          <>
            <div className="resize-handle" onMouseDown={startResize} />
            <div className="panel" style={{ flex: 1, pointerEvents: isDragging ? 'none' : 'auto' }}>
              <DrawingCanvas fileId={currentFileId} />
            </div>
          </>
        )}
      </div>

      {/* Fixed overlays */}
      <div className="current-file-indicator" onClick={() => setSwitcherOpen(o => !o)}>
        {files[currentFileId]?.name}
      </div>
      {!switcherOpen && <div className="keyboard-hint">Press Ctrl+P for files</div>}
      <Stopwatch />
      <Countdown />
      <DrawToggle open={drawOpen} onToggle={() => setDrawOpen(o => !o)} />

      {/* File switcher */}
      {switcherOpen && (
        <>
          <div className="switcher-backdrop" onClick={() => setSwitcherOpen(false)} />
          <FileSwitcher
            files={files}
            currentFileId={currentFileId}
            selectedIndex={selectedIndex}
            onSwitch={switchTo}
            onCreate={createFile}
            onRename={renameFile}
            onClose={closeFile}
            onSelectIndex={setSelectedIndex}
            onToggle={() => setSwitcherOpen(false)}
          />
        </>
      )}
    </div>
  );
}
