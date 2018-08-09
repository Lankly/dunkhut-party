// Load up the discord.js library
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config/bot-config.json");
const all_quotes = require("./config/kaiba-quotes.json");

// Load up dunkhut.party functions
const tasks = require("./js/tasks")(null);

// Data we will keep track of
let last_id = 0;
const TYPE_UNKNOWN = 0, TYPE_TASK = 1;
let last_type = TYPE_UNKNOWN;

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
  let quotes = all_quotes.failure;
  let output = "", next, value;

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
          last_type = TYPE_TASK;
          quotes = all_quotes.create;
          output = ` (#${last_id})`;
          break;

        // Add a description to something
        case "description":
          // Possible syntaxes:
          // !add description to task #70: My Description
          // !add description My Description (applies to last obj)
          if (args[0] === "to") {
            next = args[1].toLowerCase();
            switch (next) {
              case "task":
              case "todo":
                last_type = TYPE_TASK;
              default:
                last_type = TYPE_UNKNOWN;
                break;
            }

            next = args[2].replace(/\D/g, "");
            if (next !== "") {
              last_id = parseInt(next);
            }
            args = args.slice(3);
          }

          switch (last_type) {
            case TYPE_TASK:
              await tasks.updateTask(
                "description"
                , last_id
                , args.join(" "));
              quotes = all_quotes.create;
              break;

            default:
              break;
          }
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
          last_type = TYPE_TASK;
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
          last_type = TYPE_TASK;
          let completed_tasks = await tasks.getCompletedTasks();
          quotes = all_quotes.list_completed;
          output = "\n";
          completed_tasks.forEach((task) => {
            output += `#${task.id}: ${task.title}\n`;
          });
          break;

        case "task":
          if (args.length < 1) { break; }

          next = args[0].replace(/\D/g, "");
          if (next === "") { break; }

          value = await tasks.getTask(parseInt(next));

          output = value.title || "N/A";
          if (value.date_completed) {
            output += " (Completed)";
          }
          output += "\n";
          if (value.description) {
            output += `Description: ${value.description}\n`;
          }
          if (value.assigned_to) {
            output += `Assigned to ${value.assigned_to}\n`;
          }
          if (value.start_date) {
            output += `Start time: ${value.start_date}\n`;
          }

          quotes = [];
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

      last_id = command.replace(/\D/g, "");
      last_type = TYPE_TASK;
      await tasks.completeTask(last_id);
      quotes = all_quotes.complete;
      break;
    case "assign":
    case "reassign":
    case "give":
      // Possible syntaxes:
      // !assign (#10) to name (number can be last obj)
      // !assign name to #
      last_type = TYPE_TASK;

      next = args[0].replace(/\D/g, "");
      if (next !== "") {
        last_id = parseInt(next);
        args = args.slice(2);
      }
      else if (args[0].toLowerCase() === "to") {
        args = args.slice(1); 
      }
      else {
        next = args[args.length - 1].replace(/\D/g, "");
        if (next === "") { break; }
        last_id = parseInt(next);
        args = args.slice(0, -2);
      }

      await tasks.updateTask("assigned_to", last_id, args.join(" "));
      quotes = all_quotes.create;
      break;
    case "reopen":
      if (args[0].toLowerCase() === "task") {
        args = args.slice(1);
      }

      next = args[0].replace(/\D/g, "");
      if (next === "") { break; }
      last_id = parseInt(next);
      last_type = TYPE_TASK;

      await tasks.updateTask("date_completed", last_id, null);
      quotes = all_quotes.create;
      break;
    case "cancel":
      if (args[0].toLowerCase() === "task") {
        args = args.slice(1);
      }

      next = args[0].replace(/\D/g, "");
      if (next === "") { break; }
      last_id = parseInt(next);
      last_type = TYPE_TASK;

      await tasks.updateTask("cancelled", last_id, true);
      quotes = all_quotes.create;
      break;

    // Delete
    case "delete":
    case "remove":
      // Possible syntaxes:
      // !delete task #53
      // !delete #53 (uses type of last object)

      // Figure out which type to use
      next = args[0].toLowerCase();
      switch (next) {
        case "task":
        case "todo":
          last_type = TYPE_TASK;
          args = args.slice(1);
          break;
        default:
          break;
      }

      last_id = args[0].replace(/\D/g, "");
      quotes = all_quotes.delete;

      // Make the delete
      switch (last_type) {
        case TYPE_TASK:
          await tasks.deleteTask(last_id);
          last_id = 0;
          break;
        case TYPE_UNKNOWN:
        default:
          quotes = all_quotes.failure;
          break;
      }

      break;

    case "quote":
      quotes = all_quotes.miscellaneous;
      break;

    case "h":
    case "help":
    default:
      quotes = [];
      output = "Usage:\n"
        +  "\tTasks:\n"
        +  "\t\t`!add task My New Task`\n"
        +  "\t\t`!add description (to #) My New Desc`\n"
        +  "\t\t`!assign (#) to Person`\n"
        +  "\t\t`!cancel (task) #`\n"
        +  "\t\t`!delete task #`\n"
        +  "\t\t`!complete task #`\n"
        +  "\t\t`!show tasks`\n"
        +  "\t\t`!show task #`\n"
        +  "\t\t`!show completed tasks`\n"
        +  "\t\t`!reopen (task) #`\n"
        +  "\tFun:\n"
        +  "\t\t`!quote`\n"
        +  "\t\t`!ping`\n";
      break;
  }

  let selected = "";
  if (quotes.length > 0) {
    selected = quotes[~~(quotes.length * Math.random())];
  }
  message.channel.send(selected + output);
});

client.login(config.token);

