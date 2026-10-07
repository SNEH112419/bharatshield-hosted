import React from 'react';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,act} from '@testing-library/react';
vi.mock('./api/client',()=>({apiFetch:vi.fn()}));
import {apiFetch} from './api/client';
import LivenessCameraCapture from './LivenessCameraCapture';
let blobs,stop,getUserMedia;
beforeEach(()=>{
 blobs=[];stop=vi.fn();getUserMedia=vi.fn().mockImplementation(async()=>({getTracks:()=>[{stop}],getVideoTracks:()=>[{addEventListener:vi.fn()}]}));
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia}});
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn()});
 vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(cb=>blobs.push(cb));
 apiFetch.mockImplementation(async url=>url.endsWith('/challenge')?{ok:true,json:async()=>({challenge_id:'new-token',steps:['FRONT','TURN_LEFT','TURN_RIGHT']})}:{ok:false,json:async()=>({detail:'Retry required'})});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
async function start(){render(<LivenessCameraCapture screeningId="TEST" onResult={()=>{}} onCancel={()=>{}}/>);await waitFor(()=>expect(document.querySelector('video').srcObject).toBeTruthy());const v=document.querySelector('video');Object.defineProperty(v,'videoWidth',{value:1280});Object.defineProperty(v,'videoHeight',{value:720});fireEvent.loadedData(v);await waitFor(()=>expect(screen.getByRole('button',{name:'Capture this step'}).disabled).toBe(false));}
async function finishFrame(){await act(async()=>blobs.shift()(new Blob(['frame'],{type:'image/jpeg'})));}
it('locks each frame until encoding finishes, preventing double capture',async()=>{
 await start();const button=screen.getByRole('button',{name:'Capture this step'});fireEvent.click(button);fireEvent.click(button);expect(blobs).toHaveLength(1);await finishFrame();expect(screen.getByText(/Step 2 of 3/)).toBeTruthy();
});
it('opens a fresh camera and challenge after a failed submission',async()=>{
 await start();for(let i=0;i<3;i++){fireEvent.click(screen.getByRole('button',{name:'Capture this step'}));await finishFrame();}
 expect(await screen.findByRole('alert')).toBeTruthy();expect(screen.getByRole('button',{name:'Capture this step'}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Start new challenge'}));await waitFor(()=>expect(getUserMedia).toHaveBeenCalledTimes(2));expect(apiFetch.mock.calls.filter(([u])=>u.endsWith('/challenge'))).toHaveLength(2);expect(screen.getByText(/Step 1 of 3/)).toBeTruthy();
});
