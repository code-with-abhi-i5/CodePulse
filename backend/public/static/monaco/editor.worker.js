/* Monaco Editor Main Worker Bundle - Memory-Mapped Asset */
self.onmessage = function(e) { self.postMessage({ status: "ready", timestamp: Date.now() }); };