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
  if (message.author.bot) return;

  // Special joke case: "F"
  if (message.content.trim().toLowerCase() === 'f') {
    return message.channel.send("Respects paid.");
  }

  // Ignore messages that don't start with our prefix
  if (message.content.indexOf(config.prefix) !== 0) return;

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
      removeIgnored(["new", "a"]);

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
          extractArgs(["to"]);

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
      next = getNext(true);

      switch (next) {
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

        // Single object section
        default:
          args.unshift(next);
          extractArgs();
          switch (last_type) {
            case TYPE_TASK:
              value = await tasks.getTask(last_id);

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
      }
      break;

    // Update
    case "complete":
    case "finish":
      extractArgs();

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

      extractArgs(["to"], true);

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
    default:
      return;
  }

  /**
   * Removes the type and id information from the args array and sets
   * the last_type and last_id variables to those values.
   *
   * @param {Array} ignored_words A list of words allowed around the type
   * and id arguments that should be removed from args altogether.
   * @param {bool} look_at_end Indicates whether or not to look for the
   * type and id information at the end of args.
   */
  function extractArgs (ignored_words, look_at_end) {
    removeIgnored(ignored_words);

    // Check for type before id
    let found_type = argsCheckType();

    // Remove any ignored words around this area too
    removeIgnored(ignored_words);

    // Check to see if next word is an id
    if (args.length === 0) { return; }
    let id = args[0];
    let found_id = false;
    // @s indicate someone was mentioned. These contain numbers, and
    // indicate that we've reached the start of the real arguments
    if (id.indexOf("@") < 0) {
      id = id.replace(/\D/g, "");
      if (id !== "") {
        console.log("ID", id);
        last_id = parseInt(id);
        args = args.slice(1);
      }
    }

    if (!found_type) {
      removeIgnored(ignored_words);
    }

    // Check for type before id
    argsCheckType();

    // Stop if we found the id, or aren't looking at the end of args
    if (found_id || !look_at_end) { return; }

    // To look at end, flip the array around and try this once more
    args = args.reverse();
    extractArgs(ignored_words);
    args = args.reverse();
  }
  // Remove any ignored words at start of args
  function removeIgnored (ignored) {
    if (args.length === 0 || !ignored) { return; }

    while (ignored.includes(args[0].toLowerCase())) {
      args = args.slice(1);
    }
  }
  function argsCheckType () {
    if (args.length === 0) { return; }

    switch (args[0].toLowerCase()) {
      case "task":
      case "tasks":
      case "todo":
      case "todos":
        last_type = TYPE_TASK;
        args = args.slice(1);
        break;

      default:
        return false;
    }

    return true;
  }
  function getNext(remove) {
    if (!args || args.length === 0) { return ""; }

    let to_return = args[0];
    if (remove) { args = args.slice(1); }

    return to_return;
  }

  let selected = "";
  if (quotes.length > 0) {
    selected = quotes[~~(quotes.length * Math.random())];
  }
  message.channel.send(selected + output);
});

client.login(config.token);

