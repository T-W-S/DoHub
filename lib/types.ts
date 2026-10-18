export type { Application, Category, AppSettings } from '@/lib/db/types';

import type { CheckResult as DbCheckResult } from '@/lib/db/types';

export type CheckResult = DbCheckResult & {
  application_name?: string;
};
