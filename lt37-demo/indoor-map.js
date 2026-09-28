let indoorActive=false,activeFloor=0,ltBuilding,ltPlace;const indoorPins=new Map();
const toolbar=document.createElement('section');toolbar.id='indoor-toolbar';toolbar.hidden=true;toolbar.setAttribute('aria-label','LT37 indoor demo');toolbar.innerHTML='<div class="indoor-tag">LT37 · INDOOR DEMO</div><h2>Lecture Theatre 37</h2><p id="indoor-floor-title"></p><button id="exit-indoor">← Back to campus</button><div id="indoor-room-info" aria-live="polite"><strong>Select an indoor marker</strong><p>Explore the sample rooms and facilities.</p></div><p style="font-size:11px">Illustrative floors and rooms, not actual NUS plans.</p>';
document.querySelector('#map-shell').append(toolbar);
const levels=document.createElement('nav');levels.id='indoor-levels';levels.hidden=true;levels.setAttribute('aria-label','Building floors');levels.innerHTML='<button id="floor-up" aria-label="Go up one floor">⌃</button><output id="current-floor" aria-live="polite">L1</output><button id="floor-down" aria-label="Go down one floor">⌄</button>';document.querySelector('#map-shell').append(levels);
const roomIcons={teach:'<path d="M3 4h18v12H3zM7 21l5-5 5 5M8 8h8"/>',stairs:'<path d="M3 21h5v-6h5V9h5V3h3"/>',lift:'<rect x="3" y="2" width="18" height="20" rx="2"/><path d="m7 9 2-3 2 3m2 6 2 3 2-3M9 6v12m6-12v12"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1"/>',amenity:'<path d="M6 3v7m-3 0h6m-3 0v11M18 3v18m-3-13h6"/>'};
const floorNames=['Arrival & lecture spaces','Teaching & tutorials','Study & collaboration'];
function makePlan(){
 const ring=ltBuilding.geometry.coordinates[0],origin=[ltBuilding.properties.lng,ltBuilding.properties.lat],angle=-20*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const local=ring.map(p=>{const e=(p[0]-origin[0])*111290,n=(p[1]-origin[1])*111319;return[e*c+n*s,-e*s+n*c]});
 const min=[Math.min(...local.map(p=>p[0])),Math.min(...local.map(p=>p[1]))],max=[Math.max(...local.map(p=>p[0])),Math.max(...local.map(p=>p[1]))];
 const ll=(u,v)=>{const x=min[0]+u*(max[0]-min[0]),y=min[1]+v*(max[1]-min[1]);return[origin[0]+(x*c-y*s)/111290,origin[1]+(x*s+y*c)/111319]};



 // Adjoining rooms form continuous wings; only the circulation aisles are left open.
 const specs=[];
 const add=(b,name,kind='teach',key='space-'+specs.length,flip=false)=>specs.push({b,name,kind,key,flip});
 add([.07,.60,.27,.94],['Lecture theatre','Upper auditorium','Learning studio'][activeFloor],'teach','room-0');
 add([.27,.60,.38,.73],'Tutorial 1','teach','space-1',true);
 add([.38,.60,.52,.73],'Tutorial 2','teach','space-2',true);
 add([.27,.80,.34,.94],'Study booth 1');
 add([.34,.80,.43,.94],'Study booth 2');
 add([.43,.80,.52,.94],'Quiet room');
 add([.52,.60,.68,.73],'Collaboration lounge','info','space-6',true);
 add([.52,.80,.61,.94],'Office 1','info');
 add([.61,.80,.76,.94],'Meeting suite','info');
 add([.68,.60,.76,.73],'Office 2','info','space-9',true);
 add([.76,.80,.86,.94],'Lift','lift');
 add([.86,.19,.97,.48],'Stairs','stairs');
 add([.76,.60,.86,.73],'Washrooms','amenity','space-12',true);
 add([.51,.19,.61,.32],'Seminar 1','teach','space-13',true);
 add([.61,.19,.75,.32],'Project studio','teach','space-14',true);
 add([.75,.19,.86,.32],'Seminar 2','teach','space-15',true);
 add([.51,.38,.58,.48],'Focus room 1');
 add([.58,.38,.66,.48],'Focus room 2');
 add([.66,.38,.75,.48],'Meeting room','info');
 add([.75,.38,.86,.48],'Resource room','info');
 // Split collinear borders at every junction and draw each shared partition once.
 const edges=[];
 for(const {b,flip} of specs){const [x0,y0,x1,y1]=b;
  edges.push(['v',x0,y0,y1],['v',x1,y0,y1]);
  const doorY=flip?y1:y0,backY=flip?y0:y1;
  edges.push(['h',backY,x0,x1]);
  const lo=flip?.43:.42,hi=flip?.58:.57;
  edges.push(['h',doorY,x0,x0+(x1-x0)*lo],['h',doorY,x0+(x1-x0)*hi,x1]);
 }
 const walls=[];
 for(const axis of ['h','v'])for(const line of new Set(edges.filter(e=>e[0]===axis).map(e=>e[1]))){
  const group=edges.filter(e=>e[0]===axis&&e[1]===line),cuts=[...new Set(group.flatMap(e=>[e[2],e[3]]))].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){const a=cuts[i],b=cuts[i+1],mid=(a+b)/2;if(group.some(e=>mid>e[2]&&mid<e[3]))walls.push(axis==='h'?[ll(a,line),ll(b,line)]:[ll(line,a),ll(line,b)]);}
 }
 const rooms=specs.map(({b,name,kind,key,flip})=>{const center=ll((b[0]+b[2])/2,(b[1]+b[3])/2);if(!pointInRing(center,ring))return null;const seed=[...key].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),17)+activeFloor*13;const temperature=(22+(seed%57)/10).toFixed(1);return {key,name,kind,center,temperature,ring:flip?[ll(b[2],b[3]),ll(b[0],b[3]),ll(b[0],b[1]),ll(b[2],b[1])]:[ll(b[0],b[1]),ll(b[2],b[1]),ll(b[2],b[3]),ll(b[0],b[3])]};}).filter(Boolean);

 return {id:Number(ltBuilding.properties.id.replace('osm-','')),floor:activeFloor,ring,center:origin,rooms,walls};
}
function updateIndoor(){const plan=makePlan();for(const pin of indoorPins.values())pin.remove();indoorPins.clear();for(const room of plan.rooms){const b=document.createElement('button');b.className='indoor-pin';b.setAttribute('aria-label',room.name+' · L'+(activeFloor+1));b.setAttribute('aria-pressed','false');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'+roomIcons[room.kind]+'</svg><span>'+room.name+'</span>';b.onclick=()=>{for(const p of indoorPins.values())p.setAttribute('aria-pressed',p===b);document.querySelector('#indoor-room-info').innerHTML='<strong>'+room.name+'</strong><p>L'+(activeFloor+1)+' · Sample '+(room.kind==='teach'?'learning space':'facility')+'. Demo layout only.</p><div class="room-temperature"><span>Room temperature <small>DEMO</small></span><div><b>'+room.temperature+'</b> °C</div><p>Simulated reading · No live sensor connected</p></div>'};document.querySelector('#map').append(b);indoorPins.set(room.key,b)}map.frame.contentWindow.__nusIndoorSink=points=>{if(!indoorActive)return;for(const p of points){const b=indoorPins.get(p.id);if(b){b.style.display=p.visible?'grid':'none';b.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`}}};map.send({action:'indoor',plan});document.querySelector('#current-floor').textContent='L'+(activeFloor+1);document.querySelector('#indoor-floor-title').textContent='L'+(activeFloor+1)+' · '+floorNames[activeFloor];document.querySelector('#floor-up').disabled=activeFloor===2;document.querySelector('#floor-down').disabled=activeFloor===0;document.querySelector('#indoor-room-info').innerHTML='<strong>'+plan.rooms.length+' sample rooms</strong><p>Select a room to see its temperature.</p>';}
function enterIndoor(){if(!ltBuilding)return;closeSearch();indoorActive=true;activeFloor=0;document.body.classList.add('indoors');toolbar.hidden=levels.hidden=false;document.querySelector('#detail').hidden=true;updateIndoor();map.send({action:'camera',lat:ltBuilding.properties.lat,lng:ltBuilding.properties.lng,pitch:58,bearing:340,distance:165});}
function exitIndoor(){indoorActive=false;document.body.classList.remove('indoors');toolbar.hidden=levels.hidden=true;map.send({action:'indoor',plan:null});for(const b of indoorPins.values())b.remove();indoorPins.clear();map.frame.contentWindow.__nusIndoorSink=null;map.flyTo({center:[ltPlace.lng,ltPlace.lat],zoom:17,pitch:48});}
document.querySelector('#exit-indoor').onclick=exitIndoor;document.querySelector('#floor-up').onclick=()=>{if(activeFloor<2){activeFloor++;updateIndoor()}};document.querySelector('#floor-down').onclick=()=>{if(activeFloor>0){activeFloor--;updateIndoor()}};
const originalShowPlace=showPlace;showPlace=function(p){if(indoorActive)exitIndoor();originalShowPlace(p);if(p.id===ltPlace?.id||(ltPlace?.buildingId&&p.buildingId===ltPlace.buildingId)){const b=document.createElement('button');b.id='lt37-open';b.textContent='Explore floors · Demo';b.onclick=enterIndoor;document.querySelector('#detail').append(b)}};
const outsideBuilding=map.onBuilding;map.onBuilding=(...args)=>{if(!indoorActive)outsideBuilding(...args)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&indoorActive)exitIndoor()});essentials.push('Lecture Theatre 37');
campusReady.then(()=>{ltPlace=places.find(p=>p.id==='lecture-theatre-37');ltBuilding=buildingData.features.find(b=>b.properties.id===ltPlace.buildingId);showPlace(ltPlace);render()});


// Optional shareable indoor-room preview; ordinary entry still uses the Explore button.
if(new URLSearchParams(location.search).has('indoor')){
 campusReady.then(()=>{
  const openLinkedRoom=()=>{enterIndoor();const key=new URLSearchParams(location.search).get('room');if(key)indoorPins.get(key)?.click();};
  if(map.ready)openLinkedRoom();else{const ready=map.onReady;map.onReady=()=>{ready?.();openLinkedRoom();};}
 });
}
