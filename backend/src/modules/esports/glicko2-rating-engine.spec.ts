import { Glicko2RatingEngineService } from './glicko2-rating-engine.service';

describe('Glicko2RatingEngineService', () => {
  let service: Glicko2RatingEngineService;
  beforeEach(() => { service = new Glicko2RatingEngineService(); });
  it('updates rating on victory', () => {
    const updated = service.updateRating({ rating: 1500, rd: 200, vol: 0.06 }, { rating: 1400, rd: 150, vol: 0.06 }, 1);
    expect(updated.rating).toBeGreaterThan(1500);
  });
});
