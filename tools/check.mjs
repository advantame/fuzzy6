// npm run check -- <deck> [clipId …] [--deck]
// npm run check -- <deck> <clipId> --overlap [--stops | --at t …] [--strict]
// Dev server required; FUZZY6_URL defaults to http://127.0.0.1:5175.
// Normal mode: duration, sentences/stills, every subtitle page at the cast-aware
// width (§3.4), endings, stored kana and pre-synthesis reading warnings.
// Conditional subtitle lines are checked with a representative matching answer.
// --deck also totals main-line chapters (dives are reported separately).
// --overlap is a separate diagnostic: all stops by default, or 1–60 explicit times.
// Exit 1: subtitle mismatch/adjacent の。; overlap findings only with --strict.
// Exit 2: invalid input, incomplete capture, resource limit or operational failure.
// Bounds: 540s external supervisor, 15s/browser step, 2000 boxes/frame,
// 200 findings/frame and 4000 output lines / 1 MiB per run. Narrow selection if capped.
// False-positive filters: identical text at identical coordinates; opacity < .5;
// fully covered earlier paint; containing rectangles (backgrounds/panels);
// stage backgrounds; small enclosing labels/rings whose text stays inside.
// Small ports/tabs (<=64x32, <=5% of panel area) centred exactly on a panel edge
// and their own lettering are deliberate attachments; off-centre partial
// intersections still count. The same filled/stroked border is reported once.
// Crossing a label border still counts. Rectangular clipping is applied; complex
// clips are reported as approximate. Round rectangles/rotated text use AABBs;
// paths, images, DOM text, shadows and partial paint occlusion are not inferred.
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { supervised, step, output, safeId } from './inspect/runtime.mjs';
import { withBrowser, openDeck, selectClips, frame } from './inspect/browser.mjs';
import { findEndings, formatEnding } from './narrate/endings.mjs';
import { takeStatus } from './narrate/core.mjs';
import { readingWarnings } from './inspect/readings.mjs';
import { installCanvasRecorder } from './inspect/canvas.mjs';
import { detectOverlap } from './inspect/overlap.mjs';
const root = resolve(import.meta.dirname, '..');
await supervised(import.meta.url, async args => {
  const flags = new Set(), positional = [], times = [];
  for (let i=0;i<args.length;i++) {
    const a=args[i];
    if (a === '--at') {
      while(i+1<args.length && !args[i+1].startsWith('--')) times.push(Number(args[++i]));
      if(!times.length) throw new Error('--at needs times');
      flags.add(a);
    } else if (['--deck','--overlap','--stops','--strict'].includes(a)) flags.add(a);
    else if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
    else positional.push(a);
  }
  const [deck,...ids]=positional, overlap=flags.has('--overlap');
  if(!safeId(deck) || times.length>60 || times.some(t=>!Number.isFinite(t)||t<0||t>180)) throw new Error('Usage: check <deck> [clipId …] [--overlap --at t …]');
  if(flags.has('--at')&&flags.has('--stops') || !overlap&&['--at','--stops','--strict'].some(f=>flags.has(f))) throw new Error('Invalid option combination');
  const log=output(); let bad=0, findings=0;
  await withBrowser(async browser => {
    const page=await step(browser.newPage({deviceScaleFactor:1}));
    if(overlap) await step(page.addInitScript(installCanvasRecorder));
    const all=await openDeck(page,deck,{clean:overlap}), clips=selectClips(all,ids);
    for(const clip of clips) {
      await frame(page,clip.id,clip.stops[0].at);
      if(overlap) {
        for(const t of times.length?times:clip.stops.map(s=>s.at)) {
          if(t>clip.duration) throw new Error(`${clip.id}: --at exceeds duration`);
          const capture=await step(page.evaluate(t=>window.__captureBoxes(t),t));
          if(capture.truncated) throw new Error(`${clip.id}@${t}: box limit reached`);
          if(capture.unknownClips) log(`WARN ${clip.id}@${t}: ${capture.unknownClips} complex clips approximated`);
          const result=detectOverlap(capture.boxes); findings+=result.total;
          const show=b=>`${b.kind==='text'?JSON.stringify(b.text):`${b.paint} rect ${b.w.toFixed(1)}x${b.h.toFixed(1)}`} [${[b.x,b.y,b.w,b.h].map(v=>v.toFixed(1)).join(',')}]`;
          for(const f of result.found) log(`${clip.id}@${t.toFixed(3)} ${f.kind}: ${show(f.a)}${f.b?' / '+show(f.b):''}`);
          log(`${clip.id}@${t.toFixed(3)}: ${capture.boxes.length} boxes, ${result.total} findings${result.truncated?' (first 200 shown)':''}`);
        }
        continue;
      }
      const data=await step(page.evaluate(async ({deck,id})=>{
        const {default:d}=await import(`/decks/${deck}/deck.js`);
        const {normalizeDeck}=await import('/src/explorer/model.js');
        const {buildTimeline}=await import('/src/explorer/timeline.js');
        const {readCast}=await import('/src/explorer/cast.js');
        const {parseLine}=await import('/src/explorer/script.js');
        const c=normalizeDeck(d).ids.get(id).clip, tl=buildTimeline(c,window.__mx.pace(),d.voice);
        const script=c.script??[];
        if(script.length>300 || script.some(l=>(l.text?.length??0)>2000)) throw new Error('Script exceeds inspection limit');
        const voice={cast:readCast(d.voice),lexicon:d.voice?.lexicon??[]};
        const records={};
        for(const l of script) {
          const r=d.voice?.manifest?.clips?.[id]?.[l.id];
          if(r) records[l.id]={...r,takes:Object.fromEntries(Object.entries(r.takes??{}).map(([s,t])=>[s,{...t,mouth:t.mouth?.slice(0,1)}]))};
        }
        const lines=script.filter(l=>l.text!==undefined).map(l=>{
          const parsed=parseLine(l.text), by=l.by??Object.keys(voice.cast)[0], actor=voice.cast[by];
          return {clipId:id,lineId:l.id,by,speaker:actor?.speaker,style:actor?.style,source:parsed.speech,anchors:parsed.anchors,pages:parsed.pages,speed:String(window.__mx.pace().voice.speed[l.speed??'normal']),text:l.text};
        });
        const samples=tl.lines.filter(l=>l.spoken).map(line=>({line,answers:''}));
        for(const source of script.filter(l=>l.text!==undefined&&!tl.lines.some(row=>row.id===l.id))) {
          const condition=Array.isArray(source.when)?source.when[0]:source.when;
          const [question,result]=condition.split('.');
          const ask=script.find(l=>l.id===question).ask;
          const choice=result==='right'?ask.answer:(ask.answer+1)%ask.choices.length;
          const answers=result==='skip'?{}:{[question]:choice};
          const line=buildTimeline(c,window.__mx.pace(),d.voice,answers).lines.find(l=>l.id===source.id);
          if(!line) throw new Error(`Cannot inspect conditional line: ${source.id}`);
          samples.push({line,answers:Object.entries(answers).map(([key,value])=>`${key}:${value}`).join(',')});
        }
        return {script,voice,manifest:{engine:d.voice?.manifest?.engine,clips:{[id]:records}},lines,
          pages:samples.flatMap(({line:l,answers})=>l.parsed.caption.split('\n\n').map((text,i)=>{
            const at=i?l.pages[i-1]:l.voice, end=l.pages[i]??l.end;
            return {id:`${l.id}#${i+1}`,t:at+Math.max(0,Math.min(.01,(end-at)/2)),written:text.split('\n').length,answers};
          }))};
      },{deck,id:clip.id}));
      log(`${clip.id}: ${clip.duration.toFixed(3)} s, ${data.script.length} sentences, ${clip.stops.filter(s=>s.kind==='still').length} stills (${clip.stops.length} stops)`);
      for(const p of data.pages) {
        if(p.answers) {
          const url=new URL(page.url());
          url.searchParams.set('c',clip.id);url.searchParams.set('t',p.t);url.searchParams.set('a',p.answers);
          await page.goto(url.href);await page.waitForFunction(()=>window.__ready===true);
        } else await frame(page,clip.id,p.t);
        const rendered=await step(page.evaluate(()=>{
          // Exercise §3.4 figure width even when optional figure assets are absent.
          const mx=document.querySelector('.mx'); mx.setAttribute('data-cast','');
          const node=[...document.querySelectorAll('.mx-subs .mx-cue')].filter(n=>n.dataset.state!=='out').at(-1);
          if(!node) return null;
          return Math.round(node.getBoundingClientRect().height/parseFloat(getComputedStyle(node).lineHeight));
        }));
        const ok=rendered===p.written; if(!ok)bad++;
        log(`${ok?'ok':'NG'} ${clip.id}/${p.id}: subtitle written ${p.written}, rendered ${rendered}`);
      }
      const endings=findEndings(data.script,{deckId:deck,clipId:clip.id,defaultBy:Object.keys(data.voice.cast)[0]});
      bad+=endings.adjacent.length;
      for(const f of endings.adjacent) log(`FIX adjacent の。 ${formatEnding(f)}`);
      for(const f of endings.alternating) log(`WARN alternating の。 ${formatEnding(f)}`);
      for(const line of data.lines) {
        const record=data.manifest.clips[clip.id][line.lineId], take=record?.takes?.[line.speed];
        let exists=false;
        if(take?.file && !take.file.includes('..') && !take.file.startsWith('/')) {
          try { await access(resolve(root,'decks',deck,'voice',take.file));exists=true; } catch { /* missing file */ }
        }
        const status=line.speaker?takeStatus(data.manifest,line,data.voice,line.speed,exists):'missing';
        log(`reading ${clip.id}/${line.lineId} [${status}]: ${JSON.stringify(line.text)} => ${record?.reading??'(no recording)'}`);
        for(const warning of readingWarnings(line.text,data.voice.lexicon)) log(`WARN reading ${clip.id}/${line.lineId} ${warning.kind}: ${warning.text}`);
      }
    }
    if(flags.has('--deck')) {
      let total=0;
      for(const chapter of new Set(all.map(c=>c.chapter))) {
        const main=all.filter(c=>c.chapter===chapter&&!c.dive), seconds=main.reduce((n,c)=>n+c.duration,0);total+=seconds;
        log(`${chapter}: ${seconds.toFixed(1)} s (${(seconds/60).toFixed(1)} min); ${main.map(c=>`${c.id} ${c.duration.toFixed(1)}`).join(', ')}`);
      }
      log(`total (main): ${total.toFixed(1)} s (${(total/60).toFixed(1)} min), ${all.filter(c=>!c.dive).length} clips; dives: ${all.filter(c=>c.dive).reduce((n,c)=>n+c.duration,0).toFixed(1)} s`);
    }
  });
  log(overlap?`${findings} overlap findings${flags.has('--strict')?' (strict)':''}`:`${bad} errors`);
  process.exitCode=(overlap?flags.has('--strict')&&findings:bad)?1:0;
});
