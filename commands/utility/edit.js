const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("edit")
			.setDescription("Edits settings for a player in the game")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.addUserOption(option =>
				option.setName('player')
					.setDescription('Player you want to edit')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('emoji')
					.setDescription('The emoji the player will be represented by')
					.setRequired(false))
			.addStringOption(option =>
				option.setName('name')
					.setDescription('The name the player will be represented by')
					.setRequired(false))
			.addIntegerOption(option =>
				option.setName('position')
					.setDescription('Move their position')
					.setRequired(false)),
		async execute(interaction) {

			const id = interaction.options.getUser('player').id;

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			if (!players.includes(id)) {
				await interaction.reply('Player not in game, use /add instead');
				return;
			}

			var player = require('../../' + server + '/' + id + '.json');

			var emoji = interaction.options.getString('emoji');

			if (emoji != null) {
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

				player['emoji'] = emoji;
			}

			const name = interaction.options.getString('name');
			if (name != null) player['name'] = name;			

			let position = interaction.options.getInteger('position');

			if (position != null) {
				position -= 1;

				if (position < 0 || position > players.length) {
					await interaction.reply('Invalid position! There are ' + players.length + 'people playing, position must be between 1 and ' + (players.length + 1));
					return;
				}
	
				players.splice(players.indexOf(id), 1);
				players.splice(position, 0, id);
				game['players'] = players
				fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
					if (err) {
						console.error(err);
					}
				});

				playersModule.updateNicknamesFrom(interaction.guild, position, game);
			}

			fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			await interaction.reply('Edited');
		}
}