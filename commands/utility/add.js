const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("add")
			.setDescription("Adds a player to the game")
			.setDefaultMemberPermissions(0)
			.addUserOption(option =>
				option.setName('player')
					.setDescription('Player you want to add')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('emoji')
					.setDescription('The emoji the player will be represented by')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('name')
					.setDescription('The name the player will be represented by (defaults to display name)')
					.setRequired(false))
			.addIntegerOption(option =>
				option.setName('position')
					.setDescription('The position they\'ll be added in (default, anticlockwise to first player)')
					.setRequired(false)),
		async execute(interaction) {

			const player = interaction.options.getUser('player');

			if (player.bot) {
				await interaction.reply('Wow. Hillarious. That\'s so funny. I\'m laughing so hard right now. What a clever joke. What an amazing joke. I bet you\'re really proud of yourself for that joke.');
				return;
			}

			var emoji = interaction.options.getString('emoji');

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
					await interaction.reply('Cannot read emoji!');
					return;
				}
			}

			const name = interaction.options.getString('name') ?? player.globalName;
			const id = player.id;

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			if (players.includes(id)) {
				await interaction.reply('Player already in game, use /edit instead');
				return;
			}

			const position = interaction.options.getInteger('position') ?? (players.length + 1);

			if (position <= 0 || position > players.length + 1) {
				await interaction.reply('Invalid position! There are ' + players.length + 'people playing, position must be between 1 and ' + (players.length + 1));
				return;
			}

			players.splice(position - 1, 0, id);
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

			await interaction.reply('**' + name + '** ' + emoji + ' joined the game!');
		}
}