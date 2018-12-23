## Tiaramisu's entry

# Powered by:
[Discord.js v12-dev](https://github.com/discordjs/discord.js)  
[Node-SQLite](https://github.com/kriasoft/node-sqlite)  
[dotenv](https://github.com/motdotla/dotenv)  
[Moment](https://github.com/moment/moment/)  

# Requisites:
A `.env` file in the root folder with the bot token named `BOT_TOKEN`  A `configuration.json` file specifying the server's and channel's ID or name where the bot will send user's mails.

Configuration example:
```json
{
	"prefix": "m>",
	"server": "Discord Mail",
	"channel": "mailto",
	"staff_role:" ["Mail Staff", "Trusted"]
}
```

or

```json
{
	"prefix": "m>",
	"server": "522020274598838282",
	"channel": "524469905467375616"
	"staff_role:" ["Mail Staff", "Trusted"]
}
```
