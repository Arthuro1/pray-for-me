// An update/testimony's text, rendered read-only as markdown-lite via RichText.
// Kept as a thin wrapper so timeline call sites share one text component.
import RichText from './RichText';

export default function RemovableText({ text, className = '', style }) {
  return <RichText text={text} className={className} style={style} />;
}
