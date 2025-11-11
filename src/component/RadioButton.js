import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RadioButton = ({
  isSelected,
  buttonColor,
  selectedButtonColor,
  labelColor,
  style,
  wrapStyle,
  children,
  onPress,
}) => {
  const color = isSelected
    ? selectedButtonColor || '#3872ef'
    : buttonColor || '#ccc';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, wrapStyle]}>
      <View style={[styles.circle, { borderColor: color }]}>
        {isSelected && (
          <View style={[styles.checkedCircle, { backgroundColor: color }]} />
        )}
      </View>
      {children && (
        <Text style={[styles.label, { color: labelColor || '#000' }, style]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  circle: {
    height: 20,
    width: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkedCircle: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#2196f3',
  },
  label: {
    fontSize: 16,
  },
});

export default RadioButton;
