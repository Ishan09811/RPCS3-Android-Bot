require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  SlashCommandBuilder, 
  REST, 
  Routes
} = require("discord.js");

const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const { Client: PgClient } = require("pg");

const db = new PgClient({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ Connected to Neon PostgreSQL!"))
  .catch(err => console.error("❌ Database connection error:", err));

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("download")
    .setDescription("Gets the latest release of RPCS3-Android"),
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

async function initDB() {
  try {
    await db.query(`
        CREATE TABLE IF NOT EXISTS warnings (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          reason TEXT NOT NULL
        )
    `);
    console.log("✅ Warnings table is ready.");
  } catch (error) {
    console.error("Failed to init db:", error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  registerCommands();
  initDB();
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

    try {
      await db.query("INSERT INTO warnings (user_id, reason) VALUES ($1, $2)", [member.id, reason]);

      const countResult = await db.query("SELECT COUNT(*) FROM warnings WHERE user_id = $1", [member.id]);
      const totalWarnings = countResult.rows[0].count;

      message.channel.send(
        `${member.user.tag} has been warned. Reason: ${reason} (Total warnings: ${totalWarnings})`
      );
    } catch (err) {
      console.error("Database error:", err);
      message.reply("❌ There was an error saving the warning.");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member } = interaction;

  if (commandName === "download") {
    try {
      const response = await axios.get("https://api.github.com/repos/RPCS3-Android/rpcs3-android/releases", {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });
      
      const releases = response.data;
      if (releases.length === 0) {
        return interaction.reply({ content: "No releases found.", ephemeral: true });
      }
      
      const latestRelease = releases[0];
      const releaseUrl = latestRelease.html_url;
      const releaseName = latestRelease.name;
      
      return interaction.reply({ content: `Latest release: **${releaseName}**\nDownload here: ${releaseUrl}` });
    } catch (error) {
      console.error("Error fetching releases:", error);
      return interaction.reply({ content: "Failed to fetch the latest release.", ephemeral: true });
    }
  }
  
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
