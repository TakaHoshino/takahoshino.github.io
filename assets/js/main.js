/* ============================================================================
   HOSHINO // PERSONAL ARCHIVE
   交互：配色切换、状态栏时钟、滚动进度、导航高亮、分层入场、数字跳变、
   复制邮箱、回到顶部。纯原生实现，无任何依赖。
   ============================================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------- 配色：NEGATIVE / POSITIVE */
  var themeToggle = document.getElementById("themeToggle");
  var themeLabel = document.getElementById("themeLabel");

  function currentTheme() {
    return root.getAttribute("data-theme") === "positive" ? "positive" : "negative";
  }

  function syncThemeLabel() {
    if (themeLabel) themeLabel.textContent = currentTheme().toUpperCase();
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "negative" ? "positive" : "negative";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* 忽略 */ }
      syncThemeLabel();
    });
  }
  syncThemeLabel();

  /* --------------------------------------------------------- 状态栏时钟 */
  var clock = document.getElementById("navClock");

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    if (!clock) return;
    var now = new Date();
    clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }

  if (clock) {
    tick();
    window.setInterval(tick, 1000);
  }

  /* ------------------------------------- 滚动进度 / 回到顶部 / 扫掠动效 */
  var progress = document.getElementById("navProgress");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (total > 0 ? Math.min(y / total, 1) * 100 : 0).toFixed(2) + "%";
    if (toTop) toTop.classList.toggle("is-visible", y > 640);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var fx = document.querySelector(".fx");
  if (fx && !reduceMotion) {
    fx.classList.add("is-running");
    window.setTimeout(function () { fx.classList.remove("is-running"); }, 1700);
  }

  /* --------------------------------------------------------- 导航高亮 */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = navLinks
    .map(function (link) {
      var href = link.getAttribute("href");
      return href && href.charAt(0) === "#" ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-42% 0px -50% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------- 分层入场（标题带遮罩揭示） */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".fx-in"));

  function showAll() {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;
          window.setTimeout(function () {
            entry.target.classList.add("is-visible");
          }, Math.min(index * 70, 210));
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* --------------------------------------------------------- 数字跳变 */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function animate(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;

    if (reduceMotion) { el.textContent = String(target); return; }

    var start = null;
    var duration = 800;
    el.textContent = "0";

    function step(timestamp) {
      if (start === null) start = timestamp;
      var p = Math.min((timestamp - start) / duration, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
    var counterObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animate(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { counterObs.observe(el); });
  }

  /* --------------------------------------------------------- 复制邮箱 */
  var copyBtn = document.getElementById("copyEmail");

  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      var label = copyBtn.querySelector(".copy-label");

      navigator.clipboard.writeText(email).then(
        function () {
          if (!label) return;
          copyBtn.classList.add("is-done");
          label.textContent = "已复制地址";
          window.setTimeout(function () {
            copyBtn.classList.remove("is-done");
            label.textContent = "复制地址";
          }, 1800);
        },
        function () { /* 失败时保留邮件按钮可用 */ }
      );
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  /* --------------------------------------------------------- 页脚年份 */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
