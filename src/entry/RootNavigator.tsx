import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/theme/ThemeContext'

export function RootNavigator() {
  const theme = useTheme()
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.palette.bg }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.palette.ink }]}>Nishkriti</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
  },
})
