/* =========================
   MOBILE NAVIGATION
========================= */

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

if (navToggle && navMenu) {

    navToggle.addEventListener("click", () => {

        const isOpen = navMenu.classList.toggle("open");

        navToggle.setAttribute(
            "aria-expanded",
            isOpen.toString()
        );

        const icon = navToggle.querySelector("i");

        if (icon) {
            icon.className = isOpen
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars";
        }
    });


    navMenu.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("open");

            navToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            const icon = navToggle.querySelector("i");

            if (icon) {
                icon.className = "fa-solid fa-bars";
            }
        });

    });

}


/* =========================
   HEADER SCROLL STATE
========================= */

const header = document.querySelector(".site-header");

function updateHeader() {

    if (!header) {
        return;
    }

    if (window.scrollY > 20) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

window.addEventListener(
    "scroll",
    updateHeader,
    { passive: true }
);

updateHeader();


/* =========================
   ACTIVE NAV LINK
========================= */

const navLinks = document.querySelectorAll(".nav-link");

const sections = [
    ...document.querySelectorAll("main section[id]")
];

const sectionObserver = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) {
                return;
            }

            const id = entry.target.id;

            navLinks.forEach(link => {

                link.classList.toggle(
                    "active",
                    link.getAttribute("href") === `#${id}`
                );

            });

        });

    },
    {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0
    }
);

sections.forEach(section => {
    sectionObserver.observe(section);
});


/* =========================
   SCROLL REVEAL
========================= */

const revealElements =
    document.querySelectorAll(".reveal");

const revealObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("visible");

                revealObserver.unobserve(
                    entry.target
                );

            });

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach(element => {
    revealObserver.observe(element);
});


/* =========================
   STAT COUNTERS
========================= */

const counters =
    document.querySelectorAll("[data-count]");

const counterObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) {
                    return;
                }

                const counter =
                    entry.target;

                const target =
                    Number(
                        counter.dataset.count
                    );

                let current = 0;

                const duration = 900;

                const start =
                    performance.now();

                function animateCounter(now) {

                    const progress =
                        Math.min(
                            (now - start) / duration,
                            1
                        );

                    current =
                        Math.floor(
                            progress * target
                        );

                    counter.textContent =
                        current;

                    if (progress < 1) {
                        requestAnimationFrame(
                            animateCounter
                        );
                    } else {
                        counter.textContent =
                            target;
                    }
                }

                requestAnimationFrame(
                    animateCounter
                );

                counterObserver.unobserve(
                    counter
                );

            });

        },
        {
            threshold: 0.7
        }
    );


counters.forEach(counter => {
    counterObserver.observe(counter);
});


/* =========================
   CURRENT YEAR
========================= */

const year =
    document.getElementById("year");

if (year) {
    year.textContent =
        new Date().getFullYear();
}


/* =========================
   REDUCED MOTION
========================= */

const reduceMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

if (reduceMotion.matches) {

    document.documentElement.style.scrollBehavior =
        "auto";

    revealElements.forEach(element => {
        element.classList.add("visible");
    });

}