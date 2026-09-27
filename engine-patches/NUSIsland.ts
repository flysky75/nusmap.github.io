import MathUtils from '~/lib/math/MathUtils';
import Vec3 from '~/lib/math/Vec3';

// A map-space campus cutout; the navigation lives outside this canvas.
export default class NUSIsland {
 private canvas=document.createElement('canvas');
 private rings: number[][][]=[];
 private hexes: number[][][]=[];
 constructor(){
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'1'});
  document.body.append(this.canvas);
  fetch('../campus-boundaries.geojson').then(r=>r.json()).then(data=>{
   this.rings=data.features.flatMap((f:any)=>f.geometry.type==='Polygon'?[f.geometry.coordinates[0]]:f.geometry.coordinates.map((p:any)=>p[0])).map((r:number[][])=>r.map(p=>{const q=MathUtils.degrees2meters(p[1],p[0]);return [q.x,q.y]}));
  });
  const center=MathUtils.degrees2meters(1.298,103.776),s=32;
  for(let row=-65;row<=65;row++)for(let col=-65;col<=65;col++){
   const x=center.x+col*s*1.5,z=center.y+(row+(col%2)/2)*s*Math.sqrt(3);
   this.hexes.push(Array.from({length:6},(_,i)=>[x+Math.cos(i*Math.PI/3)*s,z+Math.sin(i*Math.PI/3)*s]));
  }
 }
 update(scene:any,terrain:any){
  if(!this.rings.length)return;
  const w=innerWidth,h=innerHeight,c=this.canvas,ctx=c.getContext('2d');
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  ctx.clearRect(0,0,w,h);
  const {camera,wrapper}=scene.objects;
  const project=(p:number[],height:number)=>{const v=Vec3.project(new Vec3(p[0]+wrapper.position.x,height,p[1]+wrapper.position.z),camera);return [(v.x+1)*w/2,(1-v.y)*h/2,v.z]};
  const rings=this.rings.map(r=>{
   const source=r.map(p=>Vec3.applyMatrix4(new Vec3(p[0]+wrapper.position.x,(terrain.getHeightGlobalInterpolated(p[0],p[1],true)||0)+2,p[1]+wrapper.position.z),camera.matrixWorldInverse));
   const clipped:Vec3[]=[];
   for(let i=0;i<source.length;i++){const a=source[i],b=source[(i+1)%source.length],ai=a.z<=-1,bi=b.z<=-1;if(ai)clipped.push(a);if(ai!==bi){const t=(-1-a.z)/(b.z-a.z);clipped.push(new Vec3(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,-1));}}
   return clipped.map(p=>{const v=Vec3.applyMatrix4(p,camera.projectionMatrix);return [(v.x+1)*w/2,(1-v.y)*h/2,v.z]});
  });
  const path=new Path2D();path.rect(0,0,w,h);
  for(const ring of rings){if(ring.length<3)continue;ring.forEach((p,i)=>i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]));path.closePath();}
  ctx.save();ctx.clip(path,'evenodd');
  const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#194f81');gradient.addColorStop(1,'#297bb4');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.beginPath();
  for(const hex of this.hexes){const center=project([(hex[0][0]+hex[3][0])/2,(hex[0][1]+hex[3][1])/2],0);if(center[2]<=0||center[2]>=1||center[0]<-250||center[0]>w+250||center[1]<-250||center[1]>h+250)continue;const ps=hex.map(p=>project(p,0));if(ps.some(p=>p[2]<=0||p[2]>=1)||ps.every(p=>p[0]<-80||p[0]>w+80||p[1]<-80||p[1]>h+80))continue;ps.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
  ctx.strokeStyle='#55b9ee';ctx.lineWidth=1.2;ctx.shadowColor='#64ceff';ctx.shadowBlur=5;ctx.stroke();ctx.restore();
  for(const ring of rings){if(ring.some(p=>p[2]>=1))continue;ctx.beginPath();ring.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.shadowColor='#3bdbff';ctx.shadowBlur=16;ctx.strokeStyle='#63e8ff';ctx.lineWidth=4;ctx.stroke();ctx.shadowBlur=6;ctx.strokeStyle='#eaffff';ctx.lineWidth=1.5;ctx.stroke();}ctx.shadowBlur=0;
 }
}


