const Canvas = require('canvas');
const CanvasGif = require('canvas-gif');
const fs = require('fs');

const DEBUG = false;
const GIF_WIDTH = 640;
const CUTIN_HEIGHT = 84;

function loadAvatarConfig() {
    const avatarConfig = require('../avatars/avatars.json');
    if (avatarConfig["default"] === undefined) throw "avatars.json does not contain 'default' key";
    return avatarConfig;
}

function getAvatarCenter(currentFrame, flipped) {
    let center = 0;
    
    const frameMiddle = 5;
    const posMiddle = 161;
    const frameEnd = 40;
    const posEnd = 234;

    if (currentFrame <= frameMiddle) {
        center = posMiddle - 92 * (frameMiddle - currentFrame);
    } else {
        const progress = (currentFrame - frameMiddle) / (frameEnd - frameMiddle);
        const ease = 1 - Math.pow(1 - progress, 5);
        const range = posEnd - posMiddle;
        center = posMiddle + ease * range;
    }

    if (flipped) center = GIF_WIDTH - center;

    return center;
}

module.exports = {
    GIF_DURATION: 3600,

    async generateBuffer(user1, user2) {
        const users = [user1, user2];

        const avatarConfig = loadAvatarConfig();

        const startTime = Date.now();

        const avatars = await Promise.all(users.map(function(user, i) {
            return module.exports.avatarCutIn(user.username, user, avatarConfig, i === 1);
        }));

        const frameCropHeights = [ 0, 30, 76 ];
        const gifBuffer = await CanvasGif(
            'modules/nominationGifBg.gif',
            function (ctx, width, height, totalFrames, currentFrame) {
                const frameCropHeight = frameCropHeights[currentFrame - 1];
                if (frameCropHeight === 0) return;

                for (let i = 0; i < 2; i++) {
                    const avatar = avatars[i];
                    
                    const height = frameCropHeight || avatar.height;
                    const yCenter = i ? 230 : 80;
                    const y = yCenter - height / 2;
                    const xCenter = getAvatarCenter(currentFrame, i == 1);
                    const x = xCenter - avatar.width / 2;

                    ctx.drawImage(
                        avatar,
                        0, (avatar.height - height) / 2, avatar.width, height,
                        x, y, avatar.width, height,
                    );
                }
            },
            {
                fps: 10,
                repeat: -1,
                optimiser: true,
                quality: 80,
            }
        )

        if (DEBUG) {
            const ms = Date.now() - startTime;
            console.log(`Generated nomination gif in ${ms} ms (${user1.username} vs ${user2.username})`);
        }

        return gifBuffer;
    },

    async avatarCutIn(username, user = null, avatarConfig = null, flipped = false) {
        if (avatarConfig === null) avatarConfig = loadAvatarConfig();

        const path = "avatars/" + username + ".png";

        let left = avatarConfig[username]?.left || avatarConfig["default"].left;
        let degrees = avatarConfig[username]?.degrees || avatarConfig["default"].degrees;
        let eyeLevel = avatarConfig[username]?.eyeLevel || avatarConfig["default"].eyeLevel;
        let cropPercentage = 0.25;

        let image;
        if (fs.existsSync(path)) {
            image = await Canvas.loadImage(path);
        } else if (user !== null) {
            image = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png' }));
            cropPercentage = 0.6;
            eyeLevel = 0.5;
        } else {
            throw `No avatar for user ${username}`;
        }

        const height = CUTIN_HEIGHT / cropPercentage;
        const width = height * image.width / image.height;
        const x = -width / 2;
        const y = -height / 2 + height * (0.5 - eyeLevel);

        const canvas = Canvas.createCanvas(GIF_WIDTH, CUTIN_HEIGHT);
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (left !== flipped) ctx.scale(-1, 1);

        if (left) degrees *= -1;
        ctx.rotate(degrees * Math.PI / 180);

        ctx.drawImage(image, x, y, width, height);
        ctx.restore();

        return canvas;
    },

    async testCutins() {
        const avatarFiles = fs.readdirSync('avatars').filter(file => file.endsWith('.png'));
        const cutins = [];
        for (const file of avatarFiles) {
            const username = file.replace(/\.png$/, '');
            const cutin = await module.exports.avatarCutIn(username);
            cutins.push(cutin);
        }
    
        if (cutins.length === 0) throw "No avatars to test in avatars folder";
    
        const width = 640;
        const height = 84;
    
        const canvas = Canvas.createCanvas(width, height * cutins.length);
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < cutins.length; i++) {
            const cutin = cutins[i];
            ctx.drawImage(cutin, 0, height * i);
        }
    
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync("./nominationGifTest.png", buffer);
    }
}
