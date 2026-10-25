(function () {
    const PLAYER_SPRITE = 'assets/imgs/Cat_hide.gif'; // swap for a custom character later

    const modal = document.getElementById('ski-modal');
    const canvas = document.getElementById('ski-canvas');
    const btn = document.getElementById('ski-toggle');
    const closeBtn = document.getElementById('ski-close');
    const scoreEl = document.getElementById('ski-score');
    const hero = document.getElementById('hero-avatar');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const GROUND = H - 50;
    const GRAVITY = 1900, JUMP_V = 680;

    const sprite = new Image();
    sprite.src = PLAYER_SPRITE;

    let running = false, over = false, raf = 0, last = 0;
    let p, items, dist, coins, speed, nextX, best = 0;

    function reset() {
        p = { x: 90, y: GROUND, vy: 0, jumps: 0, size: 40 };
        items = [];
        dist = 0;
        coins = 0;
        speed = 220;
        nextX = W + 100;
        over = false;
    }

    // items live in world coordinates; screen x = item.x - dist * 10
    function generate() {
        while (nextX < dist * 10 + W + 200) {
            const r = Math.random();
            if (r < 0.5) {
                items.push({ t: 'tree', x: nextX, w: 26, h: 40 + Math.random() * 20 });
            } else if (r < 0.75) {
                items.push({ t: 'gap', x: nextX, w: 60 + Math.random() * 40 });
            } else {
                items.push({ t: 'coin', x: nextX, y: GROUND - 60 - Math.random() * 40, w: 16 });
            }
            nextX += 220 + Math.random() * 160 + speed * 0.3;
        }
    }

    function jump() {
        if (!running) return;
        if (p.jumps < 2) {
            p.vy = JUMP_V;
            p.jumps++;
        }
    }

    const sx = it => it.x - dist * 10;

    function update(dt) {
        speed = Math.min(480, speed + dt * 8);
        dist += speed * dt / 10;
        generate();

        p.vy -= GRAVITY * dt;
        p.y -= p.vy * dt;

        const overGap = items.some(it => it.t === 'gap' && sx(it) < p.x + 8 && sx(it) + it.w > p.x - 8);
        if (!overGap && p.y >= GROUND) {
            p.y = GROUND;
            p.vy = 0;
            p.jumps = 0;
        }
        if (p.y > H + 40) over = true;

        const hw = p.size * 0.3, top = p.y - p.size * 0.85;
        for (const it of items) {
            const x = sx(it);
            if (it.t === 'tree') {
                const hit = p.x + hw > x + 4 && p.x - hw < x + it.w - 4 && p.y > GROUND - it.h + 6;
                if (hit) over = true;
            } else if (it.t === 'coin' && !it.got) {
                if (Math.abs(x - p.x) < 22 && it.y > top - 8 && it.y < p.y + 8) {
                    it.got = true;
                    coins++;
                }
            }
        }
        items = items.filter(it => sx(it) + (it.w || 0) > -40);
        scoreEl.textContent = Math.floor(dist) + ' m · ' + coins + ' ★' + (best ? ' · best ' + best + ' m' : '');
    }

    function drawGround() {
        const gaps = items.filter(it => it.t === 'gap').map(it => [sx(it), sx(it) + it.w]).sort((a, b) => a[0] - b[0]);
        let x = 0;
        const seg = (a, b) => {
            if (b <= a) return;
            ctx.fillStyle = '#f4f8fd';
            ctx.fillRect(a, GROUND, b - a, H - GROUND);
            ctx.fillStyle = '#c9d8ea';
            ctx.fillRect(a, GROUND, b - a, 3);
        };
        for (const [a, b] of gaps) {
            seg(x, Math.min(a, W));
            x = Math.max(x, b);
        }
        seg(x, W);
    }

    function drawTree(x, h) {
        ctx.fillStyle = '#5b3a29';
        ctx.fillRect(x + 11, GROUND - 8, 4, 8);
        ctx.fillStyle = '#1f6b45';
        const layers = 3, lh = (h - 8) / layers;
        for (let i = 0; i < layers; i++) {
            const w = 13 - i * 2, y = GROUND - 8 - i * (lh * 0.7);
            ctx.beginPath();
            ctx.moveTo(x + 13 - w, y);
            ctx.lineTo(x + 13 + w, y);
            ctx.lineTo(x + 13, y - lh);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawCoin(x, y) {
        ctx.fillStyle = '#ffcb3d';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e0a400';
        ctx.fillRect(x - 1.5, y - 4, 3, 8);
    }

    function draw() {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#9cc4ee');
        sky.addColorStop(1, '#e8f1fb');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#b9cfe8';
        const mo = (dist * 2) % 240;
        for (let x = -mo - 240; x < W + 240; x += 240) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND);
            ctx.lineTo(x + 120, GROUND - 100);
            ctx.lineTo(x + 240, GROUND);
            ctx.fill();
        }

        drawGround();
        for (const it of items) {
            const x = sx(it);
            if (it.t === 'tree') drawTree(x, it.h);
            else if (it.t === 'coin' && !it.got) drawCoin(x, it.y);
        }

        if (sprite.complete && sprite.naturalWidth) {
            ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size, p.size, p.size);
        } else {
            ctx.fillStyle = '#e4572e';
            ctx.fillRect(p.x - 14, p.y - 28, 28, 28);
        }

        if (!running || over) {
            ctx.fillStyle = 'rgba(22,22,26,.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 22px Poppins, sans-serif';
            ctx.fillText(over ? 'Game over · ' + Math.floor(dist) + ' m' : 'Ready to run?', W / 2, H / 2 - 4);
            ctx.font = '13px Poppins, sans-serif';
            ctx.fillText(over ? 'Press Play to try again' : 'Space / ↑ / tap to jump (double jump!)', W / 2, H / 2 + 22);
        }
    }

    function loop(t) {
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        update(dt);
        if (over) {
            best = Math.max(best, Math.floor(dist));
            scoreEl.textContent = Math.floor(dist) + ' m · ' + coins + ' ★ · best ' + best + ' m';
            stop(true);
            return;
        }
        draw();
        raf = requestAnimationFrame(loop);
    }

    function start() {
        reset();
        running = true;
        btn.textContent = 'Stop';
        btn.setAttribute('aria-pressed', 'true');
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    function stop(keepOver) {
        running = false;
        cancelAnimationFrame(raf);
        btn.textContent = 'Play';
        btn.setAttribute('aria-pressed', 'false');
        if (keepOver !== true) over = false;
        draw();
    }

    function openModal() {
        modal.classList.add('open');
        reset();
        draw();
    }

    function closeModal() {
        stop();
        modal.classList.remove('open');
    }

    hero.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    btn.addEventListener('click', () => (running ? stop() : start()));

    window.addEventListener('keydown', e => {
        if (!modal.classList.contains('open')) return;
        if (e.key === 'Escape') return closeModal();
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
            e.preventDefault();
            if (!e.repeat) jump();
        }
    });
    canvas.addEventListener('pointerdown', jump);

    reset();
    sprite.onload = draw;
})();
