(function(document, $, undefined) {
"strict";

function sgn(x) {
  return (x < 0) ? -1 : (x > 0) ? 1 : 0;
}

function leftTurn(p1, p2, p3) {
  // If you look at the corner patterns, the following system emerges for left turns:
  // - If the x coordinate changes first, then the sign of the change will
  //   be the opposite of the sign of the y coordinate change.
  // - If the y coordinate changes first, then the signs are equal.
  // - Otherwise, it's a right turn.
  if (p1[0] != p2[0]) {
    // x changed first, expect different signs.
    return sgn(p2[0] - p1[0]) != sgn(p3[1] - p2[1]);
  }
  // y changed first, expect similar signs.
  return sgn(p2[1] - p1[1]) == sgn(p3[0] - p2[0]);
}

function shrunkenEdge(p1, p2, radius) {
  var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  var np1 = p1.slice(0);
  var np2 = p2.slice(0);
  if (Math.abs(dx) < 0.0001) {
    if (np1[1] > np2[1]) {
      radius = -radius;
    }
    np1[1] += radius;
    np2[1] -= radius;
  } else {
    if (np1[0] > np2[0]) {
      radius = -radius;
    }
    np1[0] += radius;
    np2[0] -= radius;
  }
  return {
    p1: np1,
    p2: np2,
  };
}

var shrink_radius = 0.1;

function make_curve_to(p, leftTurn) {
  var flag = leftTurn ? '0' : '1';
  return "A" + shrink_radius + ' ' + shrink_radius + ' 0 0 ' + flag + ' ' + p.join(' ');
}

function make_path_string(path_coords) {
  var edge = shrunkenEdge(path_coords[path_coords.length-1], path_coords[0], shrink_radius);
  var path_pieces = ["M" + edge.p2.join(' ')];
  for (var i = 0; i < path_coords.length; i++) {
    var p0 = path_coords[(i-1+path_coords.length) % path_coords.length],
        p1 = path_coords[i],
        p2 = path_coords[(i+1) % path_coords.length];
    var edge = shrunkenEdge(p1, p2, shrink_radius);
    path_pieces.push(make_curve_to(edge.p1, leftTurn(p0, p1, p2)));
    path_pieces.push("L" + edge.p2.join(' '));
  }
  path_pieces.push("Z");
  return path_pieces.join("");
}

function getBounds(polygons) {
  var minX = Infinity, minY = Infinity,
      maxX = -Infinity, maxY = -Infinity;
  for (var i in polygons) {
    var p = polygons[i];
    for (var j in p.vertices) {
      var v = p.vertices[j];
      minX = Math.min(minX, v[0]);
      minY = Math.min(minY, v[1]);
      maxX = Math.max(maxX, v[0]);
      maxY = Math.max(maxY, v[1]);
    }
  }
  return [
    Math.floor(minX), Math.floor(minY),
    Math.ceil(maxX), Math.ceil(maxY)
  ];
}

KeyboardSVG = function(parent, layout, keyMod) {
  parent = (typeof parent === 'string') ? $('#' + parent) : $(parent);
  keyMod = keyMod || function() {};

  var bbox = layout.boundingBox();
  var polygons = layout.polygons();

  function draw(paper) {
    var width = paper.canvas.width.baseVal.value,
        height = paper.canvas.height.baseVal.value;

    // Spread to fill the width.
    var scale = width / (bbox.x2 - bbox.x1);
    // Center vertically.
    var yOffset = (height - scale * (bbox.y2 - bbox.y1)) / 2;

    var transform = this.transform = new Raphael.matrix(scale, 0, 0, scale, 0, yOffset);
    paper.clear();
    for (var i in polygons) {
      var p = polygons[i];
      var pathSpec = Raphael.mapPath(make_path_string(p.vertices), transform);
      p.path = paper.path(pathSpec);
      keyMod(p);
    }
  }

  var paper = this.paper = Raphael(parent[0], '100%', '100%', function() {
    var paper = this;
    function checkWidthAndDraw() {
      if (paper.canvas.width.baseVal.value === 0) {
        window.requestAnimationFrame(checkWidthAndDraw);
      }
      draw(paper);
    }
    // This should only ever request a single frame. We just have to break out
    // of the javascript computation loop to allow the div to render (and thus
    // receive actual size values), and that happens by the next animation frame.
    window.requestAnimationFrame(checkWidthAndDraw);
  });
};

}(document, $));
