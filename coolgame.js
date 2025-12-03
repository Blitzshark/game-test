(async function() {
    // ==== LOAD IMAGES ====
    const IMAGES = {
        player: "https://raw.githubusercontent.com/Blitzshark/game-test/main/player.png",
        slash: "https://raw.githubusercontent.com/Blitzshark/game-test/main/slash.png",
        enemy: "https://raw.githubusercontent.com/Blitzshark/game-test/main/fire%20ball.png",
        fireball: "https://raw.githubusercontent.com/Blitzshark/game-test/main/basic%20fire%20guy.png",
        explosion: "https://raw.githubusercontent.com/Blitzshark/game-test/main/Fire%20explose.png"
    };

    function loadImage(url) {
        return new Promise(res => {
            const img = new Image();
            img.src = url;
            img.onload = () => res(img);
        });
    }

    const sprites = {};
    for (const k in IMAGES) sprites[k] = await loadImage(IMAGES[k]);

    // ==== CANVAS SETUP ====
    const canvas = document.createElement("canvas");
    document.body.innerHTML = "";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
    resize();
    onresize = resize;

    // ==== PLAYER ====
    const player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: 48,
        h: 48,
        frame: 0,
        frameTimer: 0,
        dir: "center",  
        speed: 4,
        hp: 100,
        orbs: 0
    };

    // ==== INPUT ====
    const keys = {};
    onkeydown = e => keys[e.key] = true;
    onkeyup = e => keys[e.key] = false;

    // ==== GAME STATE ====
    let enemies = [];
    let projectiles = [];
    let slashes = [];
    let explosions = [];
    let wave = 1;
    let waveTimer = 0;

    // ==== ENEMY SPAWNING ====
    function spawnEnemy() {
        const side = Math.random() * 4;
        let x, y;

        if (side < 1) { x = -50; y = Math.random() * canvas.height; }
        else if (side < 2) { x = canvas.width + 50; y = Math.random() * canvas.height; }
        else if (side < 3) { x = Math.random() * canvas.width; y = -50; }
        else { x = Math.random() * canvas.width; y = canvas.height + 50; }

        enemies.push({
            x, y,
            w: 40,
            h: 40,
            hp: wave === 10 ? 300 : 40,
            boss: wave === 10
        });
    }

    function spawnWave() {
        let count = wave === 10 ? 1 : wave * 3;
        for (let i = 0; i < count; i++) spawnEnemy();
    }

    spawnWave();

    // ==== SLASH ATTACK ====
    function doSlash() {
        slashes.push({
            x: player.x,
            y: player.y,
            dir: player.dir,
            lifetime: 10
        });
    }

    // ==== COLLISION ====
    function hit(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    // ==== MAIN LOOP ====
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // === Player movement ===
        if (keys["w"]) player.y -= player.speed;
        if (keys["s"]) player.y += player.speed;
        if (keys["a"]) player.x -= player.speed;
        if (keys["d"]) player.x += player.speed;

        // === Slash input ===
        if (keys[" "]) {
            if (!player.slashCooldown) {
                player.slashCooldown = 20;
                doSlash();
            }
        }
        if (player.slashCooldown > 0) player.slashCooldown--;

        // === Player animation ===
        player.frameTimer++;
        if (player.frameTimer > 10) {
            player.frameTimer = 0;
            player.frame = (player.frame + 1) % 4;
        }

        // === DRAW PLAYER ===
        const frameW = sprites.player.width / 4;
        const frameH = sprites.player.height;

        ctx.drawImage(
            sprites.player,
            frameW * player.frame, 0, frameW, frameH,
            player.x - player.w / 2, player.y - player.h / 2,
            player.w, player.h
        );

        // === Update slashes ===
        for (let i = slashes.length - 1; i >= 0; i--) {
            let s = slashes[i];
            s.lifetime--;

            let sx = s.x - 40, sy = s.y - 40;
            if (s.dir === "up") sy -= 20;
            if (s.dir === "down") sy += 20;

            ctx.drawImage(sprites.slash, sx, sy, 80, 80);

            if (s.lifetime <= 0) slashes.splice(i, 1);
        }

        // === Enemies update ===
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];

            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.hypot(dx, dy);

            e.x += dx / dist * 1.2;
            e.y += dy / dist * 1.2;

            // Draw enemy
            ctx.drawImage(sprites.enemy, e.x - e.w/2, e.y - e.h/2, e.w, e.h);

            // Slash hit
            for (let s of slashes) {
                if (hit(
                    {x: s.x-30, y: s.y-30, w:60, h:60},
                    e
                )) {
                    e.hp -= 40;
                }
            }

            // Enemy dead
            if (e.hp <= 0) {
                enemies.splice(i, 1);
                explosions.push({x:e.x, y:e.y, life:20});
                player.orbs++;

                if (player.orbs >= 5) {
                    player.orbs = 0;
                    // TODO: show card popup
                }
            }
        }

        // === Explosion animation ===
        for (let i = explosions.length - 1; i >= 0; i--) {
            let ex = explosions[i];
            ex.life--;

            ctx.globalAlpha = ex.life / 20;
            ctx.drawImage(sprites.explosion, ex.x-32, ex.y-32, 64, 64);
            ctx.globalAlpha = 1;

            if (ex.life <= 0) explosions.splice(i, 1);
        }

        // === Wave check ===
        if (enemies.length === 0) {
            wave++;
            spawnWave();
        }

        requestAnimationFrame(loop);
    }

    loop();
})();
