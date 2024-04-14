const fs = require('fs');

module.exports = {
    async remove(player, guildId) {
        const server = './data/' + guildId;

        var game = require('../' + server + '/game.json');
        var players = game["players"]

        const id = player.id;

        if (!players.includes(id)) {
            throw 'Player not in game';
        }

        players.splice(players.indexOf(id), 1);
        game['players'] = players;

        fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
            if (err) {
                console.error(err);
            }
        });

        fs.rmSync(server + '/' + id + '.json');
    },

    async add(player, emoji, guildId, name=null, position=null) {
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

        const server = './data/' + guildId;

        var game = require('../' + server + '/game.json');
        var players = game["players"]

        if (players.includes(id)) {
            throw 'You\'re already in the game!';
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

        const init = {"name":name,"canvote":true,"emoji":emoji}

        fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(init), {flag: 'w+'}, err => {
            if (err) {
                console.error(err);
            }
        });

        return {
            name,
            emoji,
        };
    },
}
