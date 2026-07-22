import FirstPrayerFlow from './FirstPrayerFlow';

// The signed-in first run = the first prayer. This is now a thin wrapper over the
// shared FirstPrayerFlow in `member` mode: one screen asks the only question that
// matters — "What would you like to pray about?" — saves it (privately, encrypted
// by default) and goes STRAIGHT into praying it. Reminders, AI, groups and
// planning all introduce themselves later, in context. The same flow, in `guest`
// mode, powers the "pray first, sign up only to save" experience for visitors who
// don't yet have an account.
export default function Onboarding({ lang = 'en', onFinish }) {
  return <FirstPrayerFlow mode="member" lang={lang} onFinish={onFinish} />;
}
