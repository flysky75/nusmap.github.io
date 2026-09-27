class StreetsMap {
 constructor(){
  this.ready=false;this.markers=new Set();this.pending=[];this.sequence=0;
  this.container=document.querySelector('#map');this.frame=document.createElement('iframe');
  this.frame.title='Streets GL campus map';this.frame.src='streets/index.html#1.29800,103.77600,45,342,1600';
  Object.assign(this.frame.style,{position:'absolute',inset:'0',width:'100%',height:'100%',border:'0'});this.container.append(this.frame);
  const attribution=document.createElement('div');attribution.className='maplibregl-ctrl-attrib';Object.assign(attribution.style,{position:'absolute',bottom:'0',right:'0',zIndex:2,fontSize:'11px',padding:'2px 6px'});
  attribution.innerHTML='<a href="https://streets.gl/" target="_blank" rel="noopener">Streets GL</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> · Terrain © Esri';this.container.append(attribution);
  window.addEventListener('message',e=>{
   if(e.origin!==location.origin||e.source!==this.frame.contentWindow||e.data?.channel!=='nus-map')return;
   const d=e.data;
   if(d.event==='ready'){this.ready=true;this.pending.splice(0).forEach(v=>this.send(v));this.sync();this.onReady?.();}
   if(d.event==='frame'){for(const p of d.points){const m=[...this.markers].find(m=>m.id===p.id);if(m){m.element.style.display=p.visible?'':'none';m.element.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;}}}
   if(d.event==='tiles'){document.querySelector('#map-status').textContent='';}
   if(d.event==='building')this.onBuilding?.(d.id,d.type);
  });
 }
 send(data){if(!this.ready){this.pending.push(data);return}this.frame.contentWindow.postMessage({channel:'nus-map',...data},location.origin)}
 sync(){clearTimeout(this.syncTimer);this.syncTimer=setTimeout(()=>this.send({action:'points',points:[...this.markers].map(m=>({id:m.id,lng:m.lnglat[0],lat:m.lnglat[1]}))}),0)}
 flyTo(o){this.send({action:'camera',...(o.center?{lng:o.center[0],lat:o.center[1]}:{}),...(o.zoom?{distance:Math.max(60,Math.min(3500,1600*Math.pow(2,15.7-o.zoom)))}:{}),...(o.pitch!==undefined?{pitch:o.pitch===0?89.99:90-o.pitch}:{}),...(o.bearing!==undefined?{bearing:(o.bearing+360)%360}:{})})}
 easeTo(o){this.flyTo(o)} zoomIn(){this.send({action:'zoom',factor:.7})} zoomOut(){this.send({action:'zoom',factor:1.43})}
 getLayer(){return false} isStyleLoaded(){return this.ready}
}
class StreetsMarker {
 constructor(options){this.element=options.element||document.createElement('span');if(!options.element){this.element.textContent='●';this.element.style.color=options.color||'#237bdb'}this.element.classList.add('maplibregl-marker');Object.assign(this.element.style,{position:'absolute',left:'0',top:'0',zIndex:2,display:'none'});}
 setLngLat(p){this.lnglat=p;return this} addTo(map){this.map=map;this.id='pin-'+map.sequence++;map.markers.add(this);map.container.append(this.element);map.sync();return this} remove(){this.element.remove();this.map?.markers.delete(this);this.map?.sync()}
}

