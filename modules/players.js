const fs = require('fs');

const PLAYER_ROLE_ID = "1229093893824581663"; // TODO
const PLAYER_NICKNAME_REGEX = /^[0-9][0-9]?\. \p{Emoji}* ?/gu;

module.exports = {
    async remove(user, guild) {
        const server = './data/' + guild.id;

        var game = JSON.parse(fs.readFileSync(server + '/game.json'));
        var players = game["players"]

        const id = user.id;

        if (!players.includes(id)) {
            throw 'Player not in game';
        }

        const position = players.indexOf(id);
        players.splice(position, 1);
        game['players'] = players;

        fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
            if (err) {
                console.error(err);
            }
        });

        fs.rmSync(server + '/' + id + '.json');

        let nicknameError = "";
        try {
            await module.exports.clearPlayer(user.id, guild);
        } catch {
            nicknameError = " (could not update nickname)";
        }
        module.exports.updateNicknamesFrom(guild, position, game);

        return {
            user,
            nicknameError,
        }
    },

    async add(player, emoji, guild, name=null, position=null) {
        if (player.bot) {
            throw 'Wow. Hillarious. That\'s so funny. I\'m laughing so hard right now. What a clever joke. What an amazing joke. I bet you\'re really proud of yourself for that joke.';
        }

        // Check if the message contains any custom server emojis
        var emojis = emoji.match(/<a?:\w+:\d+>/g);

        if (emojis != null) {
            emoji = emojis[0]
        }
        else {
            // Check if the message contains any Unicode emoji characters
            emojis = emoji.match(/\p{Emoji}/gu);
            if (emojis != null) {
                emoji = emojis[0]
            }
            else {
                throw 'Cannot read emoji!';
            }
        }

        name = name ?? player.globalName;
        const id = player.id;

        const server = './data/' + guild.id;

        var game = JSON.parse(fs.readFileSync(server + '/game.json'));
        var players = game["players"]

        if (players.includes(id)) {
            throw 'Player is already in the game!';
        }

        position = position ?? players.length;

        if (position < 0 || position > players.length) {
            throw 'Invalid position! There are ' + players.length + ' people playing, position must be between 1 and ' + (players.length + 1);
        }
        
        players.splice(position, 0, id);
        game['players'] = players

        fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
            if (err) {
                console.error(err);
            }
        });

        const init = {"name":name,"canvote":true,"alive":true,"emoji":emoji};

        fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(init), {flag: 'w+'}, err => {
            if (err) {
                console.error(err);
            }
        });

        const member = await guild.members.fetch(player);
        await member.roles.add(PLAYER_ROLE_ID);

        let nicknameError = "";
        try {
            await module.exports.updateNickname(player.id, guild, game);
        } catch {
            nicknameError = " (could not update nickname)";
        }
        module.exports.updateNicknamesFrom(guild, position + 1, game);

        return {
            name,
            emoji,
            position,
            nicknameError,
        };
    },

    async updateNicknamesFrom(guild, position, game=null) {
        if (game === null) {
            const server = './data/' + guild.id;
            game = JSON.parse(fs.readFileSync(server + '/game.json'));
        }
        const players = game["players"];
        let promises = [];

        for (let i = position; i < players.length; i++) {
            promises.push(module.exports.updateNickname(players[i], guild, game).catch(function(e) {
                console.error(e);
            }));
        }

        await Promise.allSettled(promises);
    },

    async updateNickname(id, guild, game=null) {
        if (game === null) {
            const server = './data/' + guild.id;
            game = JSON.parse(fs.readFileSync(server + '/game.json'));
        }
        try {
            const playerData = JSON.parse(fs.readFileSync('./data/' + guild.id + '/' + id + '.json'));

            const number = (game.players.indexOf(id) + 1).toString().padStart(2, '0');
            let nickname = `${number}. `;
            
            const emojis = [];
            if (playerData.canvote) {
                if (!playerData.alive) emojis.push("💀");
            } else {
                if (!playerData.alive) emojis.push("🦴");
                else emojis.push("❗");
            }
            if (playerData.handRaised) {
                emojis.push("🖐️");
            }
            nickname += emojis.join('');
            nickname += " ";

            const member = await guild.members.fetch(id);
            nickname += member.displayName.replace(PLAYER_NICKNAME_REGEX, "");

            await member.setNickname(nickname);
        } catch (e) {
            throw `Could not change nickname of user <@${id}> (${e})`;
        }
    },

    async clearPlayer(id, guild) {
        try {
            const member = await guild.members.fetch(id);
            await member.roles.remove(PLAYER_ROLE_ID);
            const nickname = member.displayName.replace(PLAYER_NICKNAME_REGEX, "");
            if (nickname !== member.displayName) {
                await member.setNickname(nickname);
            }
        } catch (e) {
            throw `Could not change nickname of user <@${id}> (${e})`;
        }
    },
}
