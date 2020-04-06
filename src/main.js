/* eslint-disable */
import Vue from "vue";
import vuetify from "./plugins/vuetify";
import App from "./App.vue";
import VueChart from "@seregpie/vue-chart";

Vue.config.productionTip = false;

Vue.component(VueChart.name, VueChart);

new Vue({
  vuetify,
  render: function (h) {
    return h(App);
  },
}).$mount("#app");
