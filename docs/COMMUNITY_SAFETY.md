# Community safety model

Praystead offers prayer support, not emergency, medical, legal, mental-health, or
safeguarding services. It does not automatically judge prayer content or make
spiritual/theological moderation decisions.

## Enforced controls

- Sharing names the selected audience and previews attribution. A local-only
  detector warns on phone numbers/email addresses and requires acknowledgement
  before adding a new group. Users should remove unnecessary diagnoses,
  addresses, school names, child identities, abuse details, and contact data.
- Members can report a prayer from its menu. `submit_community_report` validates
  group membership, rate-limits reports, and stores only content/group IDs and a
  fixed category—never a duplicate of prayer text.
- Members can block an author. `set_user_block` owns the block relationship;
  restrictive RLS hides that author's future prayers, updates, and testimonies
  from the blocker. Blocking is personal and does not remove group membership.
- Database triggers limit prayer/testimony, update, and reaction inserts even if
  a modified client bypasses UI throttles. Private counters are inaccessible to
  users.
- Group admins can view open report metadata and already have author/admin
  deletion workflows. Admins may remove a member only through the atomic
  removal/key-rotation RPC.

## Moderator workflow

1. Acknowledge the report without copying content into email/chat/tickets.
2. Open the referenced content through an authorized group-admin account.
3. For spam/harassment/privacy: preserve minimal metadata, remove content when
   warranted, warn or remove the member, and record category/outcome only.
4. Escalate credible threats, exploitation, abuse disclosures, or child-safety
   concerns to the designated safeguarding lead. Follow local mandatory
   reporting law; do not investigate or contact an alleged perpetrator in-app.
5. For imminent self-harm/violence or medical emergency, encourage contact with
   local emergency services and a trusted nearby person. Do not promise live
   monitoring, diagnosis, confidentiality beyond policy, or a guaranteed rescue.
6. Mark the report resolved/dismissed/escalated and apply retention policy.

Only trained, least-privilege staff should receive cross-group escalation access.
Group admins are not given service-role credentials. Appeals and takedown/data
subject requests go through the security/privacy contact in `SECURITY.md`.

## Child safety

Do not solicit children's full names, schools, addresses, photos, phone numbers,
or detailed abuse narratives. Prefer a non-identifying summary. A disclosure
that a child may be in danger is handled by a trained safeguarding lead and
appropriate authorities, not by crowdsourcing advice or generating AI counsel.

## Known limits

Contact detection is intentionally narrow, local, and bypassable; it is a speed
bump, not content surveillance. Encryption does not stop intended group members
from copying content. Reports are not continuously staffed, and the application
must never present itself as an emergency channel.
