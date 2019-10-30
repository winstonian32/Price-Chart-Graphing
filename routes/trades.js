const express = require("express");
const router = express.Router();
const TradeList = require("../models/tradeList");
const Symbols = require("../models/symbols");

let History = require("../client/src/components/api/quandlConfig");

router.get("/current", (req, res) => {
  TradeList.find({ ticker: req.query.tck }).then(function(tradeList) {
    res.send(tradeList);
  });
});

router.post("/current", (req, res) => {
  TradeList.create(req.body).then(function(tradeList) {
    res.send(tradeList);
  });
});

router.get("/config", (req, res) => {
  var config = {
    supports_search: true,
    supports_group_request: false,
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: false,
    exchanges: [
      {
        value: "",
        name: "All Exchanges",
        desc: ""
      },
      {
        value: "NasdaqNM",
        name: "NasdaqNM",
        desc: "NasdaqNM"
      },
      {
        value: "NYSE",
        name: "NYSE",
        desc: "NYSE"
      },
      {
        value: "NCM",
        name: "NCM",
        desc: "NCM"
      },
      {
        value: "NGM",
        name: "NGM",
        desc: "NGM"
      }
    ],
    symbols_types: [
      {
        name: "All types",
        value: ""
      },
      {
        name: "Stock",
        value: "stock"
      },
      {
        name: "Index",
        value: "index"
      }
    ],
    supported_resolutions: ["D", "2D", "3D", "W", "3W", "M", "6M"]
  };
  res.send(config);
});

router.get("/symbols", (req, res) => {
  Symbols.find({ name: req.query.symbol }).then(function(symbols) {
    if (symbols.length !== 0) {
      var symInfo = {
        name: symbols[0].name,
        "exchange-traded": symbols[0].exchange,
        "exchange-listed": symbols[0].exchange,
        timezone: "America/New_York",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "0930-1630",
        has_intraday: false,
        has_no_volume: symbols[0].type !== "stock",
        description: symbols[0].description,
        type: symbols[0].type,
        supported_resolutions: ["D", "2D", "3D", "W", "3W", "M", "6M"],
        pricescale: 100,
        ticker: symbols[0].name
      };
    } else {
      var symInfo = {
        timezone: "America/New_York",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "0930-1630",
        has_intraday: false,
        supported_resolutions: ["D", "2D", "3D", "W", "3W", "M", "6M"],
        pricescale: 100
      };
    }
    res.send(symInfo);
  });
});

router.get("/search", (req, res) => {
  Symbols.find({
    name: { $regex: req.query.query, $options: "i" }
  }).then(function(symbols) {
    var searchRes = [];
    for (var i = 0; i < symbols.length; i++) {
      var curr = {
        symbol: symbols[i].name,
        full_name: symbols[i].name,
        description: symbols[i].description,
        exchange: symbols[i].exchange,
        type: symbols[i].type
      };
      searchRes.push(curr);
    }
    res.send(searchRes);
  });
});

router.get("/history", (req, res) => {
  res.send(
    History.GetSymbolHistory(
      req.query.symbol,
      req.query.from,
      req.query.to,
      req.query.resolution
    )
  );
});

router.post("/addSymbols", (req, res) => {
  Symbols.create(req.body).then(function(symbols) {
    res.send(symbols);
  });
});

module.exports = router;
