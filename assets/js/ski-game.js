(function () {
    const PLAYER_SPRITE = 'assets/imgs/Cat_Ski.png';

    const modal = document.getElementById('ski-modal');
    const canvas = document.getElementById('ski-canvas');
    const btn = document.getElementById('ski-toggle');
    const closeBtn = document.getElementById('ski-close');
    const scoreEl = document.getElementById('ski-score');
    const hero = document.getElementById('hero-avatar');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const GROUND = H - 56;
    const TIER = 58;                 // vertical distance between layers
    const GRAVITY = 1900, JUMP_V = 700;
    const GRID = 32;

    const sprite = new Image();
    sprite.src = PLAYER_SPRITE;

    const keys = { left: false, right: false };
    let mode = 'idle';               // idle | run | over
    let open = false, raf = 0, last = 0;
    let p, items, cam, camSpeed, coins, nextX, best = 0, dropT = 0;
    let wander = { target: W / 2, timer: 0 };

    const sx = it => it.x - cam;
    const platTop = tier => GROUND - tier * TIER;
    const BLK = 24, BLK_H = 16;

    function mkPlat(x, w, tier) {
        const n = Math.max(2, Math.round(w / BLK));
        const blocks = [];
        for (let i = 0; i < n; i++) {
            blocks.push({ kind: Math.random() < (tier === 2 ? 0.3 : 0.18) ? 'q' : 'brick', bump: 0 });
        }
        return { t: 'plat', x, w: n * BLK, tier, blocks };
    }

    function blockAt(plat, worldX) {
        const i = Math.floor((worldX - plat.x) / BLK);
        return i >= 0 && i < plat.blocks.length ? plat.blocks[i] : null;
    }

    function reset() {
        p = { x: W / 2, y: GROUND, vy: 0, jumps: 0, size: 40 };
        items = [];
        cam = 0;
        camSpeed = 30;
        coins = 0;
        nextX = W + 120;
        dropT = 0;
    }

    function generate() {
        while (nextX < cam + W + 240) {
            const r = Math.random();
            let adv = 0;
            if (r < 0.28) {
                items.push({ t: 'tree', x: nextX, base: GROUND, h: 38 + Math.random() * 18 });
                adv = 30;
            } else if (r < 0.5) {
                const w = 70 + Math.random() * 40;
                items.push({ t: 'gap', x: nextX, w });
                if (Math.random() < 0.6) {
                    items.push(mkPlat(nextX - 30, w + 60, 1));
                    items.push({ t: 'coin', x: nextX + w / 2, y: platTop(1) - 24 });
                }
                adv = w;
            } else if (r < 0.82) {
                const tier = Math.random() < 0.5 ? 1 : 2;
                const w = 150 + Math.random() * 80;
                if (tier === 2) {
                    items.push(mkPlat(nextX - 70, 90, 1));
                }
                const plat = mkPlat(nextX, w, tier);
                items.push(plat);
                if (Math.random() < 0.6) {
                    const bi = 1 + Math.floor(Math.random() * (plat.blocks.length - 2));
                    items.push({ t: 'tree', x: plat.x + bi * BLK + 1, base: platTop(tier), h: 32 + Math.random() * 8, plat, bi });
                }
                for (let i = 0; i < 3; i++) {
                    items.push({ t: 'coin', x: nextX + 20 + i * (w - 40) / 2, y: platTop(tier) - 26 });
                }
                adv = w;
            } else {
                for (let i = 0; i < 4; i++) {
                    items.push({ t: 'coin', x: nextX + i * 26, y: GROUND - 34 - Math.sin(i / 3 * Math.PI) * 40 });
                }
                adv = 100;
            }
            nextX += adv + 170 + Math.random() * 120;
        }
    }

    function jump() {
        if (mode === 'idle' && open) return;
        if (mode !== 'run') return;
        if (p.jumps < 2) {
            p.vy = JUMP_V;
            p.jumps++;
        }
    }

    function inGap(x) {
        return items.some(it => it.t === 'gap' && sx(it) < x + 8 && sx(it) + it.w > x - 8);
    }

    function physics(dt) {
        const prevY = p.y;
        p.vy -= GRAVITY * dt;
        p.y -= p.vy * dt;
        dropT = Math.max(0, dropT - dt);

        let floor = null;
        if (p.vy <= 0) {
            if (!inGap(p.x) && prevY <= GROUND + 1 && p.y >= GROUND) floor = GROUND;
            if (dropT <= 0) {
                for (const it of items) {
                    if (it.t !== 'plat') continue;
                    const top = platTop(it.tier);
                    const solid = [p.x - 8, p.x + 8].some(wx => {
                        const b = blockAt(it, wx + cam);
                        return b && b.kind !== 'gone';
                    });
                    if (solid && prevY <= top + 1 && p.y >= top) {
                        if (floor === null || top < floor) floor = top;
                    }
                }
            }
        }
        if (floor !== null) {
            p.y = floor;
            p.vy = 0;
            p.jumps = 0;
        }
    }

    function updateIdle(dt) {
        cam += camSpeed * dt;
        wander.timer -= dt;
        if (wander.timer <= 0) {
            wander.target = 50 + Math.random() * (W - 100);
            wander.timer = 1 + Math.random() * 2;
            if (Math.random() < 0.5 && p.y >= GROUND) p.vy = 520;
        }
        const d = wander.target - p.x;
        p.x += Math.sign(d) * Math.min(Math.abs(d), 70 * dt);
        physics(dt);
    }

    function updateRun(dt) {
        camSpeed = Math.min(230, camSpeed + dt * 7);
        cam += camSpeed * dt;
        generate();
        const prevPY = p.y;

        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        p.x = Math.max(20, Math.min(W - 20, p.x + dir * 190 * dt));
        physics(dt);

        if (p.y > H + 40) return die();

        const hw = p.size * 0.28, head = p.y - p.size * 0.8;
        const prevHead = prevPY - p.size * 0.8;
        for (const it of items) {
            const x = sx(it);
            if (it.t === 'plat') {
                const bottom = platTop(it.tier) + BLK_H;
                if (p.vy > 0 && prevHead >= bottom && head < bottom) {
                    const b = blockAt(it, p.x + cam);
                    if (b && b.kind !== 'gone' && b.kind !== 'used') {
                        if (b.kind === 'q') { b.kind = 'used'; coins += 3; }
                        else { b.kind = 'gone'; coins += 1; }
                        b.bump = 0.15;
                        p.vy = 0;
                    }
                }
                it.blocks.forEach(b => { b.bump = Math.max(0, b.bump - dt); });
            } else if (it.t === 'tree' && it.plat && it.plat.blocks[it.bi].kind === 'gone') {
                it.fall = true;
            }
            if (it.t === 'tree' && !it.fall) {
                if (p.x + hw > x + 4 && p.x - hw < x + 22 && p.y > it.base - it.h + 6 && p.y <= it.base + 6) return die();
            } else if (it.t === 'coin' && !it.got) {
                if (Math.abs(x - p.x) < 20 && it.y > head - 8 && it.y < p.y + 6) {
                    it.got = true;
                    coins++;
                }
            }
        }
        items = items.filter(it => sx(it) + (it.w || 30) > -60);
        updateScore();
    }

    function die() {
        mode = 'over';
        best = Math.max(best, Math.floor(cam / 10));
        btn.textContent = 'Play';
        btn.setAttribute('aria-pressed', 'false');
        updateScore();
    }

    function updateScore() {
        scoreEl.textContent = Math.floor(cam / 10) + ' m · ' + coins + ' ★' + (best ? ' · best ' + best + ' m' : '');
    }

    function rr(x, y, w, h, r, fill) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
    }

    function drawTree(x, base, h) {
        ctx.fillStyle = '#6b4a35';
        ctx.fillRect(x + 9, base - 7, 4, 7);
        ctx.fillStyle = '#3fb97d';
        const layers = 3, lh = (h - 7) / layers;
        for (let i = 0; i < layers; i++) {
            const w = 12 - i * 2, y = base - 7 - i * lh * 0.72;
            ctx.beginPath();
            ctx.moveTo(x + 11 - w, y);
            ctx.lineTo(x + 11 + w, y);
            ctx.lineTo(x + 11, y - lh);
            ctx.closePath();
            ctx.fill();
        }
    }

    function draw() {
        ctx.fillStyle = '#12131a';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#232536';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const off = cam % GRID;
        for (let x = -off; x <= W; x += GRID) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, H); }
        for (let y = GROUND % GRID; y <= H; y += GRID) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
        ctx.stroke();

        // ground as rounded bars between gaps
        const gaps = items.filter(it => it.t === 'gap').map(it => [sx(it), sx(it) + it.w]).sort((a, b) => a[0] - b[0]);
        let x = -20;
        const seg = (a, b) => { if (b > a) rr(a, GROUND, b - a, 14, 7, '#c8d0f0'); };
        for (const [a, b] of gaps) { seg(x, Math.min(a, W + 20)); x = Math.max(x, b); }
        seg(x, W + 20);

        for (const it of items) {
            const px = sx(it);
            if (it.t === 'plat') {
                const top = platTop(it.tier);
                it.blocks.forEach((b, i) => {
                    if (b.kind === 'gone') return;
                    const bx = px + i * BLK, by = top - (b.bump > 0 ? 5 : 0);
                    const fill = b.kind === 'q' ? '#ffcb3d' : b.kind === 'used' ? '#5a5d73' : '#8b7cf6';
                    rr(bx + 1, by, BLK - 2, BLK_H, 4, fill);
                    if (b.kind === 'q') {
                        ctx.fillStyle = '#7a5600';
                        ctx.font = 'bold 12px Poppins, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('?', bx + BLK / 2, by + 12);
                    }
                });
            }
        }
        for (const it of items) {
            const px = sx(it);
            if (it.t === 'tree') { if (!it.fall) drawTree(px, it.base, it.h); }
            else if (it.t === 'coin' && !it.got) {
                ctx.fillStyle = '#ffcb3d';
                ctx.beginPath();
                ctx.arc(px, it.y, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (sprite.complete && sprite.naturalWidth) {
            ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size, p.size, p.size);
        } else {
            ctx.fillStyle = '#e4572e';
            ctx.fillRect(p.x - 14, p.y - 28, 28, 28);
        }

        ctx.textAlign = 'center';
        if (mode === 'over') {
            ctx.fillStyle = 'rgba(18,19,26,.72)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Poppins, sans-serif';
            ctx.fillText('Game over · ' + Math.floor(cam / 10) + ' m', W / 2, H / 2 - 4);
            ctx.font = '13px Poppins, sans-serif';
            ctx.fillText('Press Play to try again', W / 2, H / 2 + 22);
        }
    }

    function loop(t) {
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        if (mode === 'idle') updateIdle(dt);
        else if (mode === 'run') updateRun(dt);
        draw();
        raf = requestAnimationFrame(loop);
    }

    function toIdle() {
        mode = 'idle';
        reset();
        btn.textContent = 'Play';
        btn.setAttribute('aria-pressed', 'false');
        updateScore();
    }

    function start() {
        const x = p.x;
        reset();
        p.x = x;
        mode = 'run';
        btn.textContent = 'Stop';
        btn.setAttribute('aria-pressed', 'true');
    }

    function openModal() {
        open = true;
        modal.classList.add('open');
        toIdle();
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
    }

    function closeModal() {
        open = false;
        cancelAnimationFrame(raf);
        modal.classList.remove('open');
    }

    hero.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    btn.addEventListener('click', () => (mode === 'run' ? toIdle() : start()));

    window.addEventListener('keydown', e => {
        if (!open) return;
        const k = e.key;
        if (k === 'Escape') return closeModal();
        if (k === 'ArrowLeft' || k === 'a') keys.left = true;
        else if (k === 'ArrowRight' || k === 'd') keys.right = true;
        else if (k === 'ArrowDown' || k === 's') { if (mode === 'run') dropT = 0.25; }
        else if (k === ' ' || k === 'ArrowUp' || k === 'w') { if (!e.repeat) jump(); }
        else return;
        e.preventDefault();
    });
    window.addEventListener('keyup', e => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });

    // touch: left/right thirds move, tap upper half jumps
    canvas.addEventListener('pointerdown', e => {
        const r = canvas.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        if (fy < 0.5) jump();
        keys.left = fx < 0.33;
        keys.right = fx > 0.66;
    });
    canvas.addEventListener('pointerup', () => { keys.left = keys.right = false; });

    reset();
    sprite.onload = () => { if (!open) draw(); };
})();
