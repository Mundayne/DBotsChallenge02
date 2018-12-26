'use strict';

const SQL = require(`sqlite`);
const { MessageEmbed } = require(`discord.js`);

const Command = {
	name: `reply`,
	usage: `Use \`<p>reply <mail_id> <message>\` to reply to an user's mail`,
	async run(Client, message, args) {
		if (args.length < 2) return message.channel.send(this.usage.replace(`<p>`, Client.prefix));

		let mailId = args.shift();
		let content = toCapitalized(args.join(` `));
		let anonymous = false, user = null, staff = message.member;

		const Database = await SQL.open(`./Database/database.sqlite`);
		let mail = await Database.get(`SELECT * FROM mails WHERE rowid = ?`, mailId);

		user = message.guild.member(mail.user_id);
		if (!user) return message.channel.send(`Couldn't find user with user id \`${mail.user_id}\``);

		await message.channel.send(`Stay anonymous? (yes/NO)`);
		let collector = message.channel.createMessageCollector((msg) => [`y`, `yes`, `n`, `no`].includes(msg.content.toLowerCase()), { max: 1, time: 8000 });

		collector.on(`collect`, (msg) => {
			anonymous = [`y`, `yes`].includes(msg.content.toLowerCase());

			const embed = new MessageEmbed()
				.setColor([218, 112, 214])
				.setTitle(`You mail just got a reply ヘ(◕。◕ヘ)`)
				.addField(`Your message:`, `\`\`\`` + mail.mail_content + `\`\`\``)
				.addField(`Response${anonymous ? ``: ` by ${staff.displayName}`}:`, `\`\`\`` + content + `\`\`\``);

			try {
				user.send(embed);
				message.channel.send(`Response sent succesfully`);
			} catch (err) {
				console.error(err);
				message.channel.send(`Something went wrong sending your response`);
			}
		});

		collector.on(`end`, (c, reason) => {
			if (reason === `time`) {
				const embed = new MessageEmbed()
					.setColor([218, 112, 214])
					.setTitle(`You mail just got a reply ヘ(◕。◕ヘ)`)
					.addField(`Your message:`, `\`\`\`` + mail.mail_content + `\`\`\``)
					.addField(`Response by ${staff.displayName}:`, `\`\`\`` + content + `\`\`\``);

				try {
					user.send(embed);
					message.channel.send(`Response sent succesfully`);
				} catch (err) {
					console.error(err);
					message.channel.send(`Something went wrong sending your response`);
				}
			}
		});		
	}
};

function toCapitalized(string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}

module.exports = Command;