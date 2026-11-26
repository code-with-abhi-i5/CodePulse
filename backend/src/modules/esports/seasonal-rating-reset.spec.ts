import { SeasonalRatingResetService } from './seasonal-rating-reset.service';

describe('SeasonalRatingResetService', () => {
  let service: SeasonalRatingResetService;
  beforeEach(() => { service = new SeasonalRatingResetService(); });
  it('soft resets player ratings', () => {
    const res = service.applySeasonalSoftReset([{ rating: 2000, rd: 100, vol: 0.06 }]);
    expect(res[0].rating).toBeLessThan(2000);
  });
});
