
import * as forms from "./forms.js";
import * as util from "./util.js";
import { renderMap } from "./plot-map.js";
import { renderBoxplot } from "./plot-boxplot.js";

document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");

        const chartType = this.getAttribute("data-chart");
        updateChart(chartType);
    });
});

// Form top

const formIcons = d3.select("div.form-top-container")
    .append("svg")
        .attr("transform", "translate(170,0)")
        .call(forms.addFormIcons);

// Tooltip

d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("position", "absolute")
    .style("z-index", 999)
    .style("width", "auto")
    .style("max-width", "300px")
    .style("height", "auto")
    .style("border", `1px solid ${ util.colors.gray4 }`);

updateChart("map");

function updateChart(selected) {

    if (selected === "map") {
        renderMap();
    };
    if (selected === "boxplot") {
        renderBoxplot();
    };
};

