const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.argv[2]||'public/index.html','utf8');
const script=html.split('<script>')[1].split('</script>')[0];
function boot(options={}){
 const nodes=new Map(),classes=new Set(),gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient(){return gradient}},{get:(t,k)=>t[k]||(()=>{})});
 function node(id){if(!nodes.has(id)){const listeners={};nodes.set(id,{textContent:'',innerHTML:'',value:'',hidden:false,open:false,style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},focus(){},setPointerCapture(){},addEventListener(type,fn){(listeners[type]??=[]).push(fn)},emit(type,event){for(const fn of listeners[type]||[])fn(event)},showModal(){this.open=true},close(){this.open=false;for(const fn of listeners.close||[])fn()},getContext(){return ctx},getBoundingClientRect(){return {width:1100,height:620}},querySelectorAll(){return []},querySelector(){return null}})}return nodes.get(id)}
 const buddies=[1,2,3].map(n=>{const b=node('buddy'+n);b.dataset.buddy=String(n);return b});
 const holds=['Space','ArrowLeft','ArrowRight','ArrowDown'].map(k=>{const b=node(k);b.dataset.hold=k;return b});
 const storage={};
 const timers=new Map();let clock=0,nextTimer=0;
 const sandbox={console,Math,Number,JSON,Array,Object,String,Boolean,Set,Map,setTimeout(fn,delay=0){const id=++nextTimer;timers.set(id,{fn,at:clock+delay});return id},clearTimeout(id){timers.delete(id)},requestAnimationFrame(){},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{querySelector:node,querySelectorAll:s=>s==='[data-buddy]'?buddies:s==='[data-hold]'?holds:[],addEventListener(){},body:{classList:{contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c)}}}},window:{addEventListener(){}}};
 vm.createContext(sandbox);vm.runInContext(script,sandbox);const run=source=>vm.runInContext(source,sandbox);
 run.advance=ms=>{const end=clock+ms;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;clock=next[1].at;timers.delete(next[0]);next[1].fn()}clock=end};
 run.fire=(selector,type,event)=>node(selector).emit(type,event);run.fireHold=(code,type,event)=>holds.find(b=>b.dataset.hold===code).emit(type,event);
 if(!options.splash)run("$('#splashScreen').close()");return run;
}
let checks=0;const test=(name,fn)=>{fn();console.log('✓ '+name);checks++};
test('The artwork splash stays for five seconds, can be skipped, and never starts gameplay',()=>{
 const run=boot({splash:true});assert(run("$('#splashScreen').open&&state==='ready'"));run.advance(4999);assert(run("$('#splashScreen').open&&!splashLeaving"));run.advance(1);assert(run('splashLeaving'));run.advance(300);assert(run("!$('#splashScreen').open&&state==='ready'&&time===0"));
 const skip=boot({splash:true});skip("$('#skipSplash').onclick()");skip.advance(300);assert(skip("!$('#splashScreen').open&&state==='ready'"));skip.advance(6000);assert(!skip("$('#splashScreen').open"));
});
test('Touch controls cancel browser gestures while preserving double jump and simultaneous movement',()=>{
 const run=boot();run("state='playing';sound=false;for(let i=0;i<3;i++)physics(STEP)");const touch=()=>({cancelable:true,defaultPrevented:false,pointerId:1,preventDefault(){this.defaultPrevented=true}});
 const right=touch();run.fireHold('ArrowRight','pointerdown',right);const first=touch();run.fireHold('Space','touchstart',first);run.fireHold('Space','pointerdown',touch());run('physics(STEP)');assert(first.defaultPrevented);assert(run('p.jumps===1&&p.vy<0&&keys.ArrowRight'));
 const end=touch();run.fireHold('Space','touchend',end);run.fireHold('Space','pointerup',touch());assert(end.defaultPrevented);run.fireHold('Space','touchstart',touch());run.fireHold('Space','pointerdown',touch());run('physics(STEP)');assert(run('p.jumps===2&&p.vy<0&&keys.ArrowRight'));
 run.fireHold('ArrowRight','pointercancel',touch());assert(!run('keys.ArrowRight'));
 const runTap=touch();run.fire('#run','touchstart',runTap);assert(runTap.defaultPrevented&&run('runLatched'));run.fire('#run','touchend',touch());run.fire('#run','touchstart',touch());assert(!run('runLatched'));
 const powerTap=touch();run.fire('#ability','touchstart',powerTap);assert(powerTap.defaultPrevented&&run('p.power===3&&p.cooldown===8'));
});
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
test('Timed coin games end safely; failed attempts retain coins and timers stop in menus',()=>{
 const run=boot();for(let type=0;type<3;type++){
  run(`level=${type};makeLevel();state='playing';sound=false;enterBonus(pipes.find(a=>a.secret&&a.type===${type}));collectCoin(coins[0]||{x:0,y:0,got:false});openWorldMap()`);const remaining=run('bonus.remaining');run('frame(1000);frame(2000)');assert.equal(run('bonus.remaining'),remaining);run("$('#mapDialog').close()");assert.equal(run('state'),'playing');run('bonus.remaining=.001;physics(STEP)');assert.equal(run('state'),'bonusComplete');assert(!run('bonus.success'));const saved=run('coinBank');run('start()');assert.equal(run('coinBank'),saved);assert.equal(run('stageGems'),0);
 }
 run(`level=1;makeLevel();state='playing';enterBonus(pipes.find(a=>a.secret&&a.type===1));for(let i=0;i<600;i++)physics(STEP)`);assert(run('bonus.spawnCount>10&&coins.some(a=>a.falling)'));
});
test('Mystery blocks allow one guess per tier, lock the other choices, and keep every coin',()=>{
 const run=boot();run(`state='playing';sound=false;enterBonus(pipes.find(a=>a.secret&&a.type===3));bonus.rows[0].winner=1;bumpBlock(bonus.rows[0].blocks[0])`);
 assert(run('bonus.activeTier===1&&bonus.correctRows===0&&bonus.rows[0].blocks.every(b=>b.used)&&coinBank===0'));
 run('bumpBlock(bonus.rows[0].blocks[1]);bumpBlock(bonus.rows[2].blocks[0])');assert(run('bonus.activeTier===1&&coinBank===0'));
 run(`for(let tier=1;tier<5;tier++)bumpBlock(bonus.rows[tier].blocks[bonus.rows[tier].winner])`);
 assert(run('bonus.activeTier===5&&bonus.gameCleared&&bonus.correctRows===4&&coinBank===70'));
 run(`const exit=pipes[0];p.x=exit.x+19;p.y=exit.y-p.h;p.grounded=true;tryPipe()`);assert(run("state==='bonusComplete'&&bonus.success&&coinBank===80&&stageGems===1"));
 run('start()');assert(run("state==='playing'&&bonus===null&&cameraY===0&&coinBank===80"));
});
test('The mystery ladder unlocks each floor, follows the upper tiers, and has no timer',()=>{
 const run=boot();run(`state='playing';sound=false;enterBonus(pipes.find(a=>a.secret&&a.type===3));p.x=650;p.y=339-p.h;p.vy=180;physics(STEP)`);assert(!run('p.grounded'));
 run(`bumpBlock(bonus.rows[0].blocks[0]);p.x=650;p.y=339-p.h;p.vy=180;physics(STEP)`);assert(run('p.grounded&&p.ground.requiresTier===1'));
 run(`for(let tier=1;tier<4;tier++)bumpBlock(bonus.rows[tier].blocks[0]);p.x=210;p.y=-230;p.vy=0;physics(STEP);render();updateBonus(100000)`);
 assert(run("cameraY<0&&state==='playing'&&!bonus.done&&bonus.remaining===Infinity"));
 run(`p.x=pipes[0].x+19;p.y=pipes[0].y-p.h;p.grounded=true;tryPipe()`);assert.equal(run('state'),'playing');
});
test('The map launches the selected land and stage, then restores normal controls',()=>{
 const run=boot();run(`state='playing';openWorldMap()`);assert(run("state==='paused'&&$('#mapDialog').open"));run(`mapTheme='forest';mapLevel=9;drawWorldMap();$('#playMapLevel').onclick()`);assert(run("theme==='forest'&&level===9&&state==='playing'&&!$('#mapDialog').open&&bonus===null"));assert.equal(run("JSON.parse(localStorage.getItem('laserLeapRewards')).level"),9);
});
test('The help popup freezes an active adventure and preserves ready and paused screens',()=>{
 const run=boot();run(`state='playing';sound=false;time=12;p.x=200;keys.ArrowRight=true;openHowToPlay()`);
 assert(run("state==='paused'&&$('#howToPlayDialog').open&&!keys.ArrowRight"));
 run('pressed("Space");frame(1000);frame(2000)');assert(run('time===12&&p.x===200&&!keys.Space'));
 run("$('#dismissHelp').onclick()");assert(run("state==='playing'&&!$('#howToPlayDialog').open"));
 run("pause();openHowToPlay();$('#closeHelp').onclick()");assert(run("state==='paused'&&!$('#overlay').hidden"));
 run("state='ready';openHowToPlay();$('#howToPlayDialog').close()");assert.equal(run('state'),'ready');
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
  for(let type=0;type<4;type++)run(`level=${type};makeLevel();state='playing';enterBonus(pipes.find(a=>a.secret&&a.type===${type}));render();finishBonusRoom(true);returnToLevel()`);
 }
});
test('Share previews are static, use the canonical domain, and declare the actual image sizes',()=>{
 const head=html.split('</head>')[0],tags=[...head.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)];
 assert(head.includes('<link rel="canonical" href="https://superemilia.com/">'));assert(html.includes('Designed with ❤️ in Smyrna by Emilia'));
 const pictures=[];for(const [,name,value] of tags){if(name==='og:image')pictures.push({url:value});else if(name.startsWith('og:image:'))pictures.at(-1)[name.slice(9)]=value}
 assert.equal(pictures.length,2);for(const picture of pictures){const url=new URL(picture.url);assert.equal(url.origin,'https://superemilia.com');assert.equal(picture.type,'image/png');assert(picture.alt.length>20);const data=fs.readFileSync(require('path').resolve(__dirname,'../public'+url.pathname));assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(data.readUInt32BE(16),Number(picture.width));assert.equal(data.readUInt32BE(20),Number(picture.height));assert(data.length<5*1024*1024)}
 assert(tags.some(([,name,value])=>name==='twitter:card'&&value==='summary_large_image'));assert(tags.some(([,name,value])=>name==='twitter:image'&&value===pictures[0].url));
 const meta=Object.fromEntries(tags.map(([,name,value])=>[name,value]));assert.equal(meta['og:description'],meta.description);assert.equal(meta['twitter:description'],meta.description);assert(meta.description.includes('60 levels')&&meta.description.includes('Pip, Mochi, and Luna')&&meta.description.length<200);assert.equal(meta['og:url'],'https://superemilia.com/');assert.equal(meta['og:title'],meta['twitter:title']);assert(meta['og:title'].length<70);
});
test('Search and link readers receive connected game, site, and cover details without running JavaScript',()=>{
 const head=html.split('</head>')[0],data=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data['@context'],'https://schema.org');const graph=data['@graph'],game=graph.find(n=>n['@type']==='VideoGame'),site=graph.find(n=>n['@type']==='WebSite'),page=graph.find(n=>n['@type']==='WebPage'),image=graph.find(n=>n['@id']===game.image['@id']);
 assert.equal(game.name,'Super Emilia World');assert.equal(game.author.name,'Emilia');assert.equal(game.isAccessibleForFree,true);assert.equal(game.playMode,'https://schema.org/SinglePlayer');assert.equal(page.mainEntity['@id'],game['@id']);assert.equal(page.isPartOf['@id'],site['@id']);assert.equal(image.width,1717);assert.equal(image.height,916);assert.equal(game.url,site.url);assert.equal(game.featureList.length,5);assert.equal(game.creditText,'Designed with ❤️ in Smyrna by Emilia');
});
console.log(checks+' checks passed.');
