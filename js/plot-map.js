
import * as forms from "./forms.js";
import * as util from "./util.js";
import { zoompanel } from "./zoompanel.js";

export function renderMap () {

    Promise.all([
    
        d3.json("./data/world_map.json"),
        d3.json("./data/disputed_dotted_black.json"),
        d3.json("./data/disputed_dotted_white.json"),
        d3.csv("./data/nodes.csv"),
    
    ]).then(function([mapRaw, disputedBlackRaw, disputedWhiteRaw, nodesRaw]) {
    
        const map = topojson.feature(mapRaw, mapRaw.objects.countries).features;
    
        const disputedBlack = topojson.feature(
                disputedBlackRaw, 
                disputedBlackRaw.objects.disputed_dotted_black
            ).features;
    
        const disputedWhite = topojson.feature(
                disputedWhiteRaw, 
                disputedWhiteRaw.objects.disputed_dotted_white
            ).features;
    
        const nodes = nodesRaw.map(d => ({
            geo: d.geo,
            t: +d.t,
            type: +d.type,
            coords: [+d.lon, +d.lat],
            var: d.var,
            v: +d.v,
            n: +d.n
        }))
    
        drawMap(map, disputedBlack, disputedWhite, nodes);  
    })
};

function drawMap(map, disputedblack, disputedwhite, nodes) {

    // Forms //////////////////////////////////////////////////////////////////

    const formIcons = d3.select("#form-top-container")
    const formsInset = d3.select("#form-inset-container")
    formsInset.selectAll("form").remove()
    const formYear = formsInset.call(forms.addFormNumber);
    const formType = formsInset.call(forms.addFormCheckbox);
    
    // "Check all" behavior

    formType.select("#type-0")
        .on("change", () => {
            let checked = d3.select("#type-0").property("checked");
            d3.selectAll("#checkbox-type .item-checkbox").property("checked", checked);
            update();
        });

    formType
        .on("change", () => {
            let allChecked = d3.selectAll("#checkbox-type .item-checkbox")
                .nodes()
                .every(cb => cb.checked);
            d3.select("#type-0").property("checked", allChecked);
            update();
        });

    // Default inputs

    formType.selectAll("#checkbox-type input").attr("checked", true);

    // Re-render visual when any input is changed

    formType.selectAll("#checkbox-type input").on("input", update);
    formYear.selectAll("input#form-number").on("input", update);
    formIcons.selectAll(".icon-group")
        .on("click", function() {
            d3.selectAll(".icon-group").classed("icon-clicked", false);
            d3.select(this).classed("icon-clicked", true);
            update();
        });

    // Chart //////////////////////////////////////////////////////////////////

    const viz = d3.select("#viz-container");
    viz.select("svg").remove();
    
    const svg = viz.append("svg")
        .attr("id", "viz-svg")
        .attr("viewBox", [0, 0, util.dim.width, util.dim.height]);

    // Map

    const projection = d3.geoEquirectangular()
        .scale(185)
        .center([0, 10])
        .translate([util.dim.width / 2, util.dim.height / 2]);

    const path = d3.geoPath().projection(projection);

    svg.append("rect").attr("id", "ocean");
    const countries = svg.append("g").attr("class", "borders");
    countries.call(util.drawBorders, path, map, disputedblack, disputedwhite);
    
    // Nodes

    const group = svg.append("g").attr("class", "nodes-container");
    const radius = { min: .1, max: 12 };
    const nRange = { min: 500, max: d3.max(nodes, d => d.n) };
    const rScaler = d3.scaleLog()
        .base(2)
        .domain([nRange.min, nRange.max])
        .range([radius.min, radius.max]);

    svg.call(addBubbleLegend, 175, util.dim.height - 80, rScaler);
    
    // Background of inset form
    svg.append("rect").attr("id", "form-inset-bg")

    // Pan and zoom ///////////////////////////////////////////////////////////

    let currentTransform = d3.zoomIdentity;
    
    function zoomed(event) {
        
        currentTransform = event.transform;
        svg.selectAll(".borders path").attr("transform", event.transform);
        svg.selectAll(".nodes-container").attr("transform", event.transform);

        // Adjust sizes relative to zoom level

        const k = event.transform.k;
        svg.selectAll("path.border").style("stroke-width", .5 / k);
        svg.selectAll("path.border-disputed-black").style("stroke-width", .5 / k);
        svg.selectAll("path.border-disputed-white").style("stroke-width", 1.25 / k);
        svg.selectAll("circle.node")
            .attr("r", d => rScaler(d.n) / Math.sqrt(k))
            .style("stroke-width", .75 / k);
    }

    const zoom = d3.zoom().scaleExtent([1, 16]).on("zoom", zoomed);
    svg.call(zoom);

    // Control panel //////////////////////////////////////////////////////////

    const panel = svg.append("g")
        .attr("transform", `translate(${ util.dim.width - 50 },15)`)
        .call(zoompanel);
    panel.select("#buttonplus")
        .on("click", () => svg.transition().duration(300).call(zoom.scaleBy, 1.5));
    panel.select("#buttonminus")
        .on("click", () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5));
    panel.select("#buttonreset")
        .on("click", () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity));
    
    // Tooltip ////////////////////////////////////////////////////////////////

    const mouseMoved = (event, d) => {
        d3.select("#tooltip")
            .style("display", "block")
            .style("left", event.pageX + 18 + "px")
            .style("top", event.pageY + 18 + "px")
            .html(`
                <p><b>${ d3.format(",.0f")(d.n) }</b> displacements due to 
                <span class="tooltip-emph">${ util.types[d.type] }s</span><br>
                ${ util.formatNum(d.v) }${ util.indicatorsTooltip[d.var] }</p>
            `);
        d3.select(event.target).style("cursor", "pointer");
    }
    
    function mouseLeft(event, d) {
        d3.selectAll(".node")
            .transition().duration(100)
            .attr("fill-opacity", .3)
            .attr("stroke-opacity", .3);
        d3.select("#tooltip").style("display", "none");
        d3.select(event.target).style("cursor", "default");
    }
  
    // Update /////////////////////////////////////////////////////////////////
  
    function update() {

        d3.selectAll(".node-container").remove();

        let typesChecked = formType.selectAll("#checkbox-type input[name='checkboxType']:checked")
            .nodes()
            .map(node => +node.value);
        typesChecked = typesChecked.filter(i => i !== 0);
        let indicatorChecked = formIcons.select(".icon-clicked").attr("value");
        let year = formYear.select("input#form-number").property("value");

        let dataIndicator = nodes.filter(d => 
            d.t == year && 
            d.n >= nRange.min && 
            d.var == indicatorChecked
        );

        let data = nodes.filter(d => 
            d.t == year && 
            d.n >= nRange.min && 
            typesChecked.includes(+d.type) && 
            d.var == indicatorChecked
        );

        let colorScaler = d3.scaleLinear()
            .domain([
                d3.min(dataIndicator, d => d.v), 
                d3.mean(dataIndicator, d => d.v), 
                d3.max(dataIndicator, d => d.v)
            ])
            .range([util.colors.yellow, util.colors.green1, util.colors.blue1]);

        const groupData = group.selectAll("g")
            .attr("class", "node-container")
            .data(data, d => d.t + "-" + d.type + "-" + d.coords[0] + "-" + d.coords[1])
            .order()
            .join("g")
            .attr("transform", d => `translate(${ projection(d.coords)[0] } , ${ projection(d.coords)[1] })`);
        
        groupData.selectAll("circle").remove();
        groupData.append("circle")
            .attr("id", d => d.geo + "-" + d.t + "-" + d.type + "-" + d.coords[0] + "-" + d.coords[1])
            .attr("class", "node")
            .attr("r", d => rScaler(d.n) / Math.sqrt(currentTransform.k))
            .attr("fill-opacity", .3)
            .attr("stroke-opacity", .3)
            .style("fill", d => colorScaler(d.v))
            .style("stroke-width", .75 / currentTransform.k)
            .on("mousemove", mouseMoved)
            .on("mouseleave", mouseLeft);

        svg.select("#color-legend").remove();
        svg.call(addColorLegend, 30, util.dim.height - 130, dataIndicator, colorScaler);

    };

    update();

}

// Legends ////////////////////////////////////////////////////////////////////

function addBubbleLegend (container, xpos, ypos, rScaler) {

    const params = ({ nMax: 10000000, nMed: 500000, nMin: 5000 });
    params.rMax = rScaler(params.nMax);
    params.rMin = rScaler(params.nMin);
    params.rMed = rScaler(params.nMed);
    
    const legend = container.append("g")
        .attr("id", "bubble-legend")
        .attr("transform", `translate(${xpos}, ${ypos})`);
    
    legend.append("g")
        .attr("class", "legend-desc")
        .append("text")
        .attr("x", 0).attr("y", 0)
        .text("Displacements");
    
    const legendKeys = legend.append("g")
        .attr("transform", `translate(45, ${params.rMax + 20})`);
  
    const addKey = (keyContainer, r, n, segment, xpos, ypos) => {
  
        let dir, anchor;
        if (segment > 0) {
            dir = 1;
            anchor = "start";
        } else {
            dir = -1;
            anchor = "end";
        };
  
        const key = keyContainer.append("g")
            .attr("transform", `translate(${xpos}, ${ypos})`);
        key.append("circle")
            .attr("class", "legend-bubble-circle")
            .attr("cx", 0).attr("cy", 0)
            .attr("r", r);
        key.append("line")
            .attr("class", "legend-bubble-line")
            .attr("x1", dir * r).attr("x2", segment)
            .attr("y1", 0).attr("y2", 0);
        key.append("text")
            .attr("class", "legend-text")
            .attr("text-anchor", anchor)
            .attr("x", segment + dir * 3).attr("y", 5)
            .text(d3.format(",.0f")(n));

        return keyContainer.node();
    }
  
    legendKeys.call(addKey, params.rMax, params.nMax, -18, 0, 0);
    legendKeys.call(addKey, params.rMed, params.nMed, 18, 20, -10);
    legendKeys.call(addKey, params.rMin, params.nMin, 12, 18, 10);

    return container.node();
};

