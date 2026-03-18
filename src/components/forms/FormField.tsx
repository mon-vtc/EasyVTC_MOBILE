import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, type TextInputProps } from 'react-native';
import { Controller, type Control, FieldValues, Path } from 'react-hook-form';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

interface FormFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'ref'> {
  control:         Control<T>;
  name:            Path<T>;
  label?:          string;
  error?:          string;
  placeholder?:    string;
  secureTextEntry?: boolean;
  showToggle?:     boolean;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  placeholder,
  secureTextEntry = false,
  showToggle = false,
  ...props
}: FormFieldProps<T>) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, error && styles.inputError]}
              onChangeText={onChange}
              value={value}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={isSecure}
              {...props}
            />
          )}
        />
        {showToggle && secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.size.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: Fonts.size.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  toggleBtn: {
    position: 'absolute',
    right: Spacing.sm,
    padding: Spacing.sm,
  },
  toggleText: {
    fontSize: 18,
  },
});