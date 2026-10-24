import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';
import { getGroups } from '@/features/groups/api';
import type { Group } from '@/features/groups/types';
import { getLeaderboard } from '@/features/leaderboard/api';
import type { LeaderboardEntry } from '@/features/leaderboard/types';
import { getExercises } from '@/features/lifts/api';
import type { Exercise } from '@/features/lifts/types';
import { formatWeight } from '@/lib/units';
import { isQueryCacheFresh, queryKeys, readQueryCache, writeQueryCache } from '@/lib/query-cache';
import { useAuth } from '@/providers/auth-provider';

export default function LeaderboardTabScreen() {
  const { profile, session } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 375;
  const [groups, setGroups] = useState<Group[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [areOptionsLoading, setAreOptionsLoading] = useState(true);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const handledRefreshKey = useRef(0);

  useFocusEffect(useCallback(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let active = true;
    const forceRefresh = refreshKey !== handledRefreshKey.current;
    handledRefreshKey.current = refreshKey;

    const groupsKey = queryKeys.groups(userId);
    const exercisesKey = queryKeys.exercises(userId);
    const leaderboardKey = queryKeys.leaderboard(userId, groupId, exerciseId);
    const cachedGroups = readQueryCache<Group[]>(groupsKey);
    const cachedExercises = readQueryCache<Exercise[]>(exercisesKey);
    const cachedEntries = readQueryCache<LeaderboardEntry[]>(leaderboardKey);

    setFilterError(null);
    setLeaderboardError(null);
    setIsRefreshing(false);
    if (cachedGroups) setGroups(cachedGroups.data);
    if (cachedExercises) setExercises(cachedExercises.data);
    setAreOptionsLoading(!cachedGroups || !cachedExercises);
    if (cachedEntries) {
      setEntries(cachedEntries.data);
      setIsLoading(false);
    } else {
      setEntries([]);
      setIsLoading(true);
    }

    async function refreshOptions() {
      try {
        const requests: Promise<void>[] = [];
        if (forceRefresh || !cachedGroups || !isQueryCacheFresh(cachedGroups)) {
          requests.push(getGroups().then((data) => {
            writeQueryCache(groupsKey, data);
            if (active) setGroups(data);
          }));
        }
        if (forceRefresh || !cachedExercises || !isQueryCacheFresh(cachedExercises)) {
          requests.push(getExercises().then((data) => {
            writeQueryCache(exercisesKey, data);
            if (active) setExercises(data);
          }));
        }
        await Promise.all(requests);
      } catch (error) {
        if (active && (!cachedGroups || !cachedExercises)) {
          setFilterError(error instanceof Error ? error.message : 'Unable to load leaderboard filters.');
        }
      } finally {
        if (active) setAreOptionsLoading(false);
      }
    }

    async function refreshLeaderboard() {
      if (!forceRefresh && cachedEntries && isQueryCacheFresh(cachedEntries)) return;
      if (cachedEntries) setIsRefreshing(true);
      try {
        const data = await getLeaderboard(groupId, exerciseId);
        writeQueryCache(leaderboardKey, data);
        if (active) setEntries(data);
      } catch (error) {
        if (active && !cachedEntries) {
          setLeaderboardError(error instanceof Error ? error.message : 'Unable to load the leaderboard.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void refreshOptions();
    void refreshLeaderboard();
    return () => { active = false; };
  }, [exerciseId, groupId, refreshKey, session?.user.id]));

  const unit = profile?.preferred_unit ?? 'lb';
  const topEntries = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);
  const hasNoGroups = !areOptionsLoading && groups.length === 0;
  const hasNoLifts = entries.length > 0 && entries.every((entry) => entry.lift_count === 0);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, isCompact && styles.compactContent]} directionalLockEnabled showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BARBELL BATTLES</Text>
          <Text style={styles.title}>Leaderboard</Text>
          {isRefreshing ? (
            <View accessibilityLabel="Refreshing leaderboard" accessibilityRole="progressbar" style={styles.refreshing}>
              <ActivityIndicator color={colors.primaryLight} size="small" />
              <Text style={styles.refreshingText}>Updating…</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.filters}>
          <Selector
            label="Group"
            onSelect={setGroupId}
            options={[{ id: null, name: 'All my groups' }, ...groups.map((group) => ({ id: group.id, name: group.name }))]}
            selectedId={groupId}
          />
          <Selector
            label="Exercise"
            onSelect={setExerciseId}
            options={[{ id: null, name: 'All lifts' }, ...exercises.map((exercise) => ({ id: exercise.id, name: exercise.name }))]}
            selectedId={exerciseId}
          />
        </View>

        {!exerciseId ? <Text style={styles.hint}>All lifts adds together one PR from each exercise.</Text> : null}

        {filterError ? (
          <View style={styles.filterError}>
            <Text style={styles.filterErrorText}>Some filters could not be loaded.</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setRefreshKey((value) => value + 1)}>
              <Text style={styles.retryLink}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading || areOptionsLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primaryLight} size="large" />
            <Text style={styles.loadingText}>Loading rankings…</Text>
          </View>
        ) : leaderboardError ? (
          <LeaderboardState
            actionLabel="Try again"
            description={leaderboardError}
            icon="!"
            onAction={() => setRefreshKey((value) => value + 1)}
            title="Unable to load rankings"
          />
        ) : hasNoGroups ? (
          <LeaderboardState
            description="Create a group or join your friends from the Groups tab to start competing."
            icon="＋"
            title="Join your first group"
          />
        ) : entries.length === 0 ? (
          <LeaderboardState
            description="There are no members available for this leaderboard yet."
            icon="—"
            title="No rankings yet"
          />
        ) : hasNoLifts ? (
          <LeaderboardState
            description={exerciseId ? 'No one has recorded this lift yet.' : 'Add a personal record to create the first ranking.'}
            icon="↑"
            title="No lifts recorded"
          />
        ) : (
          <View style={styles.results}>
            <View
              accessibilityLabel={getPodiumAccessibilityLabel(topEntries, unit)}
              accessibilityRole="text"
              accessible
              style={[styles.podium, isCompact && styles.compactPodium]}>
              <View style={styles.podiumGlow} />
              <View style={styles.podiumRow}>
                <PodiumEntry compact={isCompact} entry={topEntries[1]} place={2} unit={unit} />
                <PodiumEntry compact={isCompact} entry={topEntries[0]} place={1} unit={unit} />
                <PodiumEntry compact={isCompact} entry={topEntries[2]} place={3} unit={unit} />
              </View>
            </View>

            {remainingEntries.length > 0 ? (
              <View style={styles.rankingList}>
                <ScrollView accessibilityLabel="Rankings after the top three" bounces={false} directionalLockEnabled nestedScrollEnabled showsVerticalScrollIndicator style={styles.rankingScroller}>
                  {remainingEntries.map((entry, index) => (
                    <View
                      accessibilityLabel={`${entry.rank}. ${entry.first_name} ${entry.last_name}${entry.is_current_user ? ', you' : ''}. ${entry.score_kg > 0 ? formatWeight(entry.score_kg, unit) : 'No score'}${!exerciseId ? `, ${entry.lift_count} personal records` : ''}.`}
                      accessibilityRole="text"
                      accessible
                      key={entry.user_id}
                      style={[
                        styles.rankingRow,
                        index < remainingEntries.length - 1 && styles.rankingRowBorder,
                        entry.is_current_user && styles.currentRankingRow,
                      ]}>
                      <Text style={styles.rank}>{entry.rank}</Text>
                      <View style={[styles.listAvatar, entry.is_current_user && styles.currentListAvatar]}>
                        <Text style={styles.listAvatarText}>{getInitials(entry)}</Text>
                      </View>
                      <View style={styles.person}>
                        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.name}>
                          {entry.first_name} {entry.last_name}{entry.is_current_user ? ' (You)' : ''}
                        </Text>
                        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.username}>@{entry.username}</Text>
                      </View>
                      <View style={styles.scoreBlock}>
                        <Text numberOfLines={1} style={styles.score}>{entry.score_kg > 0 ? formatWeight(entry.score_kg, unit) : '—'}</Text>
                        {!exerciseId ? <Text style={styles.liftCount}>{entry.lift_count} PRs</Text> : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LeaderboardState({ actionLabel, description, icon, onAction, title }: { actionLabel?: string; description: string; icon: string; onAction?: () => void; title: string }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Text style={styles.stateIconText}>{icon}</Text>
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.retryButton, pressed && styles.dropdownPressed]}>
          <Text style={styles.retryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PodiumEntry({ compact, entry, place, unit }: { compact: boolean; entry?: LeaderboardEntry; place: 1 | 2 | 3; unit: 'lb' | 'kg' }) {
  if (!entry) return <View style={styles.podiumSlot} />;

  const placeLabel = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
  const medalStyle = place === 1 ? styles.gold : place === 2 ? styles.silver : styles.bronze;

  return (
    <View style={[styles.podiumSlot, compact && styles.compactPodiumSlot, place === 1 && styles.firstPlace]}>
      {place === 1 ? <Text accessibilityElementsHidden style={styles.crown}>♛</Text> : null}
      <View style={[
        styles.avatar,
        compact && styles.compactAvatar,
        place === 1 && styles.firstAvatar,
        compact && place === 1 && styles.compactFirstAvatar,
        place === 2 && styles.silverAvatar,
        place === 3 && styles.bronzeAvatar,
        entry.is_current_user && styles.currentAvatar,
      ]}>
        <Text style={[styles.avatarText, place === 1 && styles.firstAvatarText]}>{getInitials(entry)}</Text>
      </View>
      <View style={[styles.medal, medalStyle]}>
        <Text style={styles.medalText}>{placeLabel}</Text>
      </View>
      <Text ellipsizeMode="tail" numberOfLines={1} style={styles.podiumName}>
        {entry.first_name} {entry.last_name}
      </Text>
      <Text ellipsizeMode="tail" numberOfLines={1} style={styles.podiumUsername}>
        @{entry.username}{entry.is_current_user ? ' · You' : ''}
      </Text>
      <Text numberOfLines={1} style={styles.podiumScore}>
        {entry.score_kg > 0 ? formatWeight(entry.score_kg, unit) : '—'}
      </Text>
    </View>
  );
}

function getPodiumAccessibilityLabel(entries: LeaderboardEntry[], unit: 'lb' | 'kg') {
  return entries.map((entry, index) => (
    `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} place, ${entry.first_name} ${entry.last_name}${entry.is_current_user ? ', you' : ''}, ${entry.score_kg > 0 ? formatWeight(entry.score_kg, unit) : 'no score'}`
  )).join('. ');
}

function getInitials(entry: LeaderboardEntry) {
  return `${entry.first_name.charAt(0)}${entry.last_name.charAt(0)}`.toUpperCase();
}

type SelectorOption = { id: string | null; name: string };

function Selector({ label, onSelect, options, selectedId }: { label: string; onSelect: (id: string | null) => void; options: SelectorOption[]; selectedId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState({ height: 0, width: 0, x: 0, y: 0 });
  const buttonRef = useRef<View>(null);
  const selectedOption = options.find((option) => option.id === selectedId) ?? options[0];

  function open() {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ height, width, x, y });
      setIsOpen(true);
    });
  }

  function select(option: SelectorOption) {
    onSelect(option.id);
    setIsOpen(false);
  }

  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label}: ${selectedOption.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={open}
        ref={buttonRef}
        style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownPressed]}>
        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.dropdownValue}>{selectedOption.name}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} statusBarTranslucent transparent visible={isOpen}>
        <View style={styles.popoverLayer}>
          <Pressable accessibilityLabel={`Close ${label} selector`} onPress={() => setIsOpen(false)} style={StyleSheet.absoluteFill} />
          <View
            accessibilityViewIsModal
            style={[styles.popover, { left: anchor.x, top: anchor.y + anchor.height + spacing.xs, width: anchor.width }]}>
            <ScrollView bounces={false} contentContainerStyle={styles.popoverOptions} nestedScrollEnabled>
              {options.map((option) => {
                const selected = option.id === selectedId;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.id ?? 'all'}
                    onPress={() => select(option)}
                    style={({ pressed }) => [styles.popoverOption, selected && styles.popoverOptionSelected, pressed && styles.dropdownPressed]}>
                    <Text ellipsizeMode="tail" numberOfLines={1} style={[styles.popoverOptionText, selected && styles.popoverOptionTextSelected]}>{option.name}</Text>
                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  checkmark: { color: colors.primaryLight, fontSize: 18, fontWeight: '900' },
  chevron: { color: colors.textMuted, fontSize: 20, lineHeight: 20, marginTop: -4 },
  compactAvatar: { borderRadius: 30, height: 60, width: 60 },
  compactContent: { paddingHorizontal: spacing.md },
  compactFirstAvatar: { borderRadius: 38, height: 76, width: 76 },
  compactPodium: { minHeight: 238, paddingHorizontal: spacing.xs, paddingTop: 38 },
  compactPodiumSlot: { paddingHorizontal: 1, paddingTop: 31 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: 64 },
  currentListAvatar: { borderColor: colors.primaryLight },
  currentRankingRow: { backgroundColor: '#172640' },
  dropdownButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 48, paddingHorizontal: 14 },
  dropdownPressed: { opacity: 0.7 },
  dropdownValue: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '800' },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  filterError: { alignItems: 'center', backgroundColor: '#2a1f24', borderColor: '#6e3945', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginTop: -spacing.sm, paddingHorizontal: 12, paddingVertical: 10 },
  filterErrorText: { color: '#fecdd3', flex: 1, fontSize: 12, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: spacing.sm },
  header: { gap: spacing.xs, position: 'relative' },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: -spacing.sm },
  liftCount: { color: colors.textMuted, fontSize: 11 },
  listAvatar: { alignItems: 'center', backgroundColor: '#21314c', borderColor: colors.border, borderRadius: 18, borderWidth: 2, height: 36, justifyContent: 'center', width: 36 },
  listAvatarText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  loadingState: { alignItems: 'center', gap: spacing.md, justifyContent: 'center', minHeight: 255 },
  loadingText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  name: { color: colors.text, fontSize: 13, fontWeight: '800' },
  person: { flex: 1 },
  podium: { backgroundColor: '#101d35', borderColor: colors.border, borderRadius: 22, borderWidth: 1, minHeight: 255, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingTop: 44 },
  podiumGlow: { alignSelf: 'center', backgroundColor: '#183564', borderRadius: 180, height: 260, opacity: 0.45, position: 'absolute', top: 26, width: 260 },
  podiumRow: { alignItems: 'flex-start', flexDirection: 'row' },
  podiumSlot: { alignItems: 'center', flex: 1, minWidth: 0, paddingHorizontal: 3, paddingTop: 35 },
  firstPlace: { paddingTop: 0 },
  avatar: { alignItems: 'center', backgroundColor: '#21314c', borderColor: '#d8dee9', borderRadius: 34, borderWidth: 3, height: 68, justifyContent: 'center', width: 68 },
  firstAvatar: { borderColor: '#facc15', borderRadius: 43, height: 86, width: 86 },
  currentAvatar: { shadowColor: colors.primaryLight, shadowOffset: { height: 0, width: 0 }, shadowOpacity: 1, shadowRadius: 8 },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  firstAvatarText: { fontSize: 25 },
  bronzeAvatar: { borderColor: '#b7791f' },
  bronze: { backgroundColor: '#b7791f' },
  crown: { color: colors.accent, fontSize: 34, lineHeight: 36, marginBottom: -4 },
  gold: { backgroundColor: '#eab308' },
  medal: { alignItems: 'center', borderRadius: 999, justifyContent: 'center', marginTop: -11, minWidth: 44, paddingHorizontal: 9, paddingVertical: 4 },
  medalText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  podiumName: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: spacing.sm, maxWidth: '100%', textAlign: 'center' },
  podiumScore: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: spacing.xs },
  podiumUsername: { color: colors.textMuted, fontSize: 10, marginTop: 2, maxWidth: '100%', textAlign: 'center' },
  results: { gap: spacing.md },
  retryButton: { backgroundColor: colors.primary, borderRadius: 12, marginTop: spacing.sm, minWidth: 120, paddingHorizontal: spacing.md, paddingVertical: 12 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  retryLink: { color: colors.primaryLight, fontSize: 12, fontWeight: '900' },
  silver: { backgroundColor: '#8492a6' },
  silverAvatar: { borderColor: '#aeb8c7' },
  popover: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, elevation: 12, maxHeight: 300, overflow: 'hidden', shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.35, shadowRadius: 16 },
  popoverLayer: { flex: 1 },
  popoverOption: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 48, paddingHorizontal: 14 },
  popoverOptionSelected: { backgroundColor: '#1b2a43' },
  popoverOptionText: { color: colors.textMuted, flex: 1, fontSize: 14, fontWeight: '700' },
  popoverOptionTextSelected: { color: colors.text },
  popoverOptions: { paddingVertical: spacing.xs },
  rank: { color: colors.textMuted, fontSize: 15, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  rankingList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  rankingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 64, paddingHorizontal: 12, paddingVertical: 9 },
  rankingRowBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  rankingScroller: { maxHeight: 256 },
  refreshing: { alignItems: 'center', bottom: 4, flexDirection: 'row', gap: 6, position: 'absolute', right: 0 },
  refreshingText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  score: { color: colors.text, fontSize: 15, fontWeight: '900' },
  scoreBlock: { alignItems: 'flex-end', gap: spacing.xs },
  selector: { flex: 1, gap: spacing.xs },
  selectorLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, minHeight: 255, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  stateDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 280, textAlign: 'center' },
  stateIcon: { alignItems: 'center', backgroundColor: '#1b2a43', borderColor: colors.border, borderRadius: 28, borderWidth: 1, height: 56, justifyContent: 'center', marginBottom: spacing.md, width: 56 },
  stateIconText: { color: colors.accent, fontSize: 25, fontWeight: '900' },
  stateTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  username: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
});
