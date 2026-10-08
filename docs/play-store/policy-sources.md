# Official launch references

Checked **8 October 2026 (Europe/Berlin)**. These are the sources for the launch
checklist. Recheck them and the actual Console prompts before submission.

| Topic | Official source | Relevant launch point |
| --- | --- | --- |
| Target SDK | [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en) | This phone-app submission/update requires API 36 from 31 August 2026. |
| New personal-account testing | [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) | Accounts created after 13 November 2023 need 12 continuously opted-in testers for 14 days and a production-access application. |
| UGC | [User-generated content](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en) | Accepted terms, content/user reporting, blocking as applicable, and ongoing moderation. |
| Data safety | [Data safety form](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) | Include SDKs and non-exempt transfers; prove any E2EE/sharing exception. |
| User data/privacy | [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en) | Privacy, consent, recipients and actual secure handling must agree with behavior. |
| Account deletion | [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en) | In-app and external deletion paths; associated data and transparent retention. |
| Review access | [Sign-in details for review](https://support.google.com/googleplay/android-developer/answer/15748846?hl=en) | Reusable fresh-device access to restricted features. |
| Console setup/listing copy | [Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en) | Title 30, short description 80, full description 4000 characters maximum. |
| Listing artwork | [Preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) | Icon, feature graphic and screenshot format/size rules. |
| Generated guidance | [AI-generated content policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en) | Prevent prohibited output and provide in-app reporting/flagging. |
| Listing visual declarations | [AI asset declaration](https://support.google.com/googleplay/android-developer/answer/17262077?hl=en) | Review each submitted image/video's AI declaration in the creation flow. |
| Child safety | [Child Safety Standards guidance](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en) | Evaluate applicability to group/social features and actual Console declaration. |
| Payments | [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en) | Confirm donation-link exemption/eligibility rather than assuming it. |
| Former analytics SDK | [Vercel Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy) | Defaults include URL/referrer, geography and request-derived session identification; custom-event allowlists alone do not sanitize page views. |
| Former performance SDK | [Vercel Speed Insights privacy](https://vercel.com/docs/speed-insights/privacy-policy) | Performance data includes URL/device/country fields; verify deployment before declaring absence. |

The product SDKs are disabled for this release. These provider references explain
why their previous defaults required review; disabling them does not determine
the hosting platform's independent request-log configuration.

Read code evidence in this checkout alongside these policies. A statement in a
historical repository document is not evidence that the behavior is deployed or
that a Console declaration has been completed.
