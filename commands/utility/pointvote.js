const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("pointvote")
			.setDescription("Starts a point vote (for boomdandy or fiddler)")
			.setDefaultMemberPermissions(0)
			.addUserOption(option =>
				option.setName('player1')
					.setDescription('The first player in voting')
					.setRequired(true))
			.addUserOption(option =>
				option.setName('player2')
					.setDescription('The second player in voting')
					.setRequired(true))
			.addUserOption(option =>
				option.setName('player3')
					.setDescription('The third player in voting')
					.setRequired(false))
			.addUserOption(option =>
				option.setName('player4')
					.setDescription('The fourth player in voting')
					.setRequired(false)),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			const game = require('../../' + server + '/game.json');
			const players = game["players"]

			var nominees = new Array();
			var num = 2;

			nominees[0] = interaction.options.getUser('player1').id;
			nominees[1] = interaction.options.getUser('player2').id;
			if (interaction.options.getUser('player3')) {
				nominees[2] = interaction.options.getUser('player3').id;
				num = 3;

				if (interaction.options.getUser('player4')) {
					nominees[3] = interaction.options.getUser('player4').id;
					num = 4;
				}
			}

			for (const nominee in nominees) {
				if (!players.includes(nominees[nominee])) {
					await interaction.reply(`Player ${Number(nominee) + 1} not in game!`);
					return;
				}
			}

			var voters = new Array;
			var voteids = new Array;
			var nomdata = new Array;

			for (const player in players) {
				const p = require('../../' + server + '/' + players[player] + '.json');

				const voteinfo = {
					name: p.name,
					emoji: p.emoji,
					alive: p.alive,
					id: players[player],
				};
				voters.splice(voters.length, 0, voteinfo);
				voteids.splice(voters.length, 0, players[player]);

				if (nominees.includes(players[player])) {
					const nomineeinfo = {
						name: p.name,
						emoji: p.emoji,
						alive: p.alive,
						id: players[player],
					};
					nomdata.splice(nomdata.length, 0, nomineeinfo);
				}
			}

			const endtime = Date.now() + 60100;

			let text = `## ${num > 2 ? 'THE BOOMDANDY WAS EXECUTED' : 'THE FIDDLING CONTEST HAS BEGUN'}\n`;
			text += `Either `
			for (let i = 0; i < num; i++) {
				text += `${i == num - 1 ? ' or ' : ''}${nomdata[i].emoji} **${nomdata[i].name}**${i < num - 2 ? ', ' : ''}`;
			}
			text += ` is the demon.\nPoint at the player you believe is the demon. Your time runs out <t:${Math.floor(endtime / 1000)}:R>\n`;
			
			var buttons = new Array();
			
			for (let i = 0; i < num; i++) {
				buttons[i] = new ButtonBuilder()
					.setCustomId(`p${i + 1}`)
					.setEmoji(`${nomdata[i].emoji}`)
					.setLabel(`${nomdata[i].name}`)
					.setStyle([ButtonStyle.Danger, ButtonStyle.Success, ButtonStyle.Primary][i % 3]);
			}

			buttons[num] = new ButtonBuilder()
				.setCustomId('abs')
				.setLabel('Abstain')
				.setStyle(ButtonStyle.Secondary);

			
		
			const row = new ActionRowBuilder()
				.addComponents(buttons);

			var votes = new Array(voters.length).fill(0);
		
			const message = await interaction.reply({
				content: text + votescreen(voters, votes, nomdata),
				components: [row],
			});

			const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 50_000 });
			collector.on('collect', i => {
				if (voteids.includes(i.user.id)) {
					votes[voteids.indexOf(i.user.id)] = (['abs', 'p1', 'p2', 'p3', 'p4'].indexOf(i.customId));
					i.deferUpdate();
					return;
				} else {
					i.reply({ content: `You are not able to vote!`, ephemeral: true });
					return;
				}
				i.reply({ content: `Unkown error`, ephemeral: true })
			});

			while (Date.now() < endtime) {
				await sleep(1004);
				interaction.editReply(text + votescreen(voters, votes, nomdata));
			}

			var counts = new Array(num).fill(0);
			for (const vote in votes) {
				if (votes[vote] > 0) counts[votes[vote] - 1] += 1;
			}
			const max = MaxWithTie(counts);
			const index = (max < 0) ? max : counts.indexOf(max);

			await interaction.editReply({
				content : text + votescreen(voters, votes, nomdata) +
					`\n\nVote concluded\n${index < 0 ? 'There is a tie for the highest number of votes. No one dies.' :
					`${nomdata[index].emoji} **${nomdata[index].name}** recieved the most votes.`}`,
				components: []
			});
		}
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function votescreen(voters, votes, nomdata) {
	// console.log(votes.length - count - 1);
	var out = '\n'
	out += voters.map(v => v.emoji).join('') + '\n';
	out += '👇'.repeat(votes.length) + '\n';
	for (let i = 0; i < votes.length; i++) {
		out += (votes[i] > 0) ? nomdata[votes[i] - 1]['emoji'] : '⬛';
	}
	return out;
}

function MaxWithTie(arr) {
	if (arr.length === 0) {
		return -1;
	}

	let max = arr[0];
	let count = 1;

	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			max = arr[i];
			count = 1;
		} else if (arr[i] === max) {
			count++;
		}
	}

	return count > 1 ? -1 : max;
}