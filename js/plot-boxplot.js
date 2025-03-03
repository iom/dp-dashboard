
import * as forms from "./forms.js";
import * as util from "./util.js";
 
export function renderBoxplot () {

    Promise.all([

        d3.csv("./data/means.csv"),
    
    ]).then(function([means]) {
    
        drawBoxplot(means);
        
    })
};

function drawBoxplot(means) {

    const margin = ({ top: 20, bottom: 120, right: 40, left: 375 });
    const gutter = ({ yout: 12.5, yin: 30, xin: 7.5, xout: 12.5 });
    const params = ({ binHeight: 10 })

    // Forms //////////////////////////////////////////////////////////////////

    const formIcons = d3.select("#form-top-container")
    const formsInset = d3.select("#form-inset-container")
    formsInset.selectAll("form").remove()
    const formRegion = formsInset.call(forms.addFormDropdown);
    // const formVar = formsInset.call(forms.addFormRadioBar);

    // Default inputs

    // formVar.select("#bar-radio-var input[value='1']").attr("checked", true);
    formRegion.select("#bar-dropdown-region option[value='0']").attr("selected", true);

    // Re-render visual when any input is changed

    // formVar.selectAll("#bar-radio-var input").on("input", update);
    formRegion.select("#bar-dropdown-region select").on("input", update);
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

    // Background shading

    svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", util.dim.width)
        .attr("height", util.dim.height)
        .style("fill", `${ util.colors.unBlue6 }`);

    const panel = svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", util.dim.width - margin.left - margin.right)
        .attr("height", util.dim.height - margin.top - margin.bottom)
        .style("fill", "white");

    const axes = svg.append("g");
    const boxplots = svg.append("g");

    // Legend

    svg.call(addBoxplotLegend, 20, util.dim.height - 60);

    // Dashed line ////////////////////////////////////////////////////////////

    const marker = svg.append("g").attr("display", "none");
    marker.append("path")
        .attr("class", "marker-line")
        .attr("d", d3.line()([[0, margin.top], [0, util.dim.height - margin.bottom]]));

    panel
        .on("mousemove", markerMouseMoved)
        .on("mouseleave", markerMouseLeft);

    function markerMouseMoved(event) {
        const [xm, ym] = d3.pointer(event);
        marker
            .attr("display", null)
            .attr("transform", `translate(${ xm }, 0)`);
    };

    function markerMouseLeft() {
        marker.attr("display", "none");
    };

    function update() {

        let region = formRegion.select("#bar-dropdown-region select").property("value");
        // let indicator = formVar
        //     .select("#bar-radio-var input[name='radioVar']:checked")
        //     .property("value");
        let indicatorChecked = formIcons.select(".icon-clicked").attr("value");
        let data = means.filter(d => d.region == region && d.var == indicatorChecked);
        const Y = d3.map(data, d => d.type);

        axes.selectAll("g").remove();
        boxplots.selectAll("g").remove();

        // x-axis
        let xScaler = d3.scaleLinear()
            .domain([d3.min(data, d => +d.p50), d3.max(data, d => +d.p950)])
            .range([gutter.yin, util.dim.width - margin.left - margin.right - gutter.yin]);
        let xAxis = d3.axisBottom(xScaler)
            .ticks(5)
            .tickSize(0)
            .tickFormat(util.formatNumAxis)
            .tickPadding([gutter.xout]);
        let xGrid = (g) => g
            .attr("class", "grid-lines")
            .selectAll("line")
            .data(xScaler.ticks(5))
            .join("line")
                .attr("x1", d => xScaler(d))
                .attr("x2", d => xScaler(d))
                .attr("y1", margin.top + gutter.xin)
                .attr("y2", util.dim.height - margin.bottom - gutter.xin);
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, ${ util.dim.height - margin.bottom })`)
            .attr("class", "x-axis")
            .call(xAxis)
            .call(g => g.select(".domain").remove());
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, 0)`)
            .call(xGrid);
        
        console.log("Min value: " + d3.min(data, d => d.p50))
        console.log("Min value scaled: " + xScaler(d3.min(data, d => d.p50)))
        console.log("Max value: " + d3.max(data, d => d.p950))
        console.log("Max value scaled: " + xScaler(d3.max(data, d => d.p950)))

        // y-axis
        let yScaler = d3.scaleBand()
            .domain(Object.keys(util.typesBar).reverse())
            .range([util.dim.height - margin.bottom - gutter.xin, margin.top + gutter.xin])
            .padding(.15);
        let yAxis = d3.axisLeft(yScaler)
            .tickSize(0)
            .tickFormat(d => util.typesBar[d])
            .tickPadding([gutter.yout]);
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, 0)`)
            .attr("class", "y-axis")
            .call(yAxis)
            .call(g => g.select(".domain").remove());

        // 90% range
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-90")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-90-" + i)
            .attr("d", (d, i) => `
                M${ xScaler(d.p50) },${ yScaler(Y[i]) }
                H${ xScaler(d.p950) }
            `);

        // 50% range
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-50")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-50-" + i)
            .attr("d", (d, i) => `
                M${ xScaler(d.p250) },${ yScaler(Y[i]) + params.binHeight }
                H${ xScaler(d.p750) }
                V${ yScaler(Y[i]) - params.binHeight }
                H${ xScaler(d.p250) }
                Z
            `);

        // Median
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-med")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-med-" + i)
            .attr("d", (d, i) => `
                M${ xScaler(+d.p500) },${ yScaler(Y[i]) + params.binHeight }
                V${ yScaler(Y[i]) - params.binHeight }
            `);

        boxplots.selectAll("path")
            .on("mousemove", mouseMoved)
            .on("mouseleave", mouseLeft);

        function mouseMoved(event, d) {
            const [xm, ym] = d3.pointer(event);
            marker
                .attr("display", null)
                .attr("transform", `translate(${ xm + margin.left }, 0)`);
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", event.pageX + 18 + "px")
                .style("top", event.pageY + 18 + "px")
                .html(() => {
                    if (d.type == 10) {
                        return `<p>Among the <span class="tooltip-emph">${ util.typesBar[d.type] }</span>,
                            ${ util.indicatorsBarTooltip[d.var] } is <b>${ util.formatNum(d.p500) }</b>.
                            The middle 50% of values range from ${ util.formatNum(d.p250) } to 
                            ${ util.formatNum(d.p750) }.</p>`;
                    } else if (d.type == 0) {
                        return `<p>In areas where displacements occurred, ${ util.indicatorsBarTooltip[d.var] } 
                            is <b>${ util.formatNum(d.p500) }</b>. The middle 50% of values range from 
                            ${ util.formatNum(d.p250) } to ${ util.formatNum(d.p750) }.</p>
                            <p class="tooltip-note">Based on ${ d3.format(",.0f")(d.e) } 
                            displacement events over 2018–2024 totaling ${ d3.format(",.0f")(d.n) } displacements.</p>`;
                    } else {
                        return `<p>In areas where displacements occurred due to 
                            <span class="tooltip-emph">${ util.typesBar[d.type] }s</span>,
                            ${ util.indicatorsBarTooltip[d.var] } is <b>${ util.formatNum(d.p500) }</b>.
                            The middle 50% of values range from ${ util.formatNum(d.p250) } to 
                            ${ util.formatNum(d.p750) }.</p>
                            <p class="tooltip-note">Based on ${ d3.format(",.0f")(d.e) } 
                            displacement events over 2018–2024 totaling ${ d3.format(",.0f")(d.n) } displacements.</p>`;
                    };
                });
            d3.select(event.target).style("cursor", "pointer");
        };

        function mouseLeft(event) {
            d3.select("#tooltip").style("display", "none");
            d3.select(event.target).style("cursor", "default");
        };
    };

    update();
};

// Legends ////////////////////////////////////////////////////////////////////

function addBoxplotLegend(container, xpos, ypos) {

    const params = ({ length90: 60, length50: 30, width: 10 });

    const legend = container.append("g")
        .attr("id", "boxplot-legend")
        .attr("transform", `translate(${xpos}, ${ypos})`);

    const text = legend.append("g");

    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 0)
        .style("font-weight", "bold")
        .text("How to read");
    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 15)
        .text("A boxplot shows");
    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 27)
        .text("the distribution");
    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 39)
        .text("of data.");

    const diagram = legend.append("g")
        .attr("transform", "translate(180, -18)");

    diagram.append("g")
        .attr("class", "bin-range-90")
        .append("path")
        .attr("d", `M0,0 V${params.length90}`);

    diagram.append("g")
        .attr("class", "bin-range-50")
        .append("path")
        .attr("d", `
            M${ params.width },${ (params.length90 - params.length50) / 2 }
            V${ (params.length90 - params.length50) / 2 + params.length50 }
            H${ -params.width }
            V${ (params.length90 - params.length50) / 2 }
            Z
        `);

    diagram.append("g")
        .attr("class", "bin-range-med")
        .append("path")
        .attr("d", `M${ params.width },${ params.length90 / 2 } H${ -params.width }`);

    const annotationLine = diagram.append("g")
        .attr("class", "legend-bubble-line");
    annotationLine.append("path")
        .attr("d", `M7,0 H${ params.width + 60 } V${ params.length90 } H7`);
    annotationLine.append("path")
        .attr("d", `M${ params.width + 60 },${ params.length90 / 2 } H${ params.width + 70 }`);
    annotationLine.append("path")
        .attr("d", `
            M${ -(params.width + 5) },${ (params.length90 - params.length50) / 2 }
            H${ -(params.width + 15) }
            V${ (params.length90 - params.length50) / 2 + params.length50 } 
            H${ -(params.width + 5) }
        `);
    annotationLine.append("path")
        .attr("d", `
            M${ -(params.width + 15) },${ params.length90 / 2 } 
            H${ -(params.width + 25) }
        `);

    const annotationText = diagram.append("g").attr("class", "legend-text");

    const middle50 = annotationText.append("g")
        .attr("transform", `translate(${ -(params.width + 30) }, ${ params.length90 / 2 })`)
        .attr("text-anchor", "end");

    middle50.append("text").attr("y", 0).text("Middle");
    middle50.append("text").attr("y", 12).text("50% of");
    middle50.append("text").attr("y", 24).text("data");

    annotationText.append("text")
        .attr("x", `${ params.width + 5 }`)
        .attr("y", `${ params.length90 / 2 + 4 }`)
        .attr("text-anchor", "start")
        .text("Median");

    const middle90 = annotationText.append("g")
        .attr("transform", `translate(${ params.width + 75 }, ${ params.length90 / 2 })`)
        .attr("text-anchor", "start");

    middle90.append("text").attr("y", 0).text("Middle");
    middle90.append("text").attr("y", 12).text("90% of");
    middle90.append("text").attr("y", 24).text("data");

    return container.node();  
};

