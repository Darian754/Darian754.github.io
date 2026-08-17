/* =========================================================
   DARIAN CHETTY PORTFOLIO
   MAIN JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       GLOBAL ELEMENTS
    ===================================================== */

    const nav = document.getElementById("mainNav");
    const hero = document.querySelector(".hero");
    const heroGrid = document.querySelector(".hero-grid");


    /* =====================================================
       NAVIGATION — SCROLL STATE
    ===================================================== */

    const updateNavigation = () => {

        if (!nav) return;

        if (window.scrollY > 40) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }

    };

    updateNavigation();

    window.addEventListener(
        "scroll",
        updateNavigation,
        { passive: true }
    );


    /* =====================================================
       NAVIGATION — ACTIVE SECTION
    ===================================================== */

    const sections = document.querySelectorAll(
        "section[id]"
    );

    const navLinks = document.querySelectorAll(
        ".nav-link"
    );

    const updateActiveNavigation = () => {

        let currentSection = "home";

        const scrollPosition =
            window.scrollY +
            (nav ? nav.offsetHeight : 80) +
            120;

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop;

            if (
                scrollPosition >= sectionTop
            ) {
                currentSection =
                    section.getAttribute("id");
            }

        });

        navLinks.forEach(link => {

            link.classList.remove("active");

            const href =
                link.getAttribute("href");

            if (
                href === `#${currentSection}`
            ) {
                link.classList.add("active");
            }

        });

    };

    updateActiveNavigation();

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );


    /* =====================================================
       MOBILE NAVIGATION
    ===================================================== */

    const navCollapse =
        document.querySelector(".navbar-collapse");

    const navItems =
        document.querySelectorAll(
            ".navbar-collapse .nav-link, .navbar-collapse .nav-contact"
        );

    navItems.forEach(link => {

        link.addEventListener("click", () => {

            if (
                navCollapse &&
                navCollapse.classList.contains("show") &&
                typeof bootstrap !== "undefined"
            ) {

                const collapse =
                    bootstrap.Collapse.getInstance(
                        navCollapse
                    );

                if (collapse) {
                    collapse.hide();
                }

            }

        });

    });


    /* =====================================================
       SCROLL REVEAL
    ===================================================== */

    const animatedElements =
        document.querySelectorAll(
            ".animate-on-scroll"
        );

    if (
        "IntersectionObserver" in window &&
        animatedElements.length
    ) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "in-view"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12,
                    rootMargin:
                        "0px 0px -50px 0px"
                }
            );

        animatedElements.forEach(element => {
            observer.observe(element);
        });

    } else {

        animatedElements.forEach(element => {
            element.classList.add(
                "in-view"
            );
        });

    }


    /* =====================================================
       ARCHITECTURE NODE INTERACTION
    ===================================================== */

    const architectureNodes =
        document.querySelectorAll(
            ".architecture-node"
        );

    architectureNodes.forEach(node => {

        node.addEventListener(
            "click",
            () => {

                architectureNodes.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                node.classList.add("active");

                /*
                 * Update architecture footer
                 * with the selected component.
                 */

                const footer =
                    document.querySelector(
                        ".architecture-footer"
                    );

                const message =
                    node.dataset.message;

                if (
                    footer &&
                    message
                ) {

                    footer.innerHTML = `
                        <i class="fa-solid fa-circle-info"></i>
                        ${message}
                    `;

                }

            }
        );

    });


    /* =====================================================
       ARCHITECTURE NODE HOVER
    ===================================================== */

    architectureNodes.forEach(node => {

        node.addEventListener(
            "mouseenter",
            () => {

                const message =
                    node.dataset.message;

                const footer =
                    document.querySelector(
                        ".architecture-footer"
                    );

                if (
                    footer &&
                    message
                ) {

                    footer.innerHTML = `
                        <i class="fa-solid fa-circle-info"></i>
                        ${message}
                    `;

                }

            }
        );

        node.addEventListener(
            "mouseleave",
            () => {

                const footer =
                    document.querySelector(
                        ".architecture-footer"
                    );

                if (
                    footer &&
                    !node.classList.contains(
                        "active"
                    )
                ) {

                    footer.innerHTML = `
                        <i class="fa-solid fa-circle-info"></i>
                        Hover over a component to explore its role in the system.
                    `;

                }

            }
        );

    });


    /* =====================================================
       TERMINAL
    ===================================================== */

    const terminalLines =
        document.querySelectorAll(
            ".terminal-body .terminal-line"
        );

    const terminalCursor =
        document.querySelector(
            ".terminal-cursor"
        );

    if (terminalCursor) {

        terminalCursor.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    if (terminalLines.length) {

        terminalLines.forEach(
            (line, index) => {

                line.style.opacity = "0";

                line.style.transform =
                    "translateX(-8px)";

                line.style.transition =
                    "opacity 0.35s ease, transform 0.35s ease";

                setTimeout(
                    () => {

                        line.style.opacity = "1";

                        line.style.transform =
                            "translateX(0)";

                    },
                    350 + index * 130
                );

            }
        );

    }


    /* =====================================================
       ROBOT COMPANION
    ===================================================== */

    const robot =
        document.querySelector(
            ".robot-companion"
        );

    const robotEyes =
        document.querySelectorAll(
            ".robot-eye span"
        );

    if (robot) {

        /*
         * Robot eye tracking.
         */

        document.addEventListener(
            "mousemove",
            event => {

                const mouseX =
                    event.clientX;

                const mouseY =
                    event.clientY;

                robotEyes.forEach(eye => {

                    const parent =
                        eye.parentElement;

                    if (!parent) return;

                    const rect =
                        parent.getBoundingClientRect();

                    const eyeCenterX =
                        rect.left +
                        rect.width / 2;

                    const eyeCenterY =
                        rect.top +
                        rect.height / 2;

                    const deltaX =
                        mouseX -
                        eyeCenterX;

                    const deltaY =
                        mouseY -
                        eyeCenterY;

                    const distance =
                        Math.hypot(
                            deltaX,
                            deltaY
                        );

                    const maxDistance = 5;

                    const movement =
                        Math.min(
                            maxDistance,
                            distance / 70
                        );

                    const angle =
                        Math.atan2(
                            deltaY,
                            deltaX
                        );

                    const moveX =
                        Math.cos(angle) *
                        movement;

                    const moveY =
                        Math.sin(angle) *
                        movement;

                    eye.style.transform =
                        `translate(${moveX}px, ${moveY}px)`;

                });

            }
        );


        /*
         * Robot speech.
         */

        const speech =
            robot.querySelector(
                ".robot-speech"
            );

        const speechMessages = [

            "Welcome to my portfolio.",

            "I build software across the stack.",

            "Frontend. Backend. Infrastructure.",

            "Currently working with Kubernetes.",

            "Architecture is where the fun begins.",

            "Designing systems, not just applications."

        ];

        let speechIndex = 0;

        let speechTimeout;


        const showRobotSpeech = () => {

            if (!speech) return;

            clearTimeout(
                speechTimeout
            );

            speech.textContent =
                speechMessages[
                    speechIndex
                ];

            robot.classList.add(
                "show-speech"
            );

            speechTimeout =
                setTimeout(
                    () => {

                        robot.classList.remove(
                            "show-speech"
                        );

                    },
                    4500
                );

            speechIndex =
                (
                    speechIndex + 1
                ) %
                speechMessages.length;

        };


        /*
         * First message.
         */

        setTimeout(
            showRobotSpeech,
            1800
        );


        /*
         * Subsequent messages.
         */

        setInterval(
            showRobotSpeech,
            10000
        );


        /*
         * Robot reacts when hovered.
         */

        robot.addEventListener(
            "mouseenter",
            () => {

                if (!speech) return;

                clearTimeout(
                    speechTimeout
                );

                speech.textContent =
                    "Need a system built? Let's talk.";

                robot.classList.add(
                    "show-speech"
                );

            }
        );

        robot.addEventListener(
            "mouseleave",
            () => {

                speechTimeout =
                    setTimeout(
                        () => {

                            robot.classList.remove(
                                "show-speech"
                            );

                        },
                        2500
                    );

            }
        );

    }


    /* =====================================================
       PROJECT CARD INTERACTION
    ===================================================== */

    const projectCards =
        document.querySelectorAll(
            ".project-card"
        );

    projectCards.forEach(card => {

        card.addEventListener(
            "mousemove",
            event => {

                /*
                 * Disable effect on mobile.
                 */

                if (
                    window.matchMedia(
                        "(pointer: coarse)"
                    ).matches
                ) {
                    return;
                }

                const rect =
                    card.getBoundingClientRect();

                const x =
                    event.clientX -
                    rect.left;

                const y =
                    event.clientY -
                    rect.top;

                const centerX =
                    rect.width / 2;

                const centerY =
                    rect.height / 2;

                const rotateX =
                    ((y - centerY) /
                        centerY) *
                    -2;

                const rotateY =
                    ((x - centerX) /
                        centerX) *
                    2;

                card.style.transform =
                    `
                    translateY(-7px)
                    perspective(900px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    `;

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform = "";

            }
        );

    });


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute(
                        "href"
                    );

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) return;

                event.preventDefault();

                const navHeight =
                    nav
                        ? nav.offsetHeight
                        : 0;

                const targetPosition =
                    target.getBoundingClientRect()
                        .top +
                    window.scrollY -
                    navHeight -
                    15;

                window.scrollTo({

                    top:
                        Math.max(
                            0,
                            targetPosition
                        ),

                    behavior: "smooth"

                });

            }
        );

    });


    /* =====================================================
       HERO GRID PARALLAX
    ===================================================== */

    if (
        hero &&
        heroGrid
    ) {

        const updateHeroParallax = () => {

            const scrollY =
                window.scrollY;

            if (
                scrollY <
                window.innerHeight
            ) {

                heroGrid.style.transform =
                    `translateY(${scrollY * 0.15}px)`;

            }

        };

        window.addEventListener(
            "scroll",
            updateHeroParallax,
            { passive: true }
        );

    }


    /* =====================================================
       CUSTOM CURSOR
    ===================================================== */

    const isTouchDevice =
        window.matchMedia(
            "(pointer: coarse)"
        ).matches;

    if (!isTouchDevice) {

        const cursorDot =
            document.createElement(
                "div"
            );

        const cursorRing =
            document.createElement(
                "div"
            );

        cursorDot.className =
            "custom-cursor-dot";

        cursorRing.className =
            "custom-cursor-ring";

        document.body.appendChild(
            cursorDot
        );

        document.body.appendChild(
            cursorRing
        );


        let mouseX =
            window.innerWidth / 2;

        let mouseY =
            window.innerHeight / 2;

        let ringX = mouseX;
        let ringY = mouseY;


        /*
         * Mouse position.
         */

        document.addEventListener(
            "mousemove",
            event => {

                mouseX =
                    event.clientX;

                mouseY =
                    event.clientY;

                cursorDot.style.left =
                    `${mouseX}px`;

                cursorDot.style.top =
                    `${mouseY}px`;

            }
        );


        /*
         * Smooth cursor ring.
         */

        const animateCursor = () => {

            ringX +=
                (mouseX - ringX) *
                0.15;

            ringY +=
                (mouseY - ringY) *
                0.15;

            cursorRing.style.left =
                `${ringX}px`;

            cursorRing.style.top =
                `${ringY}px`;

            requestAnimationFrame(
                animateCursor
            );

        };

        animateCursor();


        /*
         * Cursor hover state.
         */

        const interactiveElements =
            document.querySelectorAll(
                `
                a,
                button,
                .project-card,
                .architecture-node,
                .nav-link
                `
            );

        interactiveElements.forEach(
            element => {

                element.addEventListener(
                    "mouseenter",
                    () => {

                        cursorRing.classList.add(
                            "cursor-hover"
                        );

                    }
                );

                element.addEventListener(
                    "mouseleave",
                    () => {

                        cursorRing.classList.remove(
                            "cursor-hover"
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );

    yearElements.forEach(
        element => {

            element.textContent =
                new Date()
                    .getFullYear();

        }
    );


    /* =====================================================
       PAGE READY
    ===================================================== */

    requestAnimationFrame(() => {

        document.body.classList.add(
            "page-loaded"
        );

    });

});