export class WcagBountyConfettiAnnouncer {
  getClaimAnnouncement(bountyTitle: string, xpReward: number) {
    return {
      role: 'status',
      ariaLive: 'polite',
      message: `Congratulations! You claimed ${bountyTitle} and earned ${xpReward} XP.`,
      confettiAccessibleAlt: 'Festive confetti celebration'
    };
  }
}
