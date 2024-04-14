//	Code for a Discord bot used to help run Blood on the Clocktower

const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');
const path = require('node:path');

const client = new Client({
		intents: [
		GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages
	// GatewayIntentBits.MessageContent
		]
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory());

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder.name);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;
		
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Save the given data in the given server's location file as a JSON object
function writeJSON(data, location) {
		write(JSON.stringify(data), location + '.json')
}

// Save the given data in the given server's location file
function write(data, location) {
		fs.writeFile('./data/' + location, data, {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
		});
}

// Save a text output in output.txt
function output(out) {
		fs.writeFile('./output.txt', out, {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
		});
}

client.once('ready', () => {
		console.log('restarted');
})

client.login(token);