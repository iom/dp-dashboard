
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
            t: +d.t,
            type: +d.type,
            coords: [+d.lon, +d.lat],
            var: d.var,
            v: +d.v,
            v_fill: +d.v_fill,
            n: +d.n
        }))
    
        drawMap(map, disputedBlack, disputedWhite, nodes);  
    })
}

function drawMap(map, disputedblack, disputedwhite, nodes) {

    const caption = d3.select(".dashboard-caption");
    const formIcons = d3.select(".topbar .form-icons");
    const mainview = d3.select(".mainview")
        .classed("map", true)
        .classed("boxplot", false);
    mainview.selectAll("div, svg").remove();

    const sidebar = mainview.append("div")
        .attr("class", "sidebar");
    const panel = mainview.append("div")
        .attr("class", "panel");

    // Forms ////////////////////////////////////

    sidebar.append("div").attr("class", "form-inset-bg");
    const formYear = sidebar.call(forms.addFormSlider);
    const formType = sidebar.call(forms.addFormCheckbox);
    
    // "Check all" behavior
    formType.select("#type-0")
        .on("change", function() {
            let checked = d3.select(this).property("checked");
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
    
    // Re-render visual when any input is changed

    d3.selectAll("#checkbox-type input").on("input", update);
    d3.selectAll("#form-year-slider input").on("change", update);

    function iconClicked() {
        d3.selectAll(".icon-group").classed("icon-clicked", false);
        d3.select(this).classed("icon-clicked", true);
        update();
    };

    formIcons.selectAll(".icon-group")
        .on("click", iconClicked)
        .on("keydown", function(event) {
            if (event.key == "Enter") iconClicked.call(this)
        });

    // Chart ////////////////////////////////////

    const panelSVG = panel.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMinYMax slice")
        .attr("viewBox", [0, 0, 950, 500]);

    // Map

    let projection = d3.geoEquirectangular()
        .scale(145)
        .center([-5, 10]);

    let path = d3.geoPath().projection(projection);

    const countries = panelSVG.append("g").attr("class", "borders");
    countries.call(util.drawBorders, path, map, disputedblack, disputedwhite);
    
    // Nodes

    const group = panelSVG.append("g").attr("class", "nodes-container");
    const radius = { min: .1, max: 12 };
    const nRange = { min: 500, max: d3.max(nodes, d => d.n) };
    const rScaler = d3.scaleLog()
        .base(2)
        .domain([nRange.min, nRange.max])
        .range([radius.min, radius.max]);

    // Legend
    
    panelSVG.call(addBubbleLegend, 175, util.dim.height - 80, rScaler);
    
    // Pan and zoom /////////////////////////////

    let currentTransform = d3.zoomIdentity;
    
    function zoomed(event) {
        
        const k = event.transform.k;
        
        currentTransform = event.transform;
        panelSVG.selectAll(".borders path").attr("transform", event.transform);
        panelSVG.selectAll(".nodes-container").attr("transform", event.transform);

        panelSVG.selectAll("path.border").style("stroke-width", .5 / k);
        panelSVG.selectAll("path.border-disputed-black").style("stroke-width", .5 / k);
        panelSVG.selectAll("path.border-disputed-white").style("stroke-width", 1.25 / k);
        panelSVG.selectAll("circle.node")
            .attr("r", d => rScaler(d.n) / Math.sqrt(k))
            .style("stroke-width", .75 / k);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 16])
        .on("zoom", zoomed);

    panelSVG.call(zoom);

    // Control panel ////////////////////////////

    const controlPanelSVG = panel.append("div")
        .attr("class", "control-panel")
        .append("svg")
        .attr("width", 25)
        .attr("height", 70)
        .call(zoompanel);
    controlPanelSVG.select("#buttonplus")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.scaleBy, 1.5));
    controlPanelSVG.select("#buttonminus")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.scaleBy, 1 / 1.5));
    controlPanelSVG.select("#buttonreset")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.transform, d3.zoomIdentity));
    
    // Tooltip //////////////////////////////////

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
  
    // Update ///////////////////////////////////
  
    function update() {

        d3.selectAll(".node-container").remove();

        let typesChecked = formType.selectAll("#checkbox-type input:checked")
            .nodes()
            .map(node => +node.value);
        typesChecked = typesChecked.filter(i => i !== 0);
        let indicatorChecked = formIcons.select(".icon-clicked").attr("value");
        let yearMin = formYear.select("input#slider-1").property("value");
        let yearMax = formYear.select("input#slider-2").property("value");

        let dataIndicator = nodes.filter(d => 
            d.t >= yearMin && 
            d.t <= yearMax && 
            d.n >= nRange.min && 
            d.var == indicatorChecked
        );

        let data = nodes.filter(d => 
            d.t >= yearMin && 
            d.t <= yearMax && 
            d.n >= nRange.min && 
            typesChecked.includes(+d.type) && 
            d.var == indicatorChecked
        );

        let colorScaler = d3.scaleLinear()
            .domain([
                d3.min(dataIndicator, d => d.v_fill), 
                d3.mean(dataIndicator, d => d.v_fill), 
                d3.max(dataIndicator, d => d.v_fill)
            ])
            .range([util.colors.yellow, util.colors.green1, util.colors.blue1]);

        const groupData = group.selectAll("g")
            .attr("class", "node-container")
            .data(data, d => d.t + "-" + d.type + "-" + d.coords[0] + "-" + d.coords[1])
            .order()
            .join("g")
            .attr("transform", d => `translate(${ projection(d.coords)[0] }, ${ projection(d.coords)[1] })`);
        
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

        panelSVG.select("#color-legend").remove();
        panelSVG.call(addColorLegend, 30, util.dim.height - 130, dataIndicator, colorScaler);

        // Build caption
        
        let yearText = yearMin + "\u2013" + yearMax;
        if (yearMin == yearMax) yearText = yearMax;

        let causeText;
        const typesCheckedNoOthers = typesChecked.filter(i => i !== 8);

        if (typesChecked.includes(8) && typesChecked.length < 8) {
            causeText = "<span class='caption-emph'>various causes</span>";
        } else if (typesCheckedNoOthers.length == 0 && typesChecked[0] == 8) {
            causeText = "<span class='caption-emph'>various causes</span>";
        } else if (typesCheckedNoOthers.length > 2) {
            causeText = "<span class='caption-emph'>various causes</span>";
        } else if (typesCheckedNoOthers.length == 1) {
            causeText = "<span class='caption-emph'>" + util.types[typesCheckedNoOthers[0]] + "</span>";
        } else if (typesCheckedNoOthers.length == 2) {
            causeText = "<span class='caption-emph'>" + util.types[typesCheckedNoOthers[0]] + "</span>" + 
                " and " + "<span class='caption-emph'>" + util.types[typesCheckedNoOthers[1]] + "</span>"
        }
        if (typesChecked.length == 8) causeText = "<span class='caption-emph'>all causes</span>";

        let indicatorText = util.indicatorsTitle[indicatorChecked];
       
        let captionText = "<p>Choose a cause of displacement to generate the graphic.</p>";
        if (typesChecked.length > 0) {
            captionText = "<p>Internally displaced persons in " + 
                "<span class='caption-emph'>" + yearText + "</span>" +
                " due to " + causeText + " and the " + 
                "<span class='caption-emph'>" + indicatorText + "</span>" + 
                " where they were displaced.</p>"
        }

        caption.html(captionText);
    }

    update();
}

