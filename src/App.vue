<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <v-img
          alt="Coronafj Logo"
          class="shrink mr-2"
          contain
          src="../public/coronafj.png"
          transition="scale-transition"
          width="35"
        />
        <span>Private Corona App (v{{ version() }}) @fj</span>
      </div>

      <!-- 
      <v-spacer></v-spacer>
      <v-btn text @click="show = 'chart'">
        Chart
        <v-icon right>mdi-chart-line</v-icon>
      </v-btn>
      <v-btn text @click="show = 'list'">
        List
        <v-icon right>mdi-view-list</v-icon>
      </v-btn>
      <v-btn
        href="https://info.gesundheitsministerium.at/"
        target="_blank"
        text
      >
         <span class="mr-2">Original Page from Ministry</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
      -->
    </v-app-bar>

    <v-content class="flex-wrap">
      <v-combobox
        class="pa-2"
        v-model="selected"
        :items="countryCodes"
        :hint="selectedShort.join(', ')"
        item-text="CountryName"
        item-value="CountryCode"
        small-chips
        persistent-hint
        label="Select countries for list:"
        multiple
        prepend-icon="mdi-filter-outline"
        outlined
        :filter="filterItem"
        :menu-props="mprops"
      >
        <template v-slot:selection="{ attrs, item }">
          <v-chip
            v-bind="attrs"
            close
            @click.stop="setCountry(item.CountryCode, $event)"
            @click:close="remove(item)"
            small
            ><v-avatar left>
              <v-img
                :src="
                  'https://www.countryflags.io/' +
                  item.CountryCode +
                  '/flat/64.png'
                "
              ></v-img>
            </v-avatar>
            <strong>{{ item.CountryCode }}</strong
            >&nbsp;
            <span>({{ item.alt }})</span>
          </v-chip>
        </template>
      </v-combobox>
      <v-divider class="my-1" />
      <v-data-table
        :headers="histHeaders"
        :items="histList"
        dense
        hide-default-footer
        class="elevation-2 pa-1"
        :items-per-page="100"
        must-sort
        fixed-header
        :sort-by="['sickPerMillion']"
      >
        <template v-slot:item="{ item, headers }">
          <tr
            class="alternate"
            @click.stop="setCountry(item.alpha2Code, $event)"
          >
            <td
              class="px-1"
              v-for="column in headers"
              :key="column.value"
              :class="
                { center: 'text-center', end: 'text-right' }[column.align] ||
                'text-start'
              "
              v-text="
                column.format
                  ? numberFormat(item[column.value], column.format)
                  : item[column.value]
              "
            />
          </tr>
        </template>
      </v-data-table>
      <v-divider class="my-1" />
      <div class="subtitle-2" style="display: flex;">
        <v-img
          max-width="24"
          :src="
            'https://www.countryflags.io/' +
            ccountry.alpha2Code +
            '/flat/64.png'
          "
        ></v-img
        ><span class="ml-1">{{ ccountry && ccountry.alt }}:</span>
      </div>
      <div class="body-2">
        Total cases:&nbsp;{{ current.confirmed | nformat("?;") }}, Total
        recovered:&nbsp;{{ current.recovered | nformat("?;") }}, Total
        deaths:&nbsp;{{ current.deaths | nformat("?;") }}, Current sick:&nbsp;{{
          current.totalSick | nformat("?;")
        }}, Recovery rate:&nbsp;{{ current.recovRate | nformat("?2;%") }}, Death
        rate:&nbsp;{{ current.deathRate | nformat("?2;%") }},
        {{ $t("DeathMillion") }}:&nbsp;{{
          current.deathPerMillion | nformat("?2;")
        }}, Double in days last:&nbsp;{{
          current.double1 | nformat("?2;")
        }}
        average3:&nbsp;{{ current.double3 | nformat("?2;") }}, New rate
        last:&nbsp;{{ current.pconf | nformat("?2;%") }} average3:&nbsp;{{
          current.pconf3 | nformat("?2;%")
        }}, New to recovered+death rate average3:&nbsp;{{
          current.confrate | nformat("?1;%")
        }}, Population:&nbsp;{{ current.population | nformat("?;") }},
        Sick/Million:&nbsp;{{
          ((current.confirmed * 1000000) / current.population) | nformat("?3;")
        }}
      </div>
      <v-divider class="my-1" />
      <vue-chart
        class="pa-1"
        v-if="chart"
        style="position: relative; height: 40vh; width: 100%;"
        :data="timeData"
        :options="timeOptions"
        :update-config="{ duration: 500, easing: 'easeInOutCirc' }"
        type="line"
      />

      <!--       
      <div class="body-2">
        Total confirmed: {{ current.confirmed | nformat("?;") }}, Total
        recovered: {{ current.recovered | nformat("?;") }}, Total deaths:
        {{ current.deaths | nformat("?;") }},
        <br />
        Total cases: {{ current.totalSick | nformat("?;") }}, Recovery rate:
        {{ current.recovRate | nformat("?2;%") }}, Death rate:
        {{ current.deathRate | nformat("?2;%") }}, Death/Million:
        {{ current.deathPerMillion | nformat("?2;") }},
        <br />
        Double in days last:
        {{ current.double1 | nformat("?2;") }} average3:
        {{ current.double3 | nformat("?2;") }}, New rate last:
        {{ current.pconf | nformat("?2;%") }} average3:
        {{ current.pconf3 | nformat("?2;%") }},
        <br />
        New to recovered+death rate average3:
        {{ current.confrate | nformat("?1;%") }}, Population:
        {{ current.population | nformat("?;") }}, Sick/Million:
        {{
          ((current.confirmed * 1000000) / current.population) | nformat("?3;")
        }}
      </div>
      -->
    </v-content>
  </v-app>
