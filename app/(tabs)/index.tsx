import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import {
  CheckinSummary,
  createLocalCheckin,
  fetchWeekCheckins,
  getValuesFromCheckin,
  saveCheckinForDate,
} from '@/lib/checkins';
import {
  DOMAINS,
  DomainKey,
  DomainValueMap,
  MAX_DAILY_SCORE,
  MAX_WEEKLY_SCORE,
  getCompletionPercent,
  getDomainPresets,
  getDomainScore,
  getScorePresentation,
} from '@/lib/domains';
import {
  addDays,
  formatDayOfMonth,
  formatLongDate,
  formatShortDay,
  formatWeekRange,
  fromLocalDateString,
  getStartOfWeek,
  getWeekDateKeys,
  toLocalDateString,
} from '@/lib/date';
import { SUPABASE_SETUP_MESSAGE, isSupabaseConfigured } from '@/lib/supabase';

type CheckinMap = Record<string, CheckinSummary>;
type DomainDateMap = Record<DomainKey, string>;
type DomainSavingMap = Record<DomainKey, boolean>;

function createCheckinMap(checkins: CheckinSummary[]) {
  return checkins.reduce<CheckinMap>((accumulator, checkin) => {
    accumulator[checkin.date] = checkin;
    return accumulator;
  }, {});
}

function createDomainDateMap(dateKey: string): DomainDateMap {
  return DOMAINS.reduce<DomainDateMap>((accumulator, domain) => {
    accumulator[domain.key] = dateKey;
    return accumulator;
  }, {} as DomainDateMap);
}

function createDomainSavingMap(): DomainSavingMap {
  return DOMAINS.reduce<DomainSavingMap>((accumulator, domain) => {
    accumulator[domain.key] = false;
    return accumulator;
  }, {} as DomainSavingMap);
}

function computeWeekScore(weekCheckins: CheckinMap, weekDates: string[]) {
  return weekDates.reduce((sum, dateKey) => sum + (weekCheckins[dateKey]?.total ?? 0), 0);
}

function computeTodayScore(weekCheckins: CheckinMap) {
  return weekCheckins[toLocalDateString()]?.total ?? 0;
}

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const maybeCode = 'code' in error && typeof error.code === 'string' ? error.code : '';

  if (maybeCode === '42501' || maybeMessage.includes('row-level security policy')) {
    return "Supabase bloque l'enregistrement. Désactive la RLS ou ajoute des policies d'écriture sur `checkins` et `domain_scores`.";
  }

  if (maybeMessage.includes('column') && maybeMessage.includes('value')) {
    return "La colonne `value` manque dans `domain_scores`. Relance le SQL de migration.";
  }

  if (maybeMessage) {
    return maybeMessage;
  }

  return fallback;
}

