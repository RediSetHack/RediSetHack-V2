/**
 * Clean Architecture Domain layer boundary.
 * Contains enterprise business rules, entities, value objects, and repository interfaces.
 */

export interface DomainEntity {
  readonly id: string;
}