// Legends //////////////////////////////////////

function addBubbleLegend (container, xpos, ypos, rScaler) {

    const params = ({ nMax: 10000000, nMed: 500000, nMin: 5000 });
    params.rMax = rScaler(params.nMax);
    params.rMin = rScaler(params.nMin);
    params.rMed = rScaler(params.nMed);
    
    const legend = container.append("g")
        .attr("id", "bubble-legend")
        .attr("transform", `translate(${ xpos }, ${ ypos })`);
    
    legend.append("g")
        .attr("class", "legend-desc")
        .append("text")
        .attr("x", 0).attr("y", 0)
        .text("Displacements");
    
    const legendKeys = legend.append("g")
        .attr("transform", `translate(45, ${ params.rMax + 20 })`);
  
    const addKey = (keyContainer, r, n, segment, xpos, ypos) => {
  
        let dir, anchor;
        if (segment > 0) {
            dir = 1;
            anchor = "start";
        } else {
            dir = -1;
            anchor = "end";
        }
  
        const key = keyContainer.append("g")
            .attr("transform", `translate(${ xpos }, ${ ypos })`);
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
}

function addColorLegend (container, xpos, ypos, data, colorRanger) {

    const params = { width: 12, height: 15, keyTextNudge: 6 };
    const indicator = data[0].var;
    
    const points = {
        min: d3.min(data, d => d.v_fill), 
        med: d3.mean(data, d => d.v_fill), 
        max: d3.max(data, d => d.v_fill)
    };

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

    const legendKeys = legend.append("g").attr("transform", "translate(3,25)");

    for (let i = 0; i < breaks.length; i++) {
        legendKeys.append("g")
        .append("rect")
            .attr("x", 0)
            .attr("y", params.height * i)
            .attr("width", params.width + "px")
            .attr("height", params.height + "px")
            .style("fill", d => colorRanger(breaks[i]));
    }

    const ticks = legendKeys.append("g").attr("class", "legend-text");
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
        .text(() => indicator == 5 
            ? d3.format(".1f")(breaks[breaks.length - 1]) 
            : util.formatNum(breaks[breaks.length - 1])
        );


    return container.node();
}

