import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { listProjects, publicUrl, type Project } from '@/lib/projects';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the list comes back into view, e.g. after saving a project.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (id: string) => router.push({ pathname: '/project/[id]', params: { id } });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => open('new')} hitSlop={12} accessibilityRole="button">
              <Text style={styles.headerAction}>+ New</Text>
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable onPress={() => supabase.auth.signOut()} hitSlop={12} accessibilityRole="button">
              <Text style={styles.headerMuted}>Sign out</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
        ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : undefined}
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No projects yet.</Text>
              <Button title="Add your first project" onPress={() => open('new')} />
            </View>
          )
        }
        renderItem={({ item, index }) => <Row project={item} index={index} onPress={() => open(item.id)} />}
      />
    </>
  );
}

function Row({ project: p, index, onPress }: { project: Project; index: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      <Thumb project={p} />
      <View style={{ flex: 1 }}>
        <Text style={styles.meta}>
          {String(index + 1).padStart(2, '0')} · {p.category || 'No category'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>{p.title}</Text>
        <View style={styles.badges}>
          <Badge text={p.published ? 'Published' : 'Hidden'} tone={p.published ? 'ok' : 'muted'} />
          {p.dwg_path ? <Badge text="DWG" /> : null}
          {p.preview_type === 'pdf' && p.preview_path ? <Badge text="PDF" /> : null}
          {p.featured ? <Badge text="Wide" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function Thumb({ project: p }: { project: Project }) {
  if (p.preview_path && p.preview_type === 'image') {
    return <Image source={{ uri: publicUrl(p.preview_path) }} style={styles.thumb} contentFit="cover" />;
  }
  const label = p.preview_type === 'pdf' && p.preview_path ? 'PDF' : p.preview_url ? 'SITE' : '—';
  return (
    <View style={[styles.thumb, styles.thumbEmpty]}>
      <Text style={styles.thumbText}>{label}</Text>
    </View>
  );
}

function Badge({ text, tone = 'default' }: { text: string; tone?: 'default' | 'ok' | 'muted' }) {
  const color = tone === 'ok' ? colors.success : tone === 'muted' ? colors.muted : colors.accent;
  return <Text style={[styles.badge, { color, borderColor: color }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  headerAction: { ...fonts.mono, color: colors.accent, fontSize: 14 },
  headerMuted: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger, padding: 16 },
  empty: { padding: 24, gap: 16 },
  emptyText: { color: colors.muted, fontSize: 16 },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 88, height: 62, borderRadius: 3, backgroundColor: colors.surface },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  thumbText: { ...fonts.mono, color: colors.muted, fontSize: 11 },
  meta: { ...fonts.mono, color: colors.accent, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 18, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: {
    ...fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
