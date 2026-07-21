// An update/testimony's text with an author-only remove control, mirroring
// AttachmentList's contract: pass onRemove to get the control (behind a
// confirmation), omit it for read-only rendering. The store cascades a removal
// that leaves the entry empty into deleting the whole row, so no author+date
// shell lingers in the timeline.
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import RichText from './RichText';
import ConfirmDialog from '../shared/ConfirmDialog';
import { t } from '../../i18n';

export default function RemovableText({ text, lang, className = '', style, onRemove = null }) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  if (!text) return null;
  if (!onRemove) return <RichText text={text} className={className} style={style} />;

  const confirmRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      <RichText text={text} className={`flex-1 min-w-0 ${className}`} style={style} />
      
      
    </div>
    
  );
}
