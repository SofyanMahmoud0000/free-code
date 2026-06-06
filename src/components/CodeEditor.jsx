import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './CodeEditor.css';

const LANGUAGES = [
  ['plaintext','Plain Text'],['cpp','C++'],['c','C'],['javascript','JavaScript'],
  ['typescript','TypeScript'],['python','Python'],['java','Java'],['csharp','C#'],
  ['go','Go'],['rust','Rust'],['html','HTML'],['css','CSS'],
  ['json','JSON'],['markdown','Markdown'],['sql','SQL'],['php','PHP'],
];

const THEMES = [
  ['one-dark-black','VS Dark Black'],
  ['vs-dark','VS Code Dark'],
  ['vs','VS Code Light'],
];

export default function CodeEditor({ file, theme, onContentChange, onLanguageChange, onThemeChange }) {
  const monacoRef = useRef(null);

  const handleMount = (editor, monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme('one-dark-black', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: { 'editor.background': '#000000' },
    });
    monaco.editor.setTheme(theme);
  };

  // Sync theme changes
  useEffect(() => {
    monacoRef.current?.editor.setTheme(theme);
  }, [theme]);

  if (!file) return null;

  return (
    <div className="code-editor-container">
      <MonacoEditor
        height="100%"
        language={file.language}
        value={file.content}
        theme={theme}
        onChange={onContentChange}
        onMount={handleMount}
        options={{
          fontSize: 16,
          tabSize: 2,
          insertSpaces: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          formatOnType: true,
          formatOnPaste: true,
          renderLineHighlight: 'none',
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          wordBasedSuggestions: false,
          parameterHints: { enabled: false },
          minimap: { enabled: false },
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        }}
      />
      <div className="editor-selectors">
        <select
          className="selector"
          value={file.language}
          onChange={e => onLanguageChange(e.target.value)}
        >
          {LANGUAGES.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          className="selector"
          value={theme}
          onChange={e => onThemeChange(e.target.value)}
        >
          {THEMES.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
