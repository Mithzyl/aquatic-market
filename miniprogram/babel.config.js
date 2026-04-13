module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true
    }],
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]
  ]
}