import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Field } from '@/components/ui';
import { emptyProfile, getProfile, saveProfile, type Credential, type Job, type Profile } from '@/lib/content';
import { colors, fonts } from '@/lib/theme';

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Lists are edited as plain text: one item per line, facts as "Label: value".
type Form = {
  availability: string;
  facts: string;
  lead: string;
  traits: string;
  jobs: (Omit<Job, 'bullets'> & { bullets: string })[];
  credentials: Credential[];
};

const toForm = (p: Profile): Form => ({
  availability: p.availability,
  facts: p.facts.map((f) => `${f.label}: ${f.value}`).join('\n'),
  lead: p.about.lead,
  traits: p.about.traits.join('\n'),
  jobs: p.experience.map((j) => ({ ...j, bullets: j.bullets.join('\n') })),
  credentials: p.credentials,
});

const toProfile = (f: Form): Profile => ({
  availability: f.availability.trim(),
  facts: lines(f.facts).map((line) => {
    const at = line.indexOf(':');
    return at === -1 ? { label: line, value: '' } : { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
  }),
  about: { lead: f.lead.trim(), traits: lines(f.traits) },
  experience: f.jobs
    .map((j) => ({ period: j.period.trim(), role: j.role.trim(), org: j.org.trim(), bullets: lines(j.bullets) }))
    .filter((j) => j.role),
  credentials: f.credentials
    .map((c) => ({ period: c.period.trim(), title: c.title.trim(), org: c.org.trim() }))
    .filter((c) => c.title),
});

export default function SiteContent() {
  const [form, setForm] = useState<Form>(toForm(emptyProfile));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => setForm(toForm(p ?? emptyProfile)))
      .catch((e) => Alert.alert('Could not load site content', message(e), [{ text: 'OK', onPress: () => router.back() }]))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setJob = (i: number, patch: Partial<Form['jobs'][number]>) =>
    setForm((f) => ({ ...f, jobs: f.jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) }));
  const setCred = (i: number, patch: Partial<Credential>) =>
    setForm((f) => ({ ...f, credentials: f.credentials.map((c, k) => (k === i ? { ...c, ...patch } : c)) }));
  const remove = (key: 'jobs' | 'credentials', i: number) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, k) => k !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile(toProfile(form));
      router.back();
    } catch (e) {
      Alert.alert('Could not save', message(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Hero</Text>
        <Field label="Availability" value={form.availability} onChangeText={set('availability')} hint="Shown as the green-dot badge. Leave empty to hide it." />

        <Text style={styles.section}>Intro facts</Text>
        <Field label="Facts" value={form.facts} onChangeText={set('facts')} multiline hint="One per line as Label: value. License, Experience and Based in also feed the hero stats." />

        <Text style={styles.section}>About</Text>
        <Field label="Paragraph" value={form.lead} onChangeText={set('lead')} multiline />
        <Field label="Strengths" value={form.traits} onChangeText={set('traits')} multiline hint="One per line." />

        <Text style={styles.section}>Experience</Text>
        {form.jobs.map((job, i) => (
          <View key={i} style={styles.block}>
            <Field label="Period" value={job.period} onChangeText={(v) => setJob(i, { period: v })} placeholder="Aug 2024 — Dec 2024" />
            <Field label="Role" value={job.role} onChangeText={(v) => setJob(i, { role: v })} placeholder="Mall Engineer" />
            <Field label="Company" value={job.org} onChangeText={(v) => setJob(i, { org: v })} />
            <Field label="What you did" value={job.bullets} onChangeText={(v) => setJob(i, { bullets: v })} multiline hint="One point per line." />
            <Button title="Remove this job" variant="danger" onPress={() => remove('jobs', i)} />
          </View>
        ))}
        <Button title="+ Add job" variant="ghost" onPress={() => set('jobs')([...form.jobs, { period: '', role: '', org: '', bullets: '' }])} />

        <Text style={styles.section}>Education & license</Text>
        {form.credentials.map((c, i) => (
          <View key={i} style={styles.block}>
            <Field label="Year(s)" value={c.period} onChangeText={(v) => setCred(i, { period: v })} placeholder="2024" />
            <Field label="Title" value={c.title} onChangeText={(v) => setCred(i, { title: v })} placeholder="Registered Mechanical Engineer" />
            <Field label="Institution" value={c.org} onChangeText={(v) => setCred(i, { org: v })} />
            <Button title="Remove" variant="danger" onPress={() => remove('credentials', i)} />
          </View>
        ))}
        <Button title="+ Add entry" variant="ghost" onPress={() => set('credentials')([...form.credentials, { period: '', title: '', org: '' }])} />

        <View style={{ marginTop: 32 }}>
          <Button title="Save changes" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  section: {
    ...fonts.mono,
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  block: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.bg2,
  },
});
