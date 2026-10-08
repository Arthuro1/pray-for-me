import { useState } from 'react';
import { Flag } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { aiOutputReportText } from '../lib/aiOutputReport';

// Report only what the reader explicitly types. Never auto-attach a prayer,
// generated response, record id, URL, prompt or conversation to feedback.
export default function AiOutputReport({ lang = 'en' }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="q-meta inline-flex min-h-11 items-center gap-1.5 underline underline-offset-4" onClick={() => setOpen(true)}>
      <Flag size={12} aria-hidden="true" />{aiOutputReportText(lang).title}
    </button>
    {open && <FeedbackModal aiReport onClose={() => setOpen(false)} />}
  </>;
}
