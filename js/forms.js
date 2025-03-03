
import * as util from "./util.js";

// Map chart forms //////////////////////////////

export function addFormNumber(container) {
    
    const years = ({ min: 2018, max: 2024 });
    const form = container.append("form");

    // Title and description
    form.append("text")
        .attr("class", "form-title")
        .text("Year")
    form.append("text")
        .attr("class", "form-desc")
        .text("2018–2024")

    form.append("input")
        .attr("type", "number")
        .attr("min", years.min)
        .attr("max", years.max)
        .attr("step", 1)
        .attr("value", years.max)
        .attr("id", "form-number");

    return container.node();
}

export function addFormCheckbox(container) {
    
    const addOption = (form, key, value, id, setClass) => {
    
        const option = form.append("label")
        option.append("input")
            .attr("type", "checkbox")
            .attr("name", "checkboxType")
            .attr("id", id)
            .attr("class", setClass)
            .attr("value", key)
        option.append("label")
            .text(value)
        
        return form.node()
    }

    const form = container.append("form")
        .attr("id", "checkbox-type")

    // Title and description
    form.append("text")
        .attr("class", "form-title")
        .text("Cause")
    form.append("text")
        .attr("class", "form-desc")
        .text("Displacements due to the selected cause/s appear as bubbles on the map.")

    // Add options
    const formCheckbox = form.append("div")
    formCheckbox.call(addOption, 0, "All causes", "type-0", "item-checkbox-all")
    for (let [code, label] of Object.entries(util.types)) {
        formCheckbox.call(addOption, code, label, "type-" + code, "item-checkbox");
    }
    
    return container.node()
}

export function addFormIcons(container) {

    const params = { pad: 75, radius: 15 };

    const iconsData = [
        { i: 1, src: "female",   lab1: "Female",     lab2: "share"      },
        { i: 2, src: "children", lab1: "Median",     lab2: "age"        },
        { i: 3, src: "children", lab1: "Children",   lab2: "share"      },
        { i: 4, src: "income",   lab1: "Per capita", lab2: "income"     },
        { i: 5, src: "educ",     lab1: "Years of",   lab2: "schooling"  },
        { i: 6, src: "life",     lab1: "Life",       lab2: "expectancy" },
        { i: 7, src: "urban",    lab1: "Urban",      lab2: "area"       },
        { i: 8, src: "crop",     lab1: "Cropland",   lab2: "area"       },
        { i: 9, src: "graze",    lab1: "Grazing",    lab2: "area"       },
    ];
    
    const form = container.append("g")
        .attr("id", "form-top")

    // Title and description
    const title = form.append("g")
        .attr("transform", "translate(0,30)");

    title.append("text")
        .attr("class", "form-title")
        .text("Indicator")

    title.append("g")
        .attr("transform", "translate(0,15)")
        .append("text")
        .attr("class", "form-desc")
        .append("tspan")
            .text("The value of the selected")
            .attr("x", 0).attr("y", 0)
        .append("tspan")
            .text("indicator determines the")
            .attr("x", 0).attr("y", 0).attr("dy", 12)
        .append("tspan")
            .text("bubbles' color.")
            .attr("x", 0).attr("y", 0).attr("dy", 12 * 2)

    iconsData.forEach(d => {
        
        const group = form.append("g")
            .attr("class", "icon-group")
            .attr("id", "icon-group-" + d.i)
            .attr("transform", `translate(${170 + (d.i - 1) * params.pad},25)`)
            .attr("value", d.i);
        
        group.append("circle")
            .attr("class", "form-icon-bg")
            .attr("r", params.radius);
        
        group.append("image")
            .attr("class", "form-icon")
            .attr("transform", "translate(-10,-10)")
            .attr("href", "assets/" + d.src + ".svg")
            .attr("width", params.radius + 5)
            .attr("height", params.radius + 5)
        
        group.append("g")
            .attr("transform", "translate(0,35)")
            .append("text")
                .attr("class", "form-label")
                .attr("text-anchor", "middle")
            .append("tspan")
                .text(d.lab1)
                .attr("x", 0).attr("y", 0)
            .append("tspan")
                .text(d.lab2)
                .attr("x", 0).attr("y", 0)
                .attr("dy", 14)
    });
    
    form.select("#icon-group-1").classed("icon-clicked", true);

    return container.node();
};

export function addFormRadio(container) {

    const radio = container.append("form")
        .attr("id", "radio-var")
        .attr("class", "radio")
        .attr("margin-top", "10px");

    radio.append("text")
        .attr("class", "form-title")
        .text("Indicator");
    
    radio.append("text")
        .attr("class", "form-desc")
        .text("The value of the selected indicator determines the bubbles' color.");

    const addButton = (form, key, value) => {
    
        const button = form.append("label");
    
        button.append("input")
            .attr("type", "radio")
            .attr("name", "radioVar")
            .attr("value", key);
        
        button.append("label")
            .text(value);
        
        return form.node();
    };

    const formRadio = radio.append("div");

    for (let [code, label] of Object.entries(util.indicators)) {
        formRadio.call(addButton, code, label);
    };
    
    return container.node();
}

// Boxplot chart forms //////////////////////////

export function addFormDropdown(container) {
  
    const dropdown = container.append("form")
        .attr("id", "bar-dropdown-region")
        .attr("class", "select")
        .attr("margin-top", "10px");

    dropdown.append("text")
        .attr("class", "form-title")
        .text("Region");

    const addOption = (form, key, value) => {
        form.append("option")
        .text(value)
        .attr("value", key);
    }

    const dropdownOptions = dropdown.append("div").append("select");

    for (let [code, label] of Object.entries(util.regions)) {
        dropdownOptions.call(addOption, code, label);
    };

    return container.node();
}

export function addFormRadioBar(container) {

    const radio = container.append("form")
        .attr("id", "bar-radio-var")
        .attr("class", "radio")
        .attr("margin-top", "10px");

    radio.append("text")
        .attr("class", "form-title")
        .text("Indicator");

    const addButton = (form, key, value) => {
        
        const button = form.append("label")
        
        button.append("input")
            .attr("type", "radio")
            .attr("name", "radioVar")
            .attr("value", key)
        
        button.append("label").text(value)
        
        return form.node()
    }

    const formRadio = radio.append("div")

    for (let [code, label] of Object.entries(util.indicatorsBar)) {
        formRadio.call(addButton, code, label);
    }

    return container.node();
};

