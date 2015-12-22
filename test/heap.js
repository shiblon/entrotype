Heap = {};

Heap.heapify = function(heap) {
  heap.sort(function(a,b){return a[0]-b[0];});
  return heap;
};

Heap._bubble_up = function(heap, idx) {
  if (idx <= 0) return;
  var idx2 = Math.floor((idx + 1) / 2) - 1;
  if (heap[idx2][0] > heap[idx][0]) {
    var tmp = heap[idx2];
    heap[idx2] = heap[idx];
    heap[idx] = tmp;
    Heap._bubble_up(heap, idx2);
  }
};

// Pushes the key and value onto the heap.
Heap.push = function(heap, key, value) {
  var last = heap.length;
  heap[last] = [key, value];  // faster push in some cases
  Heap._bubble_up(heap, last);
  return value;
};

Heap._bubble_down = function(heap, idx) {
  var idx2 = (idx + 1) * 2 - 1;
  var len = heap.length - 1;
  if (idx2 >= len) return;
  if (idx2+1 < len && heap[idx2][0] > heap[idx2+1][0]) idx2++;
  if (heap[idx][0] > heap[idx2][0]) {
    var tmp = heap[idx2];
    heap[idx2] = heap[idx];
    heap[idx] = tmp;
    Heap._bubble_down(heap, idx2);
  }
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
  Heap._bubble_down(heap, 0);
  return elem;
};
