// Initialize constants for canvas dimensions
const width = 800;
const height = 600;


// Create the SVG canvas
d3.select("body")
  .append("h1")
  .text("Ham Sandwich Cut Visualization");

const svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("border", "1px solid black");

const text_box = d3.select("body").append("h3").text(
  "This project runs through a simulation of Lo, Matoušek, and Steiger's Algorithm for finding the Ham Sandwich Cut in Linear Time. The Ham Sandwhich Cut is a singular line that bisects two separate sets of points. It has been shown that in 2 dimensions, under general conditions, it is always possible to construct a Ham Sandwich Line to bisect 2 classes. The Lo, Matoušek, and Steiger's Algorithm runs in Linear Time. The original paper can be found here https://link.springer.com/article/10.1007/BF02574017. The following two links are other resources that summarize the idea of the algorithm without going into too much detail. https://linux.ime.usp.br/~kobus/mac0499/monografia.pdf https://cgm.cs.mcgill.ca/~athens/cs507/Projects/2002/DanielleMacNevin/algorithm-pg1.html. \n Click on the square to start. Click to move forward in the algorithm.");

let originalBluePoints = [];
let originalRedPoints = [];
let bluePoints = [];
let redPoints = [];
let currentColor = "blue";
let pointCount = 0;
let stage = 0;
let sections_tried = 0;
let temp_node = null;
let temp_line = null;
let intersections = null;
let sections = null;
let left_section = [];
let right_section = [];
let x_0, y_0, x_1, y_1, x_2, y_2, x_3, y_3;
let team_color;

const scaleX = d3.scaleLinear().domain([0, width]).range([0, width]);
const scaleY = d3.scaleLinear().domain([0, height]).range([height, 0]);

