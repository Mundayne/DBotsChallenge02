'use strict';

const Discord = require(`discord.js`);
const FS = require(`fs`);
const { BOT_TOKEN } = require(`dotenv`).config().parsed;

const Client = new Discord.Client();
Client.commands = new Discord.Collection();
Client.cooldowns = new Discord.Collection();
Client.prefix = require(`./configuration.json`).prefix;
Client.COOLDOWN = 3;

// Initialize database
require(`./Database/initialize`).exec();

// Bot's commands
FS.readdir(`./Commands`, (err, files) => {
	if (err) throw new Error(err);

	files = files.filter((file) => file.endsWith(`.js`));

	for (const cmdFile of files) {
		const command = require(`./Commands/${cmdFile}`);

		Client.commands.set(command.name, command);
	}
});

// Bot's events
FS.readdir(`./Events`, (err, files) => {
	if (err) throw new Error(err);

	files = files.filter((file) => file.endsWith(`.js`));

	for (const eventFile of files) {
		const event = require(`./Events/${eventFile}`);

		Client.on(event.trigger, (...args) => event.run(Client, ...args));
	}
});

Client.login(BOT_TOKEN);