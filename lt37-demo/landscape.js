// OSM-derived geometry. Heights and individual woodland trees are illustrative where unmapped.
function addCampusLandscape(map,details,treeData){
 const foliage=[],trunks=[],shadows=[],bands=[];
 function circle(x,y,r,n=12){const points=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;points.push([x+Math.cos(a)*r/(111320*Math.cos(y*Math.PI/180)),y+Math.sin(a)*r/111320])}return points}
 const feature=(geometry,properties)=>({type:'Feature',geometry,properties});
 for(const f of treeData.features){const [x,y]=f.geometry.coordinates,{height:h,radius:r}=f.properties;
  trunks.push(feature({type:'Polygon',coordinates:[circle(x,y,.22,8)]},{height:h*.6,base:0}));
  shadows.push(feature({type:'Polygon',coordinates:[circle(x+.000015,y-.000012,r*1.3)]},{}));
  const lower=h*.32,span=h*.68;
  for(let level=0;level<7;level++){const t=(level+.5)/7,rad=r*Math.sqrt(Math.max(.04,1-Math.pow(t*2-1,2)));foliage.push(feature({type:'Polygon',coordinates:[circle(x,y,rad)]},{base:lower+span*level/7,height:lower+span*(level+1)/7,color:['#293c22','#334a29','#3c552c','#486333','#57733d','#63814a','#769355'][level]}))}
 }
 // Subtle floor bands add facade depth while retaining the original building palette.
 for(const f of details.features){const h=f.properties.height,base=f.properties.base||0;if(h-base<8)continue;for(const ring of f.geometry.coordinates){for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.00006)continue;const nx=-dy/len*.0000011,ny=dx/len*.0000011;for(let z=base+3.3;z<h-1;z+=6.6){bands.push(feature({type:'Polygon',coordinates:[[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny]]]},{base:z,height:z+.38}))}}}
 }
 for(const [name,features] of [['tree-shadows',shadows],['tree-trunks',trunks],['tree-canopies',foliage],['building-facades',bands]])map.addSource(name,{type:'geojson',data:{type:'FeatureCollection',features}});
 map.addLayer({id:'tree-shadows',type:'fill',source:'tree-shadows',minzoom:14,paint:{'fill-color':'#283422','fill-opacity':.45}},'nus-buildings');
 map.addLayer({id:'tree-trunks',type:'fill-extrusion',source:'tree-trunks',minzoom:14.5,paint:{'fill-extrusion-color':'#655442','fill-extrusion-height':['get','height'],'fill-extrusion-base':0,'fill-extrusion-opacity':1}});
 map.addLayer({id:'tree-canopies',type:'fill-extrusion',source:'tree-canopies',minzoom:14.5,paint:{'fill-extrusion-color':['get','color'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','base'],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}});
 map.addLayer({id:'building-facades',type:'fill-extrusion',source:'building-facades',minzoom:16,paint:{'fill-extrusion-color':'#203f62','fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','base'],'fill-extrusion-opacity':1}},'roof-rims');
}
