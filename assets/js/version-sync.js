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

  /* 仓库由页面声明：<html data-gh-repo="owner/name">，未声明则不做任何请求 */
  var REPO = document.documentElement.getAttribute("data-gh-repo") || "";
  if (!REPO) return;

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

  /* 选择一个 assets：优先 .apk，其次按 data-gh-asset 提示匹配，最后取第一个 */
  function pickAsset(rel, hint) {
    var assets = rel && Array.isArray(rel.assets) ? rel.assets : [];
    var i;
    for (i = 0; i < assets.length; i++) {
      if (/\.apk$/i.test(String(assets[i].name))) return assets[i];
    }
    if (hint) {
      for (i = 0; i < assets.length; i++) {
        if (String(assets[i].name).indexOf(hint) >= 0) return assets[i];
      }
    }
    return assets.length ? assets[0] : null;
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

  /* 与页面上的「下载最新版」按钮保持同一口径：releases/latest 指向的正式版。
     仓库还没发布过正式版时（接口 404），退回最新一条 release（可能是预发布）。 */
  function getLatestRelease() {
    return getJSON(API + "/releases/latest").catch(function () {
      return getJSON(API + "/releases?per_page=1").then(function (list) {
        return Array.isArray(list) && list[0] ? list[0] : null;
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

  function apply(rel, repo) {
    if (rel) {
      setText("version", rel.tag_name ? String(rel.tag_name) : "");
      setText("channel", rel.prerelease ? "（测试版）" : "（正式版）");
      setText("date", formatDate(rel.published_at));
      setHref("release-url", rel.html_url ? String(rel.html_url) : "");
      patchJsonLd(rel.tag_name ? String(rel.tag_name) : "");

      /* 体积 / 下载量可按 data-gh-asset 指定取哪一个安装包 */
      each("size", function (el) {
        var asset = pickAsset(rel, el.getAttribute("data-gh-asset"));
        if (asset) el.textContent = formatSize(asset.size);
      });

      each("downloads", function (el) {
        var asset = pickAsset(rel, el.getAttribute("data-gh-asset"));
        if (asset && typeof asset.download_count === "number") {
          el.textContent = String(asset.download_count);
        }
      });
    }

    if (repo) {
      setCount("stars", repo.stargazers_count);
      setCount("forks", repo.forks_count);
      setCount("issues", repo.open_issues_count);
    }
  }

  var cached = readCache();
  if (cached) { apply(cached.rel, cached.repo); return; }

  Promise.all([
    getLatestRelease().catch(function () { return null; }),
    getJSON(API).catch(function () { return null; })
  ]).then(function (res) {
    var rel = res[0];
    var repo = res[1];
    var payload = { rel: rel || null, repo: repo || null };
    writeCache(payload);
    apply(payload.rel, payload.repo);
  }).catch(function () { /* 保留静态文案 */ });
})();
