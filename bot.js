// Load up the discord.js library
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config/bot-config.json");

// Startup event
client.on("ready", () => {
  // Log to console
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} servers.`); 
  // Set Discord Status
  client.user.setActivity("Dueling Yugi");
});


// This event triggers when the bot joins a server.
client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.

  // Ignore other bots
  if(message.author.bot) return;

  // Ignore messages that don't start with our prefix
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command. 
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch (command) {
    case "ping":
      const m = await message.channel.send("Ping?");
      m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
      break;

    case "say":
      // makes the bot say something and delete the message.
      const sayMessage = args.join(" ");
      message.delete().catch(O_o=>{}); 
      message.channel.send(sayMessage);
      break;

    default:
      message.channel.send("Sorry! I didn't understand that. Yell at Lan.");
      break;
  }
});

client.login(config.token);

