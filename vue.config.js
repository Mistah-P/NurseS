const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'NurseScript'
    }
  },
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
      // Copy new module directory for difficulty-based content
      args[0].patterns.push({
        from: path.resolve(__dirname, 'public/new module'),
        to: path.resolve(__dirname, 'dist/new module'),
        globOptions: {
          ignore: ['.*']
        }
      })
      // Copy updated module directory
      args[0].patterns.push({
        from: path.resolve(__dirname, 'public/updated module'),
        to: path.resolve(__dirname, 'dist/updated module'),
        globOptions: {
          ignore: ['.*']
        }
      })
      return args
    })
  }
})
