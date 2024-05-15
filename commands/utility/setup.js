const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("setup")
			.setDescription("Use on a new server, the bot performs necessary setup")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
		async execute(interaction) {
			const server = interaction.guildId;

			const folderName = './data/' + server;

			// try {
			//	 if (!fs.existsSync('./data/')) {
			//		 fs.mkdirSync('./data/');
			//	 }
			// } catch (err) {
			//	 console.error(err);
			// }


			try {
				if (fs.existsSync(folderName)) {
					if (!(await isDirEmpty(folderName))) {
						await interaction.reply('Setup already done, use /reset to reset game instead');
						return;
					}
				}
				else {
					fs.mkdirSync(folderName);
				}
			} catch (err) {
				console.error(err);
			}

			const init = {"players":[],"open":false}

			fs.writeFile(folderName + '/game.json', JSON.stringify(init), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			interaction.reply('Setup complete!')
		}
}

function isDirEmpty(dirname) {
	return fs.promises.readdir(dirname).then(files => {
			return files.length === 0;
	});
}