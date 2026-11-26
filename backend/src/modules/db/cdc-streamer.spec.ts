import { CdcStreamerService } from './cdc-streamer.service';

describe('CdcStreamerService', () => {
  let service: CdcStreamerService;

  beforeEach(() => {
    service = new CdcStreamerService();
  });

  it('captures writes and batches them for destination OLAP tables', () => {
    const ev = service.captureWrite('matches', 'INSERT', null, { id: 100 });
    const batches = service.batchEventsForClickhouse([ev]);
    expect(batches['analytics_matches'].length).toBe(1);
  });
});