</template>

<script>
import axios from "axios";
import countries from "./assets/countries.json";
import packagej from "../package.json";

const mylang = (navigator.language || navigator.userLanguage).slice(0, 2);
const myCache = {};
/*
function fix(number, digits, min, max) {
  min = min || Number.NEGATIVE_INFINITY;
  max = max || Number.POSITIVE_INFINITY;
  number = number < min ? min : number;
  number = number > max ? max : number;
  return Number(number.toFixed(digits === undefined ? 3 : digits));
}
*/
// import Hello from './components/Hello';
export default {
  name: "App",
  data: () => {
    return {
      //      myData: myData,
      chart: false,
      histAt: null,
      timeData: null,
      timeOptions: null,
      activeCountry: "",
      message: "",
      searchCountry: "",
      myLang: mylang,
      countries: countries,
      countryIndex: {},
      ccountry: null,
      current: { confirmed: 0 },
      selected: [],
      expanded: 0,
      mprops: {
        auto: true,
        overflowY: true,
        maxHeight: 300,
        closeOnClick: false,
        closeOnContentClick: true,
        openOnClick: false,
        disabled: false,
      },
      histList: [],
      // tmp: {},
      // tmp1: {},
      histHeaders: [
        {
          text: "Country",
          align: "start",
          sortable: false,
          value: "alt",
        },
        // {
        //   text: "Sick%",
        //   align: "end",
        //   sortable: true,
        //   value: "pconf",
        //   format: "?2;",
        // },
        {
          text: "Sick/M",
          align: "end",
          sortable: true,
          value: "sickPerMillion",
          format: "?1;",
        },
        {
          text: "Recovered%",
          align: "end",
          sortable: true,
          value: "recovRate",
          format: "?2;",
        },
        {
          text: "Deaths/M",
          align: "end",
          sortable: true,
          value: "deathPerMillion",
          format: "?1;",
        },
        {
          text: "Deaths%",
          align: "end",
          sortable: true,
          value: "deathRate",
          format: "?2;",
        },
        {
          text: "New%",
          align: "end",
          sortable: true,
          value: "pconf3",
          format: "?2;",
        },
        {
          text: "Double in",
          align: "end",
          sortable: true,
          value: "double3",
          format: "?1;",
        },
        {
          text: "new/ (rec+deadths)",
          align: "end",
          sortable: true,
          value: "confrate",
          format: "?1;",
        },
        {
          text: "Recovered/day",
          align: "end",
          sortable: true,
          value: "treco3",
          format: "?;",
        },
        {
          text: "Sick",
          align: "end",
          sortable: true,
          value: "confirmed",
          format: "?;",
        },
        {
          text: "Recovered",
          align: "end",
          sortable: true,
          value: "recovered",
          format: "?;",
        },
        {
          text: "Deaths",
          align: "end",
          sortable: true,
          value: "deaths",
          format: "?;",
        },
        {
          text: "Population",
          align: "end",
          sortable: true,
          value: "population",
          format: "?;",
        },
      ],
    };
  },
  filters: {
    nformat: (val, places, options) => {
      if (
        options === undefined &&
        (typeof places === "object" || typeof places === "string")
      ) {
        options = places;
        places = undefined;
      } else if (!options) options = {};
      else if (typeof options === "string" && places !== undefined)
        options = { postfix: options };
      if (typeof options === "string") {
        const match = options.match(/^([.,?]?)(\d+)?(\;?)(\-[^\+]+)?\+?(.*)$/);
        options = {};
        if (match) {
          if (match[2] === undefined && places === undefined) places = 0;
          else places = Number(match[2]);
          if (match[1]) options.decimalPoint = match[1];
          options.sepThousands = !!match[3];
          if (match[4] && match[4].startsWith("-"))
            options.prefix = match[4].slice(1);
          else options.prefix = "";
          options.postfix = match[5];
        }
      }
      if (places !== undefined) {
        if (!isNaN(Number(places))) places = Number(places);
      } else places = Number(options.digits);
      if (places === undefined || isNaN(places)) places = 0;
      if (options.digits && !isNaN(Number(options.digits)))
        places = Number(options.digits);
      if (options.decimalPoint === "?") {
        options.decimalPoint = mylang == "en" ? "." : ",";
      }
      val = Number(val);
      val = isNaN(val) ? "NaN" : val.toFixed(places).toString();
      if (options.decimalPoint) val = val.replace(".", options.decimalPoint);
      if (options.sepThousands) {
        const del = options.decimalPoint === "," ? "." : ",";
        const dec = del === "," ? "." : ",";
        const spl = val.split(dec);
        val = spl[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + del);
        if (spl[1]) val += dec + spl[1].replace(/(\d{3})(?=\d)/g, "$1" + del);
      }
      if (options.prefix) val = options.prefix + " " + val;
      if (options.postfix) val += " " + options.postfix;
      return val;
    },
  },
  methods: {
    setCountry(item, event) {
      event.stopPropagation();
      //      this.mprops.disabled = true;
      this.activeCountry = this.countryCodes.filter(
        (i) => i.CountryCode == item
      )[0];
      //      setTimeout((_) => (this.mprops.disabled = false), 100);
      //      this.$nextTick().then();
    },

    filterItem(item, qText, iText) {
      const s = qText.toLowerCase();
      const t = iText.toLowerCase() + " " + item.CountryCode.toLowerCase();
      //      console.log("filter:", qText, " itext:", iText, "item:", item);
      return t.indexOf(s) >= 0;
    },

    remove(item) {
      this.selected.splice(this.selected.indexOf(item), 1);
      this.selected = [...this.selected];
    },
    numberFormat(val, ...args) {
      if (
        this.$options &&
        this.$options.filters &&
        this.$options.filters["nformat"]
      )
        return this.$options.filters["nformat"](val, ...args);
      else return val;
    },

    version() {
      //      console.log(process.env);
      return packagej.version;
    },

    consoleLog(...args) {
      let s = "";
      args.map((l) => (s += l + " "));
      this.message += s + "<br>";
    },

    calcHistory(history) {
      function sq3m(e, key, i, n) {
        const ci = e[key];
        let cs = ci * ci;
        let x = 1;
        if (ci == Infinity) x = cs = 0;

        while (--n >= 0 && --i >= 0)
          if (Number(history[i][key] != Infinity)) {
            x++;
            cs += Math.pow(Number(history[i][key]), 2);
          }
        return Math.sqrt(cs / x);
      }

      while (
        (history.length > 1 &&
          !history[0].confirmed &&
          !history[1].confirmed) ||
        history[0].date < "2020-02-15T00:00:00"
      )
        history.shift();
      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        // calculate all new values
        item.active = item.confirmed - item.deaths - item.recovered;
        item.tconf = item.confirmed - (i > 0 ? history[i - 1].confirmed : 0);
        item.tconf3 = sq3m(item, "tconf", i, 4);
        item.tdeaths = item.deaths - (i > 0 ? history[i - 1].deaths : 0);
        item.tdeaths3 = sq3m(item, "tdeaths", i, 4);
        item.treco = item.recovered - (i > 0 ? history[i - 1].recovered : 0);
        item.treco3 = sq3m(item, "treco", i, 4);
        item.pconf = (item.active && (100.0 * item.tconf) / item.active) || 0;
        item.pconf3 = sq3m(item, "pconf", i, 4);
        if (item.pconf3 > 60) item.pconf3 = null;
        let c =
          i < 2
            ? 0
            : Math.log2(2) /
              (Math.log2(item.confirmed) - Math.log2(history[i - 2].confirmed));
        if (c == Infinity) c = item.y ? Math.log2(e.y) : 0;
        item.double1 = c;
        item.double3 = sq3m(item, "double1", i, 3);
      }
      return history;
    },

    calcLast(history, country) {
      let last = { confirmed: 0 };
      if (history && history.length) {
        last = JSON.parse(JSON.stringify(history[history.length - 1]));
        last.totalSick = last.confirmed - last.deaths - last.recovered;
        last.deathRate = (100.0 * last.deaths) / last.totalSick;
        last.recovRate = (100.0 * last.recovered) / last.totalSick;
        last.confrate = (100.0 * last.tconf3) / (last.treco3 + last.tdeaths3);
        last.double1 = last.double1;
        last.double3 = last.double3;
        last.pconf = last.pconf;
        last.pconf3 = last.pconf3;
        last.population = country.population;
        last.sickPerMillion = (last.confirmed * 1000000) / country.population;
        last.deathPerMillion = (last.deaths * 1000000) / country.population;
      }
      return last;
    },
    /*     getColor(kp) {
      kp = Number(kp.replace(",", "."));
      const kpa = this.myData.kpmd;
      if (kp > kpa) return "red lighten-4";
      else if (kp < kpa / 2) return "green lighten-4";
      else return "orange lighten-4";
    },
 */
    /*
    convCsv(data, options) {
      function splitCSV(str, delimiter, quotes) {
        //split the str first
        //then merge the elments between two double quotes
        delimiter = delimiter || ",";
        quotes = quotes || '"';
        var elements = str.split(delimiter);
        var newElements = [];
        for (var i = 0; i < elements.length; ++i) {
          if (elements[i].indexOf(quotes) >= 0) {
            //the left double quotes is found
            var indexOfRightQuotes = -1;
            var tmp = elements[i];
            //find the right double quotes
            for (var j = i + 1; j < elements.length; ++j) {
              if (elements[j].indexOf(quotes) >= 0) {
                indexOfRightQuotes = j;
                break;
              }
            }
            //found the right double quotes
            //merge all the elements between double quotes
            if (-1 != indexOfRightQuotes) {
              for (var j = i + 1; j <= indexOfRightQuotes; ++j) {
                tmp = tmp + delimiter + elements[j];
              }
              newElements.push(tmp);
              i = indexOfRightQuotes;
            } else {
              //right double quotes is not found
              newElements.push(elements[i]);
            }
          } else {
            //no left double quotes is found
            newElements.push(elements[i]);
          }
        }

        return newElements;
      }
      const { sep, lineSep, noHeader, quotes } = Object.assign(
        { sep: ",", lineSep: "\n", quotes: '"' },
        options || {}
      );
      data = data || "";
      const list = data.split(lineSep).map((i) => i.trim());
      const titles = splitCSV(list[0], sep, quotes).map((i, index) =>
        noHeader ? index : i.trim()
      );
      const res = {};
      for (let i = noHeader ? 0 : 1; i < list.length; i++) {
        const values = splitCSV(list[i], sep, quotes).map((i) => i.trim());
        for (let j = 0; j < titles.length; j++) {
          const name = titles[j];
          if (name) {
            if (!res[name]) res[name] = [];
            const item = res[name];
            const val = values[j];
            item[noHeader ? i : i - 1] =
              val === "0" || Number(val) ? Number(val) : val;
          }
        }
      }
      return res;
    },

    proxyAxios(url, always) {
      return axios({
        method: "get",
        url:
          process.env.IS_ELECTRON && !always
            ? url
            : "http://cors-anywhere.herokuapp.com/" + url,
        headers: { "Access-Control-Allow-Origin": true },
      });
    },
*/
    getCountry(code) {
      if (myCache[code]) return Promise.resolve(myCache[code]);
      return axios
        .get("https://api.smartable.ai/coronavirus/stats/" + code, {
          headers: { "Subscription-Key": "3009d4ccc29e4808af1ccc25c69b4d5d" },
        })
        .then(
          (res) => {
            res = res.data;
            res.country = this.countryIndex[code];
            res.history = this.calcHistory(res.stats.history);
            res.current = this.calcLast(res.history, res.country);
            myCache[code] = res;
            return res;
          },
          (e) => {
            this.consoleLog("Error get country data for", code);
            return {};
          }
        );
    },

    wait(time) {
      var timer;
      const that = this;
      return new Promise((res) => {
        if (!time || time < 0 || typeof time !== "number")
          return that.$nextTick(res);
        timer = setTimeout((_) => {
          timer = null;
          return res();
        }, time);
      });
    },

    pSequence(arr, promise, wait) {
      wait = wait || 0;
      if (!Array.isArray(arr) && typeof arr === "object")
        arr = Object.entries(arr);
      const res = [];
      const myPromise = (key) =>
        this.wait(wait).then((_) =>
          promise(key).then((r) => res[res.push(r) - 1])
        );
      return arr
        .reduce((p, x) => p.then((_) => myPromise(x)), Promise.resolve())
        .then((_) => res);
    },
  },

  computed: {
    countryCodes() {
      return this.countries
        .map((c) => {
          const ret = {
            CountryCode: c.alpha2Code,
            CountryName: c.name,
          };
          c.alt = c.name;
          let alt = "";
          if (c.translations && c.translations[this.myLang])
            alt = c.translations[this.myLang];
          else if (c.nativeName) alt = c.nativeName;
          if (alt) {
            c.alt = alt;
            ret.alt = alt;
            ret.ori = ret.CountryName;
            ret.CountryName += " / " + alt;
          }
          return ret;
        })
        .sort(function (a, b) {
          if (a.CountryName < b.CountryName) {
            return -1;
          }
          if (a.CountryName > b.CountryName) {
            return 1;
          }
          return 0;
        });
    },
    selectedShort() {
      return this.selected.map((i) => i.CountryCode);
    },
  },
  watch: {
    selectedShort(newC) {
      //      const list = [];
      this.histList = [];
      this.chart = false;
      return this.wait(30).then((_) =>
        this.pSequence(
          newC,
          (code) =>
            this.getCountry(code).then((i) =>
              this.histList.push(Object.assign({}, i.country, i.current))
            ),
          10
        ).then((_) => {
          //          this.histList = list;
          return this.wait(10).then((_) =>
            this.$forceUpdate((this.chart = true))
          );
        })
      );
    },

    activeCountry(newC) {
      if (!newC) return {};
      this.ccountry = this.countryIndex[newC.CountryCode];
      return this.getCountry(newC.CountryCode).then((res) => {
        this.histAt = res;
      });
    },

    histAt(newH) {
      function hexToRGB(h, e) {
        e = e ? "" : "," + +e;
        let r = 0,
          g = 0,
          b = 0;

        // 3 digits
        if (h.length == 4) {
          r = "0x" + h[1] + h[1];
          g = "0x" + h[2] + h[2];
          b = "0x" + h[3] + h[3];

          // 6 digits
        } else if (h.length == 7) {
          r = "0x" + h[1] + h[2];
          g = "0x" + h[3] + h[4];
          b = "0x" + h[5] + h[6];
        }

        return "rgb(" + +r + "," + +g + "," + +b + e + ")";
      }

      const colors = [
        "#C2185B",
        "#1565C0",
        "#00796B",
        "#FFEA00",
        "#F57C00",
        "#5D4037",
        "#455A64",
        "#64DD17",
      ];

      const country = newH && newH.location && newH.location.countryOrRegion;
      const history = newH.history;
      this.current = newH.current;
      const labels = [];
      let datasets = [];
      const timeFormat = "YYYY-MM-DD HH:mm";
      const options = {
        title: {
          text: "Covid cases for " + country,
        },
        maintainAspectRatio: false,
        tooltips: {
          mode: "index",
        },
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                parser: timeFormat,
                displayFormats: {
                  day: "ddd MMM D",
                }, // round: 'day'
                tooltipFormat: "ddd ll",
              },
              // scaleLabel: {
              //   display: false,
              //   labelString: "Date",
              // },
            },
          ],
          yAxes: [],
        },
      };
      //      this.consoleLog("His data loaded! for:", country || "unknown");
      if (country && history.length) {
        const example = history[0];
        const series = [];
        const axes = {
          tconf3: "new|log2|/day",
          confirmed: "sick total|log1|total",
          double3: "toDouble|n5|days",
          pconf3: "new %|perc|",
          active: "sick actual|log1|total",
          recovered: "recovered|log1|total",
          tdeaths: "died|log2|/day",
          treco3: "recovered|log2|/day",
        };
        const naxes = {};
        let posit = false;
        const yAxes = [];
        for (const n of Object.keys(axes)) {
          const an = axes[n].split("|");
          const a = an[1];
          const se = {
            name: n,
            label: an[0] + (an[2] ? "-" + an[2] : ""),
            yAxisID: a,
            data: [],
            fill: false,
            borderColor: hexToRGB(colors[series.length % colors.length], 0.9),
          };
          se.backgroundColor = se.borderColor;
          series.push(se);
          if (!naxes[a]) {
            const nax = {
              id: a,
              position: (posit = !posit) ? "left" : "right",
              type: a.startsWith("log") ? "logarithmic" : "linear",
              scaleLabel: {
                labelString: an[2],
                display: a != "perc",
              },
              ticks: {
                fontColor: "#202020",
                fontSize: 14,
                callback:
                  a == "perc"
                    ? function (value, index, values) {
                        return (
                          "    ".slice(0, 4 - value.toString().length) +
                          value +
                          " %"
                        );
                      }
                    : (v) => v,
                //           beginAtZero: true,
              },
            };
            naxes[a] = nax;
            yAxes.push(nax);
          }
          //          }
        }
        for (let i = 0; i < history.length; i++) {
          const item = history[i];
          labels.push(new Date(item.date));
          let s = 0;
          for (const n of Object.keys(axes)) series[s++].data.push(item[n]);
        }
        datasets = series;
        options.scales.yAxes = yAxes;
        this.timeOptions = options;
        this.timeData = { labels, datasets };
      }
    },
  },

  mounted() {
    //    console.log("Mounted:", this.$t);
    /*     axios(
      "https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_particular_country.php?country=Austria",
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
          "x-rapidapi-key":
            "f15ec2b43amshcdf31a3383ec09dp1c4144jsn44f08110d1c8",
        },
      }
    )
      .then(
        (response) => console.log((this.tmp = response.data)),
        (err) => console.log(err)
      )
      .then((_) => {
      console.log("second");
        return axios(
          "https://coronavirus-monitor.p.rapidapi.com/coronavirus/history_by_particular_country_by_date.php?country=Austria&date=2020-04-09",
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
              "x-rapidapi-key":
                "f15ec2b43amshcdf31a3383ec09dp1c4144jsn44f08110d1c8",
            },
          }
        ).then(
          (response) => console.log((this.tmp1 = response.data)),
          (err) => console.log(err)
        );
      });
 */
    this.$i18n.locale = this.myLang;
    this.countries.map((i) => (this.countryIndex[i.alpha2Code] = i));
    this.activeCountry = { CountryCode: "AT", CountryName: "Austria" };
    this.selected = this.countryCodes.filter(
      (i) =>
        "AT, CH, DE, BE, CN, DK, FI, FR, IT, NL, NO, ES, PT, SE, GB, US"
          .split(", ")
          .indexOf(i.CountryCode) >= 0
    );
    this.$nextTick().then((_) => this.$forceUpdate());
  },

  created() {},
};
</script>
<style scoped.vue>
html {
  overflow-y: auto !important;
}

tr.alternate:nth-child(odd) {
  background: #e3f2fd;
}

td,
th,
th[role="columnheader"] {
  padding: 0 1px;
  border-left: 1px dotted #dddddd;
}
</style>
