import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Label } from '@/components/ui';
import { emptyProfile, getProfile, isImage, isPdf, saveProfile, type Credential, type Job, type Profile, type Service } from '@/lib/content';
import { publicUrl, type PickedFile } from '@/lib/projects';
import { colors, fonts } from '@/lib/theme';

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Lists are edited as plain text: one item per line, facts as "Label: value".
type Form = {
  availability: string;
  facts: string;
  services: Service[];
  lead: string;
  traits: string;
  jobs: (Omit<Job, 'bullets'> & { bullets: string })[];
  credentials: Credential[];
};

const toForm = (p: Profile): Form => ({
  availability: p.availability,
  facts: p.facts.map((f) => `${f.label}: ${f.value}`).join('\n'),
  services: p.services,
  lead: p.about.lead,
  traits: p.about.traits.join('\n'),
  jobs: p.experience.map((j) => ({ ...j, bullets: j.bullets.join('\n') })),
  credentials: p.credentials,
});

async function pickFile(type: string | string[]): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size };
}

const toProfile = (f: Form, base: Profile): Profile => ({
  ...base,
  availability: f.availability.trim(),
  facts: lines(f.facts).map((line) => {
    const at = line.indexOf(':');
    return at === -1 ? { label: line, value: '' } : { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
  }),
  services: f.services.map((s) => ({ title: s.title.trim(), text: s.text.trim() })).filter((s) => s.title),
  about: { lead: f.lead.trim(), traits: lines(f.traits) },
  experience: f.jobs
    .map((j) => ({ period: j.period.trim(), role: j.role.trim(), org: j.org.trim(), bullets: lines(j.bullets) }))
    .filter((j) => j.role),
  credentials: f.credentials
    .map((c) => ({ period: c.period.trim(), title: c.title.trim(), org: c.org.trim() }))
    .filter((c) => c.title),
});

export default function SiteContent() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [form, setForm] = useState<Form>(toForm(emptyProfile));
  const [photo, setPhoto] = useState<PickedFile>();
  const [resume, setResume] = useState<PickedFile>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => { setProfile(p ?? emptyProfile); setForm(toForm(p ?? emptyProfile)); })
      .catch((e) => Alert.alert('Could not load site content', message(e), [{ text: 'OK', onPress: () => router.back() }]))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setJob = (i: number, patch: Partial<Form['jobs'][number]>) =>
    setForm((f) => ({ ...f, jobs: f.jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) }));
  const setCred = (i: number, patch: Partial<Credential>) =>
    setForm((f) => ({ ...f, credentials: f.credentials.map((c, k) => (k === i ? { ...c, ...patch } : c)) }));
  const setService = (i: number, patch: Partial<Service>) =>
    setForm((f) => ({ ...f, services: f.services.map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  const remove = (key: 'jobs' | 'credentials' | 'services', i: number) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, k) => k !== i) }));

  const choosePhoto = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    if (!isImage(f)) return Alert.alert('Unsupported file', 'Choose a JPG, PNG or WebP photo.');
    setPhoto(f);
  };
  const chooseResume = async () => {
    const f = await pickFile('application/pdf');
    if (!f) return;
    if (!isPdf(f)) return Alert.alert('Not a PDF', 'The resume must be a PDF file.');
    setResume(f);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile(toProfile(form, profile), { photo, resume });
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
        <Text style={styles.section}>Photo & resume</Text>
        <Label>Portrait (About section)</Label>
        {photo || profile.photo_path ? (
          <Image source={{ uri: photo ? photo.uri : publicUrl(profile.photo_path!) }} style={styles.photo} contentFit="cover" />
        ) : (
          <Text style={styles.hint}>Using the photo built into the website.</Text>
        )}
        <Button title={photo ? `New: ${photo.name}` : 'Choose photo'} variant="ghost" onPress={choosePhoto} />
        <Text style={styles.hint}>Portrait orientation works best (4:5, like an ID photo).</Text>

        <View style={{ height: 16 }} />
        <Label>Resume (PDF)</Label>
        <Text style={styles.hint}>
          {resume ? `New: ${resume.name}` : profile.resume_path ? `Current: ${profile.resume_path.split('/').pop()}` : 'Using the resume built into the website.'}
        </Text>
        <Button title="Choose resume PDF" variant="ghost" onPress={chooseResume} />

        <Text style={styles.section}>Hero</Text>
        <Field label="Availability" value={form.availability} onChangeText={set('availability')} hint="Shown as the green-dot badge. Leave empty to hide it." />

        <Text style={styles.section}>Intro facts</Text>
        <Field label="Facts" value={form.facts} onChangeText={set('facts')} multiline hint="One per line as Label: value. License, Experience and Based in also feed the hero stats." />

        <Text style={styles.section}>What I can help with</Text>
        {form.services.map((s, i) => (
          <View key={i} style={styles.block}>
            <Field label="Title" value={s.title} onChangeText={(v) => setService(i, { title: v })} placeholder="HVAC drafting" />
            <Field label="Description" value={s.text} onChangeText={(v) => setService(i, { text: v })} multiline />
            <Button title="Remove" variant="danger" onPress={() => remove('services', i)} />
          </View>
        ))}
        <Button title="+ Add service" variant="ghost" onPress={() => set('services')([...form.services, { title: '', text: '' }])} />

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

        <Text style={styles.section}>Education, license & training</Text>
        <Text style={styles.hint}>Add seminars and certificates here too (OSH, fire safety, AutoCAD, manufacturer trainings).</Text>
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
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  photo: { width: 160, aspectRatio: 4 / 5, borderRadius: 4, backgroundColor: colors.surface, marginBottom: 12 },
  block: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.bg2,
  },
});
