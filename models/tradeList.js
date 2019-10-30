const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TradeListSchema = new Schema({
  tradeNum: {
    type: Number
  },

  type: {
    type: String
  },

  price: {
    type: Number,
    min: 0
  },

  ticker: {
    type: String
  },

  timestamp: {
    type: Date
  }
});

module.exports = TradeList = mongoose.model("tradeList", TradeListSchema);
