Heap = {};

Heap.heapify = function(heap) {
  heap.sort(function(a,b){return a[0]-b[0];});
  return heap;
};

// Pushes the key and value onto the heap.
Heap.push = function(heap, key, value) {
  var last = heap.length;
  heap[last] = [key, value];  // faster push in some cases
  var bubble_up = function(idx) {
    if (idx <= 0) return;
    var idx2 = Math.floor((idx + 1) / 2) - 1;
    if (heap[idx2][0] > heap[idx][0]) {
      var tmp = heap[idx2];
      heap[idx2] = heap[idx];
      heap[idx] = tmp;
      bubble_up(idx2);
    }
  };
  bubble_up(last);
  return value;
};

// Returns the key and value at the top of the heap.
Heap.pop = function(heap) {
  if (heap.length == 0) {
    throw "Can't pop an empty heap";
  }
  var elem = heap[0];
  var len = heap.length-1;
  heap[0] = heap[len];
  heap.length = len;  // fast pop
  var bubble_down = function(idx) {
    var idx2 = (idx + 1) * 2 - 1;
    if (idx2 >= len) return;
    if (idx2+1 < len && heap[idx2][0] > heap[idx2+1][0]) idx2++;
    if (heap[idx][0] > heap[idx2][0]) {
      var tmp = heap[idx2];
      heap[idx2] = heap[idx];
      heap[idx] = tmp;
      bubble_down(idx2);
    }
  };
  bubble_down(0);
  return elem;
};
