const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("vote")
			.setDescription("Starts a vote")
			.setDefaultMemberPermissions(0)
			.addUserOption(option =>
				option.setName('player')
					.setDescription('Player who was nominated, aka player who will vote last')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('customname')
				.setDescription('(Optional) The name of the nominated person, if needs to be customized')
					.setRequired(false)),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			const game = require('../../' + server + '/game.json');
			const players = game["players"]

			const nominee = interaction.options.getUser('player');

			if (!players.includes(nominee.id)) {
				await interaction.reply('Player not in game!');
				return;
			}

			var voters = new Array;
			var voteids = new Array;
			const offset = players.indexOf(nominee.id) + 1;

			let aliveCount = 0;
			for (const player in players) {
				const cur = (Number(player) + Number(offset)) % players.length;
				const p = require('../../' + server + '/' + players[cur] + '.json');
				if (p.alive) aliveCount += 1;
				if (!p.canvote) continue;
				const voteinfo = {
					name: p.name,
					emoji: p.emoji,
					alive: p.alive,
					id: players[cur],
				};
				voters.splice(voters.length, 0, voteinfo);
				voteids.splice(voters.length, 0, players[cur]);
			}

			// console.log(voters);
			// console.log(voteids);

			const required = Math.ceil(aliveCount / 2);
			const nomineeName = interaction.options.getString('customname') ?? nominee.globalName;
			let text = `## VOTING IS NOW OPEN\n**${required}** votes needed to execute **${nomineeName}**\n\n`;

			text += voters[0]['emoji'] + ' **' + voters[0]['name'] + '**\'s vote will be recorded in 8 seconds\n'
			
			const vote = new ButtonBuilder()
				.setCustomId('Vote')
				.setLabel('Raise Hand')
				.setStyle(ButtonStyle.Danger);

			const unvote = new ButtonBuilder()
				.setCustomId('Unvote')
				.setLabel('Lower Hand')
				.setStyle(ButtonStyle.Primary);
		
			const row = new ActionRowBuilder()
				.addComponents(vote, unvote);

			var votes = new Array(voters.length).fill(false);
			var count = 0;
		
			const message = await interaction.reply({
				content: text + votescreen(count, voters, votes),
				components: [row],
			});

			const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10_000 });
			collector.on('collect', i => {
				if (voteids.includes(i.user.id)) {
					if (voteids.indexOf(i.user.id) >= count) {
						votes[voteids.indexOf(i.user.id)] = (i.customId === 'Vote');
						i.deferUpdate();
						return;
					}
					else {
						i.reply({ content: `Your vote has been recorded, and cannot be changed.`, ephemeral: true });
						return;
					}
				} else {
					i.reply({ content: `You are not able to vote!`, ephemeral: true });
					return;
				}
				i.reply({ content: `Unkown error`, ephemeral: true })
			});

			for (let i = 0; i < 7; i++) {
				await sleep(1050);
				interaction.editReply(text + votescreen(count, voters, votes));
			}

			let deadVoters = [];
			for (const voter in voters) {
				await sleep(1050);
				text += voters[count]['emoji'] + ' **' + voters[count]['name'] + '** has '
					+ (votes[count] ? '**VOTED\n**' : '**ABSTAINED\n**')
				// text += (count >= votes.length - 1 ? '\n' : ' (' + voters[count + 1]['emoji'] + ' **' + voters[count + 1]['name'] + '** is next)\n');
				if (votes[count] && !voters[count].alive) {
					deadVoters.push(voters[count]);
				}
				count++;
				await interaction.editReply(text + votescreen(count, voters, votes));
			}

			let deadVotersText = "";
			if (deadVoters.length > 0) {
				deadVotersText = "\nThe following dead players have spent their vote: ";
				let deadVoterNames = deadVoters.map(voter => voter.name);
				deadVotersText += '**' + deadVoterNames.join('**, ') + '**';
			}

			const num = votes.filter(Boolean).length
			await interaction.editReply({
				content : text + votescreen(count, voters, votes) + '\n\nVote concluded with **' + num + '** vote' + (num == 1 ? '' : 's') + ', which is ' + (num < required ? '**not** enough' : '**enough**') + '.' + deadVotersText,
				components: []
			});

			for (let voter of deadVoters) {
				var player = require('../../' + server + '/' + voter.id + '.json');
				player['canvote'] = false;
				fs.writeFileSync(server + '/' + voter.id + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
					if (err) {
						console.error(err);
					}
				});
				await playersModule.updateNickname(voter.id, interaction.guild, game);
			}
		}
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function votescreen(count, voters, votes) {
	// console.log(votes.length - count - 1);
	var out = '\n'
	out += (count == votes.length ? '' : ('⬛'.repeat(count)) + '⬇' + ('⬛'.repeat(votes.length - count - 1)) + '\n');
	out += voters.map(v => v.emoji).join('') + '\n';
	for (let i = 0; i < count; i++) {
		// out += votes[i] ? '<:vote:1228700232498413619>' : '<:abstain:1228700281047613502>';
		out += votes[i] ? '🟥' : '🟪';
	}
	for (let i = count; i < votes.length; i++) {
		// out += votes[i] ? '<:vote_pending:1228700236269224007>' : '<:abstain_pending:1228700283429978193>';
		out += votes[i] ? '🟧' : '🟦';
	}
	return out;
}