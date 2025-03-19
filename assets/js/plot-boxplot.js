
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

    const margin = ({ top: 20, bottom: 80, right: 40, left: 350 });
    const gutter = ({ yout: 12.5, yin: 30, xin: 7.5, xout: 12.5 });
    const params = ({ binHeight: 10 })

    // Forms //////////////////////////////////////////////////////////////////

    const formIcons = d3.select(".form-top-container")
    const formsInset = d3.select("#form-inset-container")
    formsInset.selectAll("form").remove()
    const formRegion = formsInset.call(forms.addFormDropdown);
    
    // Default inputs

    formRegion.select("#bar-dropdown-region option[value='0']").attr("selected", true);

    // Re-render visual when any input is changed

    formRegion.select("#bar-dropdown-region select").on("input", update);
    formIcons.selectAll(".icon-group")
        .on("click", function() {
            d3.selectAll(".icon-group").classed("icon-clicked", false);
            d3.select(this).classed("icon-clicked", true);
            update();
        });

    // Chart //////////////////////////////////////////////////////////////////

    const viz = d3.select(".graphic");
    viz.select("svg").remove();

    const svg = viz.append("svg")

    // Background shading

    svg.append("rect")
        .attr("class", "graphic-bg")
        // .attr("x", 0).attr("y", 0)
        // .attr("width", util.dim.width)
        // .attr("height", util.dim.height)
        // .style("fill", `${ util.colors.unBlue6 }`);

    const panel = svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", util.dim.width - margin.left - margin.right)
        .attr("height", util.dim.height - margin.top - margin.bottom)
        .style("fill", "white");

    const axes = svg.append("g");
    const boxplots = svg.append("g");

    // Legend

    svg.call(addBoxplotLegend, 30, 120);

    // Dashed line ////////////////////////////////////////////////////////////

    const marker = svg.append("g").attr("display", "none");
    marker.append("path")
        .attr("class", "marker-line")
        .attr("d", d3.line()([[0, margin.top], [0, util.dim.height - margin.bottom]]));

    const markerNum = d3.select("body")
        .append("div")
        .attr("id", "marker-num")
        .style("display", "none")
        
    function update() {

        let region = formRegion.select("#bar-dropdown-region select").property("value");
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
        
        let xScalerInv = d3.scaleLinear()
            .domain([
                margin.left + gutter.yin, 
                util.dim.width - margin.right - gutter.yin
            ])
            .range([d3.min(data, d => +d.p50), d3.max(data, d => +d.p950)])

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

        panel
            .on("mousemove", markerMouseMoved)
            .on("mouseleave", markerMouseLeft);

        function markerMouseMoved(event) {
            const [xm, ym] = d3.pointer(event);
            marker
                .attr("display", null)
                .attr("transform", `translate(${ xm }, 0)`);
            markerNum.style("display", "block")
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 15 + "px")
                .html(function() {
                    if (xScalerInv(xm) < 0) {
                        return "";
                    } else if (indicatorChecked == 4) {
                        return "$" + d3.format(",.0f")(xScalerInv(xm));
                    } else {
                        return util.formatNum(xScalerInv(xm));
                    }
                });
        };

        function markerMouseLeft() {
            marker.attr("display", "none");
            markerNum.style("display", "none");
        };

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

    const params = ({ length90: 150, length50: 75, width: 10 });

    const legend = container.append("g")
        .attr("id", "boxplot-legend")
        .attr("transform", `translate(${xpos}, ${ypos})`);

    // Title and description //////////////////////////////////////////////////

    const text = legend.append("g");
    text.append("text")
        .attr("class", "legend-desc-bold")
        .attr("x", 0).attr("y", 0)
        .text("How to read");
    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 15)
        .text("A boxplot shows the");
    text.append("text")
        .attr("class", "legend-desc")
        .attr("x", 0).attr("y", 27)
        .text("distribution of data.");

    // Diagram ////////////////////////////////////////////////////////////////

    const diagram = legend.append("g").attr("transform", "translate(0,100)");

    // Draw 90% bin
    diagram.append("g")
        .attr("class", "bin-range-90")
        .append("path")
        .attr("d", `M0,0 H${ params.length90 }`);

    // Draw 50% bin
    diagram.append("g")
        .attr("class", "bin-range-50")
        .append("path")
        .attr("d", `
            M${ (params.length90 - params.length50) / 2 },${ params.width }
            H${ (params.length90 - params.length50) / 2 + params.length50 }
            V${ -params.width }
            H${ (params.length90 - params.length50) / 2 }
            Z
        `);

    // Draw median
    diagram.append("g")
        .attr("class", "bin-range-med")
        .append("path")
        .attr("d", `
            M${ params.length90 / 2 },${ params.width } 
            V${ -params.width }
        `);

    // Dotted lines ///////////////////////////////////////////////////////////

    const annotationLine = diagram.append("g")
        .attr("class", "legend-bubble-line");

    // Draw 90% bin dotted lines
    annotationLine.append("path")
        .attr("d", `M0,7 V${ params.width + 40 } H${ params.length90 } V7`);

    // Draw 50% bin dotted lines
    annotationLine.append("path")
        .attr("d", `
            M${ params.length90 / 2 },${ params.width + 60 } 
            H${ params.width + 70 }
        `);
    annotationLine.append("path")
        .attr("d", `
            M${ (params.length90 - params.length50) / 2 },${ -(params.width + 5) }
            V${ -(params.width + 15) }
            H${ (params.length90 - params.length50) / 2 + params.length50 } 
            V${ -(params.width + 5) }
        `);
    
    // Draw median dotted lines
    annotationLine.append("path")
        .attr("d", `M${ params.length90 / 2 },${ params.width + 3 } V20`);

    // Annotations ////////////////////////////////////////////////////////////

    const annotationText = diagram.append("g").attr("class", "legend-text");
    
    // 50% bin annotation
    const middle50 = annotationText.append("g")
        .attr("transform", `translate(${ params.length90 / 2 },${ -(params.width + 35) })`)
        .attr("text-anchor", "middle");

    middle50.append("text").attr("y", 0).text("Middle 50%");
    middle50.append("text").attr("y", 12).text("of data");

    // Median annotation
    annotationText.append("text")
        .attr("x", `${ params.length90 / 2 }`)
        .attr("y", `${ params.width + 23 }`)
        .attr("text-anchor", "middle")
        .text("Median");
    
    // 90% bin annotation
    const middle90 = annotationText.append("g")
        .attr("transform", `translate(${ params.length90 / 2 },${ params.width + 40 + 15 })`)
        .attr("text-anchor", "middle");
    middle90.append("text").attr("y", 0).text("Middle 90%");
    middle90.append("text").attr("y", 12).text("of data");

    return container.node();  
};

