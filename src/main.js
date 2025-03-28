require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  SlashCommandBuilder, 
  REST, 
  Routes
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Sends a message as the bot (hidden command)")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("The message to send")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("message_id")
        .setDescription("Optional message ID to reply to")
        .setRequired(false)
    )
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: COMMANDS }
    );
    console.log("Slash commands registered.");
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await registerCommands();
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member } = interaction;
  
  if (commandName === "say") {
    const hasPermission = member.roles.cache.has("1346566185956671531") ||
                          member.permissions.has(PermissionsBitField.Flags.Administrator);
    
    if (!hasPermission) {
      return interaction.reply({ content: "You don't have permission to use this command!", ephemeral: true });
    }

    const messageContent = options.getString("message");
    const messageId = options.getString("message_id");

    if (messageId) {
      try {
        const channel = interaction.channel;
        const referencedMessage = await channel.messages.fetch(messageId);
        await referencedMessage.reply(messageContent);
      } catch (error) {
        return interaction.reply({ content: "Invalid message ID or message not found.", ephemeral: true });
      }
    } else {
      await interaction.channel.send(messageContent);
    }

    await interaction.reply({ content: "Message sent!", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
