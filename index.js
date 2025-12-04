require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");

// Create client with intents we need
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Setup DisTube with Spotify & SoundCloud, with YouTube as fallback
const distube = new DisTube(client, {
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
});

const prefix = ".";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Simple music commands using message content
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  // Require user to be in voice channel for music commands
  if (["p", "s", "x", "pause", "resume", "queue"].includes(cmd)) {
    if (!message.member.voice.channel) {
      return message.reply("📌 You must join a voice channel first.");
    }
  }

  try {
    if (cmd === "p") {
      const query = args.join(" ");
      if (!query) return message.reply("Usage: `.p <song name or link>`");
      await distube.play(message.member.voice.channel, query, {
        textChannel: message.channel,
        message
      });
    } else if (cmd === "s") {
      await distube.skip(message);
      message.reply("⏭️ Skipped.");
    } else if (cmd === "x") {
      distube.stop(message);
      message.reply("⏹️ Stopped and left the channel.");
    } else if (cmd === "pause") {
      distube.pause(message);
      message.reply("⏸️ Paused.");
    } else if (cmd === "resume") {
      distube.resume(message);
      message.reply("▶️ Resumed.");
    } else if (cmd === "queue") {
      let q = distube.getQueue(message);
      if (!q) return message.reply("❌ Nothing is playing.");
      const list = q.songs.map((s, i) => `${i + 1 === 1 ? "Now" : i + 1}. ${s.name} (${s.formattedDuration})`).join("\n");
      message.reply(`🎶 Queue:\n${list}`);
    }
  } catch (err) {
    console.error(err);
    message.reply("❌ Error: " + (err.message || err));
  }
});

// Useful DisTube events for user feedback
distube.on("playSong", (queue, song) => {
  queue.textChannel.send(`🎵 Now playing: **${song.name}** — \`${song.formattedDuration}\``);
});
distube.on("addSong", (queue, song) => {
  queue.textChannel.send(`➕ Added: **${song.name}**`);
});
distube.on("error", (error, queue, song) => {
  console.error("DisTube error:", error);
  if (queue && queue.textChannel) {
    queue.textChannel.send(`❌ Error: ${error.message || error}`);
  }
});
distube.on("empty", (queue) => {
  queue.textChannel?.send("❌ Voice channel is empty, leaving...");
});

client.login(process.env.BOT_TOKEN);


