const setup = stage => {
  const {ctx}=stage.canvas();
  return {render(){
    ctx.fillStyle='white';ctx.fillRect(0,0,1600,900);
    ctx.fillStyle='black';ctx.font='30px sans-serif';ctx.fillText('first',100,100);ctx.fillText('second',110,100);
  }};
};
export default {
  id:'inspection-fixture',title:'Inspection fixture',
  voice:{cast:{speaker:{name:'fixture'}}},
  chapters:[{id:'chapter',title:'Fixture',clips:[
    {id:'bad',title:'Bad',setup,script:[
      {id:'a',text:'背景なの。'},
      {id:'b',text:'理由なの。'},
      {id:'long',text:'長い字幕の折り返しを確認するための文をここに書きます。'.repeat(4)},
    ]},
    {id:'warnings',title:'Warnings',setup,script:[
      {id:'a',text:'12 本、4-5、#128、Opus 4、2020 年。'},
      {id:'pages',text:'一枚め。\n\n二枚め。'},
      {id:'q',text:'どちらでしょう。',ask:{choices:['A','B'],answer:0}},
      {id:'right',when:'q.right',text:'正解。\n\n次のページ。'},
      {id:'wrong',when:'q.wrong',text:'不正解。'},
    ]},
  ]}],
};
