"use strict";

const element = (id) => document.getElementById(id);

function text(id, value) {
  element(id).textContent = value || "";
}

function safeURL(value, allowEmail = false) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, document.baseURI);
    const allowed = allowEmail
      ? ["http:", "https:", "mailto:"]
      : ["http:", "https:"];

    return allowed.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function externalLink(label, value) {
  const href = safeURL(value);
  if (!href) return null;

  const link = document.createElement("a");
  link.textContent = `${label} ↗`;
  link.href = href;

  if (new URL(href).origin !== location.origin) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  return link;
}

function youtubeID(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/")[1];
      return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
    }

    if (
      ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
    ) {
      const parts = url.pathname.split("/");
      const id = url.searchParams.get("v") ||
        (["embed", "shorts"].includes(parts[1]) ? parts[2] : null);

      return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

function renderShowreel(showreel) {
  const section = element("showreel");
  const container = element("showreel-player");
  const url = safeURL(showreel?.url);

  if (!showreel?.enabled || !url) {
    section.hidden = true;
    document.querySelectorAll('nav a[href="#showreel"]').forEach(link => { link.hidden = true; });
    return;
  }

  text("showreel-title", showreel.title);
  text("showreel-description", showreel.description);
  container.replaceChildren();

  const id = youtubeID(url);

  if (id) {
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${id}`;
    frame.title = showreel.title || "Portfolio showreel";
    frame.loading = "lazy";
    frame.allow = "fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    container.append(frame);
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    container.append(video);
  }

  section.hidden = false;
}

function renderProjectMedia(project) {
  const container = document.createElement("div");
  container.className = "project-media";

  const placeholder = document.createElement("span");
  placeholder.className = "media-placeholder";
  placeholder.textContent = project.title || "Project";
  container.append(placeholder);

  const imageURL = safeURL(project.image);
  const videoURL = safeURL(project.video);

  if (project.thumbnailType === "video" && videoURL) {
    const video = document.createElement("video");
    video.src = videoURL;
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute(
      "aria-label",
      project.thumbnailAlt || `${project.title} demonstration`
    );

    if (imageURL) video.poster = imageURL;

    video.addEventListener("error", () => video.remove(), { once: true });
    placeholder.hidden = true;
    video.addEventListener("error", () => {
      placeholder.hidden = false;
    }, { once: true });

    container.append(video);
  } else if (imageURL) {
    const image = document.createElement("img");
    image.src = imageURL;
    image.alt = project.thumbnailAlt || project.title || "";
    image.loading = "lazy";
    image.width = 960;
    image.height = 600;

    image.addEventListener("load", () => {
      placeholder.hidden = true;
    });

    image.addEventListener("error", () => {
      image.remove();
      placeholder.hidden = false;
    }, { once: true });

    container.append(image);
  }

  return container;
}

function projectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";

  const content = document.createElement("div");
  content.className = "project-content";

  const meta = document.createElement("div");
  meta.className = "project-meta";

  const category = document.createElement("span");
  category.textContent = project.category || "Project";

  const status = document.createElement("span");
  status.textContent = project.status || "";

  meta.append(category, status);

  const title = document.createElement("h3");
  title.textContent = project.title || "Untitled project";

  const description = document.createElement("p");
  description.className = "project-description";
  description.textContent = project.description || "";

  content.append(meta, title, description);

  if (project.contribution) {
    const contribution = document.createElement("p");
    contribution.className = "project-contribution";

    const label = document.createElement("strong");
    label.textContent = "My contribution: ";

    contribution.append(
      label,
      document.createTextNode(project.contribution)
    );

    content.append(contribution);
  }

  const links = document.createElement("div");
  links.className = "project-links";

  [
    externalLink(project.moreLabel || "View more", project.moreUrl),
    externalLink("GitHub", project.repositoryUrl),
    externalLink("Watch demo", project.demoUrl)
  ].filter(Boolean).forEach((link) => links.append(link));

  content.append(links);
  card.append(renderProjectMedia(project), content);

  return card;
}

function renderProjects(projects) {
  const grid = element("project-grid");
  const filters = element("filters");
  const status = element("project-status");

  const published = projects
    .filter((project) => project && project.published !== false);

  const categories = [
    "All",
    ...new Set(
      published.map((project) => project.category).filter(Boolean)
    )
  ];

  function display(category) {
    const selected = category === "All"
      ? published
      : published.filter((project) => project.category === category);

    grid.replaceChildren(...selected.map(projectCard));
    status.hidden = selected.length > 0;
    status.textContent = selected.length ? "" : "No projects to display.";

    filters.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.textContent === category)
      );
    });
  }

  filters.replaceChildren();

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter";
    button.textContent = category;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => display(category));
    filters.append(button);
  });

  filters.hidden = categories.length < 3;
  display("All");
}

function renderSite(data) {
  const profile = data.profile || {};
  const appearance = data.appearance || {};
  const contact = data.contact || {};

  document.title = data.pageTitle || `${profile.name || "Portfolio"}`;
  document.querySelector('meta[name="description"]').content =
    data.metaDescription || "";

  const accents = {
    pink: "#ff4793",
    rose: "#ff7aa8",
    white: "#f5f3f4"
  };

  document.documentElement.style.setProperty(
    "--accent",
    accents[appearance.accent] || accents.pink
  );

  document.body.dataset.layout =
    appearance.layout === "single" ? "single" : "grid";

  text("header-name", profile.name);
  text("hero-label", profile.role);
  text("hero-title", profile.headline);
  text("hero-description", profile.introduction);
  text("hero-meta", [profile.location, profile.availability]
    .filter(Boolean).join(" · "));
  text("portrait-caption", profile.portraitCaption);

  const headshotURL = safeURL(profile.headshot);

  if (headshotURL) {
    const image = element("headshot");
    image.alt = profile.headshotAlt || profile.name || "";
    image.onload = () => {
      image.hidden = false;
      element("portrait-placeholder").hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      element("portrait-placeholder").hidden = false;
    };
    image.src = headshotURL;
  }

  text("work-title", data.workTitle);
  text("work-description", data.workDescription);

  const resumeURL = safeURL(data.resume);

  document.querySelectorAll(".resume-link").forEach((link) => {
    link.hidden = !resumeURL;

    if (resumeURL) {
      link.href = resumeURL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  text("about-title", data.aboutTitle);
  const about = element("about-body");
  about.replaceChildren();

  String(data.about || "").split(/\n\s*\n/).filter(Boolean)
    .forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      about.append(p);
    });

  text("contact-title", contact.title);
  text("contact-description", contact.description);

  const email = element("contact-email");
  const address = String(contact.email || "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);

  email.hidden = !validEmail;

  if (validEmail) {
    email.textContent = address;
    email.href = `mailto:${address}`;
  }

  const socialLinks = element("social-links");
  socialLinks.replaceChildren();

  [
    ["LinkedIn", contact.linkedin],
    ["GitHub", contact.github],
    ["YouTube", contact.youtube],
    ["Other links", contact.otherLinks]
  ].forEach(([label, url]) => {
    const link = externalLink(label, url);
    if (link) socialLinks.append(link);
  });

  ["header-socials", "mobile-socials"].forEach(id => {
    const container = element(id);
    container.replaceChildren();
    [["LinkedIn", contact.linkedin], ["GitHub", contact.github], ["YouTube", contact.youtube]].forEach(([label, url]) => {
      const link = externalLink(label, url);
      if (link) { link.textContent = label; container.append(link); }
    });
  });

  text(
    "footer-copy",
    `© ${new Date().getFullYear()} ${profile.name || ""}. ${data.footer || ""}`
  );

  renderProjects(Array.isArray(data.projects) ? data.projects : []);
  renderShowreel(data.showreel);
}

async function init() {
  try {
    const response = await fetch("./content.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Content request failed: ${response.status}`);
    }

    const data = await response.json();
    renderSite(data);
  } catch (error) {
    console.error(error);
    element("project-status").textContent =
      "The portfolio content could not be loaded. Please try again.";
  }
}

function setupMobileMenu() {
  const menu = element("mobile-menu");
  const toggle = element("menu-toggle");
  toggle.addEventListener("click", () => {
    menu.showModal();
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  });
  element("menu-close").addEventListener("click", () => menu.close());
  menu.addEventListener("close", () => {
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
  menu.addEventListener("click", event => {
    if (event.target === menu) {
      const rect = menu.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) menu.close();
    }
    const link = event.target.closest("a");
    if (link) {
      menu.close();
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const target = document.querySelector(href);
        if (target) { target.setAttribute("tabindex", "-1"); target.focus({preventScroll:true}); }
      }
    }
  });
  window.matchMedia("(min-width: 1051px)").addEventListener("change", event => {
    if (event.matches && menu.open) menu.close();
  });
}

setupMobileMenu();
init();