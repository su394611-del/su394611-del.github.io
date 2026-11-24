(function () {
    var b = document.getElementById("copy-bibtex");
    if (!b || !navigator.clipboard) { if (b) b.hidden = true; return; }
    b.addEventListener("click", function () {
      navigator.clipboard.writeText(document.getElementById("bibtex").textContent).then(function () {
        b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy BibTeX"; }, 1800);
      });
    });
  })();
