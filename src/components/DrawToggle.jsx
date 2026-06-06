import './DrawToggle.css';

export default function DrawToggle({ open, onToggle }) {
  return (
    <div className={`draw-toggle${open ? ' active' : ''}`} onClick={onToggle}>
      <span className="draw-toggle-label">Draw</span>
    </div>
  );
}
