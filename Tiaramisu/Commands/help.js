'use strict';

const { MessageEmbed } = require(`discord.js`);

const Command = {
	name: `help`,
	async run(Client, message, mentioned, args) {		
		if (mentioned) {
			await message.channel.send(`Hi, ${message.member}, how can I **help** you?`);
			let collector = message.channel.createMessageCollector((...args) => collectorFilter(message.author, ...args), { max: 1, time: 3000 });

			collector.on(`collect`, (message) => {
				const embed = createInfoEmbed(Client);
				message.channel.send(embed);
			});
		} else {
			if (!args.length) {
				const embed = createInfoEmbed(Client);
				message.channel.send(embed);
			} else {
				// m>help <command_name>
			}
		}
	}
};

function collectorFilter(author, msg) {
	return (msg.content.includes(`help`) && msg.author.id === author.id);
}

function createInfoEmbed(Client) {
	const howTo = [
		`**As an user:**`,
		`Just DM me with you message for the staff`,
		``,
		`**As a staffer:**`,
		`Use \`${Client.prefix}reply <mail_id> <message>\` to reply to an user's mail`,
		`Use \`${Client.prefix}blacklist <user_id>\` to blacklist someone from my commands`,
		`**[Not implemented]** Use \`${Client.prefix}get <user_id> <count>\` to get <count> last messages from an user`,
		`**[Not implemented]** Use \`${Client.prefix}solve <user_id> <?message>\` to close a chat and (opcional) reply to the user`
	];

	const embed = new MessageEmbed()
		.setTitle(`Mailbot info`)
		.setColor([218, 112, 214])
		.setAuthor(Client.user.username, Client.user.avatarURL())
		.setDescription(`A bot made for [/r/Discord_Bots](https://discord.gg/xRFmHYQ) with the only purpose of creating a somehow ticket-support channel between an user and a server's staff.\n\n**Author**: [Fuckmesu#8832](https://discord.gg/awhEqSv)\n`)
		.addField(`How to use:`, howTo.join(`\n`));

	return embed;
}

module.exports = Command;