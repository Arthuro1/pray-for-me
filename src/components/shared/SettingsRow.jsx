import Switch from './Switch';

// One setting: an optional icon tile of its own hue (`tone`), its words, an
// optional switch, and whatever it opens underneath (`children`), which lines
// up under the words.
export default function SettingsRow({ icon: Icon, tone, label, sub, enabled, onToggle, children }) {
  return (
    <div className={`settings-row ${Icon ? 'settings-row--icon' : ''}`}>
      <div className="settings-row__main">
        {Icon && <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.85} /></span>}
        <div className="settings-row__text">
          <p className="settings-row__label">{label}</p>
          {sub && <p className="settings-row__sub">{sub}</p>}
        </div>
        {onToggle && <Switch checked={!!enabled} onChange={onToggle} label={label} />}
      </div>
      {children}
    </div>
  );
}
