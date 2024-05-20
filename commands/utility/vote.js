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
			.addIntegerOption(option =>
				option.setName('countdown')
				.setDescription('Seconds before voting will start. Leave blank to start voting manually')
					.setRequired(false))
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

			const initialCountdown = interaction.options.getInteger('countdown');
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

			const required = Math.ceil(aliveCount / 2);
			const nomineeName = optionAtheist ? interaction.user.globalName : nominee.globalName;
			let header = initialCountdown === null ? `## VOTING BEGINS SOON` : `## VOTING BEGINS IN ${initialCountdown}`;
			let text = `\n**${required}** votes needed to ${optionExile ? "exile" : "execute"} **${nomineeName}**\n`;
			if (voudon) text += `Only dead players and the Voudon can vote.\n`;
			text += '\n';

			let startingText = `Voting will start with ${voters[0].emoji} **${voters[0].name}**'s vote.\n`;
			
			const vote = new ButtonBuilder()
				.setCustomId('Vote')
				.setLabel('Raise Hand')
				.setStyle(ButtonStyle.Danger);

			const unvote = new ButtonBuilder()
				.setCustomId('Unvote')
				.setLabel('Lower Hand')
				.setStyle(ButtonStyle.Primary);
			
			const initialRow = new ActionRowBuilder().addComponents(vote, unvote);
			if (initialCountdown === null) {
				const startVote = new ButtonBuilder()
					.setCustomId('StartVote')
					.setLabel('Start Vote')
					.setStyle(ButtonStyle.Secondary);
				initialRow.addComponents(startVote);
			}

			var votes = new Array(voters.length).fill(false);
			var count = 0;
		
			let currentVotescreen = votescreen(count, voters, votes);
			const message = await interaction.reply({
				content: header + text + startingText + currentVotescreen,
				components: [ initialRow ],
			});


			let voteCountdownLeft = initialCountdown;
			const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 1000 * 20 * 60 });
			collector.on('collect', i => {
				if (i.customId === 'StartVote') {
					if (i.user.id !== interaction.user.id) {
						i.reply({ content: 'Only the storyteller can start the vote!', ephemeral: true });
						return;
					}
					voteCountdownLeft = 3;
					i.deferUpdate();
				} else if (i.customId === 'Vote' || i.customId === 'Unvote') {
					if (voteids.includes(i.user.id)) {
						if (voteids.indexOf(i.user.id) >= count) {
							votes[voteids.indexOf(i.user.id)] = (i.customId === 'Vote');
							i.deferUpdate();
						} else {
							i.reply({ content: `Your vote has been recorded, and cannot be changed.`, ephemeral: true });
						}
					} else {
						i.reply({ content: `You are not able to vote!`, ephemeral: true });
					}
				}
			});


			while (voteCountdownLeft === null) {
				let newVotescreen = votescreen(count, voters, votes);
				if (newVotescreen !== currentVotescreen) {
					message.edit(header + text + startingText + newVotescreen);
					currentVotescreen = newVotescreen;
				}
				await sleep(1050);
			}

			let updateComponents = initialCountdown === null;
			while (voteCountdownLeft > 0) {
				header = `## VOTING BEGINS IN ${voteCountdownLeft}`;

				const reply = { content: header + text + startingText + votescreen(count, voters, votes) };
				if (updateComponents) {
					reply.components = [ new ActionRowBuilder().addComponents(vote, unvote) ];
					updateComponents = false;
				}
				message.edit(reply);

				await sleep(1050);
				voteCountdownLeft -= 1;
			}

			header = '## VOTING HAS BEGUN';
			message.edit({
				content: header + text + startingText + votescreen(count, voters, votes),
				components: [ new ActionRowBuilder().addComponents(vote, unvote) ],
			});

			let deadVoters = [];
			for (const voter in voters) {
				await sleep(1050);
				text += voters[count]['emoji'] + ' **' + voters[count]['name'] + '** has '
					+ (votes[count] ? '**VOTED\n**' : '**ABSTAINED\n**')
				if (votes[count] && !voters[count].alive) {
					deadVoters.push(voters[count]);
				}
				count++;
				await message.edit(header + text + votescreen(count, voters, votes));
			}

			let deadVotersText = "";
			if (!optionExile && !voudon && deadVoters.length > 0) {
				deadVotersText = "\nThe following dead players have spent their vote: ";
				let deadVoterNames = deadVoters.map(voter => voter.name);
				deadVotersText += '**' + deadVoterNames.join('**, ') + '**';
			}

			const num = votes.filter(Boolean).length;
			header = '## VOTING CONCLUDED';
			await message.edit({
				content : header + text + votescreen(count, voters, votes) + '\n\nVote concluded with **' + num + '** vote' + (num == 1 ? '' : 's') + ', which is ' + (num < required ? '**not** enough' : '**enough**') + '.' + deadVotersText,
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

			collector.stop();
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