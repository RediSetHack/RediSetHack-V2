export class CtfChallengeNotFoundError extends Error {
  constructor(challengeId: number) {
    super(`CTF challenge with id ${challengeId} does not exist`);
    this.name = 'CtfChallengeNotFoundError';
  }
}

export class CtfRateLimitError extends Error {
  constructor() {
    super('Too many flag submissions. Wait a minute before trying again.');
    this.name = 'CtfRateLimitError';
  }
}
