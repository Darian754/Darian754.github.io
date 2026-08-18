document.addEventListener("DOMContentLoaded", () => {
    const robot = document.getElementById("robotCompanion");
    if (!robot) return;

    const speech = document.getElementById("robotSpeech");
    const eyes = [...robot.querySelectorAll(".robot-eye span")];
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stateSections = [...document.querySelectorAll("[data-robot-state]")];
    const stateClasses = ["robot-state-observer", "robot-state-engineer", "robot-state-suiting", "robot-state-architect", "robot-state-contact"];
    const messages = {
        observer: "System online.",
        engineer: "Good systems start with understanding the problem.",
        architect: "Architecture mode.",
        contact: "Let's build something reliable."
    };
    let speechTimer;
    let currentState = "observer";
    let lastSpeechAt = 0;

    const showSpeech = (message, duration = 3600) => {
        if (!speech || !message || window.innerWidth <= 700) return;
        window.clearTimeout(speechTimer);
        speech.textContent = message;
        robot.classList.add("show-speech");
        speechTimer = window.setTimeout(() => robot.classList.remove("show-speech"), duration);
        lastSpeechAt = Date.now();
    };

    const setState = state => {
        if (!state || state === currentState) return;
        currentState = state;
        robot.classList.remove(...stateClasses.filter(name => name !== "robot-state-suiting"));
        robot.classList.add(`robot-state-${state}`);
        if (Date.now() - lastSpeechAt > 7000) showSpeech(messages[state]);
    };

    window.setTimeout(() => {
        if (currentState === "observer") showSpeech(messages.observer);
    }, 1300);

    if ("IntersectionObserver" in window) {
        const visibleSections = new Set();
        const stateObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => entry.isIntersecting ? visibleSections.add(entry.target) : visibleSections.delete(entry.target));
            const active = [...visibleSections].sort((a, b) => {
                const aDistance = Math.abs(a.getBoundingClientRect().top + a.offsetHeight / 2 - innerHeight / 2);
                const bDistance = Math.abs(b.getBoundingClientRect().top + b.offsetHeight / 2 - innerHeight / 2);
                return aDistance - bDistance;
            })[0];
            if (active) setState(active.dataset.robotState);
        }, { threshold: [0, .15, .35], rootMargin: "-18% 0px -18% 0px" });
        stateSections.forEach(section => stateObserver.observe(section));
    }

    const suitTrigger = document.querySelector("[data-robot-suit-trigger]");
    let suitActivated = false;
    const activateSuit = () => {
        if (suitActivated) return;
        suitActivated = true;
        if (reducedMotion.matches) {
            robot.classList.add("robot-suited", "robot-state-architect");
            return;
        }
        robot.classList.add("robot-state-suiting");
        window.setTimeout(() => robot.classList.add("robot-suited"), 250);
        window.setTimeout(() => {
            robot.classList.remove("robot-state-suiting");
            robot.classList.add("robot-state-architect");
            if (Date.now() - lastSpeechAt > 2500) showSpeech(messages.architect);
        }, 1050);
    };
    if (suitTrigger && "IntersectionObserver" in window) {
        const suitObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            activateSuit();
            suitObserver.disconnect();
        }, { threshold: 0, rootMargin: "-40% 0px -40% 0px" });
        suitObserver.observe(suitTrigger);
    } else if (suitTrigger && suitTrigger.getBoundingClientRect().top < innerHeight * .6) {
        activateSuit();
    }

    if (finePointer.matches && !reducedMotion.matches && eyes.length) {
        let pointerX = innerWidth / 2, pointerY = innerHeight / 2;
        let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
        document.addEventListener("pointermove", event => {
            pointerX = event.clientX;
            pointerY = event.clientY;
        }, { passive: true });
        const trackEyes = () => {
            const face = robot.querySelector(".robot-face")?.getBoundingClientRect();
            if (face) {
                const deltaX = pointerX - (face.left + face.width / 2);
                const deltaY = pointerY - (face.top + face.height / 2);
                const angle = Math.atan2(deltaY, deltaX);
                const distance = Math.min(5, Math.hypot(deltaX, deltaY) / 75);
                targetX = Math.cos(angle) * distance;
                targetY = Math.sin(angle) * distance;
                currentX += (targetX - currentX) * .12;
                currentY += (targetY - currentY) * .12;
                eyes.forEach(eye => {
                    eye.style.setProperty("--eye-x", `${currentX.toFixed(2)}px`);
                    eye.style.setProperty("--eye-y", `${currentY.toFixed(2)}px`);
                });
            }
            requestAnimationFrame(trackEyes);
        };
        trackEyes();
    }
});
