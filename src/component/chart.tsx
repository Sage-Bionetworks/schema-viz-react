import React, { useEffect, useRef } from "react";
import configJson from "../config.json"
import * as d3 from 'd3';
import { Selection, selection, Transition, transition, BaseType } from "d3";

type Parents = [] | [{ id: string, bundle: any, bundles: any, bundles_index: any, children: string[], direct_children: string[], height: number, level: number, parents: [Parents], x: number, y: number }]
type Links = [] | [{
    bundle: any //nested
    c1: number
    c2: number
    source: any //nested
    target: any //nested
    xb: number
    xs: number
    xt: number
    ys: number
    yt: number
    sourceId?: string
    targetId?: string
}]
type Bundles = {
    i: number,
    id: string,
    level: number,
    links: Links,
    name: null,
    parents: Parents
    url: null
    parentList?: string[]
    _links?: Links

}
type Nodes = {
    bundles: any,
    bundles_index: any,
    children: string[],
    direct_children: string[],
    height: number,
    id: string,
    level: number,
    parents: Parents
    x: number,
    y: number
    _direct_children?: string[],
    parentList?: string[]
}

type Props = {
    chartObj: {
        bundles: [Bundles]
        layout: any
        levels: any
        links: any
        nodes: [Nodes]
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
        var interactivePartNode = chartObj.nodes
        var bundles = chartObj.bundles

        //define the update function 
        processNodes(interactivePartNode);
        processBundles(bundles)
        console.log('interactive part node', interactivePartNode)
        console.log('bundles', bundles)
        update(interactivePartNode, bundles)
        //for styling
        interactivePartNode.map(n => {
            d3.select('#myViz').append('path')
                .attr('class', 'node')
                .attr('stroke', 'red') //this color should match the background color of the visualization
                .attr('stroke-width', 3)
                .attr('d', `M${n.x} ${n.y - n.height / 2} L${n.x} ${n.y + n.height / 2}`);
        })

        function getLstParents(parents: Parents): string[] {
            //extract an array of immediate parents
            if (parents && parents.length > 0) {
                var parentArr = parents.map(function (elem) {
                    return elem.id
                })
                return parentArr
            }

            return []

        }

        function processNodes(nodes: [Nodes]) {
            for (var val of nodes) {
                //extract a list of parents and create a parent array
                //assign the array to a new variable
                var parentArr = getLstParents(val.parents)
                val["parentList"] = parentArr

            }
        }

        function processBundles(bundles: [Bundles]) {
            for (var val of bundles) {
                //extract a list of parents and create a parent array
                //assign the array to a new variable
                // var parentArr = getLstParents(val.parents.parents)
                // val["parentList"] = parentArr


                var linksArr = val['links']
                //loop through array of links and extract source id and target id
                for (var link of linksArr) {
                    link["sourceId"] = link.source.id
                    link['targetId'] = link.target.id
                }
            }
        }

        function update(interactivePartNode: [Nodes], bundles: [Bundles]) {
            const g = svg.select('g').node() ? svg.select("g") : svg.append("g")

            //This tells the TypeScript compiler that flexibleNode is a selection of SVGPathElement elements, with a node data type and an unknown parent element type.
            var flexibleNode: Selection<BaseType, Nodes, SVGSVGElement, unknown> | any = svg.selectAll("path.node").data(interactivePartNode);
            var flexibleNodeEnter = flexibleNode.enter();

            //create nodes
            flexibleNodeEnter.append('path').merge(flexibleNode)
                .attr('class', 'selectable node')
                .attr("id", function (d: Nodes) { return "node_" + d.id; })
                .attr('stroke', function (d: Nodes) {
                    //if nodes could be expanded, we change its color to orange
                    return d._direct_children && d._direct_children.length > 0 && !checkIfDirectLinkExist(d, bundles) ? "orange" : "#575757"
                })
                .attr('stroke-width', 8) //size of node
                .attr('d', function (d: Nodes) {
                    return `M${d.x} ${d.y - d.height / 2} L${d.x} ${d.y + d.height / 2}` //location of the nodes
                })
            flexibleNode.exit().remove();

        }

        function concatArr<T>(...arrays: (T[] | undefined)[]): T[] {
            return ([] as T[]).concat(...arrays.filter(Array.isArray as (x: any) => x is T[]));
        }

        function checkIfDirectLinkExist(node: Nodes, bundles: [Bundles]): Boolean {
            var toCollapse = true
            //get all direct children
            var directChildren = concatArr(node.direct_children, node._direct_children)
            //the node being clicked
            var nodeClicked = node.id


            //simplified version of collapsing/expanding logic: 
            //"_link" is the a variable for saving all the links that were temporarily removed
            //we set the default to "collapse" a node. When clicking on a node, if part of the node's link between itself 
            //and its immediate children are in "_link", we should fully expand the node 

            //example: after collapse on "CellLine" and also "Resource", if we expand on "Resource" and then click on "CellLine" again, 
            //the code SHOULD then expand CellLine since the links between CellLine and its immediate child Mutation were "hidden" (or in other words, saved in "_links")
            var SavedLinks = []
            for (var val of bundles) {

                //checking the links betwen the node being clicked and its direct children 

                var linkArrContainer = val._links

                if (linkArrContainer && linkArrContainer.length > 0) {
                    //loop through all the links in link array container 
                    //if there's a link between the node being clicked and its direct children in "_link" folder, 
                    //we would want to later set toCollapse to false
                    for (var link of linkArrContainer) {
                        if (link.targetId && link.sourceId === nodeClicked && directChildren.includes(link.targetId)) {
                            SavedLinks.push(link)
                        }
                    }
                }


            }

            if (SavedLinks.length > 0) {
                toCollapse = false
            }

            return toCollapse


        }



    })

    return (
        <div id="visualization"></div>
    )

}


export default CreateCollapsibleTree