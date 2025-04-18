
export const dim = { width: 1200, sidebarWidth: 190, height: 500 };
dim.panelWidth = dim.width - dim.sidebarWidth;

export const colors = { 
    blue1:   "#0033A0", 
    blue2:   "#4068B8", 
    blue3:   "#8099D0", 
    blue4:   "#B3C2E3", 
    blue5:   "#D9E0F1", 
    green1:  "#5CB8B2", 
    green2:  "#85CAC5",
    green3:  "#AEDCD9",
    green4:  "#CEEAE8",
    green5:  "#E7F4F3",
    yellow:  "#FFB81C", 
    red1:    "#D22630", 
    red2:    "#DD5C64", 
    red3:    "#E99398", 
    red4:    "#F2BEC1", 
    red5:    "#F8DEE0",
    unBlue1: "#418FDE",
    unBlue2: "#84ADEC",
    unBlue3: "#ADC9F2",
    unBlue4: "#CEDEF7",
    unBlue5: "#E6EFFB", 
    unBlue6: "#F3F7FD", 
    gray1:   "#404040", 
    gray2:   "#666666", 
    gray3:   "#999999", 
    gray4:   "#CCCCCC", 
    gray5:   "#F2F2F2",
};

export const types = {
    1: "Conflict",
    2: "Drought",
    3: "Earthquake",
    4: "Flood",
    5: "Mass movement",
    6: "Storm",
    7: "Wildfire",
    8: "Other"
};

export const typesBar = {
    0: "All causes",
    1: "Conflict",
    2: "All disasters",
    3: "Flood",
    4: "Storm",
    5: "Earthquake",
    6: "Wildfire",
    7: "Drought",
    8: "Mass movement",
    9: "Extreme temperature",
    10: "Total population in region"
};

export const indicators = {
    1: "Female",
    2: "Median age",
    3: "Children",
    4: "Income",
    5: "Years of schooling",
    6: "Life expectancy",
    7: "Urban area",
    8: "Cropland area",
    9: "Grazing area",
};

export const indicatorsAxis = {
    1: "Females in area (per cent)",
    2: "Average age in area (per cent)",
    3: "Under-18-year-olds in area (per cent)",
    4: "Average income in area (constant 2017 US$)",
    5: "Average years of schooling in area (years)",
    6: "Average life expectancy in area (years)",
    7: "Urban land in area (per cent of land)",
    8: "Cropland in area (per cent of land)",
    9: "Grazing land in area (per cent of land)"
};

export const regions = {
    0: "World",
    1: "Central and Southern Asia",
    2: "Eastern and Southeastern Asia",
    3: "Europe",
    4: "Latin America and the Caribbean",
    5: "Northern Africa and Western Asia",
    6: "Northern America",
    7: "Oceania",
    8: "Sub-Saharan Africa"
};

export function formatNum(num) {
    let numFormat;
    if (num >= 100) {
        numFormat = "$" + d3.format(",.0f")(num);
    } else if (num < 100 && num >= 1) {
        numFormat = d3.format(",.1f")(num);
    } else {
        numFormat = d3.format(".1f")(100 * num) + "%";
    }
    return numFormat;
};

export function drawBorders(container, path, map, mapOutline, disputedblack, disputedwhite) {

    container.append("g")
        .append("path")
        .attr("class", "map-outline")
        .datum(mapOutline)
        .attr("d", path);

    const borders = container.append("g")
        .selectAll("country")
        .data(map)
        .join("path")
        .attr("class", "border")
        .attr("d", path)
        .style("fill", "white");
        
    borders.selectAll("disputed-black")
        .data(disputedblack)
        .join("path")
        .attr("class", "border-disputed-black")
        .attr("d", path)
        .style("stroke", colors.gray4);
    
    borders.selectAll("disputed-white")
        .data(disputedwhite)
        .join("path")
        .attr("class", "border-disputed-white")
        .attr("d", path)
        .style("stroke", "white");
    
    return container.node();
}
