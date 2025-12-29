// Simplified execution result (no planning/fallbacks)
export interface ExecutionResult<T> {
  success: boolean;
  items: T[];
  metadata?: Record<string, unknown>;
}

export type { BaseEmailQueryFields, ComposeContentType, EmailContentType, EmailDetail, EmailSummary, ExcludeThreadHistory, FieldOperator } from './schemas/index.ts';
