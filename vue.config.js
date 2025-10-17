const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  configureWebpack: {
    resolve: {
      fallback: {
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "zlib": false
      }
    }
  },
  chainWebpack: config => {
    // Copy module files from public directory for production builds
    config.plugin('copy').tap(args => {
      args[0].patterns.push({
        from: path.resolve(__dirname, 'public/module'),
        to: path.resolve(__dirname, 'dist/module'),
        globOptions: {
          ignore: ['.*']
        }
      })
      return args
    })
  }
})
