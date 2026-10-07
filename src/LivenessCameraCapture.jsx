import {useEffect,useRef,useState} from 'react';
import {apiFetch} from './api/client';

const labels={FRONT:'Face forward',TURN_LEFT:'Turn your head left',TURN_RIGHT:'Turn your head right'};
export default function LivenessCameraCapture({screeningId,onResult,onCancel}){
 const video=useRef(null),stream=useRef(null),generation=useRef(0),submitting=useRef(false),captureLock=useRef(false),request=useRef(null);
 const [attempt,setAttempt]=useState(0),[challenge,setChallenge]=useState(null),[index,setIndex]=useState(0),[frames,setFrames]=useState({}),[ready,setReady]=useState(false),[busy,setBusy]=useState(true),[capturing,setCapturing]=useState(false),[error,setError]=useState('');
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 useEffect(()=>{
  const token=++generation.current,controller=new AbortController();request.current=controller;
  submitting.current=false;captureLock.current=false;setChallenge(null);setIndex(0);setFrames({});setReady(false);setBusy(true);setCapturing(false);setError('');
  const current=()=>generation.current===token;
  const timer=setTimeout(()=>{if(current()){generation.current++;controller.abort();stop();setBusy(false);setError('Camera setup timed out. Start a new challenge.');}},30000);
  (async()=>{
   try{
    const r=await apiFetch(`/api/screening/${screeningId}/face/liveness/challenge`,{method:'POST',signal:controller.signal});const data=await r.json();
    if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'Could not start challenge.');if(!current())return;
    if(!Array.isArray(data.steps)||data.steps.length!==3||new Set(data.steps).size!==3||data.steps.some(s=>!labels[s]))throw Error('Invalid challenge. Start again.');
    setChallenge(data);
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable in this browser.');
    const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}});
    if(!current()){s.getTracks().forEach(t=>t.stop());return;}
    stream.current=s;if(video.current){video.current.srcObject=s;await video.current.play();}
    s.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(current()){setReady(false);setError('Camera disconnected. Start a new challenge.');}}));
    if(current())setBusy(false);
   }catch(e){if(current()){stop();setReady(false);setError(e.name==='NotAllowedError'?'Allow camera access, then start a new challenge.':e.message||'Could not start challenge.');setBusy(false);}}
   finally{clearTimeout(timer);}
  })();
  return()=>{clearTimeout(timer);generation.current++;controller.abort();request.current?.abort();stop();};
 },[screeningId,attempt]);
 const submit=async(all,token)=>{
  if(submitting.current||generation.current!==token)return;submitting.current=true;setCapturing(false);setBusy(true);setReady(false);setError('');stop();
  const controller=new AbortController();request.current=controller;
  const timer=setTimeout(()=>{if(generation.current===token){generation.current++;controller.abort();setBusy(false);setError('Request timed out. Reopen the screening to check its saved result before retrying.');}},60000);
  try{
   const form=new FormData();form.append('challenge_id',challenge.challenge_id);form.append('front',all.FRONT);form.append('turn_left',all.TURN_LEFT);form.append('turn_right',all.TURN_RIGHT);
   const r=await apiFetch(`/api/screening/${screeningId}/face/liveness`,{method:'POST',body:form,signal:controller.signal});const data=await r.json();
   if(generation.current!==token)return;if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'Liveness verification failed.');onResult(data);
  }catch(e){if(generation.current===token){setError(e.message||'Liveness verification failed.');submitting.current=false;setBusy(false);}}
  finally{clearTimeout(timer);}
 };
 const capture=()=>{
  if(!challenge||busy||!ready||!video.current?.videoWidth||!video.current?.videoHeight||submitting.current||captureLock.current)return;
  captureLock.current=true;setCapturing(true);const token=generation.current;
  try{
   const step=challenge.steps[index],v=video.current,canvas=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(v.videoWidth,v.videoHeight));
   canvas.width=Math.round(v.videoWidth*scale);canvas.height=Math.round(v.videoHeight*scale);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Capture unavailable.');ctx.drawImage(v,0,0,canvas.width,canvas.height);
   canvas.toBlob(blob=>{
    if(generation.current!==token)return;
    if(!blob){captureLock.current=false;setCapturing(false);setError('Capture failed. Please retry.');return;}
    const next={...frames,[step]:new File([blob],`${step.toLowerCase()}.jpg`,{type:'image/jpeg'})};setFrames(next);
    if(index<challenge.steps.length-1){setIndex(i=>i+1);}else{submit(next,token);}
   },'image/jpeg',.94);
  }catch(e){captureLock.current=false;setCapturing(false);setError(e.message||'Capture failed.');}
 };
 // Release the synchronous double-click lock only after the new step is rendered.
 useEffect(()=>{captureLock.current=false;setCapturing(false);},[index]);
 const restart=()=>{generation.current++;request.current?.abort();stop();setReady(false);setAttempt(a=>a+1);};
 const step=challenge?.steps?.[index];
 return <div className="camera-box liveness-box"><h3>Active liveness challenge</h3><p>Follow three prompts. Keep your face in view and turn slowly.</p>
 {challenge&&<div className="liveness-step"><strong>Step {index+1} of {challenge.steps.length}: {labels[step]}</strong><span>{challenge.instructions?.[step]}</span></div>}
 <video ref={video} autoPlay playsInline muted aria-label="Active liveness camera" onLoadedData={()=>{if(video.current?.videoWidth&&video.current?.videoHeight)setReady(true);}} onCanPlay={()=>{if(video.current?.videoWidth&&video.current?.videoHeight)setReady(true);}}/>
 {error&&<p role="alert">{error}</p>}{busy&&!error&&<p role="status">{submitting.current?'Checking motion…':'Starting camera…'}</p>}
 <div className="camera-actions"><button type="button" className="primary-btn" disabled={!ready||busy||capturing||!step} onClick={capture}>{capturing?'Capturing…':'Capture this step'}</button><button type="button" className="secondary-btn" disabled={busy} onClick={restart}>Start new challenge</button><button type="button" className="secondary-btn" onClick={()=>{generation.current++;request.current?.abort();stop();onCancel();}}>Cancel liveness</button></div>
 <small>Active motion check only; not certified liveness. Camera frames are not stored.</small></div>;
}
