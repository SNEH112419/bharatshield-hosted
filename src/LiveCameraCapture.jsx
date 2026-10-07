import {useEffect,useRef,useState} from 'react';

export default function LiveCameraCapture({onCapture,onCancel}){
 const video=useRef(null),stream=useRef(null),active=useRef(false),busy=useRef(false),session=useRef(0);
 const [attempt,setAttempt]=useState(0),[ready,setReady]=useState(false),[error,setError]=useState(''),[capturing,setCapturing]=useState(false);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 useEffect(()=>{
  let current=true;active.current=true;session.current++;busy.current=false;setCapturing(false);setError('');setReady(false);
  if(!navigator.mediaDevices?.getUserMedia){setError('Camera unavailable. Use localhost in a supported browser, or upload a photo.');return()=>{active.current=false;};}
  navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}}).then(async s=>{
   if(!current){s.getTracks().forEach(t=>t.stop());return;}
   stream.current=s;if(video.current){video.current.srcObject=s;try{await video.current.play();}catch{if(current)setError('Camera preview could not play. Retry the camera.');}}
   s.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(current){setReady(false);setError('Camera disconnected. Reconnect it and retry.');}}));
  }).catch(e=>{if(current)setError(e.name==='NotAllowedError'?'Camera permission denied. Allow access in your browser, then retry.':e.name==='NotFoundError'?'No camera found. Connect a webcam or upload a photo.':'Camera could not start. Close other camera apps and retry.');});
  return()=>{current=false;active.current=false;session.current++;stop();};
 },[attempt]);
 const capture=()=>{
  if(busy.current||!ready||!video.current?.videoWidth||!video.current?.videoHeight)return;
  busy.current=true;setCapturing(true);setError('');const token=session.current;
  try{
   const v=video.current,canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(v.videoWidth,v.videoHeight));
   canvas.width=Math.round(v.videoWidth*scale);canvas.height=Math.round(v.videoHeight*scale);
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Capture unavailable.');
   ctx.drawImage(v,0,0,canvas.width,canvas.height);
   canvas.toBlob(blob=>{if(!active.current||session.current!==token)return;busy.current=false;setCapturing(false);if(!blob){setError('Capture failed. Please retry.');return;}stop();setReady(false);onCapture(new File([blob],'live-person.jpg',{type:'image/jpeg'}));},'image/jpeg',.94);
  }catch{busy.current=false;setCapturing(false);setError('Capture failed. Please retry.');}
 };
 const markReady=()=>{if(video.current?.videoWidth&&video.current?.videoHeight){setReady(true);setError('');}};
 return <div className="camera-box"><p>Face forward, keep your whole face visible and use even lighting.</p>
 <div className="person-camera-stage"><video ref={video} autoPlay playsInline muted aria-label="Live person camera" onLoadedData={markReady} onCanPlay={markReady}/><span className="camera-guide" aria-hidden="true"/></div>
 <small className="camera-caption">Positioning guide only. Face detection runs after capture.</small>
 {error&&<p role="alert">{error}</p>}
 <div className="camera-actions"><button type="button" className="primary-btn" disabled={!ready||capturing} onClick={capture}>{capturing?'Capturing…':'Capture person'}</button><button type="button" className="secondary-btn" onClick={()=>{session.current++;stop();setReady(false);setAttempt(a=>a+1);}}>Retry camera</button><button type="button" className="secondary-btn" onClick={()=>{active.current=false;session.current++;stop();onCancel();}}>Close camera</button></div>
 </div>;
}
