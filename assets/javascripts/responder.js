/**
 * Controller Script
 * 
 * Author: Dr Neil Brittliff
 */

let schemaTemplate = ejs.compile($('script[data-template="template"]').text(), { client: true });

var data = null;

var selected = [];

var filters = new Map();
var selectors = new Map();
var colours = new Map();

var categorical = [];
var continuous = [];

$.fn.Table = (prefix, div, cellWidth, cellHeight, filters) => {
    var divs = [];

    var left = 10;
    var top = 10;
    var html = [];
    var ids = [];

    for (var x = 0; x < filters.length; x++) {

        for (var y = 0; y < filters.length; y++) {

            left = x * cellWidth;
            top = y * cellHeight;
            var id = `${prefix}-${x}-${y}`;
            var label = "";
            var backgroundColor = "black";

            if (x != y) {
                ids.push(id);
            } else {
                label = `<label style="display: flex; justify-content: center; align-items:center; height:100%;"/>${filters[x]}<label>`;
            }

            var cell = `<div id="${id}" style="display:inline-block; position:absolute; background-color:${backgroundColor}; top:${top}px; 
            left:${left}px; width:${cellWidth}px; height:${cellHeight}px; margin:20px; border: 2px solid rgb(255,255,255)"/>${label}</div>`

            html.push(cell);

        }

    }

    var left = cellWidth * filters.length;
    html.push(`<div style="display:inline-block; position:absolute; top: 0px; bottom:0px; left:${left}px; width:45px;"/></div>`);
    $(div).append(html);

}

$.fn.Plot = (category, filters, filteredData, cellWidth, cellHeight, callback) => {

    for (var x = 0; x < filters.length; x++) {

        next: for (var y = 0; y < filters.length; y++) {
            if (x == y) {
                continue next;
            }

            var rows = [];
            var range = null;

            filteredData.forEach((row) => {
                var cell = {};

                cell[filters[x]] = parseFloat(row[filters[x]]);
                cell[filters[y]] = parseFloat(row[filters[y]]);
                cell[category] = row[category];

                rows.push(cell);

                if (range == null) {
                    range = {
                        x: {
                            max: cell[filters[x]],
                            min: cell[filters[x]]
                        },
                        y: {
                            max: cell[filters[y]],
                            min: cell[filters[y]]
                        }
                    }
                } else {
                    range.x.max = Math.max(range.x.max, cell[filters[x]]);
                    range.x.min = Math.min(range.x.min, cell[filters[x]]);

                    range.y.max = Math.max(range.y.max, cell[filters[y]]);
                    range.y.min = Math.min(range.y.min, cell[filters[y]]);
                }

            });

            callback(`#sp-${x}-${y}`, rows, range, {
                    x: filters[x],
                    y: filters[y]
                },

                cellWidth, cellHeight);

        }

    }

}

