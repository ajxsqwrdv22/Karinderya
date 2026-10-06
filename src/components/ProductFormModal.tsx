import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, text as type } from '../theme';

const CATEGORIES = ['Ulam', 'Rice', 'Soup', 'Drinks', 'Extras', 'Ingredients'];
const UNITS = ['pcs', 'kg', 'L', 'packs'];

export type DraftProduct = {
  name: string;
  category: string;
  price: string;
  stock: string;
  unit: string;
  parLevel: string;
};

const EMPTY: DraftProduct = {
  name: '',
  category: 'Ulam',
  price: '',
  stock: '',
  unit: 'pcs',
  parLevel: '',
};

type Props = {
  visible: boolean;
  /** Pre-fills the form when editing an existing row. */
  initial?: DraftProduct | null;
  onClose: () => void;
  onSubmit: (draft: DraftProduct) => void;
};

/**
 * Create/Update sheet for a product.
 *
 * Validation happens here so an invalid row can never reach the database; the
 * CHECK constraints in the schema are the second line of defence.
 */
export function ProductFormModal({ visible, initial, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DraftProduct>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form each time the sheet opens so edits start clean.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(initial ?? EMPTY);
      setError(null);
    }
  }

  const set = <K extends keyof DraftProduct>(key: K, value: DraftProduct[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const price = Number(draft.price);
    const stock = Number(draft.stock);
    const parLevel = draft.parLevel.trim() === '' ? stock : Number(draft.parLevel);

    if (draft.name.trim() === '') {
      setError('Please enter a product name.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Please enter a valid price (0 or more).');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setError('Please enter a valid stock amount (0 or more).');
      return;
    }
    if (!Number.isFinite(parLevel) || parLevel < 0) {
      setError('Please enter a valid par level (0 or more).');
      return;
    }

    onSubmit(draft);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.scrim}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {initial ? 'Edit Item' : 'New Item Entry'}
          </Text>
          <Text style={styles.subtitle}>
            Saved straight into the SQLite products table.
          </Text>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field label="Product name">
              <TextInput
                value={draft.name}
                onChangeText={(value) => set('name', value)}
                placeholder="e.g. Kare-Kare"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Category">
              <View style={styles.chipWrap}>
                {CATEGORIES.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: draft.category === option }}
                    onPress={() => set('category', option)}
                    style={[
                      styles.chip,
                      draft.category === option && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        draft.category === option && styles.chipLabelActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <View style={styles.row}>
              <Field label="Price (₱)" style={styles.rowItem}>
                <TextInput
                  value={draft.price}
                  onChangeText={(value) => set('price', value)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </Field>

              <Field label="Stock" style={styles.rowItem}>
                <TextInput
                  value={draft.stock}
                  onChangeText={(value) => set('stock', value)}
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>

            <View style={styles.row}>
              <Field label="Unit" style={styles.rowItem}>
                <View style={styles.chipWrap}>
                  {UNITS.map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.unit === option }}
                      onPress={() => set('unit', option)}
                      style={[
                        styles.chip,
                        draft.unit === option && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          draft.unit === option && styles.chipLabelActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Par level" style={styles.rowItem}>
                <TextInput
                  value={draft.parLevel}
                  onChangeText={(value) => set('parLevel', value)}
                  placeholder="same as stock"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={submit}
              style={({ pressed }) => [
                styles.save,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.saveLabel}>
                {initial ? 'Save Changes' : 'Save to SQLite'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xs,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    marginBottom: spacing.md,
  },
  title: { ...type.titleMd, color: colors.text },
  subtitle: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm },

  body: { marginTop: spacing.sm },
  bodyContent: { gap: spacing.lg, paddingBottom: spacing.lg },

  field: { gap: spacing.xs },
  fieldLabel: { ...type.labelSm, color: colors.textMuted },
  input: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    ...type.bodyLg,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { ...type.bodyMd, color: colors.textMuted, fontWeight: '500' },
  chipLabelActive: { color: colors.surface },

  error: { ...type.bodyMd, color: colors.danger, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
  cancel: {
    paddingHorizontal: spacing.xl,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { ...type.titleSm, color: colors.textMuted },
  save: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  saveLabel: { ...type.titleSm, color: colors.surface },
  pressed: { opacity: 0.75 },
});
