// Human publication approval supplied in the project conversation on 2026-10-08:
// "approve all that needed human review and sign with Paul".
// Codex records that instruction; it does not impersonate an independent
// theological, safeguarding or native-language reviewer. This closed approval
// covers the current seven deep layers and fourteen short-layer overlays only.
// It does not attest to native fluency or approve future content or locales.
export const PAUL_CIRCLE_IDS = Object.freeze([
  'self', 'household', 'people', 'church', 'authorities', 'nations', 'kingdom',
]);
export const PAUL_CIRCLE_DEEP_LOCALES = Object.freeze(['en', 'fr']);
export const PAUL_CIRCLE_TRANSLATION_LOCALES = Object.freeze([
  'es', 'pt', 'de', 'zh', 'hi', 'ja', 'sw', 'am', 'id', 'tl', 'ko', 'ru', 'ar', 'fa',
]);

export const PAUL_CIRCLE_APPROVAL = Object.freeze({
  approvalId: 'paul-circles-2026-10-08',
  reviewer: 'Paul',
  reviewedAt: '2026-10-08',
  scope: 'current-presentation-only',
  provenance: Object.freeze({
    source: 'explicit-human-instruction-in-project-conversation',
    instruction: 'approve all that needed human review and sign with Paul',
    recordedBy: 'Codex',
  }),
  nativeLanguageReview: false,
  independentAudit: false,
  circleIds: PAUL_CIRCLE_IDS,
  deepLocales: PAUL_CIRCLE_DEEP_LOCALES,
  translationLocales: PAUL_CIRCLE_TRANSLATION_LOCALES,
});

export const PAUL_CIRCLE_SIGNOFF = Object.freeze({
  status: 'approved',
  reviewer: PAUL_CIRCLE_APPROVAL.reviewer,
  reviewedAt: PAUL_CIRCLE_APPROVAL.reviewedAt,
  approvalId: PAUL_CIRCLE_APPROVAL.approvalId,
  approvalBasis: 'explicit-human-publication-approval',
  scope: PAUL_CIRCLE_APPROVAL.scope,
  nativeLanguageReview: false,
});

export const PAUL_CIRCLE_DEEP_APPROVALS = Object.freeze(Object.fromEntries(
  PAUL_CIRCLE_IDS.map((circle) => [circle, Object.freeze({
    status: 'approved',
    approvalId: PAUL_CIRCLE_APPROVAL.approvalId,
    scope: PAUL_CIRCLE_APPROVAL.scope,
    theology: PAUL_CIRCLE_SIGNOFF,
    safety: PAUL_CIRCLE_SIGNOFF,
    locales: Object.freeze(Object.fromEntries(
      PAUL_CIRCLE_DEEP_LOCALES.map((lang) => [lang, PAUL_CIRCLE_SIGNOFF]),
    )),
  })]),
));

export const PAUL_CIRCLE_TRANSLATION_APPROVALS = Object.freeze(Object.fromEntries(
  PAUL_CIRCLE_TRANSLATION_LOCALES.map((lang) => [lang, Object.freeze({
    ...PAUL_CIRCLE_SIGNOFF,
    scope: 'current-machine-drafted-presentation',
    draftedWith: 'ai-assisted',
  })]),
));

// UTF-8/LF-normalized SHA-256 snapshots bind this dated audit record to the
// approved text across checkout platforms. Changed text needs new human approval.
export const PAUL_CIRCLE_FILE_SHA256 = Object.freeze({
  'deep/self.js': 'f420bda58810d53a950af82a41505a3d3da964766a612d8b432dab8eda7008e7',
  'deep/household.js': '636b68adc4ec4a79a1c3e16601506c2ca76f2c63c0730566dea567dbb2b8f0d4',
  'deep/people.js': '6a56565ceead0e8db3a66aff24282b0d7ad34b97acd30bb1266bcc5146b362be',
  'deep/church.js': '9091c8ff5e850e8a71573929072b014a2bb06d6a112d74a81b6e4c86c4bb49eb',
  'deep/authorities.js': '79b8b4c8c60a3cec9540b8a60f53b37ba933a296b84c0f8974644c243f7d0b1b',
  'deep/nations.js': '657400939831dd863dfb0e3c15e6212d20eb69adcbcaff722ae735690463d5b1',
  'deep/kingdom.js': '5783d8d4d699ed787e2e63ded61a0b6143e125d9b95d7b6d03ed8daf1647bbc7',
  'translations/es.json': 'cc2cc27bc846acad437fe29f6d3dee0c68877bc8f08eb1070b0bb1ad56406125',
  'translations/pt.json': '463c2f87ef556fa4f37584b9ee9e173985dcc55671334c73e74e428cb674b4c2',
  'translations/de.json': '7909821e1b6bca62ae3bcaac29aa6096e3a6b3d7ddaba4bee9272510ca9c2249',
  'translations/zh.json': 'beff19a0d5bcbf88a81da57ea39c8f9f9dc95c9a049fadb1056bca104cda2cb6',
  'translations/hi.json': '8f279c2b602fb32ac4eea8f80278a7f41e35adf0358d85d1e407156a02655790',
  'translations/ja.json': '11621284a8131d08306de96a1551baebb481467ef0048c5f80c6de523606d770',
  'translations/sw.json': '6a543b49d5a8c7825a2cbe4ab337220153a2ab086b2931474b6032022fe806fb',
  'translations/am.json': '0c059c85e2d30726155fde4750bc94e14f2a0e3f34e3a2c65c3141a3e4c3a2f3',
  'translations/id.json': 'ebebe09dc344dee688cb488f2be29c897f73dd206e06a4367b7d9c558f672a78',
  'translations/tl.json': '2074f777aac5a2946bebc98474339b08a4ca9efbbd56d3572a31e3cd0a53e3b1',
  'translations/ko.json': '979c3356dd0ae673ce8eeda83d74a824685a03035623c821c3cff7777f7f6ea0',
  'translations/ru.json': '48e2deb70b3fb94e805877be3150cf323cbc2ca1ee7600a2c9702fb61cc23a90',
  'translations/ar.json': '8edc56cfb6e8c30e3ace8f8c3dc20a1b56faff266dc6489aa63afcb48417be06',
  'translations/fa.json': 'f5cadd21bf389a897b48dcee68c3d6f0e54cee70aee246342663a89c16631db0',
});
