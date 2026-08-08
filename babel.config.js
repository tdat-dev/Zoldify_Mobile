module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: nativewind là thứ cho phép viết className trên
      // component React Native
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