function addColorLegend (container, xpos, ypos, data, colorRanger) {

    const params = ({ width: 12, height: 15, keyTextNudge: 6 });
    const indicator = data[0].var;
    
    console.log(indicator);

    const points = ({
        min: d3.min(data, d => d.v), 
        med: d3.mean(data, d => d.v), 
        max: d3.max(data, d => d.v)
    });

    const breaks = [
        points.max,
        points.med + (points.max - points.med) / 2,
        points.med, 
        points.min + (points.med - points.min) / 2,
        points.min
    ];

    const labels = [
        { var: 1, line1: "Per cent female",            line2: "of people in area" },
        { var: 2, line1: "Median age",                 line2: "of people in area" },
        { var: 3, line1: "Per cent under age 18",      line2: "of people in area" },
        { var: 4, line1: "Per capita GNP in US$",      line2: "of people in area" },
        { var: 5, line1: "Average years of schooling", line2: "of people in area" },
        { var: 6, line1: "Life expectancy in years",   line2: "of people in area" },
        { var: 7, line1: "Per cent urban",             line2: "of area"           },
        { var: 8, line1: "Per cent cropland",          line2: "of area"           },
        { var: 9, line1: "Per cent grazing land",      line2: "of area"           },
    ];

    const label = labels.find(d => d.var == indicator);

    const legend = container.append("g")
        .attr("id", "color-legend")
        .attr("transform", `translate(${xpos}, ${ypos})`);

    legend.append("text")
        .attr("class", "legend-desc")
        .append("tspan")
            .attr("x", 0).attr("y", 0)
            .text(label.line1)
        .append("tspan")
            .attr("x", 0).attr("y", 0).attr("dy", 11)
            .text(label.line2);

    const legendKeys = legend.append("g")
        .attr("transform", "translate(3, 25)");

    for (let i = 0; i < breaks.length; i++) {
        legendKeys.append("g")
        .append("rect")
            .attr("x", 0)
            .attr("y", params.height * i)
            .attr("width", params.width + "px")
            .attr("height", params.height + "px")
            .style("fill", d => colorRanger(breaks[i]));
    };

    const ticks = legendKeys.append("g")
        .attr("class", "legend-text");
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", 12)
        .text(util.formatNum(breaks[0]));
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", breaks.length * params.height / 2 + 5)
        .text(util.formatNum(breaks[2]));
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", breaks.length * params.height - 2)
        .text(util.formatNum(breaks[breaks.length - 1]));

    return container.node();
};

