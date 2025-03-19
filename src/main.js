require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!ban")) {
    if (!message.member.permissions.has("BAN_MEMBERS"))
      return message.reply("You don't have permission to ban!");

    const member = message.mentions.members.first();
    if (!member) return message.reply("Please mention a user to ban!");

    await member.ban();
    message.channel.send(`${member.user.tag} has been banned!`);
  }

  if (message.content.startsWith("!ping")) {
       return message.reply("pong!");
  }
});

client.login(process.env.TOKEN);
