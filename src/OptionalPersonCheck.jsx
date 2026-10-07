import {useEffect,useRef,useState} from 'react';
import {apiFetch} from './api/client';
import LiveCameraCapture from './LiveCameraCapture';
import LivenessCameraCapture from './LivenessCameraCapture';
import './person-check.css';

export default function OptionalPersonCheck({screening,onResult,onLivenessResult}){
 const saved=screening.result?.ai_analysis?.face||{status:'NOT_RUN'};
 const liveness=screening.result?.ai_analysis?.liveness||{status:'NOT_RUN'};
 const identityHistory=screening.result?.ai_analysis?.identity_history||liveness.identity_history||{status:'NOT_RUN',candidates:[]};
 const [enabled,setEnabled]=useState(false),[camera,setCamera]=useState(false),[livenessCamera,setLivenessCamera]=useState(false),[photo,setPhoto]=useState(null),[source,setSource]=useState(''),[preview,setPreview]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const request=useRef(null),generation=useRef(0),working=useRef(false);
 const cancel=()=>{generation.current++;request.current?.abort();request.current=null;working.current=false;setBusy(false);setCamera(false);setLivenessCamera(false);setPhoto(null);};
 useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
 useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 const choose=(file,kind)=>{setCamera(false);setLivenessCamera(false);setPhoto(null);setSource('');setError('');setNotice('');
  const type=file?.type||({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[file?.name?.split('.').pop()?.toLowerCase()]);
  if(!file||!['image/png','image/jpeg','image/webp'].includes(type)||!file.size||file.size>10*1024*1024){setError('Use a JPG, PNG or WEBP up to 10 MiB.');return;}setPhoto(file);setSource(kind);
 };
 async function send(skip=false){
  if(working.current||(!skip&&!photo))return;working.current=true;setBusy(true);setError('');setNotice('');
  const token=++generation.current,controller=new AbortController();request.current=controller;
  const timeout=setTimeout(()=>{if(generation.current!==token)return;generation.current++;controller.abort();working.current=false;setBusy(false);setError('Comparison timed out. Reopen this screening to check whether the server saved the attempt before retrying.');},60000);
  try{
   const form=new FormData();if(!skip){form.append('photo',photo);form.append('capture_source',source);}
   const response=await apiFetch(`/api/screening/${screening.id}/face${skip?'/skip':''}`,{method:'POST',...(!skip?{body:form}:{}),signal:controller.signal});
   const data=await response.json();if(generation.current!==token)return;
   if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'Comparison request failed.');
   onResult(data);setPhoto(null);setEnabled(false);setNotice(skip?'Person check skipped.':'Comparison saved. See the result above.');
  }catch(e){if(generation.current===token)setError(e.message||'Local comparison failed.');}
  finally{clearTimeout(timeout);if(generation.current===token){working.current=false;setBusy(false);request.current=null;}}
 }
 const attempted=!!saved.status&&!['NOT_RUN','SKIPPED','OPTIONAL_NOT_RUN'].includes(saved.status);
 const locked=['Verified','Recapture requested'].includes(screening.status)||screening.review?.state==='RESOLVED';
 const label=value=>String(value||'Not run').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
 const faceMessage=saved.status==='REVIEW_REQUIRED'?'Comparison complete. Review similarity and the original images.':saved.status==='NOT_RUN'?'Add a camera capture or upload a photo to begin.':saved.status==='SKIPPED'?'Person comparison skipped.':saved.reason||label(saved.status);
 return <section className="panel face-panel optional-person">
 <div className="person-heading"><div><span className="person-eyebrow">OPTIONAL CHECK</span><h2>Person comparison</h2><p>Compare the document portrait with a live capture or uploaded photo.</p></div><span className="person-local">Local processing</span></div>
 {attempted&&<><div className="person-result" role="status"><strong>{saved.status==='REVIEW_REQUIRED'?'Ready for officer review':label(saved.status)}</strong><p>{faceMessage}</p></div>
 <div className="person-metrics"><div><small>Face similarity</small><strong>{saved.cosine_similarity!==undefined?Number(saved.cosine_similarity).toFixed(3):'—'}</strong><span>Similarity score, not an identity verdict</span></div><div><small>Document / person faces</small><strong>{saved.face_counts?.document??'—'} / {saved.face_counts?.person??'—'}</strong><span>One face required in each image</span></div><div><small>Active liveness</small><strong>{label(liveness.status)}</strong><span>{liveness.status==='PASSED_ACTIVE_CHALLENGE'?'Motion challenge completed':'Separate camera challenge'}</span></div></div></>}
 {liveness.status==='RETRY_REQUIRED'&&<p className="review-warning">{liveness.reason||'Please repeat the head-turn challenge.'}</p>}
 {identityHistory.requires_review&&<div className="identity-history-box"><strong>Identity-history review required</strong><p>A similar face is linked to different recorded details. Review the candidates.</p>{(identityHistory.candidates||[]).slice(0,5).map(c=><div className="identity-candidate" key={c.screening_id}><strong>{c.person_name}</strong> · {c.document_number}<br/><small>{c.screening_id} · similarity {c.cosine_similarity} · {(c.identity_differences||[]).join(', ')}</small></div>)}</div>}
 {(enabled||attempted)&&<details className="person-details"><summary>Evidence and privacy details</summary>
 <p>{saved.reason||'No comparison recorded.'}</p><p>{liveness.reason||'Liveness has not been assessed.'}</p>
 {saved.capture_source&&<p>Source: {label(saved.capture_source)} · Recorded by {saved.performed_by} at {saved.performed_at}</p>}
 <p>Face similarity requires officer review. Active motion challenges are not certified presentation-attack detection.</p>
 <p>Comparison photos and raw liveness frames are not stored. A passed challenge can retain an encrypted biometric template for local identity-history review.</p>
 {saved.model&&<p>Model: {saved.model}</p>}{saved.face_quality&&<pre>{JSON.stringify(saved.face_quality,null,2)}</pre>}
 <p>Identity history: {label(identityHistory.status)}. Detailed evidence is available in the export.</p>
 </details>}
 {attempted&&saved.status==='REVIEW_REQUIRED'&&<div className="liveness-actions">
  <button type="button" className="primary-btn" disabled={busy||livenessCamera||locked} onClick={()=>{setLivenessCamera(true);setEnabled(false);setCamera(false);setPhoto(null);setError('');setNotice('');}}>Run active liveness challenge</button>
  {liveness.status==='PASSED_ACTIVE_CHALLENGE'&&<strong className="liveness-pass">Active challenge passed</strong>}
  {liveness.status==='RETRY_REQUIRED'&&<strong className="review-warning">Liveness retry required</strong>}
 </div>}
 {livenessCamera&&<LivenessCameraCapture screeningId={screening.id} onCancel={()=>setLivenessCamera(false)} onResult={value=>{setLivenessCamera(false);onLivenessResult?.(value);setNotice(value.status==='PASSED_ACTIVE_CHALLENGE'?'Active liveness challenge saved.':'Liveness challenge saved; review or retry the result.');}}/>}

 {locked?<p>This case has a final decision. Reopen its supervisor review or start a new screening before adding another comparison.</p>:<>
 <label><input type="checkbox" checked={enabled} disabled={busy} onChange={e=>{cancel();setEnabled(e.target.checked);setError('');setNotice('');}}/> Enable optional person comparison</label>
 {!enabled&&!attempted&&<button type="button" className="secondary-btn" disabled={busy||saved.status==='SKIPPED'} onClick={()=>send(true)}>Skip person check</button>}
 {enabled&&<><p className="person-consent">Use with the person’s knowledge. A passed liveness challenge may retain an encrypted face template. See privacy details above.</p>
 <div className="batch-switch"><button type="button" className="secondary-btn" disabled={busy} onClick={()=>{setPhoto(null);setLivenessCamera(false);setCamera(true);setError('');}}>Open live camera</button>
 <label className="secondary-btn">Upload photo<input aria-label="Upload consented test photo" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{if(e.target.files[0])choose(e.target.files[0],'UPLOADED_PHOTO');e.target.value='';}}/></label></div>
 {camera&&<LiveCameraCapture onCapture={f=>choose(f,'LIVE_CAMERA')} onCancel={()=>setCamera(false)}/>}
 {photo&&<><div className="person-preview"><figure><img src={`/api/screening/${screening.id}/image?view=original`} alt="Document photograph reference"/><figcaption>Document reference</figcaption></figure><figure><img src={preview} alt="Person capture awaiting comparison" onError={()=>{setPhoto(null);setError("This image cannot be opened. Choose a different JPG, PNG or WEBP.");}}/><figcaption>{source==='LIVE_CAMERA'?'Camera capture':'Uploaded test photo'}</figcaption></figure></div>
 <button type="button" className="primary-btn" disabled={busy} onClick={()=>send(false)}>Compare locally</button><button type="button" className="secondary-btn" disabled={busy} onClick={()=>{setPhoto(null);if(source==='LIVE_CAMERA')setCamera(true);}}>Retake / choose another</button></>}
 {!attempted&&!busy&&<button type="button" className="secondary-btn" onClick={()=>{cancel();setEnabled(false);send(true);}}>Skip person check</button>}
 </>}
 </>}
 {busy&&<p role="status">Running local person check…</p>}{busy&&<button type="button" className="secondary-btn" onClick={()=>{cancel();setEnabled(false);setNotice('Request cancelled locally. The server may already have saved it; reopen the screening to check.');}}>Cancel comparison</button>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
