require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

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

const warnings = new Map();

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

  if (message.content.startsWith("!warn")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("You don't have permission to warn!");
    }

    const args = message.content.split(" ");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Please mention a user to warn!");

    const reason = args.slice(2).join(" ") || "No reason provided.";

    if (!warnings.has(member.id)) {
      warnings.set(member.id, []);
    }
    warnings.get(member.id).push(reason);

    message.channel.send(
      `${member.user.tag} has been warned. Reason: ${reason} (Total warnings: ${warnings.get(member.id).length})`
    );
  }
});

client.login(process.env.TOKEN);
