import { useState } from 'react'
import { TextInput, type TextInputProps, type TextStyle, View, type ViewStyle } from 'react-native'

import { createStyles, scaleFont, useTheme } from '@/theme'

import { Text } from './Text'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  readonly label?: string
  readonly helperText?: string
  readonly errorText?: string
  readonly required?: boolean
  readonly leadingAdornment?: React.ReactNode
  readonly trailingAdornment?: React.ReactNode
  readonly containerStyle?: ViewStyle
  readonly inputStyle?: TextStyle
  readonly testID?: string
}

export function Input({
  label,
  helperText,
  errorText,
  required,
  leadingAdornment,
  trailingAdornment,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  testID,
  editable = true,
  ...rest
}: InputProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [focused, setFocused] = useState(false)
  const hasError = Boolean(errorText)

  const borderColor = hasError
    ? theme.palette.danger
    : focused
      ? theme.palette.teal
      : theme.palette.border

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label ? (
        <Text variant="labelM" color={theme.palette.ink2} style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          { borderColor, backgroundColor: theme.palette.card },
          !editable && styles.disabled,
        ]}
      >
        {leadingAdornment}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={helperText}
          editable={editable}
          placeholderTextColor={theme.palette.ink3}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          style={[
            styles.input,
            {
              color: theme.palette.ink,
              fontFamily: theme.typography.bodyM.fontFamily,
              fontSize: scaleFont(theme.typography.bodyM.fontSize),
            },
            inputStyle,
          ]}
          {...rest}
        />
        {trailingAdornment}
      </View>

      {hasError ? (
        <Text variant="caption" color={theme.palette.danger} style={styles.helper}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color={theme.palette.ink2} style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  container: {
    gap: theme.spacing[4],
  },
  label: {
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing[12],
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing[12],
  },
  disabled: {
    opacity: 0.5,
  },
  helper: {
    marginTop: theme.spacing[2],
  },
}))
