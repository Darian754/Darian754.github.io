document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("mainNav");
    const navCollapse = document.querySelector(".navbar-collapse");
    const sections = [...document.querySelectorAll("main section[id]")];
    const navLinks = [...document.querySelectorAll(".nav-link")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateNavigation = () => {
        nav?.classList.toggle("scrolled", window.scrollY > 40);
        const marker = window.scrollY + (nav?.offsetHeight || 80) + 140;
        const current = sections
            .filter(section => marker >= section.offsetTop)
            .sort((a, b) => a.offsetTop - b.offsetTop)
            .at(-1)?.id || "home";
        navLinks.forEach(link => link.classList.toggle("active", link.hash === `#${current}`));
    };
    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });
    window.addEventListener("resize", updateNavigation, { passive: true });

    document.querySelectorAll(".navbar-collapse .nav-link, .navbar-collapse .nav-contact").forEach(link => {
        link.addEventListener("click", () => {
            if (!navCollapse?.classList.contains("show") || typeof bootstrap === "undefined") return;
            bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
        });
    });

    const animatedElements = [...document.querySelectorAll(".animate-on-scroll")];
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        animatedElements.forEach(element => element.classList.add("in-view"));
    } else {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("in-view");
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: .12, rootMargin: "0px 0px -50px 0px" });
        animatedElements.forEach(element => revealObserver.observe(element));
    }

    const architectureFooter = document.querySelector(".architecture-footer");
    const architectureNodes = [...document.querySelectorAll(".architecture-node")];
    const updateArchitectureMessage = node => {
        if (!architectureFooter || !node?.dataset.message) return;
        architectureFooter.replaceChildren();
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-circle-info";
        icon.setAttribute("aria-hidden", "true");
        architectureFooter.append(icon, document.createTextNode(node.dataset.message));
    };
    architectureNodes.forEach(node => {
        node.addEventListener("click", () => {
            architectureNodes.forEach(item => item.classList.remove("active"));
            node.classList.add("active");
            updateArchitectureMessage(node);
        });
        node.addEventListener("mouseenter", () => updateArchitectureMessage(node));
        node.addEventListener("focus", () => updateArchitectureMessage(node));
    });

    const terminalLines = [...document.querySelectorAll(".terminal-body .terminal-line")];
    document.querySelector(".terminal-cursor")?.setAttribute("aria-hidden", "true");
    if (!reducedMotion.matches) {
        terminalLines.forEach((line, index) => {
            line.style.opacity = "0";
            line.style.transform = "translateX(-8px)";
            line.style.transition = "opacity .35s ease, transform .35s ease";
            window.setTimeout(() => {
                line.style.opacity = "1";
                line.style.transform = "translateX(0)";
            }, 300 + index * 110);
        });
    }

    if (!reducedMotion.matches && window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll(".project-card").forEach(card => {
            card.addEventListener("pointermove", event => {
                const rect = card.getBoundingClientRect();
                const rotateX = ((event.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -1.2;
                const rotateY = ((event.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 1.2;
                card.style.transform = `translateY(-5px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }, { passive: true });
            card.addEventListener("pointerleave", () => { card.style.transform = ""; });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const target = document.querySelector(link.hash);
            if (!target) return;
            event.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 0) - 15;
            window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? "auto" : "smooth" });
        });
    });

    const heroGrid = document.querySelector(".hero-grid");
    if (heroGrid && !reducedMotion.matches) {
        let parallaxQueued = false;
        window.addEventListener("scroll", () => {
            if (parallaxQueued || window.scrollY >= window.innerHeight) return;
            parallaxQueued = true;
            requestAnimationFrame(() => {
                heroGrid.style.transform = `translateY(${window.scrollY * .12}px)`;
                parallaxQueued = false;
            });
        }, { passive: true });
    }

    if (window.matchMedia("(pointer: fine)").matches) {
        const dot = document.createElement("div");
        const ring = document.createElement("div");
        dot.className = "custom-cursor";
        ring.className = "custom-cursor-ring";
        dot.setAttribute("aria-hidden", "true");
        ring.setAttribute("aria-hidden", "true");
        document.body.append(dot, ring);
        let targetX = innerWidth / 2, targetY = innerHeight / 2, ringX = targetX, ringY = targetY;
        document.addEventListener("pointermove", event => {
            targetX = event.clientX;
            targetY = event.clientY;
            dot.style.left = `${targetX}px`;
            dot.style.top = `${targetY}px`;
        }, { passive: true });
        const drawCursor = () => {
            const interpolation = reducedMotion.matches ? 1 : .16;
            ringX += (targetX - ringX) * interpolation;
            ringY += (targetY - ringY) * interpolation;
            ring.style.left = `${ringX}px`;
            ring.style.top = `${ringY}px`;
            requestAnimationFrame(drawCursor);
        };
        drawCursor();
        document.addEventListener("pointerover", event => {
            document.body.classList.toggle("cursor-hover", Boolean(event.target.closest("a, button, summary, .project-card")));
        }, { passive: true });
        document.addEventListener("pointerdown", () => document.body.classList.add("cursor-click"), { passive: true });
        document.addEventListener("pointerup", () => document.body.classList.remove("cursor-click"), { passive: true });
    }

    document.querySelectorAll("[data-current-year]").forEach(element => { element.textContent = new Date().getFullYear(); });
    requestAnimationFrame(() => document.body.classList.add("page-loaded"));
});
