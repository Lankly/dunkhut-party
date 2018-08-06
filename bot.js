// Load up the discord.js library
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config/bot-config.json");
const all_quotes = require("./config/kaiba-quotes.json");

// Load up dunkhut.party functions
const tasks = require("./js/tasks")(null, true);

// Data we will keep track of
let last_id = 0;

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

  // Ignore other bots
  if(message.author.bot) return;

  // Ignore messages that don't start with our prefix
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command. 
  let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();
  let quotes = ["Fool! That's not how this game works."];
  let output = "";

  switch (command) {
    case "ping":
      const m = await message.channel.send("Ping?");
      m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
      quotes = [];
      break;

    // Create
    case "add":
    case "create":
    case "new":
      switch (args.shift().toLowerCase()) {
        case "task":
          last_id = (await tasks.createTask({
            assigned_to: null,
            description: null,
            start_time: new Date(),
            title: args.join(" ")
          }))[0].id;
          quotes = all_quotes.create;
          output = ` (#${last_id})`;
          break;
        default:
          break;
      }
      break;

    // Read
    case "show":
    case "list":
      switch (args.shift().toLowerCase()) {
        case "tasks":
        case "todo":
        case "incomplete":
          let incomplete_tasks = await tasks.getIncompleteTasks();
          quotes = all_quotes.list_incomplete;
          output = "\n";
          incomplete_tasks.forEach((task) => {
            output += `#${task.id}: ${task.title}\n`;
          });
          break;

        case "complete":
        case "completed":
        case "finished":
          let completed_tasks = await tasks.getCompletedTasks();
          quotes = all_quotes.list_completed;
          output = "\n";
          completed_tasks.forEach((task) => {
            output += `#${task.id}: ${task.title}\n`;
          });
          break;
        default:
          break;
      }
      break;

    // Update
    case "complete":
    case "finish":
      command = args.shift().toLowerCase();
      if (command === "task") { 
        command = args.shift().toLowerCase();
      }
      tasks.completeTask(command.replace(/\D/, ""));
      quotes = all_quotes.complete;
      break;

    // Delete
    case "delete":
    case "remove":
      switch (args.shift().toLowerCase()) {
        case "task":
          tasks.deleteTask(args[0].replace(/\D/, ""));
          quotes = all_quotes.delete;
          break;
        default:
          break;
      }
      break;

    case "quote":
      quotes = all_quotes.miscellaneous;
      break;

    default:
      break;
  }

  let selected = "";
  if (quotes.length > 0) {
    selected = quotes[~~(quotes.length * Math.random())];
  }
  message.channel.send(selected + output);
});

client.login(config.token);

