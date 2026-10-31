(() => {
  'use strict';
  const data=window.UNIVERSE, $=s=>document.querySelector(s);
  const storageKey='erick-rafaela-universo-v1';
  let visited=new Set(), active=0, opener=null, soundOn=false, audio=null;
  try {const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved)) visited=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<9));} catch {}
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let still=media.matches;
  const dialog=$('#memory'), container=$('#constellations');
  data.groups.forEach((group,g)=>{
    const section=document.createElement('section');section.className='cluster';section.style.setProperty('--accent',group.color);section.setAttribute('aria-labelledby','group-'+g);
    section.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${group.shape}"/><polyline class="traces" points="${group.shape} ${group.points[0].join(',')}"/></svg><div class="cluster-heading"><h2 id="group-${g}">${group.name}</h2><p>${group.subtitle}</p></div>`;
    group.points.forEach(([x,y],j)=>{
      const i=g*3+j, star=data.stars[i],button=document.createElement('button');
      button.className='star';button.dataset.index=i;button.style.cssText=`--x:${x}%;--y:${y*2.1}px;--delay:-${i*.63}s`;
      button.innerHTML=`<span class="spark" aria-hidden="true"></span><span class="star-label">${star.label}</span>`;
      button.addEventListener('click',()=>openStar(i,button));section.append(button);
    });container.append(section);
  });
  function update(){
    document.querySelectorAll('.star').forEach(b=>{const i=Number(b.dataset.index),seen=visited.has(i);b.classList.toggle('visited',seen);b.setAttribute('aria-label',`${data.groups[Math.floor(i/3)].name}: ${data.stars[i].title}${seen?', já descoberta':''}`);});
    $('#count').textContent=`${String(visited.size).padStart(2,'0')} / 09 DESCOBERTAS`;
    $('#final-star').setAttribute('aria-disabled',String(visited.size!==9));
    $('#unlock-note').textContent=visited.size===9?'O céu está completo. Esta carta é toda sua.':visited.size===0?'Nove estrelas guardam o caminho até esta.':`Ainda ${9-visited.size} ${visited.size===8?'estrela espera':'estrelas esperam'} por você.`;
  }
  function p(text){const el=document.createElement('p');el.textContent=text;return el;}
  function openStar(i,source){
    if(i===9&&visited.size<9)return;
    active=i;if(!dialog.open)opener=source||document.activeElement;
    const final=i===9, star=final?{title:'Rafaela, meu amor.',photo:2,text:data.final}:data.stars[i], group=final?{name:'Nossa eternidade',color:'#d5edff'}:data.groups[Math.floor(i/3)];
    const wasLocked=visited.size<9;
    if(!final){visited.add(i);try{localStorage.setItem(storageKey,JSON.stringify([...visited]));}catch{}}
    update();
    if(wasLocked&&visited.size===9)$('#status').textContent='Você encontrou as nove estrelas. Nossa eternidade, a carta final, está desbloqueada.';
    $('#memory-title').textContent=star.title;$('#category').textContent=final?'A DÉCIMA ESTRELA · PARA SEMPRE':`${group.name.toUpperCase()} · ESTRELA ${String(i+1).padStart(2,'0')}`;
    $('#photo').src=`assets/images/foto-${String(star.photo).padStart(2,'0')}.jpg`;
    $('#photo').alt=final?'Foto especial de Erick e Rafaela juntos, reservada para a carta final':`Fotografia escolhida por Erick para a estrela “${star.title}”`;
    $('#photo-caption').textContent=final?'Você e eu. Agora, e nas próximas eternidades.':'Um instante nosso. Um lugar no infinito.';
    const text=$('#letter-text');text.replaceChildren();
    // Paragraph boundaries change only presentation, never the supplied words.
    if(final){star.text.split(/(?<=fantástico\.) |(?<=junto a ti\.) /).forEach(t=>text.append(p(t)));}
    else text.append(p(star.text));
    if(star.note){const note=document.createElement('div');note.className='note';const label=document.createElement('small');label.textContent='Uma lembrança que guardei';note.append(label,p(star.note));text.append(note);}
    if(final){const details=document.createElement('details');details.className='thoughts';const summary=document.createElement('summary');summary.textContent='Antes deste céu, eu já escrevia sobre você…';details.append(summary);data.thoughts.forEach(t=>details.append(p(t)));text.append(details);}
    $('#letter-number').textContent=final?'10 / 10 · NOSSO INFINITO':`${String(i+1).padStart(2,'0')} / 09`;
    $('#next').textContent=final?'Voltar ao nosso céu ↗':visited.size===9?'Abrir nossa eternidade ↗':'Próxima estrela ↗';
    dialog.classList.toggle('final-letter',final);document.body.classList.add('zooming');document.body.style.overflow='hidden';
    if(!dialog.open){if(source){const r=source.getBoundingClientRect(),c=container.getBoundingClientRect();container.style.transformOrigin=`${r.left+r.width/2-c.left}px ${r.top+r.height/2-c.top}px`;}dialog.showModal();burst(source,group.color,final?48:22);}
    dialog.scrollTop=0;$('#memory-title').focus({preventScroll:true});play(final?3:Math.floor(i/3));
  }
  function close(){dialog.close();}
  dialog.addEventListener('close',()=>{document.body.classList.remove('zooming');document.body.style.overflow='';if(opener)opener.focus({preventScroll:true});});
  $('#close').addEventListener('click',close);
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
  $('#next').addEventListener('click',()=>{if(active===9){close();return;}if(visited.size===9){openStar(9);return;}for(let offset=1;offset<=9;offset++){const next=(active+offset)%9;if(!visited.has(next)){openStar(next);break;}}});
  $('#final-star').addEventListener('click',e=>{if(visited.size===9)openStar(9,e.currentTarget);else{$('#status').textContent=`Explore as ${9-visited.size} estrelas restantes para abrir a carta final.`;$('#unlock-note').animate(still?[]:[{opacity:.4},{opacity:1}],{duration:600});}});
  let restartPending=false,restartTimer;
  $('#restart').addEventListener('click',()=>{if(!visited.size)return;if(!restartPending){restartPending=true;$('#restart').textContent='Toque novamente para recomeçar';clearTimeout(restartTimer);restartTimer=setTimeout(()=>{restartPending=false;$('#restart').textContent='Recomeçar a descoberta';},6000);return;}clearTimeout(restartTimer);restartPending=false;$('#restart').textContent='Recomeçar a descoberta';visited.clear();try{localStorage.removeItem(storageKey);}catch{}update();$('#status').textContent='Um novo começo. As nove estrelas esperam por você.';document.querySelector('.star').focus();});
  async function play(group){
    if(!soundOn)return;
    try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();await audio.resume();
      const notes=[[261.63,329.63,392,523.25],[293.66,369.99,440,587.33],[329.63,415.3,493.88,659.25],[261.63,329.63,392,523.25,659.25,783.99]][group];
      notes.forEach((hz,j)=>{const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+j*.2;osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.035);gain.gain.exponentialRampToValueAtTime(.0001,t+2.6);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+2.7);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
    }catch{soundOn=false;$('#sound').setAttribute('aria-pressed','false');$('#sound span').textContent='Som indisponível';}
  }
  $('#sound').addEventListener('click',()=>{soundOn=!soundOn;$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound span').textContent=soundOn?'Som ligado':'Som desligado';$('#sound').title=soundOn?'Desligar sons suaves':'Ativar sons suaves';if(soundOn)play(0);else if(audio)audio.suspend();});
  function motion(){document.body.classList.toggle('still',still);$('#motion').setAttribute('aria-pressed',String(still));$('#motion span').textContent=still?'Movimento pausado':'Pausar movimento';$('#motion').title=still?'Retomar animações':'Pausar animações';render(performance.now());}
  $('#motion').addEventListener('click',()=>{still=!still;motion();});media.addEventListener('change',e=>{still=e.matches;motion();});
  function burst(source,color,count){if(still||!source)return;const r=source.getBoundingClientRect();for(let i=0;i<count;i++){const particle=document.createElement('i');particle.className='particle';const angle=Math.random()*Math.PI*2,length=35+Math.random()*150;particle.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;--particle:${color};--dx:${Math.cos(angle)*length}px;--dy:${Math.sin(angle)*length}px`;document.body.append(particle);setTimeout(()=>particle.remove(),1400);}}
  // Three depth planes, with slow twinkle and pointer parallax. No gyroscope permission needed.
  const canvas=$('#stardust'),ctx=canvas.getContext('2d');let width=0,height=0,dpr=1,points=[],px=0,py=0,frame=0,lastFrame=0;
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);points=Array.from({length:Math.min(230,Math.floor(width*height/5000))},()=>({x:Math.random()*width,y:Math.random()*height,z:Math.random(),phase:Math.random()*6.28}));render(performance.now());}
  function render(time){cancelAnimationFrame(frame);if(!ctx)return;if(time-lastFrame>32||still){ctx.clearRect(0,0,width,height);points.forEach(s=>{const alpha=.25+.45*(still?.6:(Math.sin(time*.00045+s.phase)+1)/2);ctx.beginPath();ctx.fillStyle=`rgba(184,216,255,${alpha})`;ctx.arc(s.x+(still?0:px*s.z),s.y+(still?0:py*s.z),.35+s.z*.85,0,Math.PI*2);ctx.fill();});lastFrame=time;}if(!still&&!document.hidden)frame=requestAnimationFrame(render);}
  addEventListener('pointermove',e=>{if(still||e.pointerType==='touch')return;px=(e.clientX/innerWidth-.5)*18;py=(e.clientY/innerHeight-.5)*18;document.body.style.setProperty('--px',`${px}px`);document.body.style.setProperty('--py',`${py}px`);container.style.setProperty('--rx',`${-py*.16}deg`);container.style.setProperty('--ry',`${px*.16}deg`);},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);if(audio)audio.suspend();}else{render(performance.now());if(audio&&soundOn)audio.resume().catch(()=>{});}});
  addEventListener('resize',resize,{passive:true});update();resize();motion();
})();
