const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.argv[2]||'public/index.html','utf8');
const script=html.split('<script>')[1].split('</script>')[0];
function boot(){
 const nodes=new Map(),classes=new Set(),gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient(){return gradient}},{get:(t,k)=>t[k]||(()=>{})});
 function node(id){if(!nodes.has(id)){const listeners={};nodes.set(id,{textContent:'',innerHTML:'',value:'',hidden:false,open:false,style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},focus(){},addEventListener(type,fn){(listeners[type]??=[]).push(fn)},showModal(){this.open=true},close(){this.open=false;for(const fn of listeners.close||[])fn()},getContext(){return ctx},getBoundingClientRect(){return {width:1100,height:620}},querySelectorAll(){return []},querySelector(){return null}})}return nodes.get(id)}
 const buddies=[1,2,3].map(n=>{const b=node('buddy'+n);b.dataset.buddy=String(n);return b});
 const holds=['Space','ArrowLeft','ArrowRight','ShiftLeft'].map(k=>{const b=node(k);b.dataset.hold=k;return b});
 const storage={};
 const sandbox={console,Math,Number,JSON,Array,Object,String,Boolean,Set,Map,setTimeout(){},requestAnimationFrame(){},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{querySelector:node,querySelectorAll:s=>s==='[data-buddy]'?buddies:s==='[data-hold]'?holds:[],addEventListener(){},body:{classList:{contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c)}}}},window:{addEventListener(){}}};
 vm.createContext(sandbox);vm.runInContext(script,sandbox);return source=>vm.runInContext(source,sandbox);
}
let checks=0;const test=(name,fn)=>{fn();console.log('✓ '+name);checks++};
test('All 60 stages have three gems, safe start/finish, varied layouts, and reachable gaps',()=>{
 const run=boot();const layouts=new Set();for(const th of ['space','candy','forest','squishy','home'])for(let i=0;i<12;i++){
 const d=run(`theme='${th}';level=${i};makeLevel();({gems:gems.length,grounds:solids.filter(a=>a.kind==='ground'),blocks:blocks.length,width:worldWidth,goal:goalX,ledges:ledges.length,hazards:hazards.length,checks:checkpoints.length})`);
 assert.equal(d.gems,3);assert(d.blocks>20&&d.width>5000&&d.goal<d.width);assert(d.ledges>10&&d.hazards>=4&&d.checks>=3);assert.equal(d.grounds[0].x,0);assert.equal(d.grounds[0].y,520);for(let j=1;j<d.grounds.length;j++){const gap=d.grounds[j].x-d.grounds[j-1].x-d.grounds[j-1].w;assert(gap<=140&&gap>=76);assert(Math.abs(d.grounds[j].y-d.grounds[j-1].y)<=40)}if(th==='space')layouts.add(JSON.stringify(d.grounds));
 }assert.equal(layouts.size,12);
});
test('Movement accelerates, sprint is faster, and camera follows without crossing the world edge',()=>{
 const run=boot();let d=run(`state='playing';sound=false;enemies=[];hazards=[];keys.ArrowRight=true;for(let i=0;i<60;i++)physics(STEP);({vx:p.vx,x:p.x,cam:camera})`);assert.equal(d.vx,265);assert(d.x>170);
 d=run(`keys.ShiftLeft=true;for(let i=0;i<30;i++)physics(STEP);({vx:p.vx,x:p.x})`);assert.equal(d.vx,385);run(`p.x=3000;p.y=200;p.vy=0;for(let i=0;i<30;i++)physics(STEP)`);assert(run('camera')>500);assert(run('camera<=worldWidth-W'));
});
test('Single jump, double jump, variable height, coyote time and jump buffer work',()=>{
 const run=boot();run(`state='playing';sound=false;for(let i=0;i<3;i++)physics(STEP);pressed('Space');physics(STEP)`);assert(run('p.vy< -600&&p.jumps===1&&!p.grounded'));run(`released('Space')`);assert.equal(run('p.vy'),-270);run(`pressed('Space');physics(STEP)`);assert(run('p.jumps===2&&p.vy< -550'));run(`released('Space');pressed('Space');physics(STEP)`);assert.equal(run('p.jumps'),2);
 run(`clearKeys();p.x=200;p.y=460;p.vy=200;p.jumps=2;p.buffer=.14;for(let i=0;i<10;i++)physics(STEP)`);assert(run('p.vy<0&&p.jumps===1'));
 run(`clearKeys();p.x=760;p.y=474;p.vy=0;p.jumps=0;p.grounded=false;p.coyote=.08;p.buffer=.1;physics(STEP)`);assert(run('p.jumps===1&&p.vy< -600'));
});
test('Surprise blocks trigger from below once, spawn power-ups, and solid sides stop the player',()=>{
 const run=boot();run(`state='playing';sound=false;const b=blocks.find(b=>b.kind==='question');p.x=b.x+4;p.y=b.y+b.h+2;p.vy=-500;p.inv=0;physics(STEP)`);assert(run('blocks[0].used&&items.length===1&&p.vy>=0'));
 run(`p.x=362;p.y=375;p.vx=200;keys.ArrowRight=true;physics(STEP)`);assert(run('p.x+p.w<=400.01'));
 const before=run('items.length');run('bumpBlock(blocks[0])');assert.equal(run('items.length'),before);
});
test('Stomps bounce, side contact removes one heart, shields absorb contact, and falls return to a flag',()=>{
 const run=boot();run(`state='playing';sound=false;const e=enemies[0];p.x=e.x;p.y=e.y-p.h-1;p.vy=300;p.inv=0;physics(STEP)`);assert(run('!enemies[0].alive&&stomps===1&&p.vy<0'));
 run(`p.inv=0;p.star=0;p.shield=0;damage(p.x+30)`);assert.equal(run('p.hp'),2);run(`p.inv=0;p.shield=10;damage(p.x+30)`);assert(run('p.hp===2&&p.shield===0&&p.inv>0'));
 run(`const flag=checkpoints[0];p.x=flag.x;p.y=flag.y+flag.h-p.h;p.vy=0;physics(STEP)`);assert(run('checkpoints[0].active&&checkpointIndex===0'));
 run(`p.y=H+150;physics(STEP)`);assert(run('p.x===spawn.x&&p.y===spawn.y&&p.hp===3'));
});
test('World powers have a cooldown; pause prevents input and stages finish only once',()=>{
 const run=boot();run(`sound=false;state='playing';ability()`);assert(run('p.power===3&&p.cooldown===8'));run(`p.power=1;ability()`);assert.equal(run('p.power'),1);
 run(`pause();pressed('ArrowRight')`);assert(run("state==='paused'&&!keys.ArrowRight"));run(`start();finish()`);assert(run("state==='complete'&&rescues===1"));const stars=run('bank');run('finish()');assert.equal(run('bank'),stars);run('start()');assert(run("level===1&&state==='playing'&&stageStars===0"));
 run(`level=11;makeLevel();state='playing';finish()`);assert.equal(run('state'),'worldComplete');run('start()');assert(run("level===0&&theme==='candy'&&state==='playing'"));
});
test('Every world and stage renders without errors; rewards and buddy selections save',()=>{
 const run=boot();for(const th of ['space','candy','forest','squishy','home'])for(let i=0;i<12;i++)run(`theme='${th}';level=${i};makeLevel();camera=goalX-700;render();camera=1000;render()`);run('buddy=3;bank=40;hat=3;save()');assert.equal(run("JSON.parse(localStorage.getItem('laserLeapRewards')).buddy"),3);
});
test('Every stage hides three different coin rooms among ordinary-looking pipes',()=>{
 const run=boot();for(const th of ['space','candy','forest','squishy','home'])for(let i=0;i<12;i++){
  run(`theme='${th}';level=${i};makeLevel()`);assert.equal(run('pipes.filter(a=>a.secret).length'),3);assert(run('pipes.some(a=>!a.secret)'));assert(run('gems.length===3&&gems.every(a=>a.hidden&&!a.got)'));assert(run("signs.every(a=>a.type==='start')"));assert.equal(run('new Set(pipes.filter(a=>a.secret).map(a=>a.type)).size'),3);
 }
});
test('Pipes require standing on the opening, and used rooms cannot be farmed within a stage',()=>{
 const run=boot();run(`state='playing';sound=false;tryPipe()`);assert.equal(run('pipeTransition'),null);
 run(`const entrance=pipes.find(a=>a.secret);p.x=entrance.x+19;p.y=entrance.y-p.h;p.grounded=false;tryPipe()`);assert.equal(run('pipeTransition'),null);
 run(`p.grounded=true;tryPipe();for(let i=0;i<75;i++)physics(STEP)`);assert(run('bonus!==null&&returnScene.pipe.used'));run('finishBonusRoom(true);returnToLevel();p.grounded=true;p.y=pipes.find(a=>a.secret).y-p.h;tryPipe()');assert.equal(run('bonus'),null);assert.equal(run('pipeTransition'),null);
});
test('Bonus rewards save and returning preserves the exact level, checkpoint, health and enemies',()=>{
 const run=boot();run(`state='playing';sound=false;stageStars=7;bank=7;stageCoins=2;coinBank=10;time=12;checkpointIndex=1;spawn={x:900,y:420};enemies[0].alive=false;p.hp=2;const entrance=pipes.find(a=>a.secret&&a.type===0);enterBonus(entrance);for(const a of coins.slice(0,18))collectCoin(a);finishBonusRoom(false)`);
 assert(run("state==='bonusComplete'&&bonus.success&&stageGems===1"));assert.equal(run('coinBank'),38);assert.equal(run('stageCoins'),30);assert.equal(run('stageStars'),12);assert.equal(run('bank'),12);
 const reward=run('coinBank');run('finishBonusRoom(false)');assert.equal(run('coinBank'),reward);run('start()');assert(run("state==='playing'&&bonus===null&&returnScene===null"));assert(run('p.hp===2&&time===12&&checkpointIndex===1&&spawn.x===900&&!enemies[0].alive'));assert(run('gems.filter(a=>a.got).length===1'));assert.equal(run("JSON.parse(localStorage.getItem('laserLeapRewards')).coins"),38);
});
test('All three mini-games end safely; failed attempts retain coins and timers stop in menus',()=>{
 const run=boot();for(let type=0;type<3;type++){
  run(`makeLevel();state='playing';sound=false;enterBonus(pipes.find(a=>a.secret&&a.type===${type}));collectCoin(coins[0]||{x:0,y:0,got:false});openWorldMap()`);const remaining=run('bonus.remaining');run('frame(1000);frame(2000)');assert.equal(run('bonus.remaining'),remaining);run("$('#mapDialog').close()");assert.equal(run('state'),'playing');run('bonus.remaining=.001;physics(STEP)');assert.equal(run('state'),'bonusComplete');assert(!run('bonus.success'));const saved=run('coinBank');run('start()');assert.equal(run('coinBank'),saved);assert.equal(run('stageGems'),0);
 }
 run(`makeLevel();state='playing';enterBonus(pipes.find(a=>a.secret&&a.type===1));for(let i=0;i<600;i++)physics(STEP)`);assert(run('bonus.spawnCount>10&&coins.some(a=>a.falling)'));
});
test('The map launches the selected land and stage, then restores normal controls',()=>{
 const run=boot();run(`state='playing';openWorldMap()`);assert(run("state==='paused'&&$('#mapDialog').open"));run(`mapTheme='forest';mapLevel=9;drawWorldMap();$('#playMapLevel').onclick()`);assert(run("theme==='forest'&&level===9&&state==='playing'&&!$('#mapDialog').open&&bonus===null"));assert.equal(run("JSON.parse(localStorage.getItem('laserLeapRewards')).level"),9);
});
test('Character choices preview without changing the player until applied and persist for all buddies',()=>{
 const run=boot();run(`state='playing';openCharacterStudio();studioDraft.hair='braids';studioDraft.skin='#8c5b45';studioDraft.outfit='overalls';renderLookPreview()`);assert(run("looks.hero.hair==='none'&&state==='paused'"));run("$('#characterDialog').close()");assert(run("looks.hero.hair==='none'&&state==='playing'"));
 run(`openCharacterStudio();studioDraft.hair='braids';studioDraft.skin='#8c5b45';studioDraft.outfit='overalls';applyCharacterLook()`);assert(run("looks.hero.hair==='braids'&&looks.hero.skin==='#8c5b45'&&state==='playing'"));assert.equal(run("JSON.parse(localStorage.getItem('laserLeapRewards')).appearance.hero.outfit"),'overalls');
 run(`openCharacterStudio();studioTarget='mochi';studioDraft={...looks.mochi,color:'#d6a178',accessory:'bow'};applyCharacterLook()`);assert(run("buddy===2&&looks.mochi.accessory==='bow'"));
 assert.equal(run("normalizeLooks({hero:{outfit:'bad',skin:'bad',hair:'bad'}}).hero.skin"),'#fff0d8');
});
test('Every world, bonus type and character outfit renders with saved customization',()=>{
 const run=boot();for(const th of ['space','candy','forest','squishy','home'])for(const outfit of ['suit','overalls','dress','hoodie']){
  run(`theme='${th}';makeLevel();looks.hero.outfit='${outfit}';looks.hero.hair='curly';looks.hero.accessory='glasses';render()`);
  for(let type=0;type<3;type++)run(`state='playing';enterBonus(pipes.find(a=>a.secret&&a.type===${type}));render();finishBonusRoom(true);returnToLevel()`);
 }
});
console.log(checks+' gameplay checks passed.');
