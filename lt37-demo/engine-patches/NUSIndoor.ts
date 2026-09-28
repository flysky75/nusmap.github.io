import MathUtils from '~/lib/math/MathUtils';
import Vec3 from '~/lib/math/Vec3';
export default class NUSIndoor {
 private canvas=document.createElement('canvas');private data:any=null;
 constructor(){Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'2'});document.body.append(this.canvas);}
 set(data:any){this.data=data;if(!data)this.canvas.getContext('2d').clearRect(0,0,this.canvas.width,this.canvas.height);}
 update(scene:any,terrain:any,manager:any){
 if(!this.data)return;const d=this.data,{camera,wrapper}=scene.objects,c=this.canvas,ctx=c.getContext('2d'),w=innerWidth,h=innerHeight;
 if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const bg=ctx.createRadialGradient(w*.55,h*.45,30,w*.5,h*.5,w*.8);bg.addColorStop(0,'#eeece8');bg.addColorStop(1,'#c4c1bc');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const center=MathUtils.degrees2meters(d.center[1],d.center[0]),ground=terrain.getHeightGlobalInterpolated(center.x,center.y,true)||0;
 const project=(p:number[],up=0)=>{const q=MathUtils.degrees2meters(p[1],p[0]),v=Vec3.project(new Vec3(q.x+wrapper.position.x,ground+1.5+d.floor*4+up,q.y+wrapper.position.z),camera);return{x:(v.x+1)*w/2,y:(1-v.y)*h/2,visible:v.z>0&&v.z<1};};
 const path=(ps:any[])=>{ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
 const poly=(ring:number[][],color:string,up=0,stroke='')=>{const ps=ring.map(p=>project(p,up));if(ps.some(p=>!p.visible))return;path(ps);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}};
 const lerp=(a:number[],b:number[],t:number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const wall=(a:number[],b:number[],height=2.4)=>{const ps=[project(a),project(b),project(b,height),project(a,height)];if(ps.some(p=>!p.visible))return;path(ps);ctx.fillStyle='#d7d5cf';ctx.fill();ctx.strokeStyle='#aaa79f';ctx.lineWidth=.55;ctx.stroke();ctx.beginPath();ctx.moveTo(ps[2].x,ps[2].y);ctx.lineTo(ps[3].x,ps[3].y);ctx.strokeStyle='#fffefa';ctx.lineWidth=3;ctx.stroke();};
 const solid=(ring:number[][],color:string,height=.6)=>{for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];path([project(a),project(b),project(b,height),project(a,height)]);ctx.fillStyle='#888176';ctx.fill();}poly(ring,color,height,'#a49c8e');};
 const footprint=d.ring.map((p:number[])=>project(p));if(footprint.some((p:any)=>!p.visible))return;
 ctx.save();ctx.shadowColor='#625c5155';ctx.shadowBlur=25;ctx.shadowOffsetY=15;poly(d.ring,'#e7e3dc');ctx.restore();
 for(let i=0;i<d.ring.length-1;i++)wall(d.ring[i],d.ring[i+1],.35);
 ctx.save();path(footprint);ctx.clip();
 for(const room of d.rooms){
 const r=room.ring,at=(u:number,v:number)=>lerp(lerp(r[0],r[1],u),lerp(r[3],r[2],u),v),rect=(x:number,y:number,ww:number,hh:number)=>[at(x,y),at(x+ww,y),at(x+ww,y+hh),at(x,y+hh)];
 const teach=room.kind==='teach',wood=teach||room.kind==='info';poly(r,wood?'#b8a081':'#e2dfd7');ctx.save();path(r.map((p:number[])=>project(p)));ctx.clip();
 // Fine floor joints remain perspective aligned with the room.
 for(let row=0;row<16;row++)for(let col=0;col<(wood?4:8);col++){let cols=wood?4:8;poly(rect(col/cols,row/16,1/cols,1/16),wood?(['#b5a087','#c4b197','#baa489'][(row+col)%3]):(['#ebe9e3','#deded7','#e5e3dc'][(row*3+col)%3]),.015,'#d0c8b9');}
 ctx.restore();
 if(room.key==='room-0'){
 solid(rect(.10,.82,.8,.12),'#716b63',.38);solid(rect(.40,.86,.15,.065),'#ded8cc',1.2);
 for(let row=0;row<6;row++)for(let col=0;col<10;col++){const x=.06+col*.088,y=.09+row*.108;solid(rect(x,y,.048,.050),'#6d7973',.48);solid(rect(x,y,.048,.012),'#455653',.92);}
 }else if(room.kind==='stairs'){
 for(let i=0;i<12;i++)solid(rect(.12,.08+i*.064,.35,.058),'#e5e3dc',.12+i*.14);
 solid(rect(.52,.08,.30,.82),'#aca89f',.2);
 for(let i=0;i<12;i++)solid(rect(.55,.08+i*.064,.24,.058),'#eeece7',1.65-i*.12);
 }else if(room.kind==='lift'){
 solid(rect(.15,.15,.7,.7),'#bbbdbb',.15);wall(at(.15,.15),at(.15,.85),2);wall(at(.85,.15),at(.85,.85),2);wall(at(.15,.85),at(.85,.85),2);
 }else if(room.kind==='amenity'){
 for(let i=0;i<4;i++){const x=.03+i*.24;wall(at(x,.45),at(x,.95),1.7);solid(rect(x+.05,.65,.12,.16),'#faf9f5',.5);solid(rect(x+.04,.08,.14,.12),'#f5f4ef',.85);}
 }else if(room.key==='room-5'){
 for(let i=0;i<3;i++){const x=i/3; if(i)wall(at(x,.05),at(x,.78),2.2);solid(rect(x+.055,.32,.21,.19),'#a9855f',.8);for(let j=0;j<2;j++){solid(rect(x+.075+j*.10,.23,.065,.065),'#656e65',.48);solid(rect(x+.075+j*.10,.55,.065,.065),'#656e65',.48);}solid(rect(x+.06,.84,.19,.075),'#d9d1c0',1.4);}
 }else{
 solid(rect(.08,.72,.7,.12),'#9c7955',.9);
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){const x=.17+col*.43,y=.15+row*.28;solid(rect(x,y,.19,.13),'#dbcaac',.7);solid(rect(x-.06,y,.05,.13),'#687969',.45);solid(rect(x+.20,y,.05,.13),'#687969',.45);}
 }
 // Door opening with a leaf and swing arc along the front wall.
 if(!d.walls){wall(r[0],lerp(r[0],r[1],.42));wall(lerp(r[0],r[1],.57),r[1]);wall(r[1],r[2]);wall(r[2],r[3]);wall(r[3],r[0]);}
 const a=project(at(.42,0)),b=project(at(.42,.14));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#8b7965';ctx.lineWidth=1.3;ctx.stroke();ctx.beginPath();for(let i=0;i<=16;i++){const t=i/16*Math.PI/2,p=project(at(.42+.15*Math.cos(t),.14*Math.sin(t)));i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle='#b3aa9c';ctx.lineWidth=.7;ctx.stroke();
 }
 if(d.walls)for(const edge of d.walls)wall(edge[0],edge[1]);
 ctx.restore();const sink=(window as any).__nusIndoorSink;if(sink)sink(d.rooms.map((r:any)=>({id:r.key,...project(r.center,3)})));
 }
}
