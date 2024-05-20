const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("vote")
			.setDescription("Starts a vote")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.addUserOption(option =>
				option.setName('nominee')
					.setDescription('Player who was nominated, aka player who will vote last')
					.setRequired(true))
			.addBooleanOption(option =>
				option.setName('exile')
				.setDescription('Whether this is a vote to exile a traveler, so dead players are counted too')
					.setRequired(false))
			.addUserOption(option =>
				option.setName('voudon')
				.setDescription('Specify if a Voudon is in play, and who they are, so only they & the dead can vote')
					.setRequired(false))
			.addBooleanOption(option =>
				option.setName('atheist')
				.setDescription('Whether this is a vote for the storyteller instead of the specified nominee')
					.setRequired(false)),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			const game = require('../../' + server + '/game.json');
			const players = game["players"]

			const nominee = interaction.options.getUser('nominee');
			
			if (!players.includes(nominee.id)) {
				await interaction.reply('Player not in game!');
				return;
			}

			const optionAtheist = interaction.options.getBoolean('atheist');
			const optionExile = interaction.options.getBoolean('exile');
			const voudon = optionExile ? null : interaction.options.getUser('voudon');

			var voters = new Array;
			var voteids = new Array;
			const offset = players.indexOf(nominee.id) + 1;

			let aliveCount = 0;
			for (const player in players) {
				const cur = (Number(player) + Number(offset)) % players.length;
				const p = require('../../' + server + '/' + players[cur] + '.json');
				
				if (voudon) {
					if (p.alive && players[cur] !== voudon.id) continue;
					aliveCount += 1;
				} else {
					if (optionExile) {
						aliveCount += 1;
					} else {
						if (p.alive) aliveCount += 1;
						if (!p.canvote) continue;
					}
				}

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
			const nomineeName = optionAtheist ? interaction.user.globalName : nominee.globalName;
			let text = `## VOTING IS NOW OPEN\n**${required}** votes needed to ${optionExile ? "exile" : "execute"} **${nomineeName}**\n`;
			if (voudon) text += `Only dead players and the Voudon can vote.\n`;
			text += '\n';

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

			const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 50_000 });
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
			if (!optionExile && !voudon && deadVoters.length > 0) {
				deadVotersText = "\nThe following dead players have spent their vote: ";
				let deadVoterNames = deadVoters.map(voter => voter.name);
				deadVotersText += '**' + deadVoterNames.join('**, ') + '**';
			}

			const num = votes.filter(Boolean).length
			await interaction.editReply({
				content : text + votescreen(count, voters, votes) + '\n\nVote concluded with **' + num + '** vote' + (num == 1 ? '' : 's') + ', which is ' + (num < required ? '**not** enough' : '**enough**') + '.' + deadVotersText,
				components: []
			});

			if (!optionExile && !voudon) {
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
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function votescreen(count, voters, votes) {
	const EMOTES = {
		ABSTAIN_PENDING: {
			ALIVE: '🟦',
			DEAD: '🔵',
		},
		ABSTAIN: {
			ALIVE: '🟪',
			DEAD: '🟣',
		},
		VOTE_PENDING: {
			ALIVE: '🟧',
			DEAD: '🟠',
		},
		VOTE: {
			ALIVE: '🟥',
			DEAD: '🔴',
		},
	}
	// const EMOTES = {
	// 	ABSTAIN_PENDING: {
	// 		ALIVE: '<:abstain_pending:1241798891863674940>',
	// 		DEAD: '<:abstain_pending_dead:1241798964026675262>',
	// 	},
	// 	ABSTAIN: {
	// 		ALIVE: '<:abstain:1241798873287229522>',
	// 		DEAD: '<:abstain_dead:1241798984276643910>',
	// 	},
	// 	VOTE_PENDING: {
	// 		ALIVE: '<:vote_pending:1241798861337395210>',
	// 		DEAD: '<:vote_pending_dead:1241798912369623211>',
	// 	},
	// 	VOTE: {
	// 		ALIVE: '<:vote:1241798847077028020>',
	// 		DEAD: '<:vote_dead:1241798952546861096>',
	// 	},
	// }

	var out = '\n'
	out += (count == votes.length ? '' : ('⬛'.repeat(count)) + '⬇' + ('⬛'.repeat(votes.length - count - 1)) + '\n');
	out += voters.map(v => v.emoji).join('') + '\n';
	for (let i = 0; i < count; i++) {
		const emotes = votes[i] ? EMOTES.VOTE : EMOTES.ABSTAIN;
		out += voters[i].alive ? emotes.ALIVE : emotes.DEAD;
	}
	for (let i = count; i < votes.length; i++) {
		const emotes = votes[i] ? EMOTES.VOTE_PENDING : EMOTES.ABSTAIN_PENDING;
		out += voters[i].alive ? emotes.ALIVE : emotes.DEAD;
	}
	return out;
}