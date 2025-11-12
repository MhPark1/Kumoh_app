import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';

export function Input({icon, containerStyle, style, ...props}) {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={colors.gray400}
          style={styles.icon}
        />
      )}
      <TextInput
        style={[styles.input, icon && styles.inputWithIcon, style]}
        placeholderTextColor={colors.gray400}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
});
