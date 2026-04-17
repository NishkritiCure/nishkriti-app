/**
 * Test-only stub for react-native-safe-area-context.
 *
 * The real package ships Flow-annotated source that Vitest cannot parse;
 * vitest.config.ts aliases the module to this stub so our component tests
 * can render surfaces that reach for insets.
 */
import { createElement, Fragment, type ReactNode } from 'react'
import { View } from 'react-native'

export type Edge = 'top' | 'right' | 'bottom' | 'left'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SafeAreaView = (props: any) => createElement(View, props, props.children)

export const SafeAreaProvider = ({ children }: { children: ReactNode }) =>
  createElement(Fragment, null, children)

export const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 })
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 0, height: 0 })