export default function CheckinScreen() {
  const isFocused = useIsFocused();
  const todayKey = toLocalDateString();
  const currentWeekDates = getWeekDateKeys();
  const currentWeekStartKey = toLocalDateString(getStartOfWeek());
  const [weekCheckins, setWeekCheckins] = useState<CheckinMap>({});
  const [selectedDatesByDomain, setSelectedDatesByDomain] = useState<DomainDateMap>(
    createDomainDateMap(todayKey),
  );
  const [savingByDomain, setSavingByDomain] = useState<DomainSavingMap>(createDomainSavingMap());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedWeekStartsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadInitialWeek = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const checkins = await fetchWeekCheckins();

        if (!isMounted) {
          return;
        }

        loadedWeekStartsRef.current.add(currentWeekStartKey);
        setWeekCheckins(createCheckinMap(checkins));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(getFriendlyErrorMessage(error, 'Chargement impossible.'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialWeek();

    return () => {
      isMounted = false;
    };
  }, [currentWeekStartKey, isFocused]);

  const loadWeekForDate = async (dateKey: string) => {
    const weekStartKey = getWeekDateKeys(fromLocalDateString(dateKey))[0];

    if (loadedWeekStartsRef.current.has(weekStartKey)) {
      return;
    }

    const checkins = await fetchWeekCheckins(fromLocalDateString(dateKey));
    loadedWeekStartsRef.current.add(weekStartKey);

    setWeekCheckins((current) => ({
      ...current,
      ...createCheckinMap(checkins),
    }));
  };

  const handleSelectDate = async (domain: DomainKey, dateKey: string) => {
    setSelectedDatesByDomain((current) => ({
      ...current,
      [domain]: dateKey,
    }));
    setErrorMessage(null);
    try {
      await loadWeekForDate(dateKey);
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error, 'Chargement impossible.'));
    }
  };

  const handleNavigateWeek = async (domain: DomainKey, direction: -1 | 1) => {
    const currentDate = selectedDatesByDomain[domain];
    const targetDateKey = toLocalDateString(addDays(fromLocalDateString(currentDate), direction * 7));

    setSelectedDatesByDomain((current) => ({
      ...current,
      [domain]: targetDateKey,
    }));
    setErrorMessage(null);

    try {
      await loadWeekForDate(targetDateKey);
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error, 'Chargement impossible.'));
    }
  };

  const handleValueChange = async (domain: DomainKey, value: number) => {
    const dateKey = selectedDatesByDomain[domain];
    const previousCheckin = weekCheckins[dateKey] ?? null;
    const previousValues = getValuesFromCheckin(previousCheckin);

    if (previousValues[domain] === value) {
      return;
    }

    const nextValues: DomainValueMap = {
      ...previousValues,
      [domain]: value,
    };

    const optimisticCheckin = createLocalCheckin(dateKey, nextValues, previousCheckin ?? undefined);

    setWeekCheckins((current) => ({
      ...current,
      [dateKey]: optimisticCheckin,
    }));
    setSavingByDomain((current) => ({
      ...current,
      [domain]: true,
    }));
    setErrorMessage(null);

    try {
      const savedCheckin = await saveCheckinForDate(dateKey, nextValues);
      setWeekCheckins((current) => ({
        ...current,
        [dateKey]: savedCheckin,
      }));
    } catch (error) {
      setWeekCheckins((current) => {
        const nextMap = { ...current };

        if (previousCheckin) {
          nextMap[dateKey] = previousCheckin;
        } else {
          delete nextMap[dateKey];
        }

        return nextMap;
      });
      setErrorMessage(getFriendlyErrorMessage(error, 'Enregistrement impossible.'));
    } finally {
      setSavingByDomain((current) => ({
        ...current,
        [domain]: false,
      }));
    }
  };

  const weeklyScore = computeWeekScore(weekCheckins, currentWeekDates);
  const todayScore = computeTodayScore(weekCheckins);
  const isAnySaveRunning = Object.values(savingByDomain).some(Boolean);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.eyebrow}>LifeXP</Text>
            <Text style={styles.title}>Mes habitudes</Text>
          </View>

          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>
              {isAnySaveRunning ? 'Enregistrement...' : 'Auto-sync'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Semaine</Text>
            <Text style={styles.summaryValue}>
              {weeklyScore}/{MAX_WEEKLY_SCORE}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Aujourd&apos;hui</Text>
            <Text style={styles.summaryValue}>
              {todayScore}/{MAX_DAILY_SCORE}
            </Text>
          </View>
        </View>
      </View>

      {!isSupabaseConfigured ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Configuration requise</Text>
          <Text style={styles.messageBody}>{SUPABASE_SETUP_MESSAGE}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator color="#f8fafc" />
          <Text style={styles.messageBody}>Chargement de la semaine...</Text>
        </View>
      ) : null}

      {!loading && errorMessage ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!loading && isSupabaseConfigured ? (
        <View style={styles.cardsList}>
          {DOMAINS.map((domain) => {
            const activeDateKey = selectedDatesByDomain[domain.key];
            const activeValues = getValuesFromCheckin(weekCheckins[activeDateKey] ?? null);
            const activeValue = activeValues[domain.key];
            const activeScore = getDomainScore(domain.key, activeValue);
            const presentation = getScorePresentation(activeScore);
            const percent = getCompletionPercent(domain.key, activeValue);
            const weekDates = getWeekDateKeys(fromLocalDateString(activeDateKey));
            const weekStartKey = weekDates[0];
            const canGoNext = weekStartKey !== currentWeekStartKey;

            return (
              <View key={domain.key} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.habitTitleWrap}>
                    <Text style={styles.habitTitle}>
                      {domain.emoji} {domain.label}
                    </Text>
                    <Text style={styles.habitMeta}>
                      {domain.weeklyGoalCount ? 'Hebdo' : 'Quotidien'} •{' '}
                      {formatLongDate(activeDateKey)}
                    </Text>
                  </View>

                  <View style={styles.scoreBubble}>
                    <Text style={styles.scoreBubbleIcon}>{presentation.icon}</Text>
                    <Text style={styles.scoreBubbleText}>{percent}%</Text>
                  </View>
                </View>

                <View style={styles.weekNav}>
                  <Pressable
                    onPress={() => void handleNavigateWeek(domain.key, -1)}
                    style={styles.navButton}>
                    <MaterialIcons color="#c8d4e3" name="chevron-left" size={18} />
                  </Pressable>

                  <Text style={styles.weekRangeLabel}>{formatWeekRange(activeDateKey)}</Text>

                  <Pressable
                    disabled={!canGoNext}
                    onPress={() => void handleNavigateWeek(domain.key, 1)}
                    style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}>
                    <MaterialIcons color={canGoNext ? '#c8d4e3' : '#607085'} name="chevron-right" size={18} />
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  {weekDates.map((dateKey) => {
                    const score = getDomainScore(
                      domain.key,
                      getValuesFromCheckin(weekCheckins[dateKey] ?? null)[domain.key],
                    );
                    const isSelected = dateKey === activeDateKey;

                    return (
                      <Pressable
                        key={`${domain.key}-${dateKey}`}
                        onPress={() => void handleSelectDate(domain.key, dateKey)}
                        style={styles.weekDay}>
                        <Text
                          style={[
                            styles.weekDayLabel,
                            isSelected && styles.weekDayLabelSelected,
                          ]}>
                          {formatShortDay(dateKey)}
                        </Text>

                        <View
                          style={[
                            styles.weekCircle,
                            score === 2 && styles.weekCircleDone,
                            score === 1 && styles.weekCirclePartial,
                            score === 0 && styles.weekCircleMissed,
                            isSelected && styles.weekCircleSelected,
                          ]}>
                          <Text style={styles.weekCircleText}>{formatDayOfMonth(dateKey)}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.optionsRow}>
                  {getDomainPresets(domain.key).map((preset) => {
                    const selected = activeValue === preset.value;

                    return (
                      <Pressable
                        key={`${domain.key}-${preset.value}`}
                        disabled={savingByDomain[domain.key]}
                        onPress={() => void handleValueChange(domain.key, preset.value)}
                        style={[styles.optionChip, selected && styles.optionChipSelected]}>
                        <Text
                          style={[
                            styles.optionChipLabel,
                            selected && styles.optionChipLabelSelected,
                          ]}>
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardsList: {
    gap: 14,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 120,
  },
  eyebrow: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  habitCard: {
    backgroundColor: '#111925',
    borderColor: '#243040',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  habitHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  habitMeta: {
    color: '#8ea0b8',
    fontSize: 12,
    fontWeight: '700',
  },
  habitTitle: {
    color: '#f3f7fb',
    fontSize: 18,
    fontWeight: '800',
  },
  habitTitleWrap: {
    flex: 1,
    gap: 4,
  },
  heroCard: {
    backgroundColor: '#121b27',
    borderColor: '#243040',
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineError: {
    backgroundColor: '#32151c',
    borderColor: '#6c2738',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  inlineErrorText: {
    color: '#ffc1cf',
    fontSize: 14,
    lineHeight: 20,
  },
  messageBody: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  messageCard: {
    alignItems: 'center',
    backgroundColor: '#121b27',
    borderColor: '#243040',
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  messageTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: '#0b1118',
    borderColor: '#243040',
    borderRadius: 12,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  navButtonDisabled: {
    opacity: 0.55,
  },
  optionChip: {
    backgroundColor: '#0b1118',
    borderColor: '#243040',
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipLabel: {
    color: '#91a2b7',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionChipLabelSelected: {
    color: '#f5fbff',
  },
  optionChipSelected: {
    backgroundColor: '#173043',
    borderColor: '#7dd3fc',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: '#0b1118',
    borderColor: '#243040',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  scoreBubbleIcon: {
    fontSize: 14,
  },
  scoreBubbleText: {
    color: '#f3f7fb',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  screen: {
    backgroundColor: '#05070a',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#0b1118',
    borderColor: '#243040',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  summaryLabel: {
    color: '#8ea0b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
  },
  syncPill: {
    backgroundColor: '#0b1118',
    borderColor: '#243040',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncPillText: {
    color: '#d8e8f8',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  weekCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  weekCircleDone: {
    backgroundColor: '#193b35',
  },
  weekCircleMissed: {
    backgroundColor: '#1a2330',
  },
  weekCirclePartial: {
    backgroundColor: '#43381b',
  },
  weekCircleSelected: {
    borderColor: '#7dd3fc',
    borderWidth: 2,
  },
  weekCircleText: {
    color: '#edf3fb',
    fontSize: 13,
    fontWeight: '700',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayLabel: {
    color: '#8393a9',
    fontSize: 10,
    fontWeight: '700',
  },
  weekDayLabelSelected: {
    color: '#c8efff',
  },
  weekNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekRangeLabel: {
    color: '#d8e8f8',
    fontSize: 13,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
