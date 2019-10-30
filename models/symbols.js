const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SymbolsSchema = new Schema({
  name: {
    type: String
  },

  description: {
    type: String
  },

  exchange: {
    type: String
  },

  type: {
    type: String
  }
});

module.exports = Symbols = mongoose.model("symbols", SymbolsSchema);
