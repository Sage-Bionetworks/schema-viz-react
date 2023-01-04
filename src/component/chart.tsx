import React, { useEffect, useRef } from "react";
import configJson from "../config.json"
import * as d3 from 'd3';

type Props = {
    chartObj: {
        bundles: any
        layout: any
        levels: any
        links: any
        nodes: any
        nodes_index: any

    };
}


function CreateCollapsibleTree({ chartObj }: Props) {
    var schemaOption = configJson["schema"]

    //set up margin 
    const margins = {
        top: 20,
        bottom: 300,
        left: 30,
        right: 100,
    };

    const color = d3.scaleOrdinal(d3.schemeDark2);
    const height = 600;
    const width = 1200;
    const totalWidth = width + margins.left + margins.right;

    //remove previous result
    useEffect(() => {
        d3.select('#visualization').select('svg').remove();

        //create new chart
        function zoomFunc(event: any) {
            svg.attr("transform", event.transform);
        }
        const svg = d3.select('#visualization')
            .append('svg')
            .attr('width', totalWidth)
            .attr('height', chartObj.layout.height)
            .attr('id', 'myViz')
            .on("dblclick.zoom", null);
        //added zoom
        const zoomBehavior = d3.zoom<SVGAElement, unknown>().scaleExtent([0.1, 10]).on("zoom", zoomFunc);

        //begin to draw tree
        var InteractivePartNode = chartObj.nodes
        var bundles = chartObj.bundles

        //define the update function 

    })

    return (
        <div id="visualization"></div>
    )

}


export default CreateCollapsibleTree