document.addEventListener("DOMContentLoaded", () => {
    const robot = document.getElementById("robotCompanion");
    if (!robot) return;

    const speech = document.getElementById("robotSpeech");
    const eyeModels = [...robot.querySelectorAll(".robot-eye")].map(socket => ({
        socket,
        pupil: socket.querySelector("span"),
        centerX: 0,
        centerY: 0,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0
    })).filter(eye => eye.pupil);
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stateSections = [...document.querySelectorAll("[data-robot-state]")];
    const stateClasses = [
        "robot-state-observer",
        "robot-state-engineer",
        "robot-state-architect",
        "robot-state-contact"
    ];
    const transientArchitectureClasses = [
        "robot-state-notice",
        "robot-state-scanning",
        "robot-state-resolving"
    ];
    const messages = {
        observer: "System online.",
        architecture: "Architecture mode.",
        projects: "Follow the evidence.",
        contact: "Available for interesting problems."
    };
    const spokenMoments = new Set();

    let currentState = "observer";
    let speechTimer;
    let architectureActivated = false;
    let architectureInProgress = false;
    let architecturePhase = "idle";
    let geometryRefreshFrame;

    const showSpeech = (message, duration = 2800) => {
        if (!speech || !message || window.innerWidth <= 700 || architectureInProgress) return;
        window.clearTimeout(speechTimer);
        speech.textContent = message;
        robot.classList.add("show-speech");
        speechTimer = window.setTimeout(() => {
            robot.classList.remove("show-speech");
        }, duration);
    };

    const announce = moment => {
        if (!messages[moment] || spokenMoments.has(moment)) return;
        spokenMoments.add(moment);
        showSpeech(messages[moment]);
    };

    const refreshEyeGeometry = () => {
        eyeModels.forEach(eye => {
            const rect = eye.socket.getBoundingClientRect();
            eye.centerX = rect.left + rect.width / 2;
            eye.centerY = rect.top + rect.height / 2;
        });
    };

    const scheduleGeometryRefresh = () => {
        cancelAnimationFrame(geometryRefreshFrame);
        geometryRefreshFrame = requestAnimationFrame(refreshEyeGeometry);
    };

    refreshEyeGeometry();

    const setState = (state, sectionId) => {
        if (state && state !== currentState) {
            currentState = state;
            robot.classList.remove(...stateClasses);
            robot.classList.add(`robot-state-${state}`);
            scheduleGeometryRefresh();
        }

        if (sectionId === "projects") announce("projects");
        if (sectionId === "contact") announce("contact");
    };

    window.setTimeout(() => {
        if (currentState === "observer") announce("observer");
    }, 1200);

    if ("IntersectionObserver" in window) {
        const visibleSections = new Set();
        const stateObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleSections.add(entry.target);
                } else {
                    visibleSections.delete(entry.target);
                }
            });

            const active = [...visibleSections].sort((a, b) => {
                const viewportCenter = innerHeight / 2;
                const aCenter = a.getBoundingClientRect().top + a.offsetHeight / 2;
                const bCenter = b.getBoundingClientRect().top + b.offsetHeight / 2;
                return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
            })[0];

            if (active) setState(active.dataset.robotState, active.id);
        }, {
            threshold: [0, .15, .35],
            rootMargin: "-18% 0px -18% 0px"
        });

        stateSections.forEach(section => stateObserver.observe(section));
    }

    const activateArchitectureMode = () => {
        if (architectureActivated) return;
        architectureActivated = true;
        architectureInProgress = true;
        architecturePhase = "notice";
        robot.classList.remove("show-speech");
        setState("architect", "architecture");

        if (reducedMotion.matches) {
            robot.classList.add("robot-architecture-mode");
            robot.classList.remove(...transientArchitectureClasses);
            architectureInProgress = false;
            architecturePhase = "complete";
            refreshEyeGeometry();
            announce("architecture");
            return;
        }

        robot.classList.add("robot-state-notice");

        window.setTimeout(() => {
            architecturePhase = "scanning";
            robot.classList.remove("robot-state-notice");
            robot.classList.add("robot-state-scanning");
        }, 180);

        window.setTimeout(() => {
            architecturePhase = "resolving";
            robot.classList.remove("robot-state-scanning");
            robot.classList.add("robot-state-resolving");
        }, 900);

        window.setTimeout(() => {
            robot.classList.add("robot-architecture-mode");
        }, 1200);

        window.setTimeout(() => {
            robot.classList.remove(...transientArchitectureClasses);
            architectureInProgress = false;
            architecturePhase = "complete";
            refreshEyeGeometry();
            announce("architecture");
        }, 1450);
    };

    const architectureTrigger = document.querySelector("[data-robot-architecture-trigger]");
    if (architectureTrigger && "IntersectionObserver" in window) {
        const architectureObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            activateArchitectureMode();
            architectureObserver.disconnect();
        }, {
            threshold: 0,
            rootMargin: "-40% 0px -40% 0px"
        });
        architectureObserver.observe(architectureTrigger);
    } else if (architectureTrigger && architectureTrigger.getBoundingClientRect().top < innerHeight * .6) {
        activateArchitectureMode();
    }

    if (finePointer.matches && !reducedMotion.matches && eyeModels.length) {
        const maxTravel = 7.5;
        const sensitivity = 130;
        const interpolation = .22;
        let pointerX = innerWidth / 2;
        let pointerY = innerHeight / 2;
        let pointerActive = false;
        let pointerMovedAt = performance.now();
        let nextSaccadeAt = pointerMovedAt + 2800 + Math.random() * 1200;
        let saccadeUntil = 0;
        let saccadeX = 0;
        let saccadeY = 0;

        const clearSaccade = now => {
            saccadeX = 0;
            saccadeY = 0;
            saccadeUntil = 0;
            nextSaccadeAt = now + 6000 + Math.random() * 4000;
        };

        document.addEventListener("pointermove", event => {
            if (Math.hypot(event.clientX - pointerX, event.clientY - pointerY) < 1.5) return;
            pointerX = event.clientX;
            pointerY = event.clientY;
            pointerActive = true;
            pointerMovedAt = performance.now();
            nextSaccadeAt = pointerMovedAt + 2800 + Math.random() * 1200;
            saccadeX = 0;
            saccadeY = 0;
            saccadeUntil = 0;
        }, { passive: true });

        document.addEventListener("mouseout", event => {
            if (!event.relatedTarget) {
                pointerActive = false;
                clearSaccade(performance.now());
            }
        }, { passive: true });

        window.addEventListener("blur", () => {
            pointerActive = false;
            clearSaccade(performance.now());
        });

        window.addEventListener("resize", scheduleGeometryRefresh, { passive: true });

        const trackEyes = now => {
            const pointerIsStill = now - pointerMovedAt > 2500;

            if (pointerActive && !architectureInProgress && pointerIsStill && now >= nextSaccadeAt) {
                const angle = Math.random() * Math.PI * 2;
                const travel = .3 + Math.random() * .2;
                saccadeX = Math.cos(angle) * travel;
                saccadeY = Math.sin(angle) * travel;
                saccadeUntil = now + 110;
                nextSaccadeAt = Number.POSITIVE_INFINITY;
            }

            if (saccadeUntil && now >= saccadeUntil) clearSaccade(now);

            eyeModels.forEach(eye => {
                let nextTargetX = 0;
                let nextTargetY = 0;

                if (architecturePhase === "scanning") {
                    nextTargetX = -maxTravel * .82;
                    nextTargetY = maxTravel * .28;
                } else if (pointerActive && !architectureInProgress) {
                    const deltaX = pointerX - eye.centerX;
                    const deltaY = pointerY - eye.centerY;
                    const distance = Math.hypot(deltaX, deltaY);

                    if (distance > 0) {
                        const travel = maxTravel * (1 - Math.exp(-distance / sensitivity));
                        nextTargetX = deltaX / distance * travel + saccadeX;
                        nextTargetY = deltaY / distance * travel + saccadeY;
                        const targetDistance = Math.hypot(nextTargetX, nextTargetY);

                        if (targetDistance > maxTravel) {
                            nextTargetX = nextTargetX / targetDistance * maxTravel;
                            nextTargetY = nextTargetY / targetDistance * maxTravel;
                        }
                    }
                }

                if (Math.hypot(nextTargetX - eye.targetX, nextTargetY - eye.targetY) > .08) {
                    eye.targetX = nextTargetX;
                    eye.targetY = nextTargetY;
                }

                eye.currentX += (eye.targetX - eye.currentX) * interpolation;
                eye.currentY += (eye.targetY - eye.currentY) * interpolation;
                eye.pupil.style.setProperty("--eye-x", `${eye.currentX.toFixed(2)}px`);
                eye.pupil.style.setProperty("--eye-y", `${eye.currentY.toFixed(2)}px`);
            });

            requestAnimationFrame(trackEyes);
        };

        requestAnimationFrame(trackEyes);
    }
});
