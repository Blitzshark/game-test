/* coolgame.js — 2D wave survival shooter for bookmarklet hosting */

(function(){

// ==== SETUP CANVAS ====
let game = document.createElement("canvas");
game.width = 900;
game.height = 600;
game.style.position = "fixed";
game.style.left = "0";
game.style.top = "0";
game.style.zIndex = "999999";
game.style.background = "#111";
document.body.appendChild(game);
let ctx = game.getContext("2d");

// ==== GAME STATE ====
let player = {
    x: 450, y: 300,
    r: 12,
    speed: 3,
    hp: 100,
    maxHp: 100,
    fireRate: 300,
    lastShot: 0,
    damage: 10,
    xp: 0,
    level: 1
};

let bullets = [];
let enemies = [];
let cardsOnScreen = false;
let wave = 1;
let nextWaveTime = Date.now() + 8000;

// ==== CARD UPGRADES ====
let upgrades = [
    { name: "Faster Fire Rate",   stat:"fireRate", change:-40 },
    { name: "More Damage",        stat:"damage",   change:+4  },
    { name: "More Speed",         stat:"speed",    change:+0.4},
    { name: "Max HP +20",         stat:"maxHp",    change:+20 },
    { name: "Bullet Size +3",     stat:"bulletR",  change:+3  },
];

// default bullet radius
player.bulletR = 4;

// ==== INPUT ====
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

game.addEventListener("mousemove", e => {
    const rect = game.getBoundingClientRect();
    player.mx = e.clientX - rect.left;
    player.my = e.clientY - rect.top;
});

game.addEventListener("click", () => {
    if (cardsOnScreen) return;
    shoot();
});

// ==== FUNCTIONS ====

function shoot() {
    if (Date.now() - player.lastShot < player.fireRate) return;
    player.lastShot = Date.now();

    let angle = Math.atan2(player.my - player.y, player.mx - player.x);
    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle)*8,
        dy: Math.sin(angle)*8,
        r: player.bulletR
    });
}

function spawnEnemies() {
    for (let i = 0; i < wave + 2; i++) {
        enemies.push({
            x: Math.random()*900,
            y: Math.random()*600,
            r: 10 + wave,
            hp: 20 + wave*5,
            speed: 1 + wave*0.2
        });
    }
}

function movePlayer() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // boundaries
    player.x = Math.max(0, Math.min(900, player.x));
    player.y = Math.max(0, Math.min(600, player.y));
}

function moveEnemies() {
    for (let e of enemies) {
        let ang = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(ang)*e.speed;
        e.y += Math.sin(ang)*e.speed;

        // collision with player
        if (dist(e, player) < e.r + player.r) {
            player.hp -= 0.3;
        }
    }
}

function moveBullets() {
    for (let b of bullets) {
        b.x += b.dx;
        b.y += b.dy;
    }
    bullets = bullets.filter(b => b.x>0 && b.x<900 && b.y>0 && b.y<600);
}

function bulletHits() {
    for (let b of bullets) {
        for (let e of enemies) {
            if (dist(b,e) < b.r + e.r) {
                e.hp -= player.damage;
                b.hit = true;
                if (e.hp <= 0) {
                    e.dead = true;
                    player.xp += 10;
                }
            }
        }
    }
    bullets = bullets.filter(b => !b.hit);
    enemies = enemies.filter(e => !e.dead);
}

function dist(a,b) {
    return Math.hypot(a.x-b.x, a.y-b.y);
}

function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();
}

function drawEnemies() {
    ctx.fillStyle = "red";
    for (let e of enemies) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawBullets() {
    ctx.fillStyle = "yellow";
    for (let b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("HP: " + Math.floor(player.hp), 10, 20);
    ctx.fillText("Wave: " + wave, 10, 40);
    ctx.fillText("XP: " + player.xp, 10, 60);
}

function checkLevelUp() {
    let needed = player.level * 50;
    if (player.xp >= needed) {
        player.xp -= needed;
        player.level++;
        showUpgradeCards();
    }
}

function showUpgradeCards() {
    cardsOnScreen = true;

    let picks = [];
    while (picks.length < 3) {
        let c = upgrades[Math.floor(Math.random()*upgrades.length)];
        if (!picks.includes(c)) picks.push(c);
    }

    drawCards(picks);
}

function drawCards(cards) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0,0,900,600);

    ctx.fillStyle = "white";
    ctx.font = "26px Arial";
    ctx.fillText("Choose an Upgrade", 320, 100);

    cards.forEach((card,i) => {
        let x = 150 + i*250;
        ctx.fillStyle = "#333";
        ctx.fillRect(x,200,200,200);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(card.name, x+20, 260);

        card.box = {x, y:200, w:200, h:200};
    });

    game.onclick = e => {
        let rect = game.getBoundingClientRect();
        let mx = e.clientX - rect.left;
        let my = e.clientY - rect.top;

        for (let card of cards) {
            if (mx > card.box.x && mx < card.box.x+card.box.w &&
                my > card.box.y && my < card.box.y+card.box.h) {
                
                player[card.stat] += card.change;
                cardsOnScreen = false;
                game.onclick = null;
            }
        }
    };
}

function waveLogic() {
    if (Date.now() > nextWaveTime) {
        wave++;
        nextWaveTime = Date.now() + 8000;
        spawnEnemies();
    }
}

// ==== MAIN LOOP ====

function loop() {
    if (player.hp <= 0) {
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,900,600);
        ctx.fillStyle="white";
        ctx.font="40px Arial";
        ctx.fillText("GAME OVER", 330, 300);
        return;
    }

    if (!cardsOnScreen) {
        movePlayer();
        moveBullets();
        moveEnemies();
        bulletHits();
        checkLevelUp();
        waveLogic();
    }

    ctx.clearRect(0,0,900,600);
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawHUD();

    requestAnimationFrame(loop);
}

spawnEnemies();
loop();

alert("WASD to move • Click to shoot • Survive waves • Level up to pick upgrades!");

})();
