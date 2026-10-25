import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';

import { Button, Field, Label, Toggle } from '@/components/ui';
import {
  createHiddenProject, deleteProject, getProject, isDwg, previewKind, publicUrl, saveProject,
  type PickedFile, type Project, type ProjectFields,
} from '@/lib/projects';
import { colors, fonts } from '@/lib/theme';

// Text form of the editable fields; lists are edited as plain text.
type Form = {
  title: string; category: string; summary: string; tools: string; overview: string;
  objective: string; process: string; specs: string; result: string; alt: string;
  featured: boolean; published: boolean; order: string;
};

const emptyForm: Form = {
  title: '', category: '', summary: '', tools: 'AutoCAD', overview: '', objective: '',
  process: '', specs: '', result: '', alt: '', featured: false, published: true, order: '0',
};

const toForm = (p: Project): Form => ({
  title: p.title, category: p.category, summary: p.summary, tools: p.tools.join(', '),
  overview: p.overview, objective: p.objective, process: p.process.join('\n'),
  specs: p.specs.map(([k, v]) => `${k}: ${v}`).join('\n'), result: p.result, alt: p.alt,
  featured: p.featured, published: p.published, order: String(p.sort_order),
});

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const toFields = (f: Form): ProjectFields => ({
  title: f.title.trim(),
  category: f.category.trim(),
  summary: f.summary.trim(),
  tools: f.tools.split(',').map((t) => t.trim()).filter(Boolean),
  overview: f.overview.trim(),
  objective: f.objective.trim(),
  process: lines(f.process),
  specs: lines(f.specs).map((line): [string, string] => {
    const at = line.indexOf(':');
    return at === -1 ? [line, ''] : [line.slice(0, at).trim(), line.slice(at + 1).trim()];
  }),
  result: f.result.trim(),
  alt: f.alt.trim(),
  featured: f.featured,
  published: f.published,
  sort_order: Number.parseInt(f.order, 10) || 0,
});

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function pickFile(type: string | string[]): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size };
}

export default function ProjectEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PickedFile>();
  const [dwg, setDwg] = useState<PickedFile>();
  const [removeDwg, setRemoveDwg] = useState(false);

  useEffect(() => {
    if (isNew) return;
    getProject(id)
      .then((p) => { setProject(p); setForm(toForm(p)); })
      .catch((e) => Alert.alert('Could not load project', message(e), [{ text: 'OK', onPress: () => router.back() }]))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const choosePreview = async () => {
    const file = await pickFile(['application/pdf', 'image/*']);
    if (!file) return;
    if (!previewKind(file)) return Alert.alert('Unsupported file', 'Choose a PDF, PNG, JPG, WebP or SVG.');
    setPreview(file);
  };

  const chooseDwg = async () => {
    // Phones don't know a MIME type for .dwg, so allow any file and check the extension.
    const file = await pickFile('*/*');
    if (!file) return;
    if (!isDwg(file)) return Alert.alert('Not a DWG file', `“${file.name}” doesn't end in .dwg.`);
    setDwg(file);
    setRemoveDwg(false);
  };

  const save = async () => {
    const fields = toFields(form);
    if (!fields.title) return Alert.alert('Title needed', 'Give the project a title.');
    if (!project && !preview) {
      return Alert.alert('Preview needed', 'Choose a PDF or image of the drawing; the website shows it on the card.');
    }
    setSaving(true);
    try {
      // Keep a newly created project so retrying after a failed upload doesn't create a duplicate.
      let target = project;
      if (!target) {
        target = await createHiddenProject(fields);
        setProject(target);
      }
      await saveProject(target, fields, { preview, dwg, removeDwg });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', message(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!project) return;
    Alert.alert('Delete project?', `“${project.title}” and its files will be removed from the website.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(project);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', message(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const currentDwg = removeDwg ? null : dwg?.name ?? project?.dwg_name ?? null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isNew ? 'New project' : 'Edit project' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Files</Text>

        <Label>Drawing preview</Label>
        <PreviewBox picked={preview} project={project} />
        <Button title={preview || project ? 'Replace preview' : 'Choose PDF or image'} variant="ghost" onPress={choosePreview} />
        <Text style={styles.hint}>
          Plot your drawing to PDF in AutoCAD (or export a PNG). The website shows it on the card and in the popup.
        </Text>

        <View style={{ height: 24 }} />
        <Label>AutoCAD file (.dwg)</Label>
        <Text style={styles.fileName}>{currentDwg ?? 'None — visitors won’t see a download button'}</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button title={currentDwg ? 'Replace DWG' : 'Choose DWG'} variant="ghost" onPress={chooseDwg} />
          </View>
          {currentDwg ? (
            <View style={{ flex: 1 }}>
              <Button title="Remove" variant="danger" onPress={() => { setDwg(undefined); setRemoveDwg(Boolean(project?.dwg_path)); }} />
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>Card</Text>
        <Field label="Title" value={form.title} onChangeText={set('title')} placeholder="Residential HVAC Layout" />
        <Field label="Category" value={form.category} onChangeText={set('category')} placeholder="HVAC Design" />
        <Field label="Short description" value={form.summary} onChangeText={set('summary')} multiline placeholder="One line shown on the card" />
        <Field label="Software / tools" value={form.tools} onChangeText={set('tools')} hint="Separate with commas: AutoCAD, Revit" />
        <Field label="Image description" value={form.alt} onChangeText={set('alt')} multiline hint="What the drawing shows, for people using screen readers." />

        <Text style={styles.section}>Project details (popup)</Text>
        <Field label="Overview" value={form.overview} onChangeText={set('overview')} multiline />
        <Field label="Objective" value={form.objective} onChangeText={set('objective')} multiline />
        <Field label="Design process" value={form.process} onChangeText={set('process')} multiline hint="One step per line." />
        <Field label="Technical details" value={form.specs} onChangeText={set('specs')} multiline hint="One per line as Label: value — e.g. Scale: 1:100" />
        <Field label="Final result" value={form.result} onChangeText={set('result')} multiline />

        <Text style={styles.section}>Display</Text>
        <Toggle label="Published" hint="Show this project on the website." value={form.published} onValueChange={set('published')} />
        <Toggle label="Full width" hint="Large card with the image beside the text." value={form.featured} onValueChange={set('featured')} />
        <View style={{ height: 16 }} />
        <Field label="Position" value={form.order} onChangeText={set('order')} keyboardType="number-pad" hint="Lower numbers show first. Equal numbers show newest first." />

        <View style={{ gap: 12, marginTop: 8 }}>
          <Button title={isNew && !project ? 'Add project' : 'Save changes'} onPress={save} loading={saving} />
          {project ? <Button title="Delete project" variant="danger" onPress={confirmDelete} disabled={saving} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PreviewBox({ picked, project }: { picked?: PickedFile; project: Project | null }) {
  if (picked) {
    return previewKind(picked) === 'image' ? (
      <Image source={{ uri: picked.uri }} style={styles.preview} contentFit="contain" />
    ) : (
      <Text style={styles.fileName}>New PDF: {picked.name}</Text>
    );
  }
  if (project?.preview_path) {
    return project.preview_type === 'image' ? (
      <Image source={{ uri: publicUrl(project.preview_path) }} style={styles.preview} contentFit="contain" />
    ) : (
      <Text style={styles.fileName}>Current: uploaded PDF</Text>
    );
  }
  if (project?.preview_url) {
    return <Text style={styles.fileName}>Current: website image ({project.preview_url.split('/').pop()})</Text>;
  }
  return <Text style={styles.fileName}>No preview yet</Text>;
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
  preview: {
    width: '100%',
    aspectRatio: 800 / 560,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 12,
  },
  fileName: { color: colors.textSoft, fontSize: 15, marginBottom: 12 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
});
