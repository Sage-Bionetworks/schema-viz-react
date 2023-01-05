import React from 'react';
import './App.css';
import { useState, useEffect } from 'react'
import configJson from "./config.json"
import CreateCollapsibleTree from "./component/chart"
import { transformInitalData } from "./utils"

type ChartObj = {
  bundles: any
  layout: any
  levels: any
  links: any
  nodes: any
  nodes_index: any

}
type ReturnType = [ChartObj | null, boolean];

function useFetchData(schemaOption: string): ReturnType {
  const [data, setData] = useState<ChartObj | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://localhost:3001/v1/visualize/tangled_tree/layers?schema_url=https%3A%2F%2Fraw.githubusercontent.com%2Fncihtan%2Fdata-models%2Fmain%2FHTAN.model.jsonld&figure_type=component`);
        const json = await response.json();
        const transformedDta = transformInitalData(json)
        setData(transformedDta);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [schemaOption]);

  return [data, loading];
}

function App() {

  const [chartObj, loading] = useFetchData(configJson["schema"]);


  return (
    <div className="App">
      <header className="App-header">
        {chartObj && <CreateCollapsibleTree chartObj={chartObj} />}
      </header>
    </div>
  );
}

export default App;
