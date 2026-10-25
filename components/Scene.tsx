"use client";
import {Canvas,useFrame} from "@react-three/fiber";
import {Float,OrbitControls,Points,PointMaterial} from "@react-three/drei";
import {useMemo,useRef} from "react";
import * as THREE from "three";
function Cloud(){const ref=useRef<THREE.Points>(null);const positions=useMemo(()=>{const a=new Float32Array(1800);for(let i=0;i<a.length;i+=3){const r=3.1+Math.random()*1.5,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);a[i]=r*Math.sin(p)*Math.cos(t);a[i+1]=r*Math.sin(p)*Math.sin(t);a[i+2]=r*Math.cos(p)}return a},[]);useFrame((_,d)=>{if(ref.current){ref.current.rotation.y+=d*.08;ref.current.rotation.x=Math.sin(Date.now()*.0002)*.08}});return <Points ref={ref} positions={positions} stride={3} frustumCulled><PointMaterial transparent color="#a78bfa" size={.022} sizeAttenuation depthWrite={false}/></Points>}
export default function Scene(){return <div className="absolute inset-0"><Canvas camera={{position:[0,0,8],fov:48}}><ambientLight intensity={.25}/><Float speed={1.2} rotationIntensity={.25} floatIntensity={.5}><Cloud/></Float><OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={.25}/></Canvas></div>}
