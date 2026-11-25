import { TournamentBracketGeneratorService } from './tournament-bracket-generator.service';

describe('TournamentBracketGeneratorService', () => {
  let service: TournamentBracketGeneratorService;
  beforeEach(() => { service = new TournamentBracketGeneratorService(); });
  it('generates brackets with power of two seeding', () => {
    const b = service.generateDoubleEliminationBracket(['a', 'b']);
    expect(b.length).toBeGreaterThan(0);
  });
});