// Event listener for placing points
svg.on("click", function (event) {
  const [x, y] = d3.pointer(event);


  if (stage == 0 && currentColor === "blue" && bluePoints.length < 10) {
    text_box.text("Place 10 blue dots. This will make up one class that will be bisected by the ham sandwich cut line.");

    bluePoints.push({ x, y, color: "blue" });
    drawPoint(x, y, "blue");
    pointCount++;
    if (bluePoints.length === 10) {
        currentColor = "red";
        pointCount = 0;
        //alert("Switching to red points. Place 10 red points.");
        for (let i = 0; i < bluePoints.length; i++) {
            console.log("Blue Point X: " + bluePoints[i].x + " Y: " + bluePoints[i].y);
        }
       stage = 1;
    }
  } 
  else if (stage == 1 && currentColor === "red" && redPoints.length < 10) {
    text_box.text("Place 10 red dots. This will make up the other class that will be bisected by the ham sandwich cut line.");
    redPoints.push({ x, y, color: "red" });
    drawPoint(x, y, "red");
    pointCount++;
    if (redPoints.length === 10) {
        for (let i = 0; i < redPoints.length; i++) {
            console.log("Red Point X: " + redPoints[i].x + " Y: " + redPoints[i].y);
        }
      //alert("All points placed. Computing Ham Sandwich Cut.");
      stage = 2;
    }
  } 
  else if (stage == 2) {
    text_box.text("Now that both classes are made, we will iterate through the algorithm. This algorithm uses the concept of the dual. Namely, instead of observing the objects as points with an x and y coordinate, it transforms the point into a line, with x becoming the slope and y becoming the intercept. The green dot is an example of a point in the primary space. Its dual is the green line. The x coordinate is turned into the slope and the y coordinate is the intercept. It is important to note that in this visualization, the dual space is transformed for easier visualizations. This transformation will not change the relevant features of the space. Additionally, the primary and dual spaces are different, and are just being overlayed in this visualization.");
    originalBluePoints = bluePoints.slice(0);
    originalRedPoints = redPoints.slice(0);
    temp_node, temp_line = computeAndDrawDualExample();
    stage = 3;
  }
  else if (stage == 3) {
    text_box.text("Here you can see all the points turned into their respective dual representation. Since these are lines, they go on past the canvas, and as such, some interactions will not be captured in the diagram. There are important correlations between the primary and the dual datapoints. For example, collinear points in the primary will always intersect at the same point in the dual. In our example, the dual representation of the ham sandwich cut line is a point that has half of each classes lines above it, and half of those lines below it.");
    computeAndDrawDual();
    stage = 4;
  }
  else if (stage == 4) {
    text_box.text("This is a visualization of all the intersections between the dual lines.");
    intersections = computeIntersections();
    stage = 5;

  }
  else if (stage == 5) {
    text_box.text("In this step, we break down the space into segments, where each segment contains N/20 intersections, where N is the total number of intersections. The full algorithm is not as precise in order to maintain the linear runtime, but it guarentees an upper bound to the number of intersections.");
    sections = computeSegments(intersections);
    stage = 6;
  }
  else if (stage == 6) {
    result = getOddIntersectionSegment(sections, sections_tried);
    text_box.text("Now that we have the segments, we will find a segment that meets the requirements for our algorithm. In this case, we are looking for a segment that demonstrates the odd intersection property. Within each segment, there is a collection of segments from the left to the right that make up the median segment for either the blue or the red class. By the intersection property, there must exist a segment in which the collection of median segments for the blue class crosses the collection of median segments for the red class an odd number of times. We iterate through to find one of these segments. This might happen off screen due to our canvas.");
    if (result == "failed") {
      sections_tried++;
    }
    else {
      sections_tried = 0;
      [left, right] = result;
      stage = 7;
    }
  }
  else if (stage == 7) {
    [x_0, y_0, x_1, y_1, x_2, y_2, x_3, y_3, team_color] = computeAndDrawTrapezoid(left, right, intersections);
    console.log([x_0, y_0, x_1, y_1, x_2, y_2, x_3, y_3, team_color]);
    stage = 8;
  }
  else if (stage == 8) {
    computeAndRemoveEdges([x_0, y_0, x_1, y_1, x_2, y_2, x_3, y_3, team_color]);
    if (bluePoints.length < 6 && redPoints.length < 6) {
      stage = 9;
    }
    else {
      stage = 4;
    }
  }
  else if (stage == 9) {
    computeAndDrawCut()

    const line = computeHamSandwichCut(originalRedPoints, originalBluePoints);
    stage = 10;
  }
});

const computeAndRemoveEdges = ([x_0, y_0, x_1, y_1, x_2, y_2, x_3, y_3, team_color]) => {

  
  drawPointScaled(x_0, y_0, "purple");
  drawPointScaled(x_1, y_1, "purple");
  drawPointScaled(x_2, y_2, "purple");
  drawPointScaled(x_3, y_3, "purple");

  let points = bluePoints;
  if (team_color == "red") {
    points = redPoints;
  }
  
  new_points = []
  for (let a of points) {
    if (intersects(a, {x:x_0, y:y_0}, {x:x_2, y:y_2}) || intersects(a, {x:x_1, y:y_1}, {x:x_3, y:y_3})){
      new_points.push(a);
      console.log(a);
    }
  }

  if (team_color == "blue") {
    bluePoints = new_points;
  } else {
    redPoints = new_points;
  }

  svg.selectAll("*").remove();

  originalBluePoints.forEach(point => drawPoint(point.x, point.y, "blue"));
  originalRedPoints.forEach(point => drawPoint(point.x, point.y, "red"));

  bluePoints.forEach(point => {
    const slope = point.x; // Dual slope is scaled x-coordinate
    const intercept = point.y; // Dual intercept is -scaled y-coordinate
    [x1, y1, x2, y2] = getLinesFromPoints(slope, intercept);
    console.log("Dual line m = " + slope + ", b = " + y1);
    drawLine(x1, y1, x2, y2, "rgba(0, 0, 255, 0.4)");
  });

  redPoints.forEach(point => {
      const slope = point.x; // Dual slope is scaled x-coordinate
      const intercept = point.y; // Dual intercept is -scaled y-coordinate
      [x1, y1, x2, y2] = getLinesFromPoints(slope, intercept);
      console.log("Dual line m = " + slope + ", b = " + y1);
      drawLine(x1, y1, x2, y2, "rgba(255, 0, 0, 0.2)");
    });
}

