// Project sites that moved when their GitHub repository was renamed.
  // GitHub redirects the repository itself, but not its GitHub Pages URL,
  // so old links land here and are forwarded (path, query and #anchor kept).
  (function () {
    var moves = {
      "/mixtral-healthcare-llm-from-scratch": "/MedSparse-Healthcare-LLM-From-Scratch",
      "/mutli-agents-using-langgraph": "/Multi-agents-using-LangGraph"
    };
    var path = window.location.pathname;
    var lower = path.toLowerCase();
    for (var old in moves) {
      if (lower === old || lower.indexOf(old + "/") === 0) {
        window.location.replace(moves[old] + path.slice(old.length) + window.location.search + window.location.hash);
        return;
      }
    }
  })();
