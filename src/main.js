/* eslint-disable */
import Vue from "vue";
import vuetify from "./plugins/vuetify";
import App from "./App.vue";
import VueChart from "@seregpie/vue-chart";
import i18n from './i18n'

Vue.config.productionTip = false;

Vue.component(VueChart.name, VueChart);

new Vue({
  vuetify,
  i18n,

  render: function (h) {
    return h(App);
  }
}).$mount("#app");