function intersects(a, b, c) {

  const slope = a.x; 
  const intercept = a.y; 

  const segmentSlope = (c.y - b.y) / (c.x - b.x);
  const segmentIntercept = b.y - segmentSlope * b.x;

  const intersectionX = (segmentIntercept - intercept) / (slope - segmentSlope); 
  const intersectionY = slope * intersectionX + intercept; 

  // Check if the intersection point lies within the bounds of the segment
  return (
    intersectionX >= Math.min(b.x, c.x) &&
    intersectionX <= Math.max(b.x, c.x) &&
    intersectionY >= Math.min(b.y, c.y) &&
    intersectionY <= Math.max(b.y, c.y)
  );
}

const computeAndDrawTrapezoid = (left, right, intersections) => {
  let points = bluePoints;
  let team_color = "blue";
  if (bluePoints.length < redPoints.length) {
    points = redPoints;
    team_color = "red";
  }

  const pyleft = getMedianLevel(points, left);
  const pyright = getMedianLevel(points, right);

  const [left_up, left_down] = getAroundMedianLevel(points, left);
  const [right_up, right_down] = getAroundMedianLevel(points, right);
  drawLine(left, left_up, right, right_up, "green", 2);
  drawLine(left, left_down, right, right_down, "green", 2);

  return [left, left_up, right, right_up, right, right_down, left, left_down, team_color];
}

const getMedianLevel = (lines, xValue) => {
  // Compute the intersection points at x = xValue
  const intersections = lines.map(line => {
    //const { slope, intercept } = line; // Line equation: y = mx + b
    slope = line.x;
    intercept = line.y;
    const y = slope * xValue + intercept; // Intersection at x = xValue
    return y;
  });

  // Sort the y-values
  intersections.sort((a, b) => a - b);

  // Find the median
  const n = intersections.length;
  if (n === 0) return null; // No lines, no median

  // Paper just removes a line, feels like thats riskier than this though.
  const median = intersections[Math.floor(n / 2)];


  return median;
};

const getAroundMedianLevel = (lines, xValue) => {
  // Compute the intersection points at x = xValue
  const intersections = lines.map(line => {
    //const { slope, intercept } = line; // Line equation: y = mx + b
    slope = line.x;
    intercept = line.y;
    const y = slope * xValue + intercept; // Intersection at x = xValue
    return y;
  });

  // Sort the y-values
  intersections.sort((a, b) => a - b);

  // Find the median
  const n = intersections.length;
  if (n === 0) return null; // No lines, no median

  // Paper just removes a line, feels like thats riskier than this though.
  const median = intersections[Math.floor(n / 2)];


  return [intersections[Math.floor(n / 2) - 2], intersections[Math.floor(n / 2) + 2]];
};

