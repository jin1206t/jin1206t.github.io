(function () {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1500;';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    let dots = [], raf = 0;

    function resize() {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
        ctx.clearRect(0, 0, c.width, c.height);
        dots = dots.filter(d => d.life > 0);
        for (const d of dots) {
            ctx.globalAlpha = d.life * 0.6;
            ctx.fillStyle = d.hue;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 2 + d.life * 5, 0, Math.PI * 2);
            ctx.fill();
            d.life -= 0.03;
        }
        raf = dots.length ? requestAnimationFrame(frame) : 0;
    }

    window.addEventListener('mousemove', e => {
        dots.push({ x: e.clientX, y: e.clientY, life: 1, hue: Math.random() < 0.5 ? '#8b7cf6' : '#6ee7b7' });
        if (!raf) raf = requestAnimationFrame(frame);
    });
})();
