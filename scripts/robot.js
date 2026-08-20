document.addEventListener("DOMContentLoaded", () => {
    const robot = document.getElementById("robotCompanion");
    if (!robot) return;

    const speech = document.getElementById("robotSpeech");
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = [...document.querySelectorAll("[data-robot-state]")].map(element => ({
        element,
        state: element.dataset.robotState,
        top: 0,
        height: 0
    }));
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

    const robotStates = {
        observer: {
            headX: 0,
            headY: 0,
            headRotate: 0,
            bodyY: 0,
            bodyRotate: 0,
            leftArm: 20,
            rightArm: -20,
            antenna: 1,
            light: 1,
            cursorInfluence: 1,
            eyeX: 0,
            eyeY: 0
        },
        analyzing: {
            headX: -2,
            headY: -1,
            headRotate: -1.5,
            bodyY: -1,
            bodyRotate: -.35,
            leftArm: 34,
            rightArm: -23,
            antenna: 1.14,
            light: 1.08,
            cursorInfluence: .64,
            eyeX: -.42,
            eyeY: .12
        },
        evaluating: {
            headX: -1,
            headY: -1,
            headRotate: 0,
            bodyY: -1,
            bodyRotate: 0,
            leftArm: 31,
            rightArm: -30,
            antenna: 1.1,
            light: 1.12,
            cursorInfluence: .72,
            eyeX: -.28,
            eyeY: .04
        },
        scanning: {
            headX: -4,
            headY: -2,
            headRotate: -2.5,
            bodyY: -2,
            bodyRotate: -1,
            leftArm: 80,
            rightArm: -38,
            antenna: 1.3,
            light: 1.25,
            cursorInfluence: .15,
            eyeX: -.82,
            eyeY: 0
        },
        investigating: {
            headX: -2,
            headY: 0,
            headRotate: -1,
            bodyY: -1,
            bodyRotate: -.4,
            leftArm: 48,
            rightArm: -27,
            antenna: 1.16,
            light: 1.18,
            cursorInfluence: .42,
            eyeX: -.56,
            eyeY: .18
        },
        reviewing: {
            headX: -1,
            headY: 0,
            headRotate: -.5,
            bodyY: 0,
            bodyRotate: 0,
            leftArm: 23,
            rightArm: -22,
            antenna: 1.04,
            light: 1.04,
            cursorInfluence: .68,
            eyeX: -.18,
            eyeY: .28
        },
        curious: {
            headX: -2,
            headY: -1,
            headRotate: -2,
            bodyY: -1,
            bodyRotate: -.3,
            leftArm: 28,
            rightArm: -18,
            antenna: 1.4,
            light: 1.2,
            cursorInfluence: .56,
            eyeX: -.3,
            eyeY: -.2
        },
        engaged: {
            headX: 2,
            headY: -1,
            headRotate: 1.5,
            bodyY: -1,
            bodyRotate: .45,
            leftArm: 17,
            rightArm: -48,
            antenna: 1.18,
            light: 1.28,
            cursorInfluence: .84,
            eyeX: .18,
            eyeY: -.05
        }
    };
    const messages = {
        observer: "System online.",
        investigating: "Follow the evidence.",
        engaged: "Available for interesting problems."
    };
    const architectureSection = sections.find(section => section.state === "scanning");
    const spokenMoments = new Set();
    const visibleSections = new Set();
    const clamp = value => Math.min(Math.max(value, 0), 1);
    const range = (value, start, end) => clamp((value - start) / (end - start));
    const smoothstep = value => {
        const amount = clamp(value);
        return amount * amount * (3 - 2 * amount);
    };
    const easedRange = (value, start, end) => smoothstep(range(value, start, end));
    const pulse = (value, start, end) => {
        if (value <= start || value >= end) return 0;
        return Math.sin(Math.PI * range(value, start, end));
    };
    const mix = (start, end, amount) => start + (end - start) * amount;

    let speechTimer;
    let currentSection = sections[0] || null;
    let currentState = currentSection?.state || "observer";
    let sectionProgress = 0;
    let previousScrollY = window.scrollY;
    let scrollDirectionTarget = 0;
    let scrollDirectionInfluence = 0;
    let lastScrollAt = 0;
    let scrollDirty = true;
    let scrollFrame = 0;
    let poseSettling = false;
    let renderedPose = null;
    let geometryRefreshFrame = 0;
    let eyeAnimationFrame = 0;
    let eyeBehavior = {
        cursorInfluence: 1,
        sectionInfluence: 0,
        sectionX: 0,
        sectionY: 0
    };

    const showSpeech = (message, duration = 2800) => {
        if (!speech || !message || window.innerWidth <= 700) return;
        window.clearTimeout(speechTimer);
        speech.textContent = message;
        robot.classList.add("show-speech");
        speechTimer = window.setTimeout(() => robot.classList.remove("show-speech"), duration);
    };

    const announce = state => {
        if (!messages[state] || spokenMoments.has(state)) return;
        spokenMoments.add(state);
        showSpeech(messages[state]);
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

    const refreshSectionMetrics = () => {
        sections.forEach(section => {
            const rect = section.element.getBoundingClientRect();
            section.top = rect.top + window.scrollY;
            section.height = rect.height;
        });
    };

    const setRobotVariable = (name, value, unit = "") => {
        robot.style.setProperty(name, `${Number(value.toFixed(3))}${unit}`);
    };

    const getArchitectureValues = progress => {
        const attention = Math.min(range(progress, 0, .12), 1 - range(progress, .84, 1));
        const action = Math.min(range(progress, .12, .28), 1 - range(progress, .84, 1));
        const emitter = Math.min(range(progress, .28, .4), 1 - range(progress, .84, .94));
        const projectionExit = 1 - range(progress, .84, .96);
        const beam = Math.min(range(progress, .4, .5), projectionExit);
        const frame = Math.min(range(progress, .4, .48), projectionExit);
        const scan = range(progress, .5, .72);
        const scanOpacity = Math.min(range(progress, .5, .54), 1 - range(progress, .68, .72));
        const confirmation = Math.min(range(progress, .72, .76), 1 - range(progress, .84, .9));
        const returning = range(progress, .84, 1);
        const visible = value => Math.min(value, projectionExit);

        return {
            attention,
            action,
            emitter,
            emitterRing: pulse(progress, .28, .4),
            beam,
            beamShiftX: returning * 21,
            beamShiftY: returning * 24,
            frame,
            nodeCore: visible(range(progress, .44, .49)),
            nodeA: visible(range(progress, .47, .52)),
            nodeB: visible(range(progress, .5, .55)),
            nodeC: visible(range(progress, .53, .58)),
            nodeD: visible(range(progress, .56, .61)),
            lineA: visible(range(progress, .52, .57)),
            lineB: visible(range(progress, .55, .6)),
            lineC: visible(range(progress, .58, .63)),
            lineD: visible(range(progress, .61, .66)),
            scan,
            scanOpacity,
            scanGlow: Math.sin(Math.PI * scan) * scanOpacity,
            tickA: pulse(progress, .54, .61),
            tickB: pulse(progress, .62, .69),
            confirmation
        };
    };

    const poseKeys = [
        "headX",
        "headY",
        "headRotate",
        "bodyY",
        "bodyRotate",
        "leftArm",
        "rightArm",
        "leftArmX",
        "leftArmY",
        "antenna",
        "light",
        "cursorInfluence",
        "eyeX",
        "eyeY",
        "emitter"
    ];

    const blendPose = (from, to, amount) => Object.fromEntries(
        poseKeys.map(key => [key, mix(from[key], to[key], amount)])
    );

    const getSectionPose = (section, progress, useProgress = true) => {
        const state = section?.state || "observer";
        const config = robotStates[state] || robotStates.observer;
        const p = clamp(progress);
        const eased = smoothstep(p);
        const pose = {
            headX: config.headX,
            headY: config.headY,
            headRotate: config.headRotate,
            bodyY: config.bodyY,
            bodyRotate: config.bodyRotate,
            leftArm: config.leftArm,
            rightArm: config.rightArm,
            leftArmX: 0,
            leftArmY: 0,
            antenna: config.antenna,
            light: config.light,
            cursorInfluence: config.cursorInfluence,
            eyeX: config.eyeX,
            eyeY: config.eyeY,
            emitter: 0
        };

        if (!useProgress) return pose;

        if (state === "observer") {
            const attention = easedRange(p, .3, .6);
            const anticipation = easedRange(p, .6, 1);
            pose.headX = -1.1 * attention;
            pose.headY = .8 * anticipation;
            pose.headRotate = -.7 * attention + .35 * anticipation;
            pose.bodyY = .5 * anticipation;
            pose.leftArm = 20 + attention * 4 + anticipation * 2;
            pose.rightArm = -20 - attention * 3;
            pose.cursorInfluence = mix(1, .92, anticipation);
            pose.eyeY = .12 * anticipation;
        } else if (state === "analyzing") {
            const armLift = Math.min(easedRange(p, .15, .4), 1 - easedRange(p, .7, 1));
            const trace = easedRange(p, .25, .65);
            pose.leftArm = mix(24, 44, armLift);
            pose.rightArm = mix(-21, -27, armLift * .65);
            pose.headX = mix(-2.8, 1.2, trace);
            pose.headY = mix(-1.6, 1.1, trace);
            pose.headRotate = mix(-1.9, .8, trace);
            pose.bodyY = -armLift;
            pose.eyeX = mix(-.56, .3, trace);
            pose.eyeY = mix(-.24, .36, trace);
            pose.cursorInfluence = mix(.72, .6, armLift);
        } else if (state === "evaluating") {
            const cardScan = smoothstep(p);
            const openPose = Math.sin(Math.PI * p);
            pose.headX = mix(-3, 2.5, cardScan);
            pose.headY = mix(-.6, 1.2, cardScan);
            pose.headRotate = mix(-1.8, 1.5, cardScan);
            pose.leftArm = 27 + openPose * 13;
            pose.rightArm = -25 - openPose * 13;
            pose.bodyY = -.8 * openPose;
            pose.eyeX = mix(-.56, .5, cardScan);
            pose.eyeY = mix(-.1, .32, cardScan);
            pose.cursorInfluence = mix(.72, .6, openPose);
        } else if (state === "scanning") {
            const architecture = getArchitectureValues(p);
            pose.headX = -4 * architecture.attention;
            pose.headY = -2 * architecture.attention;
            pose.headRotate = -2.5 * architecture.attention;
            pose.bodyY = -2 * architecture.attention;
            pose.bodyRotate = -architecture.action;
            pose.leftArm = mix(20, 80, architecture.action);
            pose.rightArm = mix(-20, -38, architecture.action);
            pose.leftArmX = -2 * architecture.action;
            pose.leftArmY = -architecture.action;
            pose.antenna = mix(1, 1.3, architecture.attention);
            pose.light = mix(1, 1.25, architecture.attention);
            pose.cursorInfluence = mix(1, .15, architecture.attention);
            pose.eyeX = -.82;
            pose.eyeY = mix(-.24, .34, architecture.scan);
        } else if (state === "investigating") {
            const diagnostic = Math.min(easedRange(p, .12, .45), 1 - easedRange(p, .78, 1));
            const compare = easedRange(p, .45, .82);
            pose.headX = mix(-3, 1.2, compare);
            pose.headY = mix(-1.2, 1.4, eased);
            pose.headRotate = mix(-1.6, .9, compare);
            pose.bodyY = -1.2 * diagnostic;
            pose.bodyRotate = -.55 * diagnostic;
            pose.leftArm = mix(27, 56, diagnostic);
            pose.rightArm = mix(-22, -30, diagnostic * .7);
            pose.eyeX = mix(-.62, .24, compare);
            pose.eyeY = mix(.08, .5, eased);
            pose.cursorInfluence = mix(.55, .4, diagnostic);
            pose.emitter = diagnostic * .42;
        } else if (state === "reviewing") {
            const currentRole = section?.element.id === "experience"
                ? easedRange(p, .64, .92)
                : 0;
            pose.headX = -1;
            pose.headY = mix(-1, 2, eased);
            pose.headRotate = mix(-.9, .75, eased) + currentRole * .35;
            pose.bodyY = mix(-.4, .7, eased);
            pose.bodyRotate = currentRole * .2;
            pose.leftArm = mix(22, 24, eased) + currentRole * 2;
            pose.rightArm = mix(-21, -23, eased) - currentRole * 2;
            pose.antenna = 1.04 + currentRole * .12;
            pose.light = 1.04 + currentRole * .18;
            pose.eyeX = -.18;
            pose.eyeY = mix(-.38, .5, eased);
            pose.cursorInfluence = mix(.66, .72, currentRole);
        } else if (state === "curious") {
            const curiosity = Math.sin(Math.PI * p);
            pose.headX = mix(-1.2, .6, eased);
            pose.headY = -.6 - curiosity * .35;
            pose.headRotate = mix(-1.8, 1.1, eased);
            pose.bodyRotate = mix(-.15, .15, eased);
            pose.leftArm = 21 + curiosity * 3;
            pose.rightArm = -20 - curiosity * 2;
            pose.antenna = 1.08 + curiosity * .22;
            pose.light = 1.06 + curiosity * .1;
            pose.eyeX = mix(-.42, .28, eased);
            pose.eyeY = mix(-.12, .16, eased);
            pose.cursorInfluence = mix(.7, .62, curiosity);
        } else if (state === "engaged") {
            const welcomeIn = easedRange(p, .05, .55);
            const welcomeOut = easedRange(p, .55, 1);
            pose.headX = mix(0, 2.2, easedRange(p, .05, .5));
            pose.headY = -1;
            pose.headRotate = mix(0, 1.6, easedRange(p, .08, .55));
            pose.bodyY = -1;
            pose.bodyRotate = .5 * welcomeIn * (1 - welcomeOut * .5);
            pose.leftArm = mix(20, 18, welcomeIn);
            pose.rightArm = p <= .55
                ? mix(-20, -34, welcomeIn)
                : mix(-34, -25, welcomeOut);
            pose.antenna = mix(1.08, 1.2, welcomeIn);
            pose.light = mix(1.12, 1.3, welcomeIn);
            pose.cursorInfluence = mix(.84, 1, easedRange(p, .1, .6));
            pose.eyeX = mix(.16, 0, easedRange(p, .1, .6));
            pose.eyeY = -.04;
        }

        return pose;
    };

    const getBlendedSectionPose = (section, progress) => {
        let pose = getSectionPose(section, progress);
        const index = sections.indexOf(section);

        if (progress < .12 && index > 0) {
            const previousPose = getSectionPose(sections[index - 1], 1);
            pose = blendPose(previousPose, pose, easedRange(progress, 0, .12));
        } else if (progress > .88 && index < sections.length - 1) {
            const nextPose = getSectionPose(sections[index + 1], 0);
            pose = blendPose(pose, nextPose, easedRange(progress, .88, 1));
        }

        return pose;
    };

    const applyRobotState = (section, progress) => {
        const state = section?.state || "observer";
        const motionReduced = reducedMotion.matches;
        const mobileScale = window.innerWidth <= 700 ? .68 : 1;
        let targetPose = motionReduced
            ? getSectionPose(section, .5, false)
            : getBlendedSectionPose(section, progress);
        let effects = getArchitectureValues(state === "scanning" && !motionReduced ? progress : 0);

        if (state === "investigating" && !motionReduced) {
            effects.emitter = targetPose.emitter;
        }

        if (!motionReduced) {
            targetPose.headY += scrollDirectionInfluence * .45;
            targetPose.bodyY += scrollDirectionInfluence * .2;
            targetPose.eyeY += scrollDirectionInfluence * .06;
        } else {
            const lowMotionScale = .22;
            targetPose = {
                ...targetPose,
                headX: targetPose.headX * lowMotionScale,
                headY: targetPose.headY * lowMotionScale,
                headRotate: targetPose.headRotate * lowMotionScale,
                bodyY: targetPose.bodyY * lowMotionScale,
                bodyRotate: targetPose.bodyRotate * lowMotionScale,
                leftArm: mix(20, targetPose.leftArm, lowMotionScale),
                rightArm: mix(-20, targetPose.rightArm, lowMotionScale),
                leftArmX: 0,
                leftArmY: 0,
                emitter: 0,
                cursorInfluence: 1,
                eyeX: 0,
                eyeY: 0
            };
            effects = getArchitectureValues(0);
        }

        targetPose = {
            ...targetPose,
            headX: targetPose.headX * mobileScale,
            headY: targetPose.headY * mobileScale,
            headRotate: targetPose.headRotate * mobileScale,
            bodyY: targetPose.bodyY * mobileScale,
            bodyRotate: targetPose.bodyRotate * mobileScale,
            leftArm: mix(20, targetPose.leftArm, mobileScale),
            rightArm: mix(-20, targetPose.rightArm, mobileScale),
            leftArmX: targetPose.leftArmX * mobileScale,
            leftArmY: targetPose.leftArmY * mobileScale
        };

        if (!renderedPose || motionReduced) renderedPose = { ...targetPose };
        const response = motionReduced ? 1 : .42;
        renderedPose = blendPose(renderedPose, targetPose, response);
        poseSettling = poseKeys.some(key => Math.abs(renderedPose[key] - targetPose[key]) > .015);

        setRobotVariable("--robot-head-x", renderedPose.headX, "px");
        setRobotVariable("--robot-head-y", renderedPose.headY, "px");
        setRobotVariable("--robot-head-rotate", renderedPose.headRotate, "deg");
        setRobotVariable("--robot-body-y", renderedPose.bodyY, "px");
        setRobotVariable("--robot-body-rotate", renderedPose.bodyRotate, "deg");
        setRobotVariable("--robot-left-arm-angle", renderedPose.leftArm, "deg");
        setRobotVariable("--robot-right-arm-angle", renderedPose.rightArm, "deg");
        setRobotVariable("--robot-left-arm-x", renderedPose.leftArmX, "px");
        setRobotVariable("--robot-left-arm-y", renderedPose.leftArmY, "px");
        setRobotVariable("--robot-antenna-intensity", renderedPose.antenna);
        setRobotVariable("--robot-light-intensity", renderedPose.light + effects.confirmation * .22);
        setRobotVariable("--robot-emitter-progress", Math.max(effects.emitter, renderedPose.emitter));
        setRobotVariable("--robot-emitter-ring", effects.emitterRing);
        setRobotVariable("--robot-beam-progress", effects.beam);
        setRobotVariable("--robot-beam-shift-x", effects.beamShiftX, "px");
        setRobotVariable("--robot-beam-shift-y", effects.beamShiftY, "px");
        setRobotVariable("--robot-frame-progress", effects.frame);
        setRobotVariable("--robot-node-core", effects.nodeCore);
        setRobotVariable("--robot-node-a", effects.nodeA);
        setRobotVariable("--robot-node-b", effects.nodeB);
        setRobotVariable("--robot-node-c", effects.nodeC);
        setRobotVariable("--robot-node-d", effects.nodeD);
        setRobotVariable("--robot-line-a", effects.lineA);
        setRobotVariable("--robot-line-b", effects.lineB);
        setRobotVariable("--robot-line-c", effects.lineC);
        setRobotVariable("--robot-line-d", effects.lineD);
        setRobotVariable("--robot-scan-progress", effects.scan);
        setRobotVariable("--robot-scan-opacity", effects.scanOpacity);
        setRobotVariable("--robot-scan-glow", effects.scanGlow);
        setRobotVariable("--robot-tick-a", effects.tickA);
        setRobotVariable("--robot-tick-b", effects.tickB);
        setRobotVariable("--robot-confirm-progress", effects.confirmation);
        setRobotVariable("--robot-section-progress", progress);

        eyeBehavior = {
            cursorInfluence: renderedPose.cursorInfluence,
            sectionInfluence: 1 - renderedPose.cursorInfluence,
            sectionX: renderedPose.eyeX,
            sectionY: renderedPose.eyeY
        };
    };
    const updateActiveSection = timestamp => {
        scrollFrame = 0;
        const directionHeld = timestamp - lastScrollAt <= 110;
        if (!directionHeld) scrollDirectionTarget = 0;
        scrollDirectionInfluence += (scrollDirectionTarget - scrollDirectionInfluence) * .34;
        if (!directionHeld
            && Math.abs(scrollDirectionTarget - scrollDirectionInfluence) < .01) {
            scrollDirectionInfluence = 0;
        }
        if (!scrollDirty && !poseSettling && !directionHeld && scrollDirectionInfluence === 0) return;
        scrollDirty = false;

        const candidates = visibleSections.size
            ? sections.filter(section => visibleSections.has(section.element))
            : sections;
        const viewportCenter = window.innerHeight / 2;
        const getSectionRect = section => ({
            top: section.top - window.scrollY,
            bottom: section.top - window.scrollY + section.height,
            height: section.height
        });
        let nearest = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        let nearestRect = null;

        if (architectureSection) {
            const architectureRect = getSectionRect(architectureSection);
            if (architectureRect.top <= window.innerHeight * .8
                && architectureRect.bottom >= window.innerHeight * .2) {
                nearest = architectureSection;
                nearestRect = architectureRect;
                nearestDistance = 0;
            }
        }

        candidates.forEach(section => {
            if (nearest === architectureSection) return;
            const rect = getSectionRect(section);
            const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
            if (distance >= nearestDistance) return;
            nearest = section;
            nearestRect = rect;
            nearestDistance = distance;
        });

        if (nearest !== architectureSection) {
            sections.forEach(section => {
                const rect = getSectionRect(section);
                const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
                if (distance + window.innerHeight * .25 >= nearestDistance) return;
                nearest = section;
                nearestRect = rect;
                nearestDistance = distance;
            });
        }

        if (!nearest || !nearestRect) return;
        const progress = clamp(
            (window.innerHeight * .8 - nearestRect.top)
            / (nearestRect.height + window.innerHeight * .6)
        );

        if (nearest !== currentSection) {
            currentSection = nearest;
            currentState = nearest.state;
            if (currentState === "scanning") {
                window.clearTimeout(speechTimer);
                robot.classList.remove("show-speech");
            } else {
                announce(currentState);
            }
            scheduleGeometryRefresh();
        }

        sectionProgress = progress;
        robot.dataset.state = currentState;
        robot.dataset.sectionId = currentSection.element.id || "home";
        robot.dataset.progress = progress.toFixed(3);
        robot.dataset.direction = scrollDirectionInfluence > .08
            ? "down"
            : scrollDirectionInfluence < -.08
                ? "up"
                : "still";
        applyRobotState(currentSection, sectionProgress);

        if (directionHeld || Math.abs(scrollDirectionInfluence) >= .01 || poseSettling) {
            scrollDirty = true;
            scrollFrame = requestAnimationFrame(updateActiveSection);
        }
    };

    const requestScrollUpdate = () => {
        scrollDirty = true;
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateActiveSection);
    };

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - previousScrollY) > .5) {
            scrollDirectionTarget = currentScrollY > previousScrollY ? 1 : -1;
            lastScrollAt = performance.now();
        }
        previousScrollY = currentScrollY;
        requestScrollUpdate();
    };

    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleSections.add(entry.target);
                } else {
                    visibleSections.delete(entry.target);
                }
            });
            requestScrollUpdate();
        }, { threshold: [0, .05, .2, .5] });
        sections.forEach(section => sectionObserver.observe(section.element));
    }

    if ("ResizeObserver" in window) {
        const sectionResizeObserver = new ResizeObserver(() => {
            refreshSectionMetrics();
            requestScrollUpdate();
        });
        sections.forEach(section => sectionResizeObserver.observe(section.element));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pageshow", requestScrollUpdate);
    window.addEventListener("resize", () => {
        refreshSectionMetrics();
        scheduleGeometryRefresh();
        requestScrollUpdate();
    }, { passive: true });
    reducedMotion.addEventListener?.("change", requestScrollUpdate);

    window.setTimeout(() => {
        if (currentState === "observer") announce("observer");
    }, 1200);

    if (eyeModels.length) {
        const maxTravel = 7.5;
        const sensitivity = 130;
        const interpolation = .22;
        let pointerX = window.innerWidth / 2;
        let pointerY = window.innerHeight / 2;
        let pointerActive = false;

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
        finePointer.addEventListener?.("change", () => {
            pointerActive = false;
        });

        const trackEyes = () => {
            eyeModels.forEach(eye => {
                let cursorTargetX = 0;
                let cursorTargetY = 0;

                if (finePointer.matches && pointerActive) {
                    const deltaX = pointerX - eye.centerX;
                    const deltaY = pointerY - eye.centerY;
                    const distance = Math.hypot(deltaX, deltaY);
                    if (distance > 0) {
                        const travel = maxTravel * (1 - Math.exp(-distance / sensitivity));
                        cursorTargetX = deltaX / distance * travel;
                        cursorTargetY = deltaY / distance * travel;
                    }
                }

                const cursorInfluence = finePointer.matches ? eyeBehavior.cursorInfluence : 0;
                const sectionInfluence = finePointer.matches
                    ? eyeBehavior.sectionInfluence
                    : currentState === "observer" || reducedMotion.matches ? 0 : Math.max(.55, eyeBehavior.sectionInfluence);
                const nextTargetX = cursorTargetX * cursorInfluence
                    + eyeBehavior.sectionX * maxTravel * sectionInfluence;
                const nextTargetY = cursorTargetY * cursorInfluence
                    + eyeBehavior.sectionY * maxTravel * sectionInfluence;

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

        refreshEyeGeometry();
        eyeAnimationFrame = requestAnimationFrame(trackEyes);
    }

    refreshSectionMetrics();
    requestScrollUpdate();
});
