import { test, expect } from '@playwright/test';
import { installCanvasRecorder } from '../../tools/inspect/canvas.mjs';
import { detectOverlap } from '../../tools/inspect/overlap.mjs';
import { openDeck, frame } from '../../tools/inspect/browser.mjs';
import { stagePNG, pixelHash, inspectStops } from '../../tools/inspect/stops.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const check = async args => {
  try {
    const result=await exec(process.execPath,['tools/check.mjs','inspection-fixture',...args],{
      env:{...process.env,FUZZY6_URL:'http://127.0.0.1:8082'},timeout:20000,maxBuffer:64*1024,killSignal:'SIGTERM',
    });
    return {code:0,...result};
  } catch(e) { if(typeof e.code==='number') return e; throw e; }
};

test('check distinguishes errors from warnings and inspects each subtitle page',async()=>{
  const bad=await check(['bad']);
  expect(bad.code).toBe(1);expect(bad.stdout).toContain('FIX adjacent の。');
  expect(bad.stdout).toContain('NG bad/long#1');
  const warnings=await check(['warnings']);
  expect(warnings.code).toBe(0);expect(warnings.stdout).toContain('[missing]');
  expect(warnings.stdout).toContain('ok warnings/pages#2');
  expect(warnings.stdout).toContain('ok warnings/right#2');
  expect(warnings.stdout).toContain('ok warnings/wrong#1');
  for(const type of ['year','counter','hyphen-number','hash-number','letters-number']) expect(warnings.stdout).toContain(type);
});

test('overlap findings exit zero unless strict is requested',async()=>{
  const result=await check(['warnings','--overlap','--at','0','1']);
  expect(result.code).toBe(0);expect(result.stdout).toContain('text-text');
  const strict=await check(['warnings','--overlap','--at','0','--strict']);
  expect(strict.code).toBe(1);expect(strict.stdout).toContain('text-text');
});

test('canvas recording captures one frame, transforms, alpha and rectangular clipping', async ({ page }) => {
  await page.addInitScript(installCanvasRecorder);
  await page.goto('/');
  const result=await page.evaluate(()=>{
    document.body.innerHTML='<div class="mx-layer" data-clip="fixture"><canvas width="800" height="450"></canvas></div>';
    window.__mx={state:()=>({clip:'fixture'})};
    const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
    window.__setTime=()=>{
      ctx.setTransform(.5,0,0,.5,0,0);
      ctx.save();ctx.translate(100,50);
      ctx.beginPath();ctx.rect(0,0,40,40);ctx.clip();
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.globalAlpha=.8;ctx.fillRect(-10,-10,80,80);
      ctx.restore();
      ctx.fillStyle='black';ctx.font='20px sans-serif';ctx.fillText('label',200,100);
      ctx.strokeText('label',200,100);
      const other=document.createElement('canvas').getContext('2d');other.fillText('offscreen',0,0);
    };
    const first=window.__captureBoxes(0), second=window.__captureBoxes(0);
    return {first,second};
  });
  expect(result.first.boxes).toHaveLength(3);
  expect(result.first.boxes[0]).toMatchObject({kind:'rect',x:100,y:50,w:40,h:40,alpha:.4,edge:{x:90,y:40,w:80,h:80}});
  expect(result.first.boxes[1].x).toBeGreaterThanOrEqual(199);
  expect(result.first.boxes[1].y).toBeGreaterThan(75);
  expect(result.second).toEqual(result.first);
  expect(detectOverlap(result.first.boxes).total).toBe(0);
});

test('canvas recording stops accumulating at its cap',async({page})=>{
  await page.addInitScript(installCanvasRecorder);await page.goto('/');
  const result=await page.evaluate(()=>{
    document.body.innerHTML='<div class="mx-layer" data-clip="fixture"><canvas width="1600" height="900"></canvas></div>';
    window.__mx={state:()=>({clip:'fixture'})};
    const ctx=document.querySelector('canvas').getContext('2d');
    window.__setTime=()=>{for(let i=0;i<2005;i++)ctx.fillRect(i,0,1,1);};
    return window.__captureBoxes(0);
  });
  expect(result.truncated).toBe(true);expect(result.boxes.length).toBe(2000);
});

test('stage hashes exclude chrome, detect changed/missing stops, and use native pixels',async({page},testInfo)=>{
  test.setTimeout(30000);
  await page.setViewportSize({width:1600,height:900});
  await openDeck(page,'llm',{baseURL:testInfo.project.use.baseURL});
  await frame(page,'session',78.742);
  const first=pixelHash(await stagePNG(page));
  await page.evaluate(()=>{
    document.querySelector('.mx-subs').textContent='changed subtitles';
    document.querySelector('.mx-rail').style.background='red';
  });
  expect(pixelHash(await stagePNG(page))).toBe(first);
  const clips=[{id:'session',stops:[{at:78.742,kind:'still',line:'l'}]}];
  let callbacks=0;
  const result=await inspectStops(page,clips,{clips:{session:{'deleted-stop':'f'.repeat(64)}}},{onDifference:()=>callbacks++});
  expect(callbacks).toBe(2);
  expect(result.differences[0]).toContain('expected missing');
  expect(result.differences[1]).toContain('actual missing');
  const wrong={clips:{session:{'001@78.742:still:l':'f'.repeat(64)}}};
  const changed=await inspectStops(page,clips,wrong);
  expect(changed.differences[0]).toContain(`expected ffffffffffff, actual ${first.slice(0,12)}`);
});
