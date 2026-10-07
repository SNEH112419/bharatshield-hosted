import numpy as np
from app import local_analysis

def row():
    return np.array([[64,32,100,120,80,60,120,60,100,90,85,110,115,110,.95]],dtype=np.float32)

def test_retry_maps_rectangles_and_landmarks_to_original_frame():
    class Detector:
        def __init__(self): self.calls=[]
        def setInputSize(self,size): self.size=size
        def detect(self,img):
            self.calls.append(self.size)
            return None,row() if max(self.size)==640 else None
    d=Detector();out=local_analysis.detect_faces(np.zeros((900,1600,3),np.uint8),d)
    assert d.calls==[(1600,900),(960,540),(640,360)]
    np.testing.assert_allclose(out[0,:14],row()[0,:14]*2.5)
    assert out[0,14]==row()[0,14]

def test_retry_preserves_multiple_faces_instead_of_choosing_largest():
    class Detector:
        def setInputSize(self,size): self.size=size
        def detect(self,img): return None,None if max(self.size)>640 else np.concatenate([row(),row()])
    assert len(local_analysis.detect_faces(np.zeros((720,1280,3),np.uint8),Detector()))==2

def test_no_face_remains_no_face_after_bounded_retries():
    class Detector:
        def __init__(self): self.calls=0
        def setInputSize(self,size): pass
        def detect(self,img): self.calls+=1;return None,None
    d=Detector();assert local_analysis.detect_faces(np.zeros((720,1280,3),np.uint8),d) is None
    assert d.calls==3
