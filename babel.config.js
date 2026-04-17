// Reanimated v4 + Worklets babel plugin.
// `react-native-worklets/plugin` must be the last plugin so it sees the
// expanded AST from babel-preset-expo. Without this plugin, any `'worklet'`
// directive produces a runtime crash on the UI thread.
module.exports = function babelConfig(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  }
}
