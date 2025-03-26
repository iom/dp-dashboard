
import * as util from "./util.js";

// Map chart forms //////////////////////////////

export function addFormSlider(container) {

    const years = ({ min: 2018, max: 2024 });

    const form = container.append("form")
        .attr("id", "form-year-slider");

    // Title and description
    const titleContainer = form.append("div")
        .attr("class", "form-title-desc");
    titleContainer.append("span")
        .attr("class", "form-title")
        .text("Years");
    const label = titleContainer.append("span")
        .attr("class", "form-desc slider-label");

    const sliderContainer = form.append("div")
        .attr("class", "slider-container")

    const slider = sliderContainer.append("div")
        .attr("class", "slider")
    
    const slideOne = sliderContainer.append("input")
        .attr("id", "slider-1")
        .attr("type", "range")
        .attr("min", years.min)
        .attr("max", years.max)
        .attr("step", 1)
        .attr("value", 2023)
        .on("input", () => {
            let val1 = +slideOne.property("value");
            let val2 = +slideTwo.property("value");
            if (val1 >= val2) {
                slideOne.property("value", val2);
                val1 = val2;
            }
            fillColor();
        });

    const slideTwo = sliderContainer.append("input")
        .attr("id", "slider-2")
        .attr("type", "range")
        .attr("min", years.min)
        .attr("max", years.max)
        .attr("step", 1)
        .attr("value", years.max)
        .on("input", () => {
            let val1 = +slideOne.property("value");
            let val2 = +slideTwo.property("value");
            if (val2 <= val1) {
                slideTwo.property("value", val1);
                val2 = val1;
            }
            fillColor();
        });

    // const label = sliderContainer.append("div")
    //     .attr("class", "slider-label")
    
    fillColor();

    function fillColor() {
        let steps = years.max - years.min;
        let percent1 = ((slideOne.property("value") - years.min) / steps) * 100;
        let percent2 = ((slideTwo.property("value") - years.min) / steps) * 100;
        slider.style("background", `linear-gradient(to right,
                ${ util.colors.blue5 } ${ percent1 }%,
                ${ util.colors.blue3 } ${ percent1 }%,
                ${ util.colors.blue3 } ${ percent2 }%,
                ${ util.colors.blue5 } ${ percent2 }%
            )`);
        
        label.text(slideOne.property("value") + "\u2013" + slideTwo.property("value"))
        
        // console.log((5 + percent1 / 90) + "%")
    };

    return container.node();
}

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
    
    const form = container.append("form")
        .attr("id", "checkbox-type")

    // Title and description
    const formTitle = form.append("div")
        .attr("class", "form-title-desc")
    formTitle.append("span")
        .attr("class", "form-title")
        .text("Cause")
    formTitle.append("span")
        .attr("class", "form-desc")
        .text("Displacements due to the selected cause/s appear as bubbles on the map.")

    // Add options
    const formCheckbox = form.append("div")
        .attr("class", "options");
    formCheckbox.call(addOption, 0, "All causes", "type-0", "item-checkbox-all")
    for (let [code, label] of Object.entries(util.types)) {
        formCheckbox.call(addOption, code, label, "type-" + code, "item-checkbox");
    }
    
    function addOption(form, key, value, id, setClass) {
    
        const option = form.append("label")
        option.append("input")
            .attr("type", "checkbox")
            .attr("id", id)
            .attr("class", setClass)
            .attr("value", key)
        option.append("label")
            .text(value)
        
        return form.node();
    }

    return container.node();
}

export function addFormIcons(form) {

    const params = { pad: 75, radius: 15 };

    const iconsData = [
        { i: 1, src: "female",   lab1: "Female", lab2: "share"       },
        { i: 2, src: "children", lab1: "Median", lab2: "age"         },
        { i: 3, src: "children", lab1: "Children", lab2: "share"     },
        { i: 4, src: "income",   lab1: "Per capita", lab2: "income"  },
        { i: 5, src: "educ",     lab1: "Years of", lab2: "schooling" },
        { i: 6, src: "life",     lab1: "Life", lab2: "expectancy"    },
        { i: 7, src: "urban",    lab1: "Urban", lab2: "area"         },
        { i: 8, src: "crop",     lab1: "Cropland", lab2: "area"      },
        { i: 9, src: "graze",    lab1: "Grazing", lab2: "area"       },
    ];
    
    iconsData.forEach(d => {
        
        const group = form.append("div")
            .attr("tabindex", 0)
            .attr("class", "icon-group")
            .attr("id", "icon-group-" + d.i)
            .attr("value", d.i);
                
        group.append("div")
            .attr("class", "icon")
            .append("img")
                .attr("src", "assets/images/" + d.src + ".svg")
                .attr("width", params.radius + 5 + "px")
                .attr("height", params.radius + 5 + "px")
        
        const label = group.append("div")
            .attr("class", "icon-label")
        label.append("div").text(d.lab1)
        label.append("div").text(d.lab2)
    });
    
    form.select("#icon-group-1").classed("icon-clicked", true);

    return form.node();
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

