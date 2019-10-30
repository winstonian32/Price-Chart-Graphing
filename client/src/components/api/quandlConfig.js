var https = require("https");
var http = require("http");

var quandlCache = {};

var quandlCacheCleanupTime = 3 * 60 * 60 * 1000;
var quandlMinimumDate = "1970-01-01";
var quandlKey = "4gYpEzqLy8vaZrQmpUjQ";

setInterval(function() {
  quandlCache = {};
  console.warn("Quandl cache invalidated");
}, quandlCacheCleanupTime);

function dateToYMD(date) {
  var obj = new Date(date);
  var year = obj.getFullYear();
  var month = obj.getMonth() + 1;
  var day = obj.getDate();
  return year + "-" + month + "-" + day;
}

function convertQuandlHistoryToUDFFormat(data) {
  function parseDate(input) {
    var parts = input.split("-");
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function columnIndices(columns) {
    var indices = {};
    for (var i = 0; i < columns.length; i++) {
      indices[columns[i].name] = i;
    }

    return indices;
  }

  var result = {
    t: [],
    c: [],
    o: [],
    h: [],
    l: [],
    v: [],
    s: "ok"
  };

  try {
    var json = JSON.parse(data);
    var datatable = json.datatable;
    var idx = columnIndices(datatable.columns);

    datatable.data
      .sort(function(row1, row2) {
        return parseDate(row1[idx.date]) - parseDate(row2[idx.date]);
      })
      .forEach(function(row) {
        result.t.push(parseDate(row[idx.date]) / 1000);
        result.o.push(row[idx.open]);
        result.h.push(row[idx.high]);
        result.l.push(row[idx.low]);
        result.c.push(row[idx.close]);
        result.v.push(row[idx.volume]);
      });
  } catch (error) {
    console.log(error);
    return null;
  }

  return result;
}

function filterDataPeriod(data, fromSeconds, toSeconds) {
  if (!data || !data.t) {
    return data;
  }

  if (data.t[data.t.length - 1] < fromSeconds) {
    return {
      s: "no_data",
      nextTime: data.t[data.t.length - 1]
    };
  }

  var fromIndex = null;
  var toIndex = null;
  var times = data.t;
  for (var i = 0; i < times.length; i++) {
    var time = times[i];
    if (fromIndex === null && time >= fromSeconds) {
      fromIndex = i;
    }
    if (toIndex === null && time >= toSeconds) {
      toIndex = time > toSeconds ? i - 1 : i;
    }
    if (fromIndex !== null && toIndex !== null) {
      break;
    }
  }

  fromIndex = fromIndex || 0;
  toIndex = toIndex ? toIndex + 1 : times.length;

  var s = data.s;

  if (toSeconds < times[0]) {
    s = "no_data";
  }

  toIndex = Math.min(fromIndex + 1000, toIndex); // do not send more than 1000 bars for server capacity reasons

  return {
    t: data.t.slice(fromIndex, toIndex),
    o: data.o.slice(fromIndex, toIndex),
    h: data.h.slice(fromIndex, toIndex),
    l: data.l.slice(fromIndex, toIndex),
    c: data.c.slice(fromIndex, toIndex),
    v: data.v.slice(fromIndex, toIndex),
    s: s
  };
}

function httpGet(datafeedHost, path, callback) {
  var options = {
    host: datafeedHost,
    path: path
  };

  function onDataCallback(response) {
    var result = "";

    response.on("data", function(chunk) {
      result += chunk;
    });

    response.on("end", function() {
      if (response.statusCode !== 200) {
        callback({
          status: "ERR_STATUS_CODE",
          errmsg: response.statusMessage || ""
        });
        return;
      }

      callback({ status: "ok", data: result });
    });
  }

  var req = https.request(options, onDataCallback);

  req.on("socket", function(socket) {
    socket.setTimeout(5000);
    socket.on("timeout", function() {
      console.log(dateForLogs() + "timeout");
      req.abort();
    });
  });

  req.on("error", function(e) {
    callback({ status: "ERR_SOCKET", errmsg: e.message || "" });
  });

  req.end();
}

function GetSymbolHistory(
  symbol,
  startDateTimestamp,
  endDateTimestamp,
  resolution
) {
  var from = quandlMinimumDate;
  var to = dateToYMD(Date.now());
  var key = symbol + "|" + from + "|" + to;

  if (quandlCache[key]) {
    var dataFromCache = filterDataPeriod(
      quandlCache[key],
      startDateTimestamp,
      endDateTimestamp
    );
    return dataFromCache;
  }

  var address =
    "/api/v3/datatables/WIKI/PRICES.json" +
    "?api_key=" +
    quandlKey +
    "&ticker=" +
    symbol +
    "&date.gte=" +
    from +
    "&date.lte=" +
    to;

  httpGet("www.quandl.com", address, function(result) {
    if (result.status !== "ok") {
      if (result.status === "ERR_SOCKET") {
        console.log("Socket problem with request: " + result.errmsg);
        return [];
      }

      console.error("Message: " + result.errmsg);
      return [];
    }
    var data = convertQuandlHistoryToUDFFormat(result.data);
    if (data === null) {
      var dataStr = typeof result === "string" ? result.slice(0, 100) : result;
      console.error(" failed to parse: " + dataStr);
      return [];
    }

    if (data.t.length !== 0) {
      console.log(
        "Successfully parsed and put to cache " + data.t.length + " bars."
      );
      quandlCache[key] = data;
    } else {
      console.log("Parsing returned empty result.");
    }

    var filteredData = filterDataPeriod(
      data,
      startDateTimestamp,
      endDateTimestamp
    );
    return JSON.stringify(filteredData);
  });
}

module.exports = {
  GetSymbolHistory
};