$.fn.PlotParalleCoordinates = (category, filters, filteredData) => {
    function wrap(text, font, width) {

        function getTextWidth(text, font) {
            var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
            var context = canvas.getContext("2d");
            context.font = font;
            var metrics = context.measureText(text);
            return metrics.width;
        }

        function shrinkText(text, font, width) {
            var shrunkText = text.slice(0, -1);

            while (shrunkText.length > 1) {

                var textWidth = getTextWidth(shrunkText, font);

                if (textWidth < width) {
                    return shrunkText;
                }

                var shrunkText = shrunkText.slice(0, -1);

            }

            return shrunkText;

        }

        text.each(function() {
            var text = d3.select(this);
            var textWidth = getTextWidth(text.text())

            if (textWidth < width) {
                text.html(text.text());
            } else {
                text.html(shrinkText(text.text(), 'normal 10pt sans-serif', width) + "&#8230;");
            }

        });

    }

    var area = {
        width: $(window).width() - parseInt($("#parallelCoordinatesArea").css('left').replace(/\D+/g, '')) - 80,
        height: $(window).height() - parseInt($("#parallelCoordinatesArea").css('top').replace(/\D+/g, '')) - 70

    }

    var margin = { top: 40, right: 0, bottom: 20, left: 30 },
        width = (area.width < 800 ? 800 : area.width) - margin.left - margin.right,
        height = (area.height < 500 ? 500 : area.height) - margin.top - margin.bottom;

    var plotWidth = width + margin.left + margin.right;
    var plotHeight = height + margin.top + margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#parallelCoordinatesArea")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var dimensions = Object.keys(filteredData[0]).filter((key) => { return filters.includes(key) });

    // For each dimension, I build a linear scale. I store all in the 'y' object
    var y = {}

    for (var dimension in dimensions) {
        var name = dimensions[dimension];

        y[name] = d3.scaleLinear()
            .domain(d3.extent(filteredData, function(d) { return +d[name]; }))
            .range([height, 0]);

    }

    // Build the X scale -> it find the best position for each Y axis

    var x = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(dimensions);


    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    svg
        .selectAll("path")
        .data(filteredData)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#021d97")
        .style("opacity", 1.0)

    // Draw the axis:
    svg.selectAll("axis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // And I build the axis with the call function
        .each(function(d) {
            d3.select(this).call(d3.axisLeft().scale(y[d]));
        })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .html(function(d) { return d; })
        .call(wrap, 'normal 10pt sans-serif',
            filters.length == 1 ? width : x(filters[1]) - x(filters[0]))
        .style("fill", "black");

}

$.fn.ScatterPlot = (category, filters, filteredData) => {

    function drawPlot(div, rows, range, axis, cellWidth, cellHeight) {
        var margin = { top: 50, right: 50, bottom: (range.x.max > 100000 ? 60 : 50), left: (range.y.max > 100000 ? 60 : 50), },
            width = cellWidth - margin.left - margin.right,
            height = cellHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select(div)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Add X axis
        var x = d3.scaleLinear()
            .domain([range.x.min, range.x.max])
            .range([0, width]);

        svg.append("g")
            .attr("transform", "translate(0, " + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,10)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([range.y.min, range.y.max])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add dots
        svg.append('g')
            .selectAll("dot")
            .data(rows)
            .enter()
            .append("circle")
            .attr("cx", function(row) { return x(row[axis.x]); })
            .attr("cy", function(row) { return y(row[axis.y]); })
            .attr("r", 1.5)
            .style("fill", function(row) {
                return colours[category][row[category]];
            })

    }

    var area = {
        width: $(window).width() - parseInt($('#scatterPlotArea').css('left').replace(/\D+/g, '')),
        height: $(window).height() - parseInt($('#scatterPlotArea').css('top').replace(/\D+/g, '')) - 88

    }

    var cellWidth = area.height / filters.length < 300 ? 300 : area.height / filters.length;
    var cellHeight = area.height / filters.length < 300 ? 300 : area.height / filters.length;

    $(this).Table('sp', '#scatterPlotArea', cellWidth, cellHeight, filters);
    $(this).Plot(category, filters, filteredData, cellWidth, cellHeight, drawPlot);

}

$.fn.Toggle = (id, button) => {

    if ($(id).css("display") == 'none') {
        $(id).css("display", "inline-block");
        $(button).css("background", $(button).css("background").replace('up', 'down'));
    } else {
        $(id).css("display", "none");
        $(button).css("background", $(button).css("background").replace('down', 'up'));
    }

}

$.fn.Draw = () => {

    if (data == null) {
        return;
    }

    $("#parallelCoordinatesArea").html("");
    $("#scatterPlotArea").html("");

    var categoricalSelector = new Map();
    var filters = [];

    $("#categories").find("input[name=categorical]").each((i, ob) => {
        var field = ob.value;
        var fieldID = 'field-' + field.replace(/[\s|0-9|\(|\)]/g, '-');

        categoricalSelector.set(field, []);

        $("#" + fieldID).find("input[type=checkbox]:checked").each((i, ob) => {

            categoricalSelector.get(field).push(ob.value);

        });

    });

    var continuousSelector = new Map();

    $("#continuous").find("input[name=continuous]:checked").each((i, ob) => {
        var field = ob.value;
        filters.push(field);

        var fieldID = 'field-' + field.replace(/[\s|0-9|\(|\)]/g, '-');

        continuousSelector.set(field, []);

        $("#" + fieldID).find("input[type=checkbox]:checked").each((i, ob) => {

            continuousSelector.get(field).push(ob.value);

        });

    });

    var category = "";
    $("#categories").find("input[name=categorical]:checked").each((i, ob) => {
        category = ob.value;
    });

    var filteredData = data.filter((d, i) => {

        function select(map, d) {
            var iKeys = map.keys();

            for (let key of iKeys) {

                if (map.get(key).indexOf(d[key]) == -1) {
                    return false;
                }

            }

            return true;

        }

        if (!select(categoricalSelector, d)) {
            return;
        }

        if (!select(continuousSelector, d)) {
            return;
        }

        return d;

    });

    $(this).PlotParalleCoordinates(category, filters, filteredData);
    $(this).ScatterPlot(category, filters, filteredData);

}

$(window).resize(() => {

    if (data != null) {
        $(this).Draw();
    }

});

$('#load').on('click', (e) => {

    $('#uploadDialog').css('display', 'block');

    return false;

});

$('#draw').on('click', (e) => {

    $(this).Draw();

    return false;

});

/**
 * Closing/Hiding the Upload Dialog
 * 
 */
$('#uploadDialogClose').on('click', (e) => {

    $('#uploadDialog').css('display', 'none');

    return false;

});

$('#parallelCoordinates').on('click', (e) => {

    $('#parallelCoordinates').children('img').map(function() {
        $(this).attr('src', 'assets/images/dot-selected.svg');
    }).get()

    $('#scatterGraphs').children('img').map(function() {
        $(this).attr('src', 'assets/images/dot-unselected.svg');
    }).get()

    $('#parallelCoordinatesArea').css('display', 'inline-block');
    $('#scatterPlotArea').css('display', 'none');

    return false;

});


$('#scatterGraphs').on('click', (e) => {

    $('#parallelCoordinates').children('img').map(function() {
        $(this).attr('src', 'assets/images/dot-unselected.svg');
    }).get()

    $('#scatterGraphs').children('img').map(function() {
        $(this).attr('src', 'assets/images/dot-selected.svg');
    }).get()

    $('#parallelCoordinatesArea').css('display', 'none');
    $('#scatterPlotArea').css('display', 'inline-block');

    return false;

});

$(() => {

    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    var dropzone = $('#droparea');

    dropzone.on('dragover', () => {
        dropzone.addClass('hover');
        return false;
    });

    dropzone.on('dragleave', () => {
        dropzone.removeClass('hover');
        return false;
    });

    dropzone.on('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');

        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);

        return false;

    });

    var uploadBtn = $('#uploadbtn');
    var defaultUploadBtn = $('#upload');

    uploadBtn.on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        defaultUploadBtn.click();
    });

    defaultUploadBtn.on('change', function() {
        var files = $(this)[0].files;

        $('#uploadDialog').css('display', 'none');
        processFiles(files);

        return false;

    });

    function processFiles(files) {


        function getColour(h) {
            function hsvTorgb(h, s, v) {
                var base = Math.round(h * 6);
                var f = h * 6 - base;
                var p = v * (1 - s)
                var q = v * (1 - f * s);
                var t = v * (1 - (1 - f) * s);
                var rgb =
                    base == 0 ? [v, t, p] :
                    base == 1 ? [q, v, p] :
                    base == 2 ? [p, v, t] :
                    base == 3 ? [p, q, v] :
                    base == 4 ? [t, p, v] : [v, p, q]
                return `rgb(${Math.round(rgb[0]*256)}, ${Math.round(rgb[1]*256)}, ${Math.round(rgb[2]*256)})`;

            }

            h += 0.618033988749895;
            h %= 1
            return {
                h: h,
                colour: hsvTorgb(h, 0.5, 0.95)
            }

        }

        categorical = [];
        continuous = [];

        category = null;

        filters.clear();
        selectors.clear();
        colours.clear();

        $("#parallelCoordinatesArea").html("");
        $("#scatterPlotArea").html("");
        $('#drawButton').css('color', 'grey');
        $('#draw').css('color', 'grey');
        $('#drawButton').css('opacity', '0.5');

        Array.prototype.slice.call(files).forEach((file) => {
            var fileURL = URL.createObjectURL(file);

            d3.csv(fileURL).then((rows) => {
                console.log(rows[0]);

                var headers = Object.keys(rows[0]);
                data = rows;

                rows.forEach((row) => {

                    headers.forEach((column) => {

                        if (!isNumber(row[column]) && row[column].match(/\S/)) {

                            if (categorical.indexOf(column) == -1) {
                                categorical.push(column);
                                filters.set(column, []);
                            }

                            if (filters.get(column).indexOf(row[column]) == -1) {
                                filters.get(column).push(row[column]);
                            }

                        } else {
                            if (row[column].trim().length > 0) {

                                if (continuous.indexOf(column) == -1) {
                                    continuous.push(column);
                                    selectors.set(column, []);
                                }

                                if (selectors.get(column).indexOf(row[column]) == -1) {
                                    selectors.get(column).push(row[column]);
                                }

                            }

                        }

                    });

                    function isNumber(n) {
                        return !isNaN(parseFloat(n)) && isFinite(n);
                    }

                });

                category = categorical.length > 0 ? categorical[0] : null;

                var html = schemaTemplate({
                    categorical: categorical,
                    continuous: continuous,
                    filters: filters,
                    selectors: selectors
                });

                $('#schema').html(html);

                for (let key of filters.keys()) {
                    var h = 1.0;

                    colours[key] = new Map();

                    var values = filters.get(key);

                    values.forEach((value) => {
                        var colourResult = getColour(h);

                        colours[key][value] = colourResult.colour;

                        h = colourResult.h;

                        if (value.trim().length > 0) {
                            var filterLabelID = 'value-' + (key + "-" + value).replace(/[\s|\(|\)|\[|\]|\/|\&|\.]/g, '-')
                            $(`#${filterLabelID}`).css("background-color", colourResult.colour);

                        }

                    });

                }

                $("input[type=checkbox]").on("click", () => {
                    selected = [];

                    $("#continuous").find("input[name=continuous]:checked").each((i, ob) => {
                        selected.push(ob.value);
                    });

                    if (selected.length > 1) {
                        $('#drawButton').css('color', 'white');
                        $('#draw').css('color', 'white');
                        $('#drawButton').css('opacity', '0.7');

                        $('#drawButton').hover(
                            function() {
                                $(this).css('opacity', '1.0');
                            },
                            function() {
                                $(this).css('opacity', '0.7');
                            }
                        );
                    } else {
                        $('#drawButton').css('color', 'grey');
                        $('#draw').css('color', 'grey');
                        $('#drawButton').css('opacity', '0.5');

                        $('#drawButton').hover(
                            function() {
                                $(this).css('opacity', '0.5');
                            },
                            function() {
                                $(this).css('opacity', '0.5');
                            }
                        );
                    }

                });

                $('#area').empty();

            });

        });

    }

});