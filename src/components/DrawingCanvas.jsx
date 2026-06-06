import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

export default function DrawingCanvas({ fileId }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Tldraw persistenceKey={`free-code-drawing-${fileId}`} />
    </div>
  );
}
