import { describe, it, expect } from 'vitest';
import { deflateSync } from 'node:zlib';
import { decodePNG, crc32, comparePixels } from '../tools/inspect/png.mjs';
import { detectOverlap } from '../tools/inspect/overlap.mjs';
import { readingWarnings } from '../tools/inspect/readings.mjs';
import { stopKey } from '../tools/inspect/stops.mjs';
const text = (x,y,w=20,h=10, more={}) => ({kind:'text',text:'label',x,y,w,h,alpha:1,...more});
const rect = (x,y,w,h,more={}) => ({kind:'rect',paint:'fill',x,y,w,h,alpha:1,...more});
const kinds = boxes => detectOverlap(boxes).found.map(f=>f.kind);
describe('retained/canvas box diagnostics',()=>{
  it('detects text overlap with a 2 px threshold and ignores repeated color passes',()=>{
    expect(kinds([text(0,0),text(18,0,20,10,{text:'other'})])).toEqual(['text-text']);
    expect(kinds([text(0,0),text(18.1,0)])).toEqual([]);
    expect(kinds([text(0,0),text(0,0)])).toEqual([]);
    expect(kinds([text(0,0),text(0,0,20,10,{text:'other',alpha:.49})])).toEqual([]);
  });
  it('detects crossing and near borders, but not the containing label or background',()=>{
    expect(kinds([rect(10,10,100,80),text(8,30)])).toEqual(['text-edge']);
    expect(kinds([rect(10,10,100,80),text(11,30)])).toEqual(['text-edge']);
    expect(kinds([rect(10,10,100,80),text(13,30)])).toEqual([]);
    expect(kinds([rect(10,10,24,14),text(12,12)])).toEqual([]);
    expect(kinds([rect(0,0,1600,900),text(0,0)])).toEqual([]);
    expect(kinds([rect(10,10,24,14),text(9,12)])).toEqual(['text-edge']);
  });
  it('reports partial label intersection, not containment',()=>{
    expect(kinds([rect(10,10,100,80),rect(90,60,100,80)])).toEqual(['rect-rect']);
    expect(kinds([rect(10,10,100,80),rect(20,20,20,20)])).toEqual([]);
    expect(kinds([rect(100,100,400,200),rect(86,150,28,14)])).toEqual([]);
    expect(kinds([rect(100,100,400,200),rect(87,150,28,14)])).toEqual(['rect-rect']);
  });
  it('suppresses opaque overpaint but keeps translucent and rounded coverage',()=>{
    expect(kinds([text(0,0),rect(0,0,100,100)])).toEqual([]);
    expect(kinds([text(0,0),rect(0,0,100,100,{alpha:.8})])).toEqual(['text-edge']);
    expect(kinds([text(0,0),rect(0,0,100,100,{rounded:true})])).toEqual(['text-edge']);
  });
  it('retains original edges after clipping',()=>{
    expect(kinds([rect(50,0,50,80,{edge:{x:0,y:0,w:100,h:80}}),text(50,30)])).toEqual([]);
  });
  it('does not report lettering on an opaque border tab or repeat fill/stroke borders',()=>{
    const panel=rect(100,100,400,200), tab=rect(250,89,48,22), label=text(258,96,24,9);
    expect(kinds([panel,tab,label])).toEqual([]);
    expect(kinds([panel,{...panel,paint:'stroke'},text(99,140)])).toEqual(['text-edge']);
  });
  it('reports stage overflow and caps findings before appending',()=>{
    expect(kinds([text(-1,0),rect(1590,890,20,20)])).toEqual(['outside','outside']);
    const result=detectOverlap([text(-1,0),text(-1,0,30,30,{text:'b'})],{limit:1});
    expect(result.found).toHaveLength(1);expect(result.total).toBe(3);expect(result.truncated).toBe(true);
    expect(()=>detectOverlap(Array(2001).fill(text(0,0)))).toThrow('2000');
  });
});
describe('reading warnings',()=>{
  it('finds each requested pattern before synthesis',()=>{
    const warnings=readingWarnings('12 本、4-5、#128、Opus 4、2020 年');
    expect(new Set(warnings.map(w=>w.kind))).toEqual(new Set(['counter','hyphen-number','hash-number','letters-number','year']));
  });
  it('excludes ruby and lexicon words without gluing neighboring tokens',()=>{
    expect(readingWarnings('[12 本|じゅうにほん]、Opus 4、2020 年',[{word:'Opus 4'},{word:'2020年'}])).toEqual([]);
    expect(readingWarnings('{a}**12 本**')).toEqual([{kind:'counter',text:'12本'}]);
    expect(readingWarnings('Opus[4|フォー]')).toEqual([]);
  });
});
function chunk(type,body) {
  const bytes=Buffer.alloc(body.length+12);bytes.writeUInt32BE(body.length);bytes.write(type,4);body.copy(bytes,8);
  bytes.writeUInt32BE(crc32(bytes.subarray(4,8+body.length)),8+body.length);return bytes;
}
function png({w=2,h=2,bpp=3,filter=0,raw,depth=8,interlace=0}={}) {
  const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=depth;header[9]=bpp===3?2:6;header[12]=interlace;
  const pixels=Buffer.from(Array.from({length:w*h*bpp},(_,i)=>(i*43)%256));
  const stride=w*bpp, rows=Buffer.alloc(h*(stride+1));
  for(let y=0;y<h;y++) {
    rows[y*(stride+1)]=filter;
    for(let x=0;x<stride;x++) {
      const i=y*stride+x,a=x>=bpp?pixels[i-bpp]:0,b=y?pixels[i-stride]:0,c=y&&x>=bpp?pixels[i-stride-bpp]:0;
      const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
      const prediction=[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][filter]??0;
      rows[y*(stride+1)+1+x]=pixels[i]-prediction;
    }
  }
  return {bytes:Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw??rows)),chunk('IEND',Buffer.alloc(0))]),pixels};
}
describe('bounded PNG decoder and pixel difference',()=>{
  for(const bpp of [3,4]) for(const filter of [0,1,2,3,4]) it(`decodes filter ${filter}, ${bpp} channels`,()=>{
    const {bytes,pixels}=png({bpp,filter}), actual=decodePNG(bytes);
    const expected=Buffer.from(Array.from({length:16},(_,i)=>i%4===3&&bpp===3?255:pixels[Math.floor(i/4)*bpp+i%4]));
    expect(actual.pixels.equals(expected),'small PNG pixel equality').toBe(true);
  });
  it('rejects unsupported, corrupt, truncated and oversized inputs before expansion',()=>{
    expect(()=>decodePNG(png({depth:16}).bytes)).toThrow('8-bit');
    expect(()=>decodePNG(png({interlace:1}).bytes)).toThrow('8-bit');
    expect(()=>decodePNG(png({filter:5}).bytes)).toThrow('filter');
    const bad=png().bytes;bad[bad.length-1]^=1;expect(()=>decodePNG(bad)).toThrow('CRC');
    expect(()=>decodePNG(png().bytes.subarray(0,30))).toThrow('Truncated');
    expect(()=>decodePNG(png({w:8193,h:1}).bytes)).toThrow('limit');
    expect(()=>decodePNG(png({raw:Buffer.alloc(1024)}).bytes)).toThrow();
  });
  it('reports a small mismatch by count/box and treats missing-sized pixels as different',()=>{
    const a=decodePNG(png().bytes),b={...a,pixels:Buffer.from(a.pixels)};
    expect(comparePixels(a,b)).toEqual({count:0,box:null});
    b.pixels[4]^=1;
    expect(comparePixels(a,b)).toEqual({count:1,box:{x:1,y:0,width:1,height:1}});
    expect(comparePixels(a,{width:1,height:1,pixels:a.pixels.subarray(0,4)}).count).toBe(3);
  });
});
it('stop keys expose index, exact millisecond time, kind and line',()=>{
  expect(stopKey({at:1.234,kind:'still',line:'a'},2)).toBe('003@1.234:still:a');
});
