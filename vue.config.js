const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
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
    // Copy module files to public directory so they can be fetched
    config.plugin('copy').tap(args => {
      args[0].patterns.push({
        from: path.resolve(__dirname, 'src/module'),
        to: path.resolve(__dirname, 'dist/src/module'),
        globOptions: {
          ignore: ['.*']
        }
      })
      return args
    })
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
      publicPath: '/src'
    }
  }
})
