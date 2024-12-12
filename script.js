// Initialize constants for canvas dimensions
const width = 800;
const height = 600;

// Create the SVG canvas
//d3.select("body")
//  .append("h1")
//  .text("Ham Sandwich Cut Visualization");

const svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("border", "1px solid black");

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

const scaleX = d3.scaleLinear().domain([0, width]).range([0, width]);
const scaleY = d3.scaleLinear().domain([0, height]).range([height, 0]);

// Event listener for placing points
svg.on("click", function (event) {
  const [x, y] = d3.pointer(event);


  if (stage == 0 && currentColor === "blue" && bluePoints.length < 10) {
    bluePoints.push({ x, y, color: "blue" });
    drawPoint(x, y, "blue");
    pointCount++;
    if (bluePoints.length === 10) {
        currentColor = "red";
        pointCount = 0;
        alert("Switching to red points. Place 10 red points.");
        for (let i = 0; i < bluePoints.length; i++) {
            console.log("Blue Point X: " + bluePoints[i].x + " Y: " + bluePoints[i].y);
        }
       stage = 1;
    }
  } 
  else if (stage == 1 && currentColor === "red" && redPoints.length < 10) {
    redPoints.push({ x, y, color: "red" });
    drawPoint(x, y, "red");
    pointCount++;
    if (redPoints.length === 10) {
        for (let i = 0; i < redPoints.length; i++) {
            console.log("Red Point X: " + redPoints[i].x + " Y: " + redPoints[i].y);
        }
      alert("All points placed. Computing Ham Sandwich Cut.");
      stage = 2;
    }
  } 
  else if (stage == 2) {
    temp_node, temp_line = computeAndDrawDualExample();
    stage = 3;
  }
  else if (stage == 3) {
    computeAndDrawDual();
    stage = 4;
  }
  else if (stage == 4) {
    intersections = computeIntersections();
    stage = 5;
  }
  else if (stage == 5) {
    sections = computeSegments(intersections);
    stage = 6;
  }
  else if (stage == 6) {
    result = getOddIntersectionSegment(sections, sections_tried);
    if (result == "failed") {
      sections_tried++;
    }
    else {
      stage = 7;
    }
  }
  else if (stage == 7) {
    computeAndDrawTrapezoid();
    stage = 8;
  }
  else if (stage == 8) {
    computeAndRemoveEdges();
    stage = 9;
  }
  else if (stage == 7) {
    const line = computeHamSandwichCut(redPoints, bluePoints);
    console.log("slope: " + line.slope + ", intercept: " + line.intercept);
    drawPoint(line.slope, line.intercept);
    stage = 8;
  }
});

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

  const median =
    n % 2 === 1
      ? intersections[Math.floor(n / 2)] // Odd: middle value
      : (intersections[n / 2 - 1] + intersections[n / 2]) / 2; // Even: average of middle two

  return median;
};

const getOddIntersectionSegment = (sections, sections_tried) => {
  // Just so it is visible on screen.
  const index = Math.floor(sections.length / 2);
  const left = sections[index + sections_tried];
  const right = sections[index + sections_tried + 1];

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
    drawVerticalLineScaled(left, 'red', 2);
    return "failed";
  }

  if (by1 < ry1 && by2 < ry2) {
    drawVerticalLineScaled(left, 'red', 2);
    return "failed";
  }

  return "passed";
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
const drawLine = (x1, y1, x2, y2, color) => {
    // Draw the dual line as a shaded line
    svg.append("line")
      .attr("x1", 300 * x1 + 200)
      .attr("y1", y1 - 200)
      .attr("x2", 300 * x2 + 200)
      .attr("y2", y2 - 200)
      .attr("stroke", color)
      .attr("stroke-width", 1);
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


const hamSandwichPoint = (blueLines, redLines) => {
  const alpha = 1/32;
  
    if (blueLines.length % 2 == 0) {
        blueLines.remove(0);
    }
    if (redLines.length % 2 == 0) {
        redLines.remove(0);
    }

    let moreLines = redLines;
    let fewerLines = blueLines;
    if (blueLines.length > redLines.length) {
        moreLines = blueLines;
        fewerLines = redLines;
    }

    let p1 = Math.ceil(moreLines.length / 2);
    let p2 = Math.ceil(fewerLines.length / 2);

    let T = (-Infinity, Infinity);

    while((moreLines.length * moreLines.length - 1) / 2 > (1 / alpha)) {
        T = NewInterval(moreLines, fewerLines, p1, p2, T);
        const t = FindTrapezoid(G1, p1, T);
        if (moreLines.length < fewerLines.length) {
            const temp = moreLines;
            moreLines = fewerLines;
            fewerLines = temp;
        }
    }

    return BruteForce(moreLines, fewerLines, p1, p2, T);
};


const NewInterval = (moreLines, fewerLines, p1, p2, T) => {
    const alpha = 1/32;
    [n, p] = IntersectionsAndRandomIntersection(moreLines, T);

    // This returns an INterval T' in T that has the odd intersection property in relation to
    // Lp1(G1) and Lp2(G2) and also the number of T' intersections among lines in G1 is no more
    // that alpha G1 choose 2.
    while (n > alpha(moreLines.length * (moreLines.length - 1) / 2)) {
        [a, b] = T
        let T1 = (a, p.x);
        let T2 = (p.x, b);

        if (OddIntersectionProperty(moreLines, fewerLines, p1, p2, T1)) {
            T = T1;
        } else {
            T = T2;
        }

        [n, p] = IntersectionsAndRandomIntersection(moreLines, T);
    }
    return T;
}

const IntersectionsAndRandomIntersection = (G, T) => {
    [a, b] = T;
    SortEval(G, a);
    pi = IndSortEval(G, b);
    [c, u, v] = InversionsAndRandomInversion(pi, 1, Math.abs(pi));
    if (c == 0) {
        return (c, null, null);
    }
    inter = Intersection(G[u], G[v]);
    return (c, inter);
}

const InversionsAndRandomInversion = (pi, i, j) => {
    if (i >= j) {
        return (0, null, null);
    }

    let k = Math.floor((i + j) / 2.0);

    [c1, u1, v1] = InversionsAndRandomInversion(pi, i, k);
    [c2, u2, v2] = InversionsAndRandomInversion(pi, k + 1, j);
    let c3 = 0;
    let t1 = i;
    let t2 = k + 1;

    //for (let t of range(i, k + 1))

}
