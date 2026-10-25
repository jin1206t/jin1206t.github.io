(function () {
    const PLAYER_SPRITE = 'assets/imgs/Cat_Ski.png';

    const modal = document.getElementById('ski-modal');
    const canvas = document.getElementById('ski-canvas');
    const btn = document.getElementById('ski-toggle');
    const closeBtn = document.getElementById('ski-close');
    const scoreEl = document.getElementById('ski-score');
    const hero = document.getElementById('hero-avatar');
    const ctx = canvas.getContext('2d');
    let W = canvas.width;
    const H = canvas.height;

    const GROUND = H - 30;
    const TIER = 58;                 // vertical distance between layers
    const GRAVITY = 1900, JUMP_V = 560, BOOST_JUMP_V = 800;
    const GRID = 32;

    const sprite = new Image();
    sprite.src = PLAYER_SPRITE;

    const keys = { left: false, right: false };
    let mode = 'idle';               // idle | run | over
    let open = false, raf = 0, last = 0;
    let p, items, cam, camSpeed, stars, boost, magnet, hearts, floaters, nextX, sinceUpper, best = 0, dropT = 0, nextBoost = Math.random() < 0.5;
    let wander = { target: W / 2, timer: 0 };

    const sx = it => it.x - cam;
    const platTop = tier => GROUND - tier * TIER;
    const BLK = 24, BLK_H = 16;

    function mkPlat(x, w, tier) {
        const n = Math.max(2, Math.round(w / BLK));
        const blocks = [];
        for (let i = 0; i < n; i++) blocks.push({ kind: 'brick', bump: 0 });
        // power-up blocks are rare: at most one per platform
        if (Math.random() < (tier === 2 ? 0.35 : 0.2)) blocks[Math.floor(Math.random() * n)].kind = 'q';
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
        stars = 0;
        boost = 0;
        magnet = 0;
        hearts = 5;
        floaters = [];
        nextX = W + 20;
        sinceUpper = 0;
        dropT = 0;
    }

    function star(x, y) { return { t: 'coin', x, y, icon: '⭐', fish: false }; }
    function fish(x, y) { return { t: 'coin', x, y, icon: '🐟', fish: true }; }

    // stars along an arch, easy to sweep up in one jump
    function arch(x0, baseY, n, height) {
        for (let i = 0; i < n; i++) {
            const k = n === 1 ? 0.5 : i / (n - 1);
            items.push(star(x0 + i * 24, baseY - Math.sin(k * Math.PI) * height));
        }
    }

    // mostly one or two lone stars; a full arch only now and then
    function starsAt(x0, baseY, n, height, span) {
        if (Math.random() < 0.05) return arch(x0, baseY, n, height);
        const cnt = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < cnt; i++) {
            items.push(star(x0 + span * (0.3 + 0.4 * Math.random()) + i * 40, baseY - height * (0.4 + 0.6 * Math.random())));
        }
    }

    // keep spawned things out of awkward spots: no pickups under or inside platforms,
    // no ground trees right next to gaps or under platforms (fish above a tree is the exception)
    function tidy(from) {
        const fresh = items.slice(from);
        const plats = items.filter(it => it.t === 'plat');
        const gaps = items.filter(it => it.t === 'gap');
        const trees = items.filter(it => it.t === 'tree');
        const drop = new Set();
        for (const it of fresh) {
            if (it.t === 'coin' && !it.keep) {
                for (const pl of plats) {
                    const top = platTop(pl.tier);
                    if (it.x > pl.x - 14 && it.x < pl.x + pl.w + 14 && it.y > top - 14) drop.add(it);
                }
                for (const tr of trees) {
                    if (it.x > tr.x - 14 && it.x < tr.x + 36 && it.y > tr.base - tr.h - 12) drop.add(it);
                }
            } else if (it.t === 'tree' && !it.plat) {
                for (const pl of plats) {
                    if (it.x > pl.x - 50 && it.x < pl.x + pl.w + 50) drop.add(it);
                }
                for (const g of gaps) {
                    if (it.x > g.x - 60 && it.x < g.x + g.w + 40) drop.add(it);
                }
            }
        }
        items = items.filter(it => !drop.has(it));
        // fish that belonged to a removed tree go with it
        items = items.filter(it => !(it.keep && it.owner && drop.has(it.owner)));
    }

    function treeWithFish(x, base, h, plat, bi) {
        const tr = { t: 'tree', x, base, h, plat, bi };
        items.push(tr);
        if (Math.random() < 0.5) {
            const f = fish(x + 11, base - h - 22);
            f.keep = true;
            f.owner = tr;
            items.push(f);
        }
    }

    function generate() {
        while (nextX < cam + W + 240) {
            const from = items.length;
            const r = sinceUpper >= 2 ? 0.6 : Math.random();
            let adv = 0;
            if (r >= 0.45 && r < 0.78) sinceUpper = 0; else sinceUpper++;
            if (r < 0.22) {
                treeWithFish(nextX, GROUND, 38 + Math.random() * 16);
                adv = 30;
            } else if (r < 0.45) {
                const w = 70 + Math.random() * 40;
                items.push({ t: 'gap', x: nextX, w });
                if (Math.random() < 0.6) starsAt(nextX - 4, GROUND - 44, Math.round((w + 8) / 24) + 1, 50, w);
                if (Math.random() < 0.25) items.push(mkPlat(nextX - 30, w + 60, 1));
                adv = w;
            } else if (r < 0.78) {
                const tier = Math.random() < 0.5 ? 1 : 2;
                const w = 150 + Math.random() * 80;
                if (tier === 2) items.push(mkPlat(nextX - 70, 90, 1));
                const plat = mkPlat(nextX, w, tier);
                items.push(plat);
                if (Math.random() < 0.55) {
                    const bi = 1 + Math.floor(Math.random() * (plat.blocks.length - 2));
                    treeWithFish(plat.x + bi * BLK + 1, platTop(tier), 32 + Math.random() * 8, plat, bi);
                } else if (Math.random() < 0.7) {
                    starsAt(plat.x + 20, platTop(tier) - 26, 5, 34, w - 40);
                }
                adv = w;
            } else {
                if (Math.random() < 0.85) starsAt(nextX, GROUND - 28, 6, 56, 120);
                if (Math.random() < 0.35) items.push(fish(nextX + 140, GROUND - 30));
                adv = 150;
            }
            tidy(from);
            nextX += adv + 170 + Math.random() * 120;
        }
    }

    function jump() {
        if (mode === 'idle' && open) return;
        if (mode !== 'run') return;
        if (p.jumps < 2) {
            p.vy = boost > 0 ? BOOST_JUMP_V : JUMP_V;
            p.jumps++;
        }
    }

    // releasing jump early gives a shorter hop
    function cutJump() {
        if (mode === 'run' && p.vy > 260) p.vy *= 0.55;
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
        camSpeed = Math.min(180, camSpeed + dt * 22);
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        // holding right speeds the world up a little; moving left never slows the forced scroll
        boost = Math.max(0, boost - dt);
        magnet = Math.max(0, magnet - dt);
        cam += camSpeed * (dir > 0 ? 1.2 : 1) * (boost > 0 ? 1.25 : 1) * dt;
        generate();
        const prevPY = p.y;

        // run speed always beats the scroll speed, so you can still run back for things you missed
        const runSpeed = (100 + camSpeed * 0.9) * (boost > 0 ? 1.25 : 1);
        p.x = Math.max(20, Math.min(W - 20, p.x + dir * runSpeed * (dir > 0 ? 0.8 : 1.3) * dt));
        physics(dt);

        if (p.y > H + 40) return die();

        const hw = p.size * 0.28;
        let head = p.y - p.size * 0.8;
        const prevHead = prevPY - p.size * 0.8;
        for (const it of items) {
            const x = sx(it);
            if (it.t === 'plat') {
                const top = platTop(it.tier), bottom = top + BLK_H;
                // ceiling: every non-gone block under the head is solid, only the nearest one reacts
                if (p.vy > 0 && prevHead >= bottom - 1 && head < bottom) {
                    const solid = [p.x, p.x - hw * 0.6, p.x + hw * 0.6]
                        .map(wx => blockAt(it, wx + cam))
                        .filter(b => b && b.kind !== 'gone');
                    if (solid.length) {
                        const b = solid[0];
                        const bi = it.blocks.indexOf(b);
                        const bx = x + (bi + 0.5) * BLK;
                        if (b.kind === 'q') {
                            b.kind = 'used';
                            nextBoost = !nextBoost;
                            if (nextBoost) {
                                boost = 5;
                                floaters.push({ x: bx + cam, y: top - 6, icon: '🎿', life: 1 });
                                floaters.push({ x: p.x, y: p.y - p.size - 14, text: 'POWER UP! Jump higher · Run faster', life: 1.8, screen: true });
                            } else {
                                magnet = 8;
                                floaters.push({ x: bx + cam, y: top - 6, icon: '🐝', life: 1 });
                                floaters.push({ x: p.x, y: p.y - p.size - 14, text: 'MAGNET! Items fly to you', life: 1.8, screen: true });
                            }
                            b.bump = 0.15;
                        } else if (b.kind === 'brick') {
                            b.kind = 'gone';
                            hearts--;
                            if (hearts <= 0) return die();
                            floaters.push({ x: bx + cam, y: top - 6, icon: '💔', life: 1 });
                            b.bump = 0.15;
                        }
                        p.y = bottom + p.size * 0.8;
                        p.vy = 0;
                        head = bottom;
                    }
                }
                // sides: push the player out of blocks instead of letting him pass through
                for (let i = 0; i < it.blocks.length; i++) {
                    if (it.blocks[i].kind === 'gone') continue;
                    const bx = x + i * BLK;
                    if (p.x + hw > bx && p.x - hw < bx + BLK && head < bottom - 1 && p.y - 2 > top + 1) {
                        p.x = p.x < bx + BLK / 2 ? bx - hw : bx + BLK + hw;
                        p.x = Math.max(20, Math.min(W - 20, p.x));
                    }
                }
                it.blocks.forEach(b => { b.bump = Math.max(0, b.bump - dt); });
            } else if (it.t === 'tree' && it.plat && it.plat.blocks[it.bi].kind === 'gone') {
                it.fall = true;
            }
            if (it.t === 'tree' && !it.fall) {
                if (p.x + hw > x + 4 && p.x - hw < x + 22 && p.y > it.base - it.h + 6 && p.y <= it.base + 6) return die();
            } else if (it.t === 'coin' && !it.got) {
                if (magnet > 0) {
                    const tx = p.x + cam, ty = p.y - p.size * 0.5;
                    const dx = tx - it.x, dy = ty - it.y, d = Math.hypot(dx, dy);
                    if (d < 170 && d > 1) {
                        const s = Math.min(d, 420 * dt);
                        it.x += dx / d * s;
                        it.y += dy / d * s;
                    }
                }
                if (Math.abs(sx(it) - p.x) < 20 && it.y > head - 8 && it.y < p.y + 6) {
                    it.got = true;
                    if (it.fish) hearts++; else stars++;
                }
            }
        }
        for (const f of floaters) { f.y -= 40 * dt; f.life -= dt * (f.text ? 0.6 : 1.2); }
        floaters = floaters.filter(f => f.life > 0);
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
        scoreEl.textContent = Math.floor(cam / 10) + ' m · ❤️ ' + hearts + ' · ⭐ ' + stars + (boost > 0 ? ' · 🎿 ' + Math.ceil(boost) + 's' : '') + (magnet > 0 ? ' · 🐝 ' + Math.ceil(magnet) + 's' : '') + (best ? ' · best ' + best + ' m' : '');
    }

    function rr(x, y, w, h, r, fill) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
    }

    function drawTree(x, base, h) {
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(x + 9, base - 7, 4, 7);
        ctx.fillStyle = '#3fae5a';
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
        const seg = (a, b) => { if (b > a) rr(a, GROUND, b - a, H - GROUND + 12, 8, '#f4f8ff'); };
        for (const [a, b] of gaps) { seg(x, Math.min(a, W + 20)); x = Math.max(x, b); }
        seg(x, W + 20);

        for (const it of items) {
            const px = sx(it);
            if (it.t === 'plat') {
                const top = platTop(it.tier);
                it.blocks.forEach((b, i) => {
                    if (b.kind === 'gone') return;
                    const bx = px + i * BLK, by = top - (b.bump > 0 ? 5 : 0);
                    const fill = b.kind === 'q' ? '#ffcb3d' : b.kind === 'used' ? '#3a3c4b' : '#6b7088';
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
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(it.icon, px, it.y + 6);
            }
        }
        for (const f of floaters) {
            ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
            ctx.textAlign = 'center';
            if (f.text) {
                ctx.font = 'bold 13px Poppins, sans-serif';
                ctx.fillStyle = '#ffcb3d';
                ctx.fillText(f.text, Math.max(110, Math.min(W - 110, f.x)), f.y);
            } else {
                ctx.font = '18px sans-serif';
                ctx.fillText(f.icon, sx(f), f.y);
            }
        }
        ctx.globalAlpha = 1;

        if (sprite.complete && sprite.naturalWidth) {
            ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size, p.size, p.size);
        } else {
            ctx.fillStyle = '#e4572e';
            ctx.fillRect(p.x - 14, p.y - 28, 28, 28);
        }

        if (magnet > 0) {
            const t = performance.now() / 1000;
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🐝', p.x + Math.cos(t * 5) * 30, p.y - p.size - 4 + Math.sin(t * 7) * 8);
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
        camSpeed = 35;
        btn.textContent = 'Stop';
        btn.setAttribute('aria-pressed', 'true');
    }

    function fit() {
        const w = Math.max(320, Math.round(modal.clientWidth || window.innerWidth));
        if (w === W) return;
        W = canvas.width = w;
        if (p) p.x = Math.min(p.x, W - 20);
    }

    function openModal() {
        open = true;
        modal.classList.add('open');
        fit();
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
    window.addEventListener('resize', () => { if (open) fit(); });
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
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') cutJump();
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
