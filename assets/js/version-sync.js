/* ============================================================================
   HOSHINO // PROJECT DATA SYNC
   ----------------------------------------------------------------------------
   项目详情页上的版本号 / 发布时间 / 安装包体积 / 下载量 / 星标数，改为读取
   GitHub 仓库的实时数据：只作用于带 data-gh 锚点的元素。

   原则：任何一步失败（断网、限流、浏览器不支持 fetch）都静默放弃，
   页面保留 HTML 里的静态文案；结果按会话缓存 10 分钟，避免重复请求。
   ============================================================================ */
(function () {
  "use strict";

  var REPO = "TakaHoshino/Wenku8Reader";
  var API = "https://api.github.com/repos/" + REPO;
  var CACHE_KEY = "gh-data:" + REPO;
  var CACHE_TTL = 10 * 60 * 1000;   /* 10 分钟 */
  var TIMEOUT = 8000;

  var nodes = document.querySelectorAll("[data-gh]");
  if (!nodes.length) return;        /* 非项目页（例如首页）：不发起任何请求 */

  function each(name, fn) {
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.getAttribute("data-gh") === name) fn(el);
    });
  }

  function setText(name, text) {
    if (!text) return;
    each(name, function (el) { el.textContent = text; });
  }

  function setHref(name, url) {
    if (!url) return;
    each(name, function (el) { if (el.tagName === "A") el.href = url; });
  }

  function setCount(name, value) {
    if (typeof value !== "number" || !isFinite(value)) return;
    each(name, function (el) {
      el.setAttribute("data-count", String(value));
      el.textContent = String(value);
      /* 主页脚本的数字跳变动画可能仍在进行，结束后再落一次最终值 */
      window.setTimeout(function () { el.textContent = String(value); }, 1200);
    });
  }

  function formatDate(iso) {
    return typeof iso === "string" && /^\d{4}-\d{2}-\d{2}/.test(iso)
      ? iso.slice(0, 10).replace(/-/g, ".")
      : "";
  }

  function formatSize(bytes) {
    return typeof bytes === "number" && bytes > 0
      ? (bytes / 1000000).toFixed(1) + " MB"
      : "";
  }

  function getJSON(url) {
    return new Promise(function (resolve, reject) {
      if (typeof window.fetch !== "function") { reject(new Error("no fetch")); return; }
      var timer = window.setTimeout(function () { reject(new Error("timeout")); }, TIMEOUT);

      window.fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
        referrerPolicy: "no-referrer"
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      }).then(function (json) {
        window.clearTimeout(timer);
        resolve(json);
      }, function (err) {
        window.clearTimeout(timer);
        reject(err);
      });
    });
  }

  function readCache() {
    try {
      var raw = window.sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved.at !== "number" || Date.now() - saved.at > CACHE_TTL) return null;
      return saved.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* 隐私模式：忽略 */ }
  }

  /* 结构化数据里的软件版本一并跟上 */
  function patchJsonLd(version) {
    if (!version) return;
    var el = document.querySelector('script[type="application/ld+json"]');
    if (!el) return;
    try {
      var json = JSON.parse(el.textContent);
      json.softwareVersion = version;
      el.textContent = JSON.stringify(json, null, 2);
    } catch (e) { /* 保持原样 */ }
  }

  function apply(data) {
    if (!data) return;
    setText("version", data.version);
    setText("date", data.date);
    setText("size", data.size);
    setText("downloads", typeof data.downloads === "number" ? String(data.downloads) : "");
    setCount("stars", data.stars);
    setCount("forks", data.forks);
    setCount("issues", data.issues);
    setHref("release-url", data.url);
    patchJsonLd(data.version);
  }

  var cached = readCache();
  if (cached) { apply(cached); return; }

  Promise.all([
    getJSON(API + "/releases?per_page=1").catch(function () { return null; }),
    getJSON(API).catch(function () { return null; })
  ]).then(function (res) {
    var releases = res[0];
    var repo = res[1];
    var rel = Array.isArray(releases) && releases[0] ? releases[0] : null;

    var apk = null;
    if (rel && Array.isArray(rel.assets)) {
      for (var i = 0; i < rel.assets.length; i++) {
        if (/\.apk$/i.test(String(rel.assets[i].name))) { apk = rel.assets[i]; break; }
      }
      if (!apk && rel.assets.length) apk = rel.assets[0];
    }

    var data = {
      version: rel && rel.tag_name ? String(rel.tag_name) : "",
      date: rel ? formatDate(rel.published_at) : "",
      size: apk ? formatSize(apk.size) : "",
      downloads: apk && typeof apk.download_count === "number" ? apk.download_count : null,
      url: rel && rel.html_url ? String(rel.html_url) : "",
      stars: repo && typeof repo.stargazers_count === "number" ? repo.stargazers_count : null,
      forks: repo && typeof repo.forks_count === "number" ? repo.forks_count : null,
      issues: repo && typeof repo.open_issues_count === "number" ? repo.open_issues_count : null
    };

    writeCache(data);
    apply(data);
  }).catch(function () { /* 保留静态文案 */ });
})();
