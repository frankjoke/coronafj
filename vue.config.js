process.env.VUE_APP_VERSION = require("./package.json").version;

module.exports = {
  transpileDependencies: ["vuetify", "vue-echarts", "resize-detector"],

  pluginOptions: {},

  productionSourceMap: false,
  publicPath: ".",
  outputDir: "docs",
};
