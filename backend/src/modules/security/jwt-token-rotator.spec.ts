import { JwtTokenRotatorService } from './jwt-token-rotator.service';

describe('JwtTokenRotatorService', () => {
  let service: JwtTokenRotatorService;

  beforeEach(() => {
    service = new JwtTokenRotatorService();
  });

  it('rotates refresh tokens and blocks replay of previously rotated tokens', () => {
    const initial = service.issueRefreshToken('u1');
    const rot1 = service.rotateRefreshToken(initial.token, 'u1');
    expect(rot1.success).toBe(true);

    const replay = service.rotateRefreshToken(initial.token, 'u1');
    expect(replay.success).toBe(false);
  });
});
