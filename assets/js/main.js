/* ============================================================================
   HOSHINO // PERSONAL ARCHIVE
   交互脚本：主题切换、HUD 时钟、滚动进度、导航高亮、入场动画、数字滚动、
   复制邮箱、回到顶部。无任何第三方依赖。
   ============================================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------- 主题：NEGATIVE / POSITIVE */
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

  /* ------------------------------------------------------------ HUD 时钟 */
  var clock = document.getElementById("hudClock");

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function tick() {
    if (!clock) return;
    var now = new Date();
    clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }

  if (clock) {
    tick();
    window.setInterval(tick, 1000);
  }

  /* ------------------------------------------- 滚动进度 / 页头 / 回到顶部 */
  var hudProgress = document.getElementById("hudProgress");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var scrolled = window.scrollY || window.pageYOffset;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = total > 0 ? Math.min(scrolled / total, 1) : 0;

    if (hudProgress) hudProgress.style.width = (ratio * 100).toFixed(2) + "%";
    if (toTop) toTop.classList.toggle("is-visible", scrolled > 620);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* --------------------------------------------------- 载入时的扫掠动效 */
  var fx = document.querySelector(".fx");
  if (fx && !prefersReducedMotion) {
    fx.classList.add("is-running");
    window.setTimeout(function () { fx.classList.remove("is-running"); }, 1600);
  }

  /* ------------------------------------------------------- 导航滚动高亮 */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".hud-link"));
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
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* --------------------------------------------------------- 入场动画 */
  var fxItems = Array.prototype.slice.call(document.querySelectorAll(".fx-in"));

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    fxItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;
          window.setTimeout(function () {
            entry.target.classList.add("is-visible");
          }, Math.min(index * 70, 210));
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    fxItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --------------------------------------------------------- 数字滚动 */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function animateNumber(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;

    var isYear = target > 1900;
    el.textContent = isYear ? String(target) : "0";
    if (isYear) return;

    var duration = 850;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if (counters.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateNumber(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { counterObserver.observe(el); });
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
          label.textContent = "已复制";
          window.setTimeout(function () {
            copyBtn.classList.remove("is-done");
            label.textContent = "复制邮箱";
          }, 1800);
        },
        function () { /* 复制失败时保留邮件按钮 */ }
      );
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  /* --------------------------------------------------------- 页脚年份 */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
