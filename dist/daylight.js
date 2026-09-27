function styleDaylightMap(map){
 function pattern(name,base,variation){const size=128,data=new Uint8Array(size*size*4);let seed=3841;for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=((seed>>>16)%101-50)/50*variation;for(let c=0;c<3;c++)data[i*4+c]=base[c]+v;data[i*4+3]=255}map.addImage(name,{width:size,height:size,data},{pixelRatio:2})}
 pattern('day-ground',[185,184,173],7);pattern('day-grass',[115,133,84],15);pattern('day-concrete',[181,179,169],10);
 for(const l of map.getStyle().layers){
  const id=l.id,source=l['source-layer']||'';
  if(source==='building'||l.type==='fill-extrusion'){map.setLayoutProperty(id,'visibility','none');continue}
  if(l.type==='background'){map.setPaintProperty(id,'background-color','#b9b8ad');map.setPaintProperty(id,'background-pattern','day-ground')}
  if(l.type==='fill'){
   const green=/park|landcover|grass|wood|forest|garden/.test(id),water=/water/.test(source),color=water?'#70898b':green?'#738554':'#b5b3a9';
   map.setPaintProperty(id,'fill-color',color);if(!water)map.setPaintProperty(id,'fill-pattern',green?'day-grass':'day-concrete');
   if(l.paint?.['fill-outline-color'])map.setPaintProperty(id,'fill-outline-color','#92968a');
  }
  if(l.type==='line'){
   const road=/transportation|road|path|street|bridge|tunnel/.test(id+' '+source),casing=/casing/.test(id),path=/path|pedestrian|footway|cycleway/.test(id);
   map.setPaintProperty(id,'line-color',road?(path?'#c5c0ad':casing?'#c4c2b7':'#727574'):'#979c8d');
   if(road)map.setPaintProperty(id,'line-opacity',1);
   if(/highway|tunnel_motorway/.test(id)&&!path){
    if(/subtle/.test(id)){map.setLayoutProperty(id,'visibility','none');continue}
    const width=/motorway/.test(id)?15:/major/.test(id)?10:5.5,extra=casing?2:0;
    map.setPaintProperty(id,'line-width',['interpolate',['exponential',2],['zoom'],12,.1,16,width*.42+extra,18,width*1.68+extra,20,width*6.72+extra]);
    if(/_inner$/.test(id)&&!/tunnel/.test(id))map.addLayer({id:id+'-lane-marks',type:'line',source:l.source,'source-layer':source,filter:l.filter,minzoom:16.5,layout:l.layout,paint:{'line-color':'#deddd1','line-width':.8,'line-dasharray':[5,7],'line-opacity':.7}});
   }
  }
  if(l.type==='symbol'){
   if(/poi|housenumber/.test(id)){map.setLayoutProperty(id,'visibility','none');continue}
   if(l.layout?.['text-field']){map.setPaintProperty(id,'text-color','#444a45');map.setPaintProperty(id,'text-halo-color','#d8d8cb');map.setPaintProperty(id,'text-halo-width',1)}
  }
 }
}
