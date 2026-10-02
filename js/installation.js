import { animationMessages } from './content.js?v=20261002-intro-v6';

// Dependency-free 3D schematic. Geometry follows the reference photo, not CAD dimensions.
export function initInstallation(getLanguage) {
  const canvas = document.getElementById('installation-canvas');
  const ctx = canvas.getContext('2d');
  const stage = canvas.closest('.installation-view');
  const buttons = [...document.querySelectorAll('[data-step]')];
  const status = document.getElementById('installation-status');
  const progressBar = document.getElementById('animation-progress');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, progress = reducedMotion.matches ? 1 : 0;
  let visible = false, playing = !reducedMotion.matches, started = false;
  let frame = 0, lastTime = null, selectedStep = -1;
  let transition = null;
  const TAU = Math.PI * 2;
  const ease = x => x * x * (3 - 2 * x);
  const clamp = x => Math.max(0, Math.min(1, x));
  const vector = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const d = Math.hypot(...a); return a.map(n=>n/d); };
  const add = (a,b) => a.map((n,i)=>n+b[i]);
  const times = (a,s) => a.map(n=>n*s);
  let shapes = [];
  const rotation = -.40;
  function project(p) {
    const tilt = -.20;
    const y = p[1]*Math.cos(tilt)-p[2]*Math.sin(tilt);
    const z = p[1]*Math.sin(tilt)+p[2]*Math.cos(tilt);
    const x2 = p[0]*Math.cos(rotation)-y*Math.sin(rotation);
    const y2 = p[0]*Math.sin(rotation)+y*Math.cos(rotation);
    // Orthographic projection keeps the reference proportions at either end of
    // the racket. Leave room above and below for the canvas labels.
    const scale = Math.min((width-64)/300,(height-140)/510);
    return {x:width*.51+x2*scale,y:height*.46-y2*scale,z};
  }
  function poly(vertices, color) {
    const points=vertices.map(project);
    shapes.push({points,fill:color,z:points.reduce((n,p)=>n+p.z,0)/points.length});
  }
  function line(vertices, color, thickness=1, dashed=false) {
    const points=vertices.map(project);
    shapes.push({points,stroke:color,thickness,dashed,z:points.reduce((n,p)=>n+p.z,0)/points.length+.3});
  }
  function shade(rgb, amount) {return `rgb(${rgb.map(c=>Math.round(Math.min(255,c*amount))).join(',')})`;}
  function rod(a,b,r,color,segments=18,endRadius=r) {
    const direction=unit(vector(b,a));
    const right=unit(cross(direction,Math.abs(direction[2])<.9?[0,0,1]:[0,1,0]));
    const up=unit(cross(direction,right));
    const ring=(center,radius,theta)=>add(center,add(times(right,Math.cos(theta)*radius),times(up,Math.sin(theta)*radius)));
    const ringA=[],ringB=[];
    for(let i=0;i<segments;i++) {
      const t=i/segments*TAU,t2=(i+1)/segments*TAU;
      const aa=ring(a,r,t),bb=ring(b,endRadius,t),cc=ring(b,endRadius,t2),dd=ring(a,r,t2);
      poly([aa,bb,cc,dd],shade(color,.63+.37*Math.cos(t-.9)));
      ringA.push(aa);ringB.push(bb);
    }
    poly(ringA,shade(color,.68));poly(ringB,shade(color,1.05));
  }
  // Trace the latest front-view reference in its own coordinate system:
  // crown y=50, bridge y=465, throat y=600, grip y=728..940.
  // This makes the head ~47%, open throat ~15%, neck ~14%, grip ~24% of length.
  const fromReference = ([x,y])=>[(x-268)*430/890,244-(y-50)*430/890];
  function sampleCurves(curves) {
    const points=[];
    for (const curve of curves) {
      for (let i=0;i<24;i++) {
        const t=i/24, u=1-t;
        points.push(fromReference([0,1].map(axis=>u**3*curve[0][axis]+3*u*u*t*curve[1][axis]+3*u*t*t*curve[2][axis]+t**3*curve[3][axis])));
      }
    }
    points.push(fromReference(curves[curves.length-1][3]));
    return points;
  }
  const halfOutline = sampleCurves([
    [[268,50],[356,48],[405,97],[407,195]],
    [[407,195],[414,286],[385,366],[340,431]],
    [[340,431],[322,454],[294,465],[268,465]],
  ]);
  const outline = [...halfOutline, ...halfOutline.slice(1,-1).reverse().map(([x,y])=>[-x,y])];
  const stringOutline = outline.map(([x,y])=>[x*.968,144+(y-144)*.978]);
  function tubeRings(path,radius,depth,closed) {
    return path.map(([x,y],i)=>{
      const previous=path[closed?(i+path.length-1)%path.length:Math.max(0,i-1)];
      const next=path[closed?(i+1)%path.length:Math.min(path.length-1,i+1)];
      const dx=next[0]-previous[0], dy=next[1]-previous[1], length=Math.hypot(dx,dy);
      return Array.from({length:10},(_,j)=>{
        const angle=j/10*TAU;
        return [x-dy/length*radius*Math.cos(angle),y+dx/length*radius*Math.cos(angle),depth*Math.sin(angle)];
      });
    });
  }
  const frameRings = tubeRings(outline,2.2,2.8,true);
  const throatSide = sampleCurves([[[347,421],[318,475],[281,552],[272,600]]]);
  const throatRings = [throatSide,throatSide.map(([x,y])=>[-x,y])].map(path=>tubeRings(path,2.6,3.2,false));
  function drawTube(rings,colorAt,closed=false) {
    const count=rings.length-(closed?0:1);
    for(let i=0;i<count;i++) {
      const ring=rings[i], next=rings[(i+1)%rings.length], color=colorAt(i);
      for(let j=0;j<10;j++) {
        const k=(j+1)%10;
        poly([ring[j],next[j],next[k],ring[k]],shade(color,.66+.28*Math.sin((j+.5)/10*TAU)+.10*Math.cos(i/rings.length*TAU)));
      }
    }
  }
  // Intersect the actual tapered outline so every string ends inside the frame.
  function stringEnds(axis, value) {
    const hits=[];
    stringOutline.forEach((a,i)=>{
      const b=stringOutline[(i+1)%stringOutline.length];
      if((a[axis]<=value&&b[axis]>value)||(b[axis]<=value&&a[axis]>value)) {
        const t=(value-a[axis])/(b[axis]-a[axis]);
        hits.push(a[1-axis]+t*(b[1-axis]-a[1-axis]));
      }
    });
    if(hits.length<2)return null;
    const ends=[Math.min(...hits),Math.max(...hits)];
    return ends.map(other=>axis===0?[value,other,.5]:[other,value,.5]);
  }
  const strings=[];
  for(let x=-60;x<=60;x+=7.5){const ends=stringEnds(0,x);if(ends)strings.push(ends);}
  for(let y=52;y<=233;y+=9.5){const ends=stringEnds(1,y);if(ends)strings.push(ends);}
  function racketHead() {
    drawTube(frameRings,i=>{
      const [x,y]=outline[i];
      return x>=0&&y>179?[70,75,73]:[236,63,65];
    },true);
    throatRings.forEach(rings=>drawTube(rings,()=>[236,63,65]));
    strings.forEach(ends=>line(ends,'rgba(187,192,184,.60)',.65));
  }
  function circleAt(y,r,color,thickness=1) {const points=[];for(let i=0;i<=50;i++)points.push([Math.cos(i/50*TAU)*r,y,Math.sin(i/50*TAU)*r]);line(points,color,thickness);}
  function updateStep(force=false) {
    const next = progress < .29 ? 0 : progress < .73 ? 1 : 2;
    if(next!==selectedStep||force) {
      selectedStep=next;
      buttons.forEach((button,i)=>{button.classList.toggle('active',i===next);button.setAttribute('aria-pressed',String(i===next));});
      status.textContent=animationMessages[getLanguage()][next];
      stage.dataset.stage=String(next+1);
    }
    progressBar.style.width=`${progress*100}%`;
  }
  function render() {
    if(!width||!height)return;
    ctx.clearRect(0,0,width,height);
    // Subtle technical grid and ground-plane reference.
    ctx.strokeStyle='rgba(152,182,125,.045)';ctx.lineWidth=1;
    for(let x=width/2%40;x<width;x+=40){ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,height-75);ctx.stroke();}
    for(let y=60;y<height-70;y+=40){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(width-20,y);ctx.stroke();}
    const glow=ctx.createRadialGradient(width*.5,height*.49,0,width*.5,height*.49,width*.45);
    glow.addColorStop(0,'rgba(147,198,86,.065)');glow.addColorStop(1,'rgba(147,198,86,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    shapes=[];
    const attach=ease(clamp((progress-.27)/.40));
    const offset=55*(1-attach);
    const sensorTop=-187-offset;
    const sensorHeight=15; // 25% thinner than the previous 20-unit cylinder.
    const sensorY=fraction=>sensorTop-sensorHeight*fraction;
    // Red / black frame, curved bridge, open throat and long black grip.
    racketHead();
    rod([0,-19,0],[0,-27,0],4.7,[226,54,56],20,4.5);
    rod([0,-26,0],[0,-55,0],4.5,[48,52,50],20,3.4);
    rod([0,-55,0],[0,-84,0],3.4,[48,52,50],20,6.6);
    poly([[3.1,-28,3.5],[2.4,-55,3.5],[4.8,-84,3.5],[6.6,-84,3.5],[3.5,-55,3.5],[4.5,-28,3.5]],'#df3e40');
    rod([0,-84,0],[0,-178,0],8.6,[43,47,44],24,9.6);
    // Spiral wrapping is geometry, so it follows the racket's perspective.
    for(let turn=0;turn<12;turn++) {
      const points=[];
      for(let i=0;i<=36;i++){const t=i/36*TAU;const y=-84-turn*7.8-i/36*7.8;const r=8.8+(-y-84)/94;points.push([Math.cos(t)*r,y,Math.sin(t)*r]);}
      for(let i=1;i<points.length;i++)line([points[i-1],points[i]],'#596058',.55);
    }
    rod([0,-177,0],[0,-184,0],10,[49,55,47],32,11.2);
    rod([0,-184,0],[0,-186,0],11.2,[74,81,69],32);
    // The short cylinder travels only along the handle axis into the butt end.
    rod([0,sensorTop,0],[0,sensorY(.95),0],12.8,[91,104,77],40);
    rod([0,sensorY(.075),0],[0,sensorY(.165),0],13,[186,228,116],40);
    rod([0,sensorY(.85),0],[0,sensorY(1),0],13,[43,51,36],40);
    circleAt(sensorY(1.015),8.5,'#a4ce67',1.1);
    if(offset>3) line([[0,-188,0],[0,sensorTop+3,0]],'rgba(195,243,107,.6)',1,true);
    if(progress>.74) {
      const calibration=clamp((progress-.74)/.25);
      for(let i=0;i<3;i++){const radius=24+i*10+calibration*7;circleAt(sensorY(.7+i*.15),radius,`rgba(195,243,107,${.23-i*.05})`,1);}
    }
    shapes.sort((a,b)=>a.z-b.z);
    for(const shape of shapes) {
      ctx.beginPath();shape.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      if(shape.fill){ctx.closePath();ctx.fillStyle=shape.fill;ctx.fill();}
      else{ctx.strokeStyle=shape.stroke;ctx.lineWidth=shape.thickness;ctx.setLineDash(shape.dashed?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);}
    }
    // Annotation tracks the actual moving sensor in the schematic.
    const tip=project([0,sensorY(.75),0]);
    const labelX=Math.min(width-118,tip.x+43), labelY=Math.min(tip.y+8,height-100);
    ctx.strokeStyle='rgba(195,243,107,.55)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(tip.x+14,tip.y);ctx.lineTo(labelX,labelY);ctx.lineTo(labelX+12,labelY);ctx.stroke();
    ctx.fillStyle='#c3f36b';ctx.beginPath();ctx.arc(tip.x+14,tip.y,2,0,TAU);ctx.fill();
    ctx.font='11px ui-monospace, monospace';ctx.fillText('IMU / 6-AXIS',labelX+17,labelY+4);
    // Orientation triad is a technical reference, not measured live data.
    const ax=width-57,ay=height-121;
    [['X',24,8,'#c3f36b'],['Y',0,-29,'#9da997'],['Z',-19,13,'#697c5c']].forEach(([label,x,y,color])=>{ctx.strokeStyle=color;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+x,ay+y);ctx.stroke();ctx.font='9px ui-monospace,monospace';ctx.fillText(label,ax+x+(x<0?-9:3),ay+y+3);});
    updateStep();
  }
  function tick(time) {
    frame=0;
    if(!visible){lastTime=null;return;}
    const delta=lastTime===null?0:Math.min(time-lastTime,60);lastTime=time;
    if(transition){transition.elapsed+=delta;const t=clamp(transition.elapsed/900);progress=transition.from+(transition.to-transition.from)*ease(t);if(t>=1)transition=null;}
    else if(playing){progress=clamp(progress+delta/10500);if(progress===1)playing=false;}
    render();
    if(playing||transition)frame=requestAnimationFrame(tick);else lastTime=null;
  }
  function requestRender(){if(!frame&&visible)frame=requestAnimationFrame(tick);else if(!visible)render();}
  function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
  new ResizeObserver(resize).observe(stage);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){started=true;requestRender();}else{if(frame)cancelAnimationFrame(frame);frame=0;lastTime=null;}},{threshold:.15});observer.observe(stage);
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{playing=false;const target=[.15,.68,1][i];if(reducedMotion.matches||!visible){progress=target;transition=null;}else transition={from:progress,to:target,elapsed:0};requestRender();}));
  document.getElementById('replay-install').addEventListener('click',()=>{transition=null;progress=0;playing=true;lastTime=null;requestRender();});
  window.addEventListener('site-language',()=>{updateStep(true);render();});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){playing=false;transition=null;progress=1;render();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=null;}else if(started)requestRender();});
  resize();updateStep(true);
}
