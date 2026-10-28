/* Hot Ice Jewels · store behaviour. No framework: every page is static HTML and this file wires it up. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MN = { Y: "Yellow gold", W: "White gold", R: "Rose gold" };
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- bag (kept in this browser until checkout exists) ---------- */
  const KEY = "hij-bag";
  const readBag = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const writeBag = (b) => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {} paintCount(); };
  function paintCount() {
    const n = readBag().reduce((a, l) => a + l.qty, 0);
    $$("[data-bag-count]").forEach((el) => { el.textContent = n; el.dataset.n = n; });
  }
  paintCount();

  /* ---------- header: shrink after the first scroll, publish its height for sticky bars ---------- */
  const hdr = $(".hdr");
  if (hdr) {
    const setH = () => document.documentElement.style.setProperty("--hdr-h", hdr.offsetHeight + "px");
    let on = false;
    const check = () => { const c = scrollY > 60; if (c !== on) { on = c; hdr.classList.toggle("compact", c); setTimeout(setH, 380); } };
    addEventListener("scroll", check, { passive: true }); addEventListener("resize", setH); check(); setH();
  }

  /* ---------- toast ---------- */
  const toast = $("#toast"); let tt;
  function say(html) {
    if (!toast) return;
    toast.innerHTML = html; toast.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 3800);
  }

  /* ---------- mobile drawer ---------- */
  const drawer = $("#drawer");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    $("#burger")?.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $(".drawer__close", drawer)?.focus();
  }
  $("#burger")?.addEventListener("click", () => setDrawer(true));
  drawer?.addEventListener("click", (e) => { if (e.target.closest(".drawer__scrim,.drawer__close,a")) setDrawer(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });

  /* ---------- 360 spin: a turntable render, scrubbed by dragging ---------- */
  function spin(el) {
    const v = $("video", el); if (!v) return null;
    let dragging = false, x0 = 0, t0 = 0, resume;
    const play = () => { if (!still) v.play().catch(() => {}); };
    v.muted = true; v.playsInline = true;
    if (!still) { v.autoplay = true; v.loop = true; }
    const start = (e) => {
      if (!v.duration) return;
      dragging = true; x0 = e.clientX; t0 = v.currentTime; v.pause(); clearTimeout(resume);
      el.classList.add("dragging", "touched"); el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      const d = v.duration, dx = (e.clientX - x0) / el.clientWidth; // one width = one full turn
      v.currentTime = ((t0 - dx * d) % d + d) % d;
    };
    const end = () => {
      if (!dragging) return;
      dragging = false; el.classList.remove("dragging");
      resume = setTimeout(play, 2600);
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("keydown", (e) => {
      if (!v.duration || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); v.pause(); el.classList.add("touched");
      v.currentTime = (v.currentTime + (e.key === "ArrowLeft" ? 0.4 : -0.4) + v.duration) % v.duration;
    });
    return {
      setMetal(m) {
        const frac = v.duration ? v.currentTime / v.duration : 0;
        v.poster = el.dataset.base + m + "-4.webp";
        v.src = el.dataset.base + m + "-spin.mp4";
        v.addEventListener("loadedmetadata", () => { v.currentTime = frac * v.duration; if (!dragging) play(); }, { once: true });
      },
      play, pause: () => v.pause(),
    };
  }
  const spins = new Map();
  $$(".spin[data-base]").forEach((el) => spins.set(el, spin(el)));

  /* metal buttons tied to one spin (home hero, 360 band) */
  $$("[data-metals-for]").forEach((g) => {
    const target = document.getElementById(g.dataset.metalsFor);
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-m]"); if (!b) return;
      $$("button", g).forEach((x) => x.setAttribute("aria-pressed", x === b));
      spins.get(target)?.setMetal(b.dataset.m);
      const cap = document.querySelector(`[data-metal-cap="${g.dataset.metalsFor}"]`);
      if (cap) cap.textContent = MN[b.dataset.m];
    });
  });

  /* ---------- product cards: swatches swap both photos ---------- */
  function setCardMetal(card, m) {
    const base = card.dataset.base;
    $(".main", card).src = base + m + "-card-1.webp";
    $(".alt", card).src = base + m + "-card-2.webp";
    $(".main", card).alt = `${card.dataset.name} in ${MN[m].toLowerCase()}`;
    $$(".sw button", card).forEach((x) => x.setAttribute("aria-pressed", x.dataset.m === m));
    const a = $(".card__media", card), n = $(".card__name", card);
    [a, n].forEach((l) => l && (l.href = l.href.split("?")[0] + (m === "Y" ? "" : "?metal=" + m)));
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".card .sw button"); if (!b) return;
    setCardMetal(b.closest(".card"), b.dataset.m);
  });

  /* ---------- rails ---------- */
  $$("[data-rail]").forEach((nav) => {
    const rail = document.getElementById(nav.dataset.rail);
    nav.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      rail.scrollBy({ left: (b.dataset.dir === "next" ? 1 : -1) * rail.clientWidth * 0.8, behavior: still ? "auto" : "smooth" });
    });
  });

  /* ---------- collection: style, metal, sort ---------- */
  const grid = $("#grid");
  if (grid) {
    const q = new URLSearchParams(location.search);
    let style = q.get("style") || "all", metal = q.get("metal") || "Y", sort = q.get("sort") || "featured", shape = q.get("shape") || "all";
    if (!MN[metal]) metal = "Y";
    const cards = $$(".card", grid);
    cards.forEach((c, i) => (c.dataset.i = i));
    function apply() {
      let shown = 0;
      const list = [...cards].sort((a, b) => sort === "az" ? a.dataset.name.localeCompare(b.dataset.name) : sort === "za" ? b.dataset.name.localeCompare(a.dataset.name) : a.dataset.i - b.dataset.i);
      list.forEach((c) => { grid.appendChild(c); const on = (style === "all" || c.dataset.style === style) && (shape === "all" || c.dataset.shapes.split(" ").includes(shape)); c.hidden = !on; if (on) shown++; setCardMetal(c, metal); });
      $("#noresult").hidden = shown > 0;
      $("#shape").value = shape;
      $$("[data-style]", $("#styles")).forEach((b) => b.setAttribute("aria-pressed", b.dataset.style === style));
      $$("button", $("#metal-filter")).forEach((b) => b.setAttribute("aria-pressed", b.dataset.m === metal));
      $("#sort").value = sort;
      $("#count").textContent = `${shown} ${shown === 1 ? "piece" : "pieces"}`;
      const p = new URLSearchParams();
      if (style !== "all") p.set("style", style);
      if (metal !== "Y") p.set("metal", metal);
      if (sort !== "featured") p.set("sort", sort);
      if (shape !== "all") p.set("shape", shape);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    }
    $("#styles").addEventListener("click", (e) => { const b = e.target.closest("[data-style]"); if (b) { style = b.dataset.style; apply(); } });
    $("#metal-filter").addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (b) { metal = b.dataset.m; apply(); } });
    $("#sort").addEventListener("change", (e) => { sort = e.target.value; apply(); });
    $("#shape").addEventListener("change", (e) => { shape = e.target.value; apply(); });
    $("#noresult button")?.addEventListener("click", () => { style = "all"; shape = "all"; apply(); });
    apply();
  }

  /* ---------- product page ---------- */
  const buy = $("#buy");
  if (buy) {
    const P = JSON.parse($("#product-data").textContent);
    const stage = $("#stage"), photo = $("#photo"), spinEl = $("#spin");
    let metal = new URLSearchParams(location.search).get("metal");
    if (!MN[metal]) metal = "Y";
    let karat = "14k", view = "360";
    function paint() {
      $$("#metal button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.m === metal));
      $$("#karat button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === karat));
      $("#metal-name").textContent = MN[metal];
      $("#karat-name").textContent = karat === "14k" ? "58.5% gold" : "75% gold";
      $$("#thumbs img[data-v]").forEach((img) => (img.src = P.base + metal + "-" + img.dataset.v + ".webp"));
      $$("#thumbs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === view));
      const is360 = view === "360";
      spinEl.hidden = !is360; photo.hidden = is360;
      if (!is360) { photo.src = P.base + metal + "-" + view + ".webp"; photo.alt = `${P.name}, view ${view}, ${MN[metal].toLowerCase()}`; spins.get(spinEl)?.pause(); }
      else spins.get(spinEl)?.play();
    }
    $("#metal").addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b || b.dataset.m === metal) return;
      metal = b.dataset.m; spins.get(spinEl)?.setMetal(metal); paint();
      history.replaceState(null, "", location.pathname + (metal === "Y" ? "" : "?metal=" + metal));
    });
    $("#karat").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) { karat = b.dataset.k; paint(); } });
    $("#thumbs").addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) { view = b.dataset.view; paint(); } });
    if (metal !== "Y") spins.get(spinEl)?.setMetal(metal);
    paint();
    const sizeEl = $("#size");
    sizeEl?.addEventListener("change", () => sizeEl.classList.remove("need"));
    $("#add").addEventListener("click", () => {
      const size = sizeEl ? sizeEl.value : "";
      if (P.ring && !size) { sizeEl.classList.add("need"); sizeEl.focus(); say(`Choose your ring size first. <a href="/ring-size">Find your size</a>`); return; }
      const bag = readBag();
      const hit = bag.find((l) => l.slug === P.slug && l.metal === metal && l.karat === karat && (l.size || "") === size);
      hit ? hit.qty++ : bag.push({ slug: P.slug, metal, karat, size, qty: 1 });
      writeBag(bag);
      say(`Added ${P.name}, ${karat} ${MN[metal].toLowerCase()}${size ? ", size " + size : ""}. <a href="/bag">View bag</a>`);
    });
  }

  /* ---------- bag page ---------- */
  const bagEl = $("#bag");
  if (bagEl) {
    const C = JSON.parse($("#catalog").textContent);
    function render() {
      const bag = readBag().filter((l) => C[l.slug]);
      const n = bag.reduce((a, l) => a + l.qty, 0);
      $("#bag-n").textContent = n;
      if (!bag.length) {
        bagEl.innerHTML = `<div class="empty"><p>Your bag is empty.</p><a class="btn btn--solid" href="/rings">Discover rings</a></div>`;
        return;
      }
      bagEl.innerHTML = bag.map((l, i) => {
        const p = C[l.slug];
        return `<article class="line">
          <a class="ph" href="${p.url}?metal=${l.metal}"><img src="${p.base}${l.metal}-card-1.webp" alt="${p.name}" width="560" height="560" loading="lazy"></a>
          <div>
            <h3><a href="${p.url}?metal=${l.metal}">${p.name}</a></h3>
            <p class="line__opts"><span class="dot dot--${l.metal}"></span>${l.karat} ${MN[l.metal].toLowerCase()}${l.size ? " · size " + l.size : ""} · <span>${p.code}</span></p>
            <div class="qty" role="group" aria-label="Quantity for ${p.name}">
              <button type="button" data-i="${i}" data-d="-1" aria-label="One fewer">−</button><output aria-live="polite">${l.qty}</output><button type="button" data-i="${i}" data-d="1" aria-label="One more">+</button>
            </div>
          </div>
          <div class="line__side"><button class="line__rm" type="button" data-rm="${i}">Remove</button></div>
        </article>`;
      }).join("");
    }
    bagEl.addEventListener("click", (e) => {
      const bag = readBag().filter((l) => C[l.slug]);
      const q = e.target.closest("[data-d]"), rm = e.target.closest("[data-rm]");
      if (q) { const l = bag[+q.dataset.i]; l.qty = Math.max(0, Math.min(9, l.qty + +q.dataset.d)); }
      if (rm) bag[+rm.dataset.rm].qty = 0;
      if (q || rm) { writeBag(bag.filter((l) => l.qty > 0)); render(); }
    });
    render();
  }
})();
