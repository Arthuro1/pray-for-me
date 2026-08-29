# Praystead UX and information architecture

## Product model

Praystead is organized around three user jobs:

1. **Pray** — Today answers “What should I pray about today?”
2. **Remember** — Journal answers “Who and what do I need to remember?”
3. **Pray together** — Together answers “Who are we praying for together?”

The permanent navigation is **Today · Journal · Together · More**. Calendar,
Guidance, and Settings are secondary destinations reached through More or from
the context that makes them useful.

## Current route audit

| Current route or surface | Current responsibility | Main issue | New home |
| --- | --- | --- | --- |
| `/` | Due prayers, prayer session, catch-up, verse, activation and install prompts | Core hierarchy is strong; contextual prompts need one shared budget | Today |
| `/prayers` | Active/answered requests, search, filters, People, follow-ups | Mostly aligned; label administration is missing from its natural context | Journal |
| `/community` | Groups, invitations, friends, carried requests | “Community” is vague and three header actions compete | Together |
| `/community/group/:id` | Group requests, testimonies, journeys, members/admin | Prayer and administration still compete in a few visible actions | Together → group |
| `/plan` | Calendar, agenda, journeys, invitations, labels, calendar export | Five different jobs share one page | Calendar only; legacy route redirects |
| `/grow` | Short prayer guides, articles, exploring-faith journey | Artificially separate from multi-day prayer content | Guidance; legacy route redirects |
| `/settings` | Account, notifications, appearance, privacy, data, support | Large but appropriately secondary | Settings & help |
| prayer detail | Prayer, schedule, follow-up, sharing, updates, AI, journey day | Stronger than before, but “Ways to pray” and AI hierarchy need clearer copy | Journal or Together detail |

## Capability map

| Capability | Destination | Exposure |
| --- | --- | --- |
| Add prayer, Pray now, due requests, carried group requests | Today | Primary |
| Catch-up, reminder summary, verse | Today | Contextual/quiet |
| Active, Answered, search | Journal | Primary |
| Filters, People, follow-ups | Journal | Progressive |
| Labels | Journal → Filters → Manage labels | Progressive |
| Groups, requests, testimonies | Together | Primary |
| Friend/person requests, group invitations, journey invitations | Together → Needs your attention | Contextual |
| People/contact relationships | Together | Secondary |
| Members, invite, manage group, leave group | Group overflow | Admin |
| Month/day schedule and occurrence management | Calendar | Primary within secondary destination |
| Calendar export | Calendar overflow | Overflow |
| Short guides, multi-day journeys, learning | Guidance | Primary within secondary destination |
| Exploring faith | Guidance recommendation | Lifecycle-contextual |
| Account, notifications, appearance, privacy, help | Settings & help | Expandable sections |
| Encryption, recovery, translation, offline state, accessibility | Existing contextual surfaces | Preserved |

## Progressive capability rules

- One contextual education card may be visible at a time.
- People appears after multiple named people make it useful.
- Search and filters appear after the journal has enough content to retrieve.
- Group list tools appear only when the request wall is long enough.
- Journey catalogues lead with one recommended or active item; the remainder is
  behind Browse.
- Journeys of eight or more days preview movements first and disclose individual
  days on request.
- Unreviewed journeys do not appear in the normal catalogue.
- Administrative actions live in overflow menus, but remain reachable by
  keyboard and assistive technology.

## Compatibility constraints

- Preserve `/plan`, `/grow`, `/community`, and `/answered` as redirects or aliases
  so existing deep links keep working.
- Keep the existing recurring-prayer model for a running journey; do not create a
  second scheduling engine.
- Keep encryption gates, recovery prompts, offline sync indicators, community
  safety controls, translation controls, and existing notification behavior.
- Use existing design tokens, components, and mobile/desktop shells.