const getOddIntersectionSegment = (sections, sections_tried) => {
  // Just so it is visible on screen.
  left = sections[sections.length - 2 - sections_tried];
  right = sections[sections.length - 2 - sections_tried + 1];


  console.log("left: " + left);
  console.log("right: " + right);
  drawVerticalLineScaled(left, 'green', 2);
  drawVerticalLineScaled(right, 'green', 2);

  const by1 = getMedianLevel(bluePoints, left);
  const by2 = getMedianLevel(bluePoints, right);

  const ry1 = getMedianLevel(redPoints, left);
  const ry2 = getMedianLevel(redPoints, right);
  drawPointScaled(left, by1, "clear", "blue");
  drawPointScaled(right, by2, "clear", "blue");
  drawPointScaled(left, ry1, "clear", "red");
  drawPointScaled(right, ry2, "clear", "red");

  if (by1 > ry1 && by2 > ry2) {
    drawVerticalLineScaled(right, 'red', 2);
    return "failed";
  }

  if (by1 < ry1 && by2 < ry2) {
    drawVerticalLineScaled(right, 'red', 2);
    return "failed";
  }

  console.log("blue---" + " leftx: " + left + " lefty: " + by1 + " rightx: " + right + " righty: " + by2);
  console.log("red---" + " leftx: " + left + " lefty: " + ry1 + " rightx: " + right + " righty: " + ry2);

  return [left, right];
}

const computeSegments = (intersections) => {
  intersections.sort((a, b) => a.x - b.x);
  const a = 1/20;
  const b = a * intersections.length;
  segments = []
  console.log(intersections);
  for (let i = 0; i < intersections.length - 1; i = Math.floor(i + b)) {
    console.log(intersections[i]);
    segments.push((intersections[i].x + intersections[i + 1].x) / 2);
  }
  console.log(segments);
  for (let c of segments) {
    drawVerticalLineScaled(c, "grey", 1);
  }

  return segments;
}

const computeIntersections = () => {
    const lines = [...bluePoints, ...redPoints];
    const intersections = [];

    // Iterate over all pairs of lines
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const line1 = lines[i];
        const line2 = lines[j];
  
        const m1 = line1.x;
        const b1 = line1.y;
        const m2 = line2.x;
        const b2 = line2.y;
  
        // Check if lines are parallel (no intersection)
        if (m1 === m2) continue;
  
        // Calculate the intersection point
        const x = (b2 - b1) / (m1 - m2); // x-coordinate of intersection
        const y = m1 * x + b1; // y-coordinate of intersection
  
        intersections.push({ x, y });
      }
    }
    for (a of intersections) {
      drawPointScaled(a.x, a.y, "black");
    }

    return intersections;
};

// Draw a single point on the canvas
const drawPoint = (x, y, color) => {
    svg.append("circle")
      .attr("cx", x) // x is relative to the new origin
      .attr("cy", y) // Negate y to match Cartesian coordinates
      .attr("r", 5)
      .attr("fill", color);
  };

// Draw a single point on the canvas
const drawPointScaled = (x, y, fill_color = "none", stroke_color = "none") => {
  svg.append("circle")
    .attr("cx", 300 * x + 200) // x is relative to the new origin
    .attr("cy", y - 200) // Negate y to match Cartesian coordinates
    .attr("r", 2)
    .attr("fill", fill_color)
    .attr("stroke", stroke_color)
    .attr("stroke-width", 1);

};

  // Draw a single point on the canvas
const drawLine = (x1, y1, x2, y2, color, width = 1) => {
    // Draw the dual line as a shaded line
    svg.append("line")
      .attr("x1", 300 * x1 + 200)
      .attr("y1", y1 - 200)
      .attr("x2", 300 * x2 + 200)
      .attr("y2", y2 - 200)
      .attr("stroke", color)
      .attr("stroke-width", width);
};

const drawVerticalLineScaled = (x, color, width) => {
  svg.append("line")
    .attr("x1", 300 * x + 200)
    .attr("y1", -1000)
    .attr("x2", 300 * x + 200)
    .attr("y2", 1000)
    .attr("stroke", color)
    .attr("stroke-width", width);
}

// Define the Ham Sandwich Cut algorithm in linear time
const quickSelect = (arr, k, keyFn) => {
  if (arr.length <= 1) return arr[0];

  const pivot = keyFn(arr[Math.floor(Math.random() * arr.length)]);
  const lows = arr.filter(x => keyFn(x) < pivot);
  const highs = arr.filter(x => keyFn(x) > pivot);
  const pivots = arr.filter(x => keyFn(x) === pivot);

  if (k < lows.length) return quickSelect(lows, k, keyFn);
  if (k < lows.length + pivots.length) return pivots[0];
  return quickSelect(highs, k - lows.length - pivots.length, keyFn);
};

