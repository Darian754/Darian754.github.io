// ===== Typewriter Animation =====
document.querySelectorAll('.typewriter-text').forEach((el, index) => {
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    const speed = index === 0 ? 100 : 60; // Main title slower, subtitle faster

    function type() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    setTimeout(type, index === 0 ? 0 : 300); // 0.3s delay for subtitle
});

// ===== Scroll-triggered Animations =====
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseFloat(entry.target.getAttribute('data-delay')) || 0;
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }, delay * 1000);
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(el => observer.observe(el));
});
