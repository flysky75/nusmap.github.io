// OSM footprints and heights; facade and roof details are schematic.
async function addCampusThree(map, buildings, trees) {
 const THREE=await import('./vendor/three.module.js');
 const origin=maplibregl.MercatorCoordinate.fromLngLat([103.775,1.3]);
 const scale=origin.meterInMercatorCoordinateUnits();
 const xy=p=>{const m=maplibregl.MercatorCoordinate.fromLngLat(p);return [(m.x-origin.x)/scale,-(m.y-origin.y)/scale]};
 const scene=new THREE.Scene(),camera=new THREE.Camera();camera.up.set(0,0,1);
 const sky=new THREE.HemisphereLight(0xe2edfa,0x767461,1.5);sky.position.set(0,0,1);scene.add(sky);
 const sun=new THREE.DirectionalLight(0xfff3d9,2.6);sun.position.set(-1200,-900,1900);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-2100,right:2100,top:2100,bottom:-2100,near:10,far:5000});sun.shadow.bias=-.00012;sun.shadow.normalBias=.35;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xc3d0de,.65);fill.position.set(400,200,150);scene.add(fill);
 function texture(type){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle=type==='wall'?'#bfbcb0':'#bcbbae';x.fillRect(0,0,256,256);
  let seed=71;for(let i=0;i<6000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=seed%256;seed=(Math.imul(seed,1664525)+1013904223)>>>0;x.fillStyle=i%2?'rgba(255,255,255,.05)':'rgba(0,0,0,.06)';x.fillRect(a,seed%256,1,1)}
  if(type==='wall'){
   x.fillStyle='#8c8b81';x.fillRect(0,244,256,12);x.fillStyle='#dbd8ca';x.fillRect(0,240,256,3);
   x.fillStyle='#565e5d';x.fillRect(24,38,208,161);x.fillStyle='#263335';x.fillRect(28,42,200,153);
   const g=x.createLinearGradient(35,45,210,195);g.addColorStop(0,'#6d8084');g.addColorStop(.45,'#3c5056');g.addColorStop(1,'#899997');x.fillStyle=g;x.fillRect(33,50,190,138);
   x.fillStyle='rgba(167,202,225,.13)';x.beginPath();x.moveTo(34,50);x.lineTo(155,50);x.lineTo(90,187);x.lineTo(34,187);x.fill();
   x.fillStyle='#a9a99f';x.fillRect(124,45,6,148);x.fillRect(28,116,200,4);x.fillStyle='#303b3b';x.fillRect(29,43,198,8);
   x.fillStyle='#dad7cb';x.fillRect(22,197,212,5);x.fillStyle='#7a7b70';x.fillRect(22,202,212,5);
   }else{for(let i=0;i<150;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const px=seed%256;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const py=seed%256;x.fillStyle=i%2?'rgba(81,77,60,.055)':'rgba(245,242,222,.065)';x.fillRect(px,py,12+i%33,8+i%25)} x.strokeStyle='rgba(21,35,50,.28)';x.lineWidth=2;for(let i=0;i<=256;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke()} }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
 }
 const loader=new THREE.TextureLoader();
 const [facadeTexture,roofTexture]=await Promise.all([loader.loadAsync('textures/facade.png'),loader.loadAsync('textures/roof.png')]);
 for(const t of [facadeTexture,roofTexture]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;}
 const wallMat=new THREE.MeshStandardMaterial({map:facadeTexture,bumpMap:facadeTexture,bumpScale:.09,roughness:.82,metalness:.04,color:0xffffff,side:THREE.DoubleSide});
 const roofMat=new THREE.MeshStandardMaterial({map:roofTexture,bumpMap:roofTexture,bumpScale:.16,roughness:.95,color:0xffffff,side:THREE.DoubleSide});
 const trimMat=new THREE.MeshStandardMaterial({color:0xbab8ab,roughness:.78});
 const metalMat=new THREE.MeshStandardMaterial({color:0x8b918e,roughness:.53,metalness:.35});
 const darkMat=new THREE.MeshStandardMaterial({color:0x414944,roughness:.8});
 const walls={p:[],uv:[]},roofs={p:[],uv:[]},trims=[],equipment=[],vents=[];
 function tri(buf,a,b,c,uv){buf.p.push(...a,...b,...c);buf.uv.push(...uv)}
 function quad(buf,a,b,c,d,u,v){tri(buf,a,b,d,[0,0,u,0,0,v]);tri(buf,b,c,d,[u,0,u,v,0,v])}
 function inside(p,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
 function beam(a,b,z,width,height,list){const dx=b[0]-a[0],dy=b[1]-a[1];list.push({x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:z+height/2,w:Math.hypot(dx,dy),d:width,h:height,angle:Math.atan2(dy,dx)})}
 for(const f of buildings.features){
  const rings=f.geometry.coordinates.map(r=>r.slice(0,-1).map(xy));const h=f.properties.height,b=f.properties.base||0;if(h<=b)continue;
  const levels=Math.max(1,Math.round((h-b)/3.4)),floor=(h-b)/levels;
  for(const r of rings)for(let i=0;i<r.length;i++){const a=r[i],c=r[(i+1)%r.length],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<.1)continue;
   quad(walls,[...a,b],[...c,b],[...c,h],[...a,h],Math.max(1,Math.round(len/3.2))/4,levels/4);
   beam(a,c,h,.35,.65,trims);
   if(len>5)for(let z=b+floor;z<h-.5;z+=floor)beam(a,c,z-.14,.27,.18,trims);
  }
  const contour=rings[0].map(p=>new THREE.Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new THREE.Vector2(...p))),all=[...contour,...holes.flat()];
  for(const t of THREE.ShapeUtils.triangulateShape(contour,holes)){const ps=t.map(i=>all[i]);tri(roofs,...ps.map(p=>[p.x,p.y,h]),ps.flatMap(p=>[p.x/22,p.y/22]))}
  const r=rings[0],xs=r.map(p=>p[0]),ys=r.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);let count=0;
  for(let ix=1;ix<5&&count<4;ix++)for(let iy=1;iy<5&&count<4;iy++){
   const x=xmin+(xmax-xmin)*ix/5,y=ymin+(ymax-ymin)*iy/5,w=3.6,d=2.3;
   if([[-w,-d],[w,-d],[w,d],[-w,d]].every(q=>inside([x+q[0],y+q[1]],r)&&!rings.slice(1).some(hole=>inside([x+q[0],y+q[1]],hole)))){
    equipment.push({x,y,z:h+.65,w,d,h:1.3,angle:0});vents.push({x,y,z:h+1.34,w:w*.78,d:d*.72,h:.12,angle:0});
    for(let j=-2;j<=2;j++)trims.push({x:x+j*.48,y,z:h+1.44,w:.07,d:d*.72,h:.07,angle:0});count++;
   }
  }
 }
 const resources=[];
 const groundGeometry=new THREE.PlaneGeometry(14000,14000),groundMaterial=new THREE.ShadowMaterial({opacity:.3,depthWrite:false});
 const ground=new THREE.Mesh(groundGeometry,groundMaterial);ground.position.z=.04;ground.receiveShadow=true;ground.frustumCulled=false;scene.add(ground);resources.push(groundGeometry);
 function mesh(buf,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(buf.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(buf.uv,2));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;scene.add(m);resources.push(g)}
 mesh(walls,wallMat);mesh(roofs,roofMat);
 function boxes(list,mat){const g=new THREE.BoxGeometry(1,1,1),m=new THREE.InstancedMesh(g,mat,list.length),o=new THREE.Object3D();list.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.rotation.set(0,0,p.angle);o.scale.set(p.w,p.d,p.h);o.updateMatrix();m.setMatrixAt(i,o.matrix)});m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;scene.add(m);resources.push(g)}
 boxes(trims,trimMat);boxes(equipment,metalMat);boxes(vents,darkMat);
 // Clustered crowns give the existing OSM/schematic tree locations a softer silhouette.
 const treeMaterials=[];
 if(trees){
  const bark=new THREE.MeshStandardMaterial({color:0x6b5b43,roughness:1});
  const leaves=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95});treeMaterials.push(bark,leaves);
  const trunkGeo=new THREE.CylinderGeometry(.2,.32,1,6);trunkGeo.rotateX(Math.PI/2);
  const crownGeo=new THREE.IcosahedronGeometry(1,1);resources.push(trunkGeo,crownGeo);
  const trunks=new THREE.InstancedMesh(trunkGeo,bark,trees.features.length),crowns=new THREE.InstancedMesh(crownGeo,leaves,trees.features.length*5),o=new THREE.Object3D();
  trees.features.forEach((f,i)=>{const [x,y]=xy(f.geometry.coordinates),h=f.properties.height,r=f.properties.radius;
   o.position.set(x,y,h*.28);o.scale.set(1,1,h*.56);o.rotation.set(0,0,0);o.updateMatrix();trunks.setMatrixAt(i,o.matrix);
   for(let j=0;j<5;j++){const a=j*2.399+i*.17;o.position.set(x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4,h*(.62+(j%3)*.09));o.scale.set(r*.78,r*.76,h*.25);o.rotation.set(i*.3,j*.4,a);o.updateMatrix();crowns.setMatrixAt(i*5+j,o.matrix);crowns.setColorAt(i*5+j,new THREE.Color(['#3b532e','#4c6634','#57773e','#637e45','#456235'][(i+j)%5]))}
  });
  for(const m of [trunks,crowns]){m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;scene.add(m)}
  crowns.instanceColor.needsUpdate=true;
 }
 let renderer;
 const layer={id:'nus-three-buildings',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new THREE.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;},
  render(gl,args){const projection=new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);const local=new THREE.Matrix4().makeTranslation(origin.x,origin.y,0).scale(new THREE.Vector3(scale,-scale,scale));camera.projectionMatrix.copy(projection).multiply(local);renderer.resetState();renderer.render(scene,camera);},
  onRemove(){resources.forEach(g=>g.dispose());[wallMat,roofMat,trimMat,metalMat,darkMat,groundMaterial,...treeMaterials].forEach(m=>{m.map?.dispose();m.dispose()});renderer?.dispose();}
 };
 map.addLayer(layer,'selected-building');
 // Keep the transparent footprint layer for existing map selection and hover behavior.
 map.setPaintProperty('nus-buildings','fill-extrusion-opacity',0);
 for(const id of ['building-facades','roof-rims',...(trees?['tree-canopies','tree-trunks']:[])])if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');
 return layer;
}

