import * as React from "react";
import "./index.css";
import { widget } from "../../charting_library/charting_library.min";
import axios from "axios";

// Uncomment for initial SymbolLoad
//import { addSymbs } from "../api/symbolLoad";

function getLanguageFromURL() {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null
    ? null
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function DisplayTradeListData(listStuff, tvWidget) {
  var visible = tvWidget.chart().getVisibleRange();
  var from = visible.from;
  var to = visible.to;
  console.log(visible);
  for (var index = 0; index < listStuff.length; index++) {
    var stamp = listStuff[index].timestamp;
    var date = new Date(stamp).getTime() / 1000;
    var num = listStuff[index].tradeNum;
    var type = listStuff[index].type;
    var value = listStuff[index].price;
    var action = { time: date };
    var entry = {
      shape: "arrow_up",
      text: "Long Entry Position " + num + " at Price: " + value
    };
    var exit = {
      shape: "arrow_down",
      text: "Long Exit Position " + num + " at Price: " + value
    };
    if (date >= from && date <= to) {
      if (type === "Long Entry") {
        tvWidget.chart().createShape(action, entry);
      } else if (type === "Long Exit") {
        tvWidget.chart().createShape(action, exit);
      }
    }
  }
}

export class TVChartContainer extends React.PureComponent {
  static defaultProps = {
    symbol: "MSFT",
    interval: "D",
    containerId: "tv_chart_container",
    datafeedUrl: "http://localhost:4000/trades",
    libraryPath: "/charting_library/",
    chartsStorageUrl: "https://saveload.tradingview.com",
    chartsStorageApiVersion: "1.1",
    clientId: "test_client",
    userId: "public_user_id",
    fullscreen: false,
    autosize: true,
    studiesOverrides: {}
  };
  state = {
    activeSymbol: "MSFT",
    trades: []
  };

  tvWidget = null;

  componentDidMount() {
    //Uncomment this line to add the test symbols to MongoDb
    //addSymbs();
    const widgetOptions = {
      symbol: this.props.symbol,
      datafeed: new window.Datafeeds.UDFCompatibleDatafeed(
        this.props.datafeedUrl
      ),
      interval: this.props.interval,
      container_id: this.props.containerId,
      library_path: this.props.libraryPath,

      locale: getLanguageFromURL() || "en",
      disabled_features: ["use_localstorage_for_settings"],
      enabled_features: ["study_templates"],
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      client_id: this.props.clientId,
      user_id: this.props.userId,
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      studies_overrides: this.props.studiesOverrides
    };

    axios
      .get(
        `http://localhost:4000/trades/current?tck=` + this.state.activeSymbol
      )
      .then(res => {
        const trades = res.data;
        this.setState({ trades });
      });

    const tvWidget = new widget(widgetOptions);

    this.tvWidget = tvWidget;

    tvWidget.onChartReady(() => {
      tvWidget.subscribe("series_properties_changed", () => {
        var currSymb = tvWidget.symbolInterval();
        var curr = currSymb.symbol;
        this.setState({ activeSymbol: curr });
        axios
          .get(`http://localhost:4000/trades/current?tck=` + curr)
          .then(res => {
            const trades = res.data;
            this.setState({ trades });
          });
      });
      tvWidget.headerReady().then(() => {
        const button1 = tvWidget.createButton();
        button1.setAttribute("title", "Click to show a notification popupp");
        button1.classList.add("apply-common-tooltip");
        button1.addEventListener("click", () => {
          DisplayTradeListData(this.state.trades, tvWidget);
        });

        button1.innerHTML = "Display Trades";
      });
    });
  }

  componentWillUnmount() {
    if (this.tvWidget !== null) {
      this.tvWidget.remove();
      this.tvWidget = null;
    }
  }

  render() {
    return <div id={this.props.containerId} className={"TVChartContainer"} />;
  }
}
