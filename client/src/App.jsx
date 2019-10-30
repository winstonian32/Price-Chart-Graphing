import * as React from "react";
import "./App.css";
import { TVChartContainer } from "./components/TVChartContainer/index";

class App extends React.Component {
  render() {
    return (
      <div className={"App"}>
        <header className={"App-header"}>
          <h1 className={"App-title"}>4Philoshopher's Charting v1.0</h1>
        </header>
        <TVChartContainer />
      </div>
    );
  }
}

export default App;