const medianLinear = (points, keyFn) => {
  return quickSelect(points, Math.floor(points.length / 2), keyFn);
};

const computeHamSandwichCut = (red, blue) => {
  const redMedianX = medianLinear(red, p => p.x).x;
  const redMedianY = medianLinear(red, p => p.y).y;
  const blueMedianX = medianLinear(blue, p => p.x).x;
  const blueMedianY = medianLinear(blue, p => p.y).y;

  // Calculate the line that bisects both sets
  const slope = (blueMedianY - redMedianY) / (blueMedianX - redMedianX);
  const intercept = redMedianY - slope * redMedianX;

  return { slope, intercept };
};

const computeAndDrawCut = () => {
  const line = computeHamSandwichCut(redPoints, bluePoints);

  // Draw the ham sandwich cut line
  svg.append("line")
    .attr("x1", 0)
    .attr("y1", line.intercept)
    .attr("x2", width)
    .attr("y2", line.slope * width + line.intercept)
    .attr("stroke", "black")
    .attr("stroke-width", 2);
};

const computeAndDrawDualExample = () => {
    svg.selectAll("circle").attr("opacity", 0.2);
    
    test_points = [bluePoints[0]];

    //const test_points = [{x: 200, y: 200}, {x: 100, y: 300}, {x: 300, y: 100}]
  
    for (a of test_points) {
        //const scaleX = d3.scaleLinear().domain([0, width]).range([0, width]);
        //const scaleY = d3.scaleLinear().domain([0, height]).range([height, 0]);

        //const scaledX = scaleX(a.x); // Scale x-coordinate
        //const scaledY = scaleY(a.y); // Scale y-coordinate

        const slope = a.x; // Dual slope is scaled x-coordinate
        const intercept = a.y; // Dual intercept is -scaled y-coordinate

        // Map line points to canvas
        const x1 = 0;
        const y1 = intercept;
        const x2 = width;
        const y2 = slope * width + intercept;

        console.log("Dual line m = " + slope + ", b = " + y1);

        drawPoint(a.x, a.y, "green");
        drawLine(x1, y1, x2, y2,  "rgba(0, 255, 0, 1)");
    }

};


function getLinesFromPoints(slope, intercept) {
  const x1 = -1000;
  const y1 = slope * -1000 + intercept;
  const x2 = 1000;
  const y2 = slope * 1000 + intercept;
  return [x1, y1, x2, y2];
}


const computeAndDrawDual = () => {  
    svg.selectAll("circle")
    .filter((_, i, nodes) => i >= nodes.length - 3) // Select the last circle
    .remove();
    svg.selectAll("line")
    .filter((_, i, nodes) => i >= nodes.length - 3) // Select the last circle
    .remove();

    svg.selectAll("circle").attr("opacity", 1);


    bluePoints.forEach(point => {
      const slope = point.x; // Dual slope is scaled x-coordinate
      const intercept = point.y; // Dual intercept is -scaled y-coordinate
      [x1, y1, x2, y2] = getLinesFromPoints(slope, intercept);
      console.log("Dual line m = " + slope + ", b = " + y1);
      drawLine(x1, y1, x2, y2, "rgba(0, 0, 255, 0.4)");
    });

    redPoints.forEach(point => {
        const slope = point.x; // Dual slope is scaled x-coordinate
        const intercept = point.y; // Dual intercept is -scaled y-coordinate
        [x1, y1, x2, y2] = getLinesFromPoints(slope, intercept);
        console.log("Dual line m = " + slope + ", b = " + y1);
        drawLine(x1, y1, x2, y2, "rgba(255, 0, 0, 0.2)");
      });
  };