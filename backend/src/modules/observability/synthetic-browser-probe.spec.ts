import { SyntheticBrowserProbeService } from './synthetic-browser-probe.service';

describe('SyntheticBrowserProbeService', () => {
  let service: SyntheticBrowserProbeService;
  beforeEach(() => { service = new SyntheticBrowserProbeService(); });
  it('executes submission journey', () => {
    const res = service.executeSubmissionJourney('p1');
    expect(res.success).toBe(true);
  });
});
