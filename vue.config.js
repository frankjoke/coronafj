process.env.VUE_APP_VERSION = require("./package.json").version;

module.exports = {
  transpileDependencies: ["vuetify", "vue-echarts", "resize-detector"],

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        win: {
          icon: "public/favicon.ico",
        },
        extraResources: [
          {
            from: "./extraResources/",
            to: "extraResources",
            filter: ["**/*"],
          },
        ],
      },
    },
  },

  productionSourceMap: false,
  publicPath: ''
};
