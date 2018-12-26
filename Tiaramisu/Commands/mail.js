'use strict';

const SQL = require(`sqlite`);
const Moment = require(`moment`);
const { MessageEmbed } = require(`discord.js`);
const config = require(`../configuration`);

const Command = {
	name: `mail`,
	async run(Client, message) {
		const args = message.content.trim().split(` `);
		if (!args.length) return message.channel.send(`You need to type the mail's content...`);

		const Database = await SQL.open(`./Database/database.sqlite`);
		
		let content = toCapitalized(args.join(` `));
		let abuse, reason;
		let isSpamming = await checkSpam(message.author);

		if (isSpamming) {
			abuse = isSpamming.abuse;
			reason = isSpamming.reason;

			let flaggedRow = await Database.get(`SELECT rowid FROM mails ORDER BY rowid DESC LIMIT 1`);
			await Database.run(`UPDATE mails SET abuse = ?, reason = ? WHERE rowid = ?`, [ abuse, reason, flaggedRow.rowid ]);
			await Database.run(`UPDATE users SET blacklisted = ? WHERE user_id = ?`, [ abuse ? 1 : 0, message.author.id ]);

			const embed = await createUBLEmbed(message.author);

			return message.channel.send(embed);
		} else {
			await Database.all(`INSERT INTO mails (user_id, mail_content, timestamp) VALUES (?, ?, ?)`, [
				message.author.id,
				content,
				Date.now()
			]);
		}

		const guild = isNaN(config.server) 
			? Client.guilds.find((server) => server.name === config.server)	
			: Client.guilds.get(config.server);
			
		const channel = isNaN(config.channel) 
			? guild.channels.find((channel) => channel.name === config.channel)	
			: guild.channels.get(config.channel);

		let embed = await createStaffEmbed(guild, message.author);

		try {
			channel.send(embed);
		} catch (err) {
			console.error(err);
			message.channel.send(`Something went wrong sending your mail`);
		}

		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});
	}
};

// Checks if last 3 mails had the same content
// OR
// If the time between the last 3 mails was < than 30 secs
async function checkSpam(user) {
	const Database = await SQL.open(`./Database/database.sqlite`);

	const lastUserMails = await Database.all(`SELECT rowid, mail_content, timestamp FROM mails WHERE user_id = ? ORDER BY rowid DESC LIMIT 3`, user.id);

	if (lastUserMails.length < 3) {
		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});

		return;
	}

	let lastMail = lastUserMails[0];
	let secondMail = lastUserMails[1];
	let thirdMail  = lastUserMails[2];

	// Check if last message is equal to the 2 before it
	if ([secondMail.mail_content, thirdMail.mail_content].every((v) => v === lastMail.mail_content)) {
		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});

		return { abuse: true, reason: `**SPAMMING**\nToo many identical messages.` };
	}

}

async function createStaffEmbed(guild, user) {
	const Database = await SQL.open(`./Database/database.sqlite`);
	const mail = await Database.get(`SELECT rowid, * FROM mails ORDER BY rowid DESC LIMIT 1`);
	const mailMoment = Moment(mail.timestamp);
	const member = guild.member(user);

	const memberInfo = [
		`Username: ${member.displayName}#${member.user.discriminator}`,
		`ID: ${member.user.id}`
	];

	const embed = new MessageEmbed()
		.setColor([218, 112, 214])
		.setTitle(`New mail arrived (งツ)ว`)
		.setThumbnail(user.avatarURL())
		.addField(`Mail content:`, `\`\`\`` + mail.mail_content + `\`\`\``)
		.addField(`Author info:`, `\`\`\`` + memberInfo.join(`\n`) + `\`\`\``)
		.setFooter(`Mail ID: ${mail.rowid} - ${mailMoment.format(`h:mm a`)} - ${mailMoment.format(`MMMM Do YYYY`)}`);

	await Database.close((err) => {
		if (err !== null) throw new Error(err);
	});
	
	return embed;
}

// UBL = User Blacklisted
async function createUBLEmbed(user) {
	const Database = await SQL.open(`./Database/database.sqlite`);
	const BLMail = await Database.get(`SELECT rowid, mail_content, timestamp, reason FROM mails WHERE user_id = ? AND abuse = 1 ORDER BY rowid DESC`, user.id);

	if (!BLMail) throw new Error(`Couldn't get the message that blacklisted this user.`);

	let mailMoment = Moment(BLMail.timestamp);

	const embed = new MessageEmbed()
		.setColor([218, 112, 214])
		.setTitle(`You are blacklisted ┐(￣ー￣)┌`)
		.addField(`Reason:`, BLMail.reason || `Not provided`)
		.addField(`Last message content:`, `\`\`\`` + BLMail.mail_content + `\`\`\`` + `Mail ID: ${BLMail.rowid}`)
		.addField(`When:`, `${mailMoment.format(`h:mm a`)} - ${mailMoment.format(`MMMM Do YYYY`)}`);

	await Database.close((err) => {
		if (err !== null) throw new Error(err);
	});
	
	return embed;
}

function toCapitalized(string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}

module.exports = Command;