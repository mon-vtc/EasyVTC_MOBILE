import React, { useState } from 'react';
import {
  View, Text, TextInput,
  StyleSheet, TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { Controller, type Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

interface FormFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'ref'> {
  control:          Control<T>;
  name:             Path<T>;
  label?:           string;
  error?:           string;
  placeholder?:     string;
  secureTextEntry?: boolean;
  showToggle?:      boolean;
  icon?:            IconName;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  placeholder,
  secureTextEntry = false,
  showToggle = false,
  icon,
  ...props
}: FormFieldProps<T>) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>

        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.iconPrimary}
            style={styles.iconLeft}
          />
        )}

        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={onChange}
              value={value}
              placeholder={placeholder}
              placeholderTextColor={Colors.textPlaceholder}
              secureTextEntry={isSecure}
              autoCapitalize="none"
              {...props}
            />
          )}
        />

        {showToggle && secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.toggleBtn}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.iconPrimary}
            />
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
    fontSize:     Fonts.size.sm,
    fontWeight:   '600',
    color:        Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  inputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       Colors.borderWith,
    borderColor:       Colors.border,
    borderRadius:      Radius.md,
    backgroundColor:   Colors.placeHolder,
    paddingHorizontal: Spacing.sm,
  },

  inputWrapperError: {
    borderColor: Colors.error,
  },

  iconLeft: {
    marginRight: Spacing.sm,
  },

  input: {
    flex:            1,
    paddingVertical: Spacing.sm,
    fontSize:        Fonts.size.md,
    color:           Colors.textPrimary,
  },
  

  toggleBtn: {
    marginLeft: Spacing.sm,
    padding:    Spacing.xs,
  },

  error: {
    fontSize:   Fonts.size.xs,
    color:      Colors.error,
    marginTop:  Spacing.xs,
  },
});