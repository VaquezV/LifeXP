import type { PostgrestError } from '@supabase/supabase-js';

import {
  DOMAINS,
  DomainKey,
  DomainValueMap,
  ScoreValue,
  STREAK_TARGET_SCORE,
  createEmptyValues,
  getDomainDefinition,
  getDomainScore,
  getFallbackValueForScore,
  getWeeklyGoalDomains,
} from '@/lib/domains';
import {
  addDays,
  fromLocalDateString,
  getTrailingDateKeys,
  getWeekDateKeys,
  getStartOfWeek,
  toLocalDateString,
} from '@/lib/date';
import { SUPABASE_SETUP_MESSAGE, supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';

type RawDomainScore = {
  domain: string;
  score: number;
  value: number | null;
};

type RawCheckin = {
  created_at: string;
  date: string;
  domain_scores: RawDomainScore[] | null;
  id: string;
};

export type DomainScoreSummary = {
  domain: DomainKey;
  score: ScoreValue;
  value: number;
};

export type CheckinSummary = {
  createdAt: string;
  date: string;
  id: string;
  scores: DomainScoreSummary[];
  total: number;
};

export type DashboardData = {
  streak: number;
  todayCheckin: CheckinSummary | null;
  todayTotal: number;
  weeklyDomainSeries: {
    domain: ReturnType<typeof getDomainDefinition>;
    scores: ScoreValue[];
    weeklyMax: number;
    weeklyTotal: number;
  }[];
  weeklyGoalSeries: {
    completed: number;
    domain: ReturnType<typeof getDomainDefinition>;
    target: number;
  }[];
  weeklyLabels: string[];
};

function ensureSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}

function clampScore(value: number | null | undefined): ScoreValue {
  if (value === 2) {
    return 2;
  }

  if (value === 1) {
    return 1;
  }

  return 0;
}

function normalizeDomainKey(domain: string): DomainKey {
  const match = DOMAINS.find((item) => item.key === domain);
  return (match?.key ?? DOMAINS[0].key) as DomainKey;
}

function normalizeCheckin(row: RawCheckin): CheckinSummary {
  const values = createEmptyValues();

  for (const domain of DOMAINS) {
    const match = row.domain_scores?.find((item) => item.domain === domain.key);
    const score = clampScore(match?.score);
    values[domain.key] =
      typeof match?.value === 'number' ? match.value : getFallbackValueForScore(domain.key, score);
  }

  return createLocalCheckin(row.date, values, {
    createdAt: row.created_at,
    id: row.id,
  });
}

function isUniqueViolation(error: PostgrestError | null) {
  return error?.code === '23505';
}

function getScoreMap(checkin: CheckinSummary) {
  return new Map(checkin.scores.map((item) => [item.domain, item.score]));
}

function getValueMap(checkin: CheckinSummary) {
  return new Map(checkin.scores.map((item) => [item.domain, item.value]));
}

function computeStreak(checkins: CheckinSummary[]) {
  const totalsByDate = new Map(checkins.map((checkin) => [checkin.date, checkin.total]));
  const today = new Date();
  const todayKey = toLocalDateString(today);
  const yesterdayKey = toLocalDateString(addDays(today, -1));
  const startKey = totalsByDate.has(todayKey)
    ? todayKey
    : totalsByDate.has(yesterdayKey)
      ? yesterdayKey
      : null;

  if (!startKey) {
    return 0;
  }

  let streak = 0;
  let cursor = fromLocalDateString(startKey);

  while (true) {
    const dateKey = toLocalDateString(cursor);
    const total = totalsByDate.get(dateKey);

    if (typeof total !== 'number' || total < STREAK_TARGET_SCORE) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getEmptyCheckinValues(): DomainValueMap {
  return createEmptyValues();
}

export function createLocalCheckin(
  date: string,
  values: DomainValueMap,
  metadata?: {
    createdAt?: string;
    id?: string;
  },
): CheckinSummary {
  const scores = DOMAINS.map((domain) => ({
    domain: normalizeDomainKey(domain.key),
    score: getDomainScore(domain.key, values[domain.key]),
    value: values[domain.key],
  }));

  return {
    createdAt: metadata?.createdAt ?? new Date().toISOString(),
    date,
    id: metadata?.id ?? `local-${date}`,
    scores,
    total: scores.reduce((sum, item) => sum + item.score, 0),
  };
}

export function getValuesFromCheckin(checkin: CheckinSummary | null): DomainValueMap {
  if (!checkin) {
    return getEmptyCheckinValues();
  }

  return checkin.scores.reduce<DomainValueMap>((accumulator, item) => {
    accumulator[item.domain] = item.value;
    return accumulator;
  }, getEmptyCheckinValues());
}

async function fetchCheckinByDate(date: string) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('checkins')
    .select('id, date, created_at, domain_scores(domain, score, value)')
    .eq('user_id', await requireUserId())
    .eq('date', date)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeCheckin(data as RawCheckin) : null;
}

export async function fetchWeekCheckins(referenceDate: Date = new Date()) {
  const client = ensureSupabase();
  const weekDates = getWeekDateKeys(referenceDate);
  const startDate = weekDates[0];
  const endDate = weekDates[weekDates.length - 1];

  const { data, error } = await client
    .from('checkins')
    .select('id, date, created_at, domain_scores(domain, score, value)')
    .eq('user_id', await requireUserId())
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeCheckin(row as RawCheckin));
}

export async function saveCheckinForDate(date: string, values: DomainValueMap) {
  const client = ensureSupabase();
  const existing = await fetchCheckinByDate(date);
  let checkinId = existing?.id ?? null;

  if (!checkinId) {
    const { data: createdCheckin, error: createError } = await client
      .from('checkins')
      .insert({
        date,
        user_id: await requireUserId(),
      })
      .select('id')
      .single();

    if (isUniqueViolation(createError)) {
      const current = await fetchCheckinByDate(date);
      checkinId = current?.id ?? null;
    } else if (createError || !createdCheckin) {
      throw createError ?? new Error("Impossible de créer l'entrée du jour.");
    } else {
      checkinId = createdCheckin.id;
    }
  }

  if (!checkinId) {
    throw new Error("Impossible de retrouver l'entrée à mettre à jour.");
  }

  const rows = DOMAINS.map((domain) => ({
    checkin_id: checkinId,
    domain: domain.key,
    score: getDomainScore(domain.key as DomainKey, values[domain.key as DomainKey]),
    value: values[domain.key as DomainKey],
  }));

  const { error: scoresError } = await client.from('domain_scores').upsert(rows, {
    onConflict: 'checkin_id,domain',
  });

  if (scoresError) {
    throw scoresError;
  }

  const savedCheckin = await fetchCheckinByDate(date);

  if (!savedCheckin) {
    throw new Error("La sauvegarde a réussi mais la relecture a échoué.");
  }

  return savedCheckin;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('checkins')
    .select('id, date, created_at, domain_scores(domain, score, value)')
    .eq('user_id', await requireUserId())
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  const checkins = (data ?? []).map((row) => normalizeCheckin(row as RawCheckin));
  const checkinsByDate = new Map(checkins.map((checkin) => [checkin.date, checkin]));
  const todayKey = toLocalDateString();
  const trailingDates = getTrailingDateKeys(7);
  const currentWeekDates = getWeekDateKeys(getStartOfWeek());

  const weeklyDomainSeries = DOMAINS.map((domain) => {
    const scores = trailingDates.map((dateKey) => {
      const score = checkinsByDate.get(dateKey);

      if (!score) {
        return 0;
      }

      return getScoreMap(score).get(domain.key as DomainKey) ?? 0;
    });

    return {
      domain,
      scores,
      weeklyMax: domain.weeklyMaxScore,
      weeklyTotal: scores.reduce<number>((sum, value) => sum + value, 0),
    };
  });

  const weeklyGoalSeries = getWeeklyGoalDomains().map((domain) => {
    const completed = currentWeekDates.reduce((sum, dateKey) => {
      const checkin = checkinsByDate.get(dateKey);

      if (!checkin) {
        return sum;
      }

      const value = getValueMap(checkin).get(domain.key as DomainKey) ?? 0;
      return sum + (value > 0 ? 1 : 0);
    }, 0);

    return {
      completed,
      domain,
      target: domain.weeklyGoalCount ?? 0,
    };
  });

  return {
    streak: computeStreak(checkins),
    todayCheckin: checkinsByDate.get(todayKey) ?? null,
    todayTotal: checkinsByDate.get(todayKey)?.total ?? 0,
    weeklyDomainSeries,
    weeklyGoalSeries,
    weeklyLabels: trailingDates,
  };
}
