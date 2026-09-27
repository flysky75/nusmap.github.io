import NUSIsland from './NUSIsland';
import SystemManager from './SystemManager';
import ControlsSystem from './systems/ControlsSystem';
import SceneSystem from './systems/SceneSystem';
import TerrainSystem from './systems/TerrainSystem';
import MapTimeSystem from './systems/MapTimeSystem';
import MathUtils from '~/lib/math/MathUtils';
import Vec3 from '~/lib/math/Vec3';

export default class NUSBridge {
 private points: {id: string; lng: number; lat: number}[] = [];
 private ready = false; private island = new NUSIsland();
 private last = 0;
 private buildings: any[] = [];
 public constructor(private manager: SystemManager) {
  window.addEventListener('message', event => {
   if(event.origin !== location.origin || event.source !== parent || event.data?.channel !== 'nus-map') return;
   const d=event.data, controls=this.manager.getSystem(ControlsSystem);
   if(d.action==='buildings'){this.buildings=d.features;return;}
   if(d.action==='points'){this.points=d.points;return;}
   if(!this.ready || !controls) return;
   const state=controls.getCurrentStateHash().split(',').map(Number);
   if(d.action==='camera') controls.setState(d.lat??state[0],d.lng??state[1],d.pitch??state[2],d.bearing??state[3],d.distance??state[4]);
   if(d.action==='zoom') controls.setState(state[0],state[1],state[2],state[3],Math.max(30,Math.min(3500,state[4]*d.factor)));
  });
  let down=[0,0];const canvas=document.getElementById('canvas');
  canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  canvas.addEventListener('pointerup',e=>{
   if(e.button!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;
   const scene=this.manager.getSystem(SceneSystem);if(!scene?.objects)return;
   const {camera,wrapper}=scene.objects,terrain=this.manager.getSystem(TerrainSystem).terrainHeightProvider;
   const inside=(p:number[],r:number[][]):boolean=>{let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit;};
   let selected:any=null,depth=Infinity;
   for(const f of this.buildings){const ring=f.geometry.coordinates[0],center=MathUtils.degrees2meters(f.properties.lat,f.properties.lng),ground=terrain.getHeightGlobalInterpolated(center.x,center.y,true)||0;
    const project=(ll:number[],h:number):number[]=>{const p=MathUtils.degrees2meters(ll[1],ll[0]);const v=Vec3.project(new Vec3(p.x+wrapper.position.x,ground+h,p.y+wrapper.position.z),camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2,v.z]};
    const top=ring.map((p:number[])=>project(p,f.properties.height||12)),bottom=ring.map((p:number[])=>project(p,0));
    const polygons=[top,...top.slice(1).map((_:number[],i:number)=>[top[i],top[i+1],bottom[i+1],bottom[i]])];
    for(const polygon of polygons){const z=polygon.reduce((n:number,p:number[])=>n+p[2],0)/polygon.length;if(z>0&&z<1&&z<depth&&inside([e.clientX,e.clientY],polygon)){depth=z;selected=f;}}
   }
   if(selected)parent.postMessage({channel:'nus-map',event:'building',id:selected.properties.id.replace('osm-','')},location.origin);
  });
 }
 public update(): void {
  const scene=this.manager.getSystem(SceneSystem),controls=this.manager.getSystem(ControlsSystem);
  if(!scene?.objects || !controls || performance.now()-this.last<50)return;
  this.last=performance.now();
  if(!this.ready){this.ready=true;this.manager.getSystem(MapTimeSystem).setState(2);parent.postMessage({channel:'nus-map',event:'ready'},location.origin);}
  const {wrapper,camera}=scene.objects;
  const terrain=this.manager.getSystem(TerrainSystem).terrainHeightProvider;
  this.island.update(scene,terrain);
  const points=this.points.map(p=>{const q=MathUtils.degrees2meters(p.lat,p.lng),height=terrain.getHeightGlobalInterpolated(q.x,q.y,true)||0;
   const v=Vec3.project(new Vec3(q.x+wrapper.position.x,height+4,q.y+wrapper.position.z),camera);
   return {id:p.id,x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<1.15&&Math.abs(v.y)<1.15};
  });
  parent.postMessage({channel:'nus-map',event:'frame',points,state:controls.getCurrentStateHash()},location.origin);
 }
}

