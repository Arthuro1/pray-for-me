import {createRequire} from 'node:module';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire('C:/Users/T480s/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium} = require('playwright');
const work = dirname(fileURLToPath(import.meta.url));
const root = resolve(work, '../..');
const out = join(work, 'render');
await mkdir(out, {recursive:true});
const bytes = await readFile(join(root, 'docs/play-store/qetoret-google-play-descriptions-16-languages.docx'));
const browser = await chromium.launch({headless:true,channel:'msedge'});
try {
  const page = await browser.newPage({viewport:{width:1050,height:1280},deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><title>Qetoret document preview</title></head><body></body></html>');
  await page.addScriptTag({path:require.resolve('jszip/dist/jszip.min.js')});
  await page.addScriptTag({path:join(work,'docx-preview.min.js')});
  await page.evaluate(async data => {
    await window.docx.renderAsync(new Uint8Array(data),document.body,null,{
      breakPages:true,ignoreLastRenderedPageBreak:false,ignoreWidth:false,ignoreHeight:false,
      renderHeaders:true,renderFooters:true,experimental:true,inWrapper:true
    });
    await document.fonts.ready;
  }, Array.from(bytes));
  const pages=page.locator('section.docx');
  const count=await pages.count();
  if(count!==17) throw new Error('Expected 17 pages, got '+count);
  const stats=[];
  for(let i=0;i<count;i++) {
    const node=pages.nth(i);
    stats.push(await node.evaluate((el,index)=>({
      page:index+1,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
      scrollHeight:el.scrollHeight,heading:el.querySelector('p')?.innerText,
      rtlParagraphs:el.querySelectorAll('[dir="rtl"]').length,
      missingReplacement:el.innerText.includes('\uFFFD')
    }),i));
    await node.screenshot({path:join(out,`page-${i+1}.png`)});
  }
  if(errors.length) throw new Error(errors.join('\n'));
  await writeFile(join(out,'preview-checks.json'),JSON.stringify({renderer:'docx-preview 0.3.6 and Chromium',nativeRendererUnavailable:'LibreOffice is not bundled on this Windows host',pages:stats},null,2));
  console.log(JSON.stringify({pageCount:count,pages:stats}));
}finally{await browser.close();}
