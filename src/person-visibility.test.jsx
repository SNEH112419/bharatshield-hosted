import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {EvidenceSummary} from './EvidenceReview';
afterEach(cleanup);
it('keeps an unrequested person check out of the summary',()=>{
 render(<EvidenceSummary analysis={{}} face={{status:'NOT_RUN'}}/>);
 expect(screen.queryByText('Person comparison')).toBeNull();
 expect(screen.getByText('Document checks')).toBeTruthy();
});
it('keeps skipped checks out of the summary',()=>{
 render(<EvidenceSummary analysis={{}} face={{status:'SKIPPED'}}/>);
 expect(screen.queryByText('Person comparison')).toBeNull();
});
it('shows a completed or inconclusive attempt without inventing liveness',()=>{
 render(<EvidenceSummary analysis={{}} face={{status:'INCONCLUSIVE'}}/>);
 expect(screen.getByText('Person comparison')).toBeTruthy();
 expect(screen.getByText('Face: INCONCLUSIVE')).toBeTruthy();
 expect(screen.queryByText(/Active liveness:/)).toBeNull();
});
