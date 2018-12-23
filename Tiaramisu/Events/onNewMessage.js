'use strict';

const SQL = require(`sqlite`);
const Moment = require(`moment`);
const Util = require(`../Utils/index`);
const { MessageEmbed } = require(`discord.js`);
const Config = require(`../configuration.json`);

const Event = {
	trigger: `message`,
	async run(Client, message) {
		if (message.author.bot) return;

		const guild = message.channel.guild;

		if (guild && [guild.name, guild.id].includes(Config.server)) {
			const mentioned = message.mentions.users.some((u) => u === Client.user);
			if (!mentioned && !message.content.startsWith(Client.prefix)) return;

			handleGuild(Client, message, mentioned);
		} else {
			handleDM(Client, message);
		}
	}
};

// When using the bot inside a guild
async function handleGuild(Client, message, mentioned = false) {
	if (mentioned) {
		const cd = Util.Cooldown.getCooldown(Client, `mention`, message);
		if (cd.onCooldown) return;

		Client.commands.get(`help`).run(Client, message, mentioned);
		return;
	}

	const args = message.content.slice(Client.prefix.length).split(` `);
	const command = Client.commands.get(args[0]) || Client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(args[0]));

	if (!command) return;
	
	const cd = Util.Cooldown.getCooldown(Client, command.name, message);
	if (cd.onCooldown) return message.channel.send(cd.message);

	args.shift();
	try {
		if (command.name === `help`) {
			command.run(Client, message, mentioned, args);
		} else {
			if (![message.channel.id, message.channel.name].includes(Config.channel)) {
				return message.channel.send(`You can't use this command in this channel`);
			}

			if (!message.member.roles.some((r) => Config.staff_role.includes(r.name))) {
				return message.channel.send(`You don't have permission to use my commands`);
			}

			command.run(Client, message, args);
		}
	} catch (err) {
		console.error(err);
		message.channel.send(`Something went wrong trying to run ${command.name} command`);
	}	
}

// When using the bot from a DM
async function handleDM(Client, message) {
	let userBlacklisted = await isBlacklisted(message.author);

	const cd = Util.Cooldown.getCooldown(Client, `mail`, message);
	if (cd.onCooldown) return message.channel.send(cd.message);

	if (userBlacklisted) {
		let embed = await createUBLEmbed(message.author);

		message.channel.send(embed);
	} else {
		try {
			Client.commands.get(`mail`).run(Client, message);
		} catch (err) {
			console.error(err);
			message.channel.send(`Something went wrong trying to run mail command`);
		}
	}
}

// Checks if user is blacklisted
async function isBlacklisted(user) {
	const Database = await SQL.open(`./Database/database.sqlite`);
	const userData = await Database.get(`SELECT * FROM users WHERE user_id = ?`, user.id);

	if (!userData) {
		await Database.run(`INSERT INTO users (user_id) VALUES (?)`, user.id);

		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});

		return false;
	} else {
		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});

		return userData.blacklisted;
	}
}

// UBL = User Blacklisted
async function createUBLEmbed(user) {
	const Database = await SQL.open(`./Database/database.sqlite`);
	const BLMail = await Database.get(`SELECT rowid, mail_content, timestamp, reason FROM mails WHERE user_id = ? AND abuse = 1 ORDER BY rowid DESC`, user.id);

	if (!BLMail) throw new Error(`Couldn't get the message that blacklisted this user.`);

	let mailMoment = Moment(BLMail.timestamp);

	const embed = new MessageEmbed()
		.setColor([218, 112, 214])
		.setTitle(`You are blacklisted (⊃◜⌓◝⊂)`)
		.addField(`Reason:`, BLMail.reason || `Not provided`)
		.addField(`Last message content:`, `\`\`\`` + BLMail.mail_content + `\`\`\`` + `Mail ID: ${BLMail.rowid}`)
		.addField(`When:`, `${mailMoment.format(`h:mm a`)} - ${mailMoment.format(`MMMM Do YYYY`)}`);

	await Database.close((err) => {
		if (err !== null) throw new Error(err);
	});
	
	return embed;
}

module.exports = Event;