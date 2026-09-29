/* Juaren A. Balingit — Portfolio interactions */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  requestAnimationFrame(() => document.body.classList.add("is-loaded"));

  /* ------------------------------------------------------------------
     Modal details for each project, keyed by the card's data-project.
     Number, category, title and image are read from the card itself.
     ------------------------------------------------------------------ */
  const PROJECTS = {
    "residential-hvac": {
      overview: "A complete air-conditioning layout for a single-storey residence, showing duct routing from the air-handling unit to every habitable room.",
      objective: "Deliver even cooling to each room with the shortest practical duct runs, while keeping ducts concealed above ceilings and clear of structural members.",
      process: [
        "Reviewed the architectural floor plan and ceiling heights.",
        "Estimated room loads to size diffusers and branch ducts.",
        "Routed the main supply trunk along the central corridor.",
        "Placed diffusers and return grilles for balanced air distribution.",
        "Annotated duct sizes, airflow and equipment tags."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "HVAC floor plan"],
        ["Scale", "1:100"],
        ["System", "Ducted split / AHU"],
        ["Sheet", "M-101"]
      ],
      result: "A clear, installation-ready plan that lets the contractor price, fabricate and install ductwork with minimal clarification."
    },
    "commercial-duct": {
      overview: "Supply and return ductwork for an open-plan commercial floor, coordinated against the structural column grid.",
      objective: "Distribute conditioned air across a large floor plate with a single main trunk and zoned branches that can be balanced independently.",
      process: [
        "Set up the column grid and architectural background as xrefs.",
        "Laid out the main trunk and sized it for total airflow.",
        "Branched to terminal units serving each zone.",
        "Added return air path, dampers and access points.",
        "Checked clearances and issued the drawing for review."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "Ductwork layout"],
        ["Scale", "1:100"],
        ["Main trunk", "Rectangular, galvanised"],
        ["Sheet", "M-201"]
      ],
      result: "A coordinated duct layout with clear sizing and zoning, ready for shop drawings and installation."
    },
    "mechanical-floor-plan": {
      overview: "Equipment arrangement for a mechanical plant room, including chillers, circulating pumps and chilled-water supply and return headers.",
      objective: "Fit major equipment into the plant room while keeping service clearances, logical pipe routing and safe access for maintenance.",
      process: [
        "Collected equipment footprints and clearance requirements.",
        "Arranged chillers and pumps for short, clean pipe runs.",
        "Drew supply and return headers with valves and fittings.",
        "Tagged equipment and added a legend.",
        "Reviewed maintenance access around every unit."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "Plant room layout"],
        ["Scale", "1:50"],
        ["Equipment", "Chillers, CHW pumps"],
        ["Sheet", "M-301"]
      ],
      result: "An organised plant room plan that balances equipment density with safe, practical access for operations staff."
    },
    "plumbing-sanitary": {
      overview: "Cold water supply, soil and waste, and vent piping for a toilet block with water closets, lavatories and a shower.",
      objective: "Provide reliable water supply and code-compliant drainage with proper slopes, venting and cleanouts.",
      process: [
        "Located fixtures on the architectural plan.",
        "Routed soil and waste lines with required slope toward the stack.",
        "Added vent lines and cleanouts at changes of direction.",
        "Drew the cold water distribution to each fixture.",
        "Labelled pipe sizes and added a symbol legend."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "Plumbing layout"],
        ["Scale", "1:50"],
        ["Systems", "CW · Soil · Waste · Vent"],
        ["Sheet", "P-101"]
      ],
      result: "A readable plumbing plan with clearly separated systems that plumbers can follow directly on site."
    },
    "fire-protection": {
      overview: "Automatic sprinkler layout for a single floor, showing the riser, cross main, branch lines and head locations.",
      objective: "Achieve full sprinkler coverage with even head spacing while keeping pipe routing simple.",
      process: [
        "Established the hazard classification and maximum head spacing.",
        "Set a regular grid of sprinkler heads across the floor.",
        "Connected heads with branch lines from a cross main.",
        "Located the riser and control valve assembly.",
        "Annotated pipe sizes and head types."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "Sprinkler layout"],
        ["Scale", "1:100"],
        ["Layout", "Tree system"],
        ["Sheet", "FP-101"]
      ],
      result: "A clean, evenly spaced sprinkler layout that is easy to review for coverage and straightforward to install."
    },
    "machine-part": {
      overview: "A fully dimensioned manufacturing drawing of a bolted flange, with a front view and a sectioned side view.",
      objective: "Communicate every dimension and feature needed for a machinist to produce the part without additional questions.",
      process: [
        "Chose the views that best describe the part.",
        "Drew the front view with bolt circle and centre lines.",
        "Added a full section to show thickness and bore.",
        "Dimensioned diameters, bolt pattern and thicknesses.",
        "Completed the title block with material and scale."
      ],
      tools: ["AutoCAD"],
      specs: [
        ["Drawing type", "Detail / manufacturing"],
        ["Views", "Front + Section A–A"],
        ["Bolt pattern", "6 × Ø28 on PCD 220"],
        ["Units", "mm"]
      ],
      result: "A precise, standards-based detail drawing suitable for fabrication and inspection."
    },
    "mechanical-assembly": {
      overview: "An exploded assembly of a shaft, bearings, gear and housing covers, with numbered balloons and a bill of materials.",
      objective: "Show how the components fit together and in what order, so the assembly can be built and maintained correctly.",
      process: [
        "Modeled or drew each component individually.",
        "Arranged parts along the shaft axis in assembly order.",
        "Added balloons linking each part to the parts list.",
        "Created the bill of materials with quantities.",
        "Reviewed fits and assembly sequence."
      ],
      tools: ["AutoCAD", "Autodesk Inventor"],
      specs: [
        ["Drawing type", "Exploded assembly"],
        ["Components", "6 parts"],
        ["Includes", "Balloons + BOM"],
        ["Sheet", "A-001"]
      ],
      result: "An assembly drawing that makes the build sequence obvious at a glance."
    },
    "3d-model": {
      overview: "A parametric solid model of a machined mounting block, used to check proportions and generate 2D drawing views.",
      objective: "Create an accurate 3D model that can be revised quickly and used as the single source for manufacturing drawings.",
      process: [
        "Sketched the base profile with driving dimensions.",
        "Extruded the block and added the bored feature.",
        "Applied edge treatments and checked proportions.",
        "Generated isometric and orthographic views.",
        "Exported views for documentation."
      ],
      tools: ["Autodesk Inventor", "SketchUp"],
      specs: [
        ["Model type", "Parametric solid"],
        ["Overall size", "200 × 140 × 80 mm"],
        ["Feature", "Ø80 through bore"],
        ["Output", "Isometric + 2D views"]
      ],
      result: "A clean, editable model that speeds up design changes and keeps drawings consistent with the design."
    }
  };

  /* ------------------------------------------------------------------
     Hero video: fall back to the static blueprint image if unavailable,
     and pause it for visitors who prefer reduced motion.
     ------------------------------------------------------------------ */
  const hero = $(".hero");
  const video = $("#hero-video");
  const useFallback = () => hero.classList.add("no-video");
  $("source", video).addEventListener("error", useFallback);
  video.addEventListener("error", useFallback);

  const playVideo = () => video.play().catch(() => {}); // autoplay may be blocked; poster stays visible
  const applyMotionPref = () => {
    if (reduceMotion.matches) {
      video.pause();
      video.removeAttribute("autoplay");
    } else {
      playVideo();
    }
  };
  applyMotionPref();
  reduceMotion.addEventListener("change", applyMotionPref);

  // Pause when hero is off-screen to save battery / CPU.
  new IntersectionObserver(([entry]) => {
    if (reduceMotion.matches || hero.classList.contains("no-video")) return;
    if (entry.isIntersecting) playVideo();
    else video.pause();
  }, { threshold: 0.05 }).observe(hero);

  /* ------------------------------------------------------------------
     Navigation: scrolled state, mobile menu, active link
     ------------------------------------------------------------------ */
  const nav = $("#nav");
  const toggle = $("#nav-toggle");
  const menu = $("#nav-menu");
  const toTop = $("#to-top");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    toTop.classList.toggle("is-visible", y > window.innerHeight * 0.9);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) nav.classList.add("is-scrolled");
    else onScroll();
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    $(".nav__logo").focus({ preventScroll: true });
  });

  const links = $$(".nav__link");
  const visible = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => visible.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0));
    let best = null, bestRatio = 0;
    visible.forEach((ratio, id) => { if (ratio > bestRatio) { best = id; bestRatio = ratio; } });
    links.forEach((l) => {
      const active = l.getAttribute("href") === `#${best}`;
      l.classList.toggle("is-active", active);
      active ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current");
    });
  }, { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.01, 0.25, 0.5, 1] });
  links.forEach((l) => spy.observe($(l.getAttribute("href"))));

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  const reveals = $$(".reveal");
  // Stagger siblings slightly (grid cards, skill groups)
  $$(".work__grid, .skills__grid").forEach((group) => {
    Array.from(group.children).forEach((el, i) => el.style.setProperty("--reveal-delay", `${(i % 2) * 90}ms`));
  });
  if (reduceMotion.matches) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Skills: hover shows details on pointer devices; click/tap/Enter toggles
     ------------------------------------------------------------------ */
  $$(".skill").forEach((skill, i) => {
    const btn = $(".skill__btn", skill);
    const info = $(".skill__info", skill);
    info.id = `skill-info-${i}`;
    btn.setAttribute("aria-controls", info.id);
    btn.addEventListener("click", () => {
      const open = skill.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ------------------------------------------------------------------
     Project modal
     ------------------------------------------------------------------ */
  const modal = $("#project-modal");
  const modalImg = $("#modal-img");
  let lastTrigger = null;

  const el = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });

  const fill = (p, card) => {
    const img = $("img", card);
    modalImg.src = img.getAttribute("src");
    modalImg.alt = img.alt;
    $("#modal-num").textContent = $(".card__num", card).textContent;
    $("#modal-cat").textContent = $(".card__cat", card).textContent;
    $("#modal-title").textContent = $(".card__title", card).textContent;
    $("#modal-overview").textContent = p.overview;
    $("#modal-objective").textContent = p.objective;
    $("#modal-result").textContent = p.result;
    $("#modal-process").replaceChildren(...p.process.map((t) => el("li", t)));
    $("#modal-tools").replaceChildren(...p.tools.map((t) => el("li", t)));
    $("#modal-specs").replaceChildren(...p.specs.map(([k, v]) => {
      const row = document.createElement("div");
      row.append(el("dt", k), el("dd", v));
      return row;
    }));
  };

  const openModal = (btn) => {
    const p = PROJECTS[btn.dataset.project];
    if (!p) return;
    fill(p, btn);
    lastTrigger = btn;
    modal.showModal();
    $(".modal__inner", modal).scrollTop = 0;
    document.body.classList.add("modal-open");
    $(".modal__close", modal).focus();
  };

  const closeModal = () => {
    if (!modal.open || modal.classList.contains("is-closing")) return;
    const finish = () => {
      modal.classList.remove("is-closing");
      modal.close();
    };
    if (reduceMotion.matches) return finish();
    modal.classList.add("is-closing");
    modal.addEventListener("animationend", finish, { once: true });
    setTimeout(() => modal.classList.contains("is-closing") && finish(), 300); // safety net
  };

  $$("[data-project]").forEach((btn) => btn.addEventListener("click", () => openModal(btn)));
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) closeModal();
  });
  modal.addEventListener("cancel", (e) => { e.preventDefault(); closeModal(); });
  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastTrigger?.focus();
  });

  /* ------------------------------------------------------------------
     Contact form: validation + submission
     ------------------------------------------------------------------ */
  const CONTACT_EMAIL = "506balingit@gmail.com";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const form = $("#contact-form");
  const status = $("#form-status");
  const submit = $(".form__submit", form);
  const submitLabel = $(".form__submit-label", form);

  const rules = {
    name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
    email: (v) => (!v.trim() ? "Please enter your email address."
                  : !EMAIL_RE.test(v.trim()) ? "Please enter a valid email address, e.g. name@example.com." : ""),
    message: (v) => (v.trim().length < 10 ? "Please write a message of at least 10 characters." : "")
  };

  const validateField = (input) => {
    const msg = rules[input.name](input.value);
    const field = input.closest(".field");
    $(".field__error", field).textContent = msg;
    field.classList.toggle("has-error", !!msg);
    field.classList.toggle("is-valid", !msg);
    input.setAttribute("aria-invalid", String(!!msg));
    return !msg;
  };

  const inputs = $$(".field input, .field textarea", form); // skips the _gotcha spam trap
  inputs.forEach((input) => {
    input.addEventListener("blur", () => { if (input.value) validateField(input); });
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) validateField(input);
    });
  });

  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = `form__status${type ? ` is-${type}` : ""}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    const results = inputs.map(validateField);
    if (results.includes(false)) {
      setStatus("Please fix the highlighted fields.", "error");
      inputs[results.indexOf(false)].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.endpoint;

    submit.disabled = true;
    submitLabel.textContent = "Sending…";

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...data, _subject: `Portfolio enquiry from ${data.name}` })
        });
        if (!res.ok) {
          // Formspree explains rejections as { errors: [{ message }] }
          const body = await res.json().catch(() => ({}));
          const reason = body.errors?.map((er) => er.message).join(" ");
          throw new Error(reason || `HTTP ${res.status}`);
        }
        setStatus("Thank you — your message has been sent. I’ll get back to you soon.", "success");
      } else {
        // No backend configured: hand off to the visitor's email app.
        const subject = encodeURIComponent(`Portfolio enquiry from ${data.name}`);
        const body = encodeURIComponent(`${data.message}\n\n— ${data.name}\n${data.email}`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        setStatus(`Your email app should now open with the message ready to send. If it doesn’t, email ${CONTACT_EMAIL} directly.`, "success");
      }
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("is-valid", "has-error"));
      inputs.forEach((i) => i.removeAttribute("aria-invalid"));
    } catch (err) {
      const reason = err.message.startsWith("HTTP") || err instanceof TypeError ? "" : ` (${err.message})`;
      setStatus(`Sorry, your message couldn’t be sent${reason}. Please try again or email ${CONTACT_EMAIL}.`, "error");
    } finally {
      submit.disabled = false;
      submitLabel.textContent = "Send message";
    }
  });
})();
