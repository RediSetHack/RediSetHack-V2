import { Quest, QuestQuestion } from './domain/entities/quest.entity.js';
import { QuestResult } from './domain/entities/quest-result.entity.js';
import { QuestSession } from './domain/entities/quest-session.entity.js';
import { QuestRepository } from './domain/ports/quest.repository.js';

// Stateful in-memory QuestRepository that honours the port's session
// contract (single active session per learner and Quest, one-way finalize),
// shared by the use-case and HTTP specs. `quest` and `questions` are mutable
// so a spec can simulate an authoring edit between start and submit.
export class FakeQuestRepository implements QuestRepository {
  sessions = new Map<number, QuestSession>();
  results = new Map<number, QuestResult>();
  xpClaims = new Set<string>();
  private nextSessionId = 1;
  private nextResultId = 1;

  constructor(
    public quest: Quest,
    public questions: QuestQuestion[],
  ) {}

  async findAll() {
    return [this.quest];
  }
  async findById(questId: number) {
    return questId === this.quest.id ? this.quest : null;
  }
  async findQuestions(questId: number) {
    return questId === this.quest.id ? this.questions : [];
  }
  async findPassedQuestIds(userId: string) {
    return new Set(
      [...this.results.values()]
        .filter((r) => r.userId === userId && r.passed)
        .map((r) => r.questId),
    );
  }
  async findActiveSession(userId: string, questId: number) {
    return (
      [...this.sessions.values()].find(
        (s) =>
          s.userId === userId && s.questId === questId && s.status === 'active',
      ) ?? null
    );
  }
  async findSessionById(sessionId: number) {
    return this.sessions.get(sessionId) ?? null;
  }
  async createSession(input: Parameters<QuestRepository['createSession']>[0]) {
    const existing = await this.findActiveSession(input.userId, input.questId);
    if (existing) return existing;
    const session = new QuestSession(
      this.nextSessionId++,
      input.userId,
      input.questId,
      input.questions,
      input.passingScore,
      new Date(),
      input.expiresAt,
      'active',
      null,
      0,
    );
    this.sessions.set(session.id, session);
    return session;
  }
  async finalizeSession(
    input: Parameters<QuestRepository['finalizeSession']>[0],
  ) {
    const session = this.sessions.get(input.sessionId);
    if (session?.status !== 'active') return null;
    const result = new QuestResult(
      this.nextResultId++,
      session.userId,
      session.questId,
      input.score,
      input.passed,
      input.responses,
      new Date(),
      session.questions,
    );
    this.results.set(result.id, result);
    this.sessions.set(
      session.id,
      new QuestSession(
        session.id,
        session.userId,
        session.questId,
        session.questions,
        session.passingScore,
        session.startedAt,
        session.expiresAt,
        input.status,
        result.id,
        0,
      ),
    );
    return result;
  }
  async recordSessionXp(sessionId: number, xpAwarded: number) {
    const s = this.sessions.get(sessionId)!;
    this.sessions.set(
      sessionId,
      new QuestSession(
        s.id,
        s.userId,
        s.questId,
        s.questions,
        s.passingScore,
        s.startedAt,
        s.expiresAt,
        s.status,
        s.resultId,
        xpAwarded,
      ),
    );
  }
  async claimXpAward(userId: string, questId: number) {
    const key = `${userId}:${questId}`;
    if (this.xpClaims.has(key)) return false;
    this.xpClaims.add(key);
    return true;
  }
  async findResultById(resultId: number) {
    return this.results.get(resultId) ?? null;
  }
}
