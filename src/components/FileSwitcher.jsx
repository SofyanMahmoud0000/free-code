import { useEffect, useRef } from 'react';
import './FileSwitcher.css';

export default function FileSwitcher({ files, currentFileId, selectedIndex, onSwitch, onCreate, onRename, onClose, onSelectIndex, onToggle }) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.focus();
  }, []);

  const fileIds = Object.keys(files);

  const handleRename = (fileId) => {
    const newName = prompt('Enter new name:', files[fileId].name);
    if (newName) onRename(fileId, newName);
  };

  const handleCreate = () => {
    const fileId = onCreate();
    setTimeout(() => {
      const newName = prompt('Enter file name:', files[fileId]?.name || 'untitled.cpp');
      if (newName) onRename(fileId, newName);
    }, 50);
  };

  return (
    <div className="file-switcher visible">
      <div className="file-switcher-header">
        <span className="file-switcher-title">Files</span>
        <span className="file-switcher-shortcuts">Ctrl+P: Toggle | ↑↓: Navigate | Enter: Select | N: New | R: Rename | D: Delete</span>
      </div>
      <div className="file-switcher-list" ref={listRef} tabIndex={0}>
        {fileIds.map((fileId, index) => (
          <div
            key={fileId}
            className={[
              'file-switcher-item',
              fileId === currentFileId ? 'active' : '',
              index === selectedIndex ? 'selected' : '',
            ].join(' ').trim()}
          >
            <span
              className="file-switcher-name"
              onClick={() => { onSelectIndex(index); onSwitch(fileId); }}
              onDoubleClick={() => handleRename(fileId)}
            >
              {files[fileId].name}
            </span>
            <span
              className="file-switcher-close"
              onClick={() => onClose(fileId)}
            >×</span>
          </div>
        ))}
      </div>
      <div className="file-switcher-new" onClick={handleCreate}>+ New File</div>
    </div>
  );
}
