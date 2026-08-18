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
    let architectureTimers = [];
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

    const clearArchitectureTimers = () => {
        architectureTimers.forEach(window.clearTimeout);
        architectureTimers = [];
    };

    const completeArchitectureMode = () => {
        clearArchitectureTimers();
        robot.classList.add("robot-architecture-mode");
        robot.classList.remove(...transientArchitectureClasses);
        architectureInProgress = false;
        architecturePhase = "complete";
        refreshEyeGeometry();
        announce("architecture");
    };

    const activateArchitectureMode = () => {
        if (architectureActivated) return;
        architectureActivated = true;
        architectureInProgress = true;
        architecturePhase = "notice";
        robot.classList.remove("show-speech");
        setState("architect", "architecture");

        if (reducedMotion.matches) {
            completeArchitectureMode();
            return;
        }

        robot.classList.add("robot-state-notice");

        architectureTimers.push(window.setTimeout(() => {
            architecturePhase = "scanning";
            robot.classList.remove("robot-state-notice");
            robot.classList.add("robot-state-scanning");
        }, 180));

        architectureTimers.push(window.setTimeout(() => {
            architecturePhase = "resolving";
            robot.classList.remove("robot-state-scanning");
            robot.classList.add("robot-state-resolving");
        }, 900));

        architectureTimers.push(window.setTimeout(() => {
            robot.classList.add("robot-architecture-mode");
        }, 1200));

        architectureTimers.push(window.setTimeout(completeArchitectureMode, 1450));
    };

    reducedMotion.addEventListener?.("change", event => {
        if (event.matches && architectureInProgress) completeArchitectureMode();
    });

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

    if (eyeModels.length) {
        const maxTravel = 7.5;
        const sensitivity = 130;
        const interpolation = .22;
        let pointerX = innerWidth / 2;
        let pointerY = innerHeight / 2;
        let pointerActive = false;
        let eyeAnimationFrame = 0;

        const centerEyes = () => {
            pointerActive = false;
            eyeModels.forEach(eye => {
                eye.currentX = 0;
                eye.currentY = 0;
                eye.targetX = 0;
                eye.targetY = 0;
                eye.pupil.style.setProperty("--eye-x", "0px");
                eye.pupil.style.setProperty("--eye-y", "0px");
            });
        };

        document.addEventListener("pointermove", event => {
            if (!finePointer.matches) return;
            if (Math.hypot(event.clientX - pointerX, event.clientY - pointerY) < 1.5) return;
            pointerX = event.clientX;
            pointerY = event.clientY;
            pointerActive = true;
        }, { passive: true });

        document.addEventListener("mouseout", event => {
            if (!event.relatedTarget) pointerActive = false;
        }, { passive: true });

        window.addEventListener("blur", () => {
            pointerActive = false;
        });

        window.addEventListener("resize", scheduleGeometryRefresh, { passive: true });

        const trackEyes = () => {
            if (!finePointer.matches) {
                eyeAnimationFrame = 0;
                centerEyes();
                return;
            }

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
                        nextTargetX = deltaX / distance * travel;
                        nextTargetY = deltaY / distance * travel;
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

            eyeAnimationFrame = requestAnimationFrame(trackEyes);
        };

        const startEyeTracking = () => {
            if (!finePointer.matches || eyeAnimationFrame) return;
            scheduleGeometryRefresh();
            eyeAnimationFrame = requestAnimationFrame(trackEyes);
        };

        finePointer.addEventListener?.("change", event => {
            if (event.matches) {
                startEyeTracking();
            } else {
                cancelAnimationFrame(eyeAnimationFrame);
                eyeAnimationFrame = 0;
                centerEyes();
            }
        });

        startEyeTracking();
    }
});
