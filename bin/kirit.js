#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import figlet from "figlet";
import gradient from "gradient-string";
import inquirer from "inquirer";
import Table from "cli-table3";
import fs from "fs";
import path from "path";
import os from "os";

const program = new Command();

// Storage directory for kirit data
const kirit_DIR = path.join(os.homedir(), ".kirit");
const NOTES_FILE = path.join(kirit_DIR, "notes.json");
const TODOS_FILE = path.join(kirit_DIR, "todos.json");
const IDEAS_FILE = path.join(kirit_DIR, "ideas.json");

// Ensure storage exists
function initStorage() {
  if (!fs.existsSync(kirit_DIR)) {
    fs.mkdirSync(kirit_DIR, { recursive: true });
  }
  [NOTES_FILE, TODOS_FILE, IDEAS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
  });
}

// Load data
function loadData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

// Save data
function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Banner display
function banner() {
  const text = figlet.textSync("KIRIT", { font: "Small", horizontalLayout: "fitted" });
  const colored = gradient.cristal.multiline(text);
  const subtitle = chalk.dim("Quick notes • Todos • Ideas • v1.0.0");
  console.log(boxen(`${colored}\n${subtitle}`, {
    padding: 1,
    margin: 0,
    borderStyle: "round",
  }));
}

// Success/error helpers
function success(msg) { console.log(chalk.greenBright("✔ ") + msg); }
function info(msg) { console.log(chalk.blueBright("ℹ ") + msg); }
function warn(msg) { console.log(chalk.yellowBright("⚠ ") + msg); }
function error(msg) { console.log(chalk.redBright("✖ ") + msg); }

// Initialize storage on load
initStorage();

program
  .name("kirit")
  .description("A CLI for quick notes, todos, and brainstorming")
  .version("1.0.0");

// ============ NOTES COMMANDS ============

program
  .command("note")
  .alias("n")
  .description("Add a quick note")
  .argument("[content...]", "Note content")
  .action(async (contentArgs) => {
    banner();
    
    let content = contentArgs.join(" ");
    
    if (!content) {
      const answer = await inquirer.prompt([{
        name: "note",
        message: "Enter your note:",
        type: "input"
      }]);
      content = answer.note;
    }
    
    if (!content.trim()) {
      error("Note cannot be empty");
      process.exit(1);
    }

    const notes = loadData(NOTES_FILE);
    const note = {
      id: generateId(),
      content: content.trim(),
      tags: extractTags(content),
      createdAt: new Date().toISOString()
    };
    notes.unshift(note);
    saveData(NOTES_FILE, notes);
    
    success("Note saved!");
    console.log(chalk.dim(`  "${truncate(content, 50)}"`));
    console.log(chalk.dim(`  Use "kirit notes" to view all notes`));
  });

program
  .command("notes")
  .description("List all notes")
  .option("-s, --search <query>", "Search notes")
  .option("-S, --SEARCH <query>", "Search notes (case-insensitive)")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-T, --TAG <tag>", "Filter by tag (case-insensitive)")
  .action((opts) => {
    banner();
    
    let notes = loadData(NOTES_FILE);
    
    const searchQuery = opts.search || opts.SEARCH;
    const tagFilter = opts.tag || opts.TAG;
    
    if (searchQuery) {
      notes = notes.filter(n => 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (tagFilter) {
      notes = notes.filter(n => n.tags.includes(tagFilter.toLowerCase()));
    }
    
    if (notes.length === 0) {
      info("No notes found");
      console.log(chalk.dim("  Add one with: kirit note <content>"));
      return;
    }
    
    console.log(chalk.bold(`\n📝 Your Notes (${notes.length}):\n`));
    
    notes.slice(0, 20).forEach((note, idx) => {
      const date = formatDate(note.createdAt);
      const tags = note.tags.length > 0 
        ? chalk.cyan(` [${note.tags.join(", ")}]`) 
        : "";
      console.log(chalk.yellow(`${idx + 1}.`) + ` ${truncate(note.content, 60)}${tags}`);
      console.log(chalk.dim(`   ${date} • id: ${note.id.slice(0, 8)}`));
    });
    
    if (notes.length > 20) {
      console.log(chalk.dim(`\n... and ${notes.length - 20} more`));
    }
  });

program
  .command("note-rm")
  .alias("nr")
  .description("Remove a note by ID or index")
  .argument("<id>", "Note ID or index number")
  .action((id) => {
    let notes = loadData(NOTES_FILE);
    const originalLength = notes.length;
    
    // Try to remove by index (1-based)
    const index = parseInt(id) - 1;
    if (!isNaN(index) && index >= 0 && index < notes.length) {
      const removed = notes.splice(index, 1)[0];
      saveData(NOTES_FILE, notes);
      success(`Removed note: "${truncate(removed.content, 40)}"`);
      return;
    }
    
    // Try to remove by ID prefix
    notes = notes.filter(n => !n.id.startsWith(id));
    
    if (notes.length < originalLength) {
      saveData(NOTES_FILE, notes);
      success("Note removed");
    } else {
      error("Note not found");
    }
  });

// ============ TODO COMMANDS ============

program
  .command("todo")
  .alias("td")
  .description("Add a todo item")
  .argument("[task...]", "Task description")
  .option("-p, --priority <level>", "Priority: high, medium, low")
  .option("-P, --Priority <level>", "Priority: high, medium, low (case-insensitive)")
  .action(async (taskArgs, opts) => {
    banner();
    
    let task = taskArgs.join(" ");
    
    if (!task) {
      const answer = await inquirer.prompt([{
        name: "task",
        message: "What needs to be done?",
        type: "input"
      }]);
      task = answer.task;
    }
    
    if (!task.trim()) {
      error("Task cannot be empty");
      process.exit(1);
    }

    const todos = loadData(TODOS_FILE);
    const todo = {
      id: generateId(),
      task: task.trim(),
      priority: (opts.Priority || opts.priority || "medium").toLowerCase(),
      done: false,
      createdAt: new Date().toISOString()
    };
    todos.unshift(todo);
    saveData(TODOS_FILE, todos);
    
    success(`Todo added! [${(opts.Priority || opts.priority || "medium").toUpperCase()}]`);
    console.log(chalk.dim(`  "${truncate(task, 50)}"`));
  });

program
  .command("todos")
  .description("List all todos")
  .option("-a, --all", "Show completed todos too")
  .option("-A, --ALL", "Show completed todos too (case-insensitive)")
  .action((opts) => {
    banner();
    
    let todos = loadData(TODOS_FILE);
    
    if (!opts.all && !opts.ALL) {
      todos = todos.filter(t => !t.done);
    }
    
    if (todos.length === 0) {
      success("No pending todos! 🎉");
      console.log(chalk.dim("  Add one with: kirit todo <task>"));
      return;
    }
    
    console.log(chalk.bold(`\n☑️  Your Todos:\n`));
    
    todos.forEach((todo, idx) => {
      const status = todo.done ? chalk.green("[✓]") : chalk.yellow("[ ]");
      const priority = getPriorityIcon(todo.priority);
      const date = formatDate(todo.createdAt);
      const text = todo.done ? chalk.strikethrough(todo.task) : todo.task;
      
      console.log(`${status} ${priority} ${text}`);
      console.log(chalk.dim(`   ${date} • kirit done ${idx + 1}`));
    });
  });

program
  .command("done")
  .description("Mark a todo as complete")
  .argument("<index>", "Todo index number")
  .action((index) => {
    const todos = loadData(TODOS_FILE);
    const idx = parseInt(index) - 1;
    
    if (idx < 0 || idx >= todos.length) {
      error("Todo not found");
      process.exit(1);
    }
    
    todos[idx].done = true;
    todos[idx].completedAt = new Date().toISOString();
    saveData(TODOS_FILE, todos);
    
    success(`Completed: "${truncate(todos[idx].task, 40)}"`);
  });

program
  .command("undo")
  .description("Mark a todo as incomplete")
  .argument("<index>", "Todo index number")
  .action((index) => {
    const todos = loadData(TODOS_FILE);
    const idx = parseInt(index) - 1;
    
    if (idx < 0 || idx >= todos.length) {
      error("Todo not found");
      process.exit(1);
    }
    
    todos[idx].done = false;
    delete todos[idx].completedAt;
    saveData(TODOS_FILE, todos);
    
    info(`Reopened: "${truncate(todos[idx].task, 40)}"`);
  });

program
  .command("todo-rm")
  .alias("tr")
  .description("Remove a todo")
  .argument("<index>", "Todo index number")
  .action((index) => {
    const todos = loadData(TODOS_FILE);
    const idx = parseInt(index) - 1;
    
    if (idx < 0 || idx >= todos.length) {
      error("Todo not found");
      process.exit(1);
    }
    
    const removed = todos.splice(idx, 1)[0];
    saveData(TODOS_FILE, todos);
    
    success(`Removed: "${truncate(removed.task, 40)}"`);
  });

// ============ IDEAS / BRAINSTORM COMMANDS ============

program
  .command("idea")
  .alias("i")
  .description("Capture a quick idea")
  .argument("[content...]", "Idea description")
  .action(async (contentArgs) => {
    banner();
    
    let content = contentArgs.join(" ");
    
    if (!content) {
      const answer = await inquirer.prompt([{
        name: "idea",
        message: "What's your idea? 💡",
        type: "input"
      }]);
      content = answer.idea;
    }
    
    if (!content.trim()) {
      error("Idea cannot be empty");
      process.exit(1);
    }

    const ideas = loadData(IDEAS_FILE);
    const idea = {
      id: generateId(),
      content: content.trim(),
      votes: 0,
      status: "new",
      createdAt: new Date().toISOString()
    };
    ideas.unshift(idea);
    saveData(IDEAS_FILE, ideas);
    
    success("Idea captured! 💡");
    console.log(chalk.dim(`  "${truncate(content, 50)}"`));
  });

program
  .command("ideas")
  .description("List all ideas")
  .option("-s, --sort <by>", "Sort by: new, votes", "new")
  .option("-S, --SORT <by>", "Sort by: new, votes (case-insensitive)")
  .action((opts) => {
    banner();
    
    let ideas = loadData(IDEAS_FILE);
    
    if (ideas.length === 0) {
      info("No ideas captured yet");
      console.log(chalk.dim("  Add one with: kirit idea <content>"));
      return;
    }
    
    const sortBy = (opts.sort || opts.SORT || "new").toLowerCase();
    if (sortBy === "votes") {
      ideas.sort((a, b) => b.votes - a.votes);
    }
    
    console.log(chalk.bold(`\n💡 Your Ideas:\n`));
    
    ideas.forEach((idea, idx) => {
      const votes = chalk.yellow(`▲ ${idea.votes}`);
      const status = getStatusIcon(idea.status);
      const date = formatDate(idea.createdAt);
      
      console.log(`${chalk.cyan(`${idx + 1}.`)} ${status} ${idea.content}`);
      console.log(chalk.dim(`   ${votes} • ${date} • kirit upvote ${idx + 1}`));
    });
  });

program
  .command("upvote")
  .alias("up")
  .description("Upvote an idea")
  .argument("<index>", "Idea index number")
  .action((index) => {
    const ideas = loadData(IDEAS_FILE);
    const idx = parseInt(index) - 1;
    
    if (idx < 0 || idx >= ideas.length) {
      error("Idea not found");
      process.exit(1);
    }
    
    ideas[idx].votes++;
    saveData(IDEAS_FILE, ideas);
    
    success(`Upvoted! (votes: ${ideas[idx].votes})`);
  });

program
  .command("idea-rm")
  .alias("ir")
  .description("Remove an idea")
  .argument("<index>", "Idea index number")
  .action((index) => {
    const ideas = loadData(IDEAS_FILE);
    const idx = parseInt(index) - 1;
    
    if (idx < 0 || idx >= ideas.length) {
      error("Idea not found");
      process.exit(1);
    }
    
    const removed = ideas.splice(idx, 1)[0];
    saveData(IDEAS_FILE, ideas);
    
    success(`Removed idea: "${truncate(removed.content, 40)}"`);
  });

// ============ UTILITY COMMANDS ============

program
  .command("search")
  .alias("s")
  .description("Search across notes, todos, and ideas")
  .argument("<query>", "Search query")
  .action((query) => {
    banner();
    
    const notes = loadData(NOTES_FILE);
    const todos = loadData(TODOS_FILE);
    const ideas = loadData(IDEAS_FILE);
    
    const q = query.toLowerCase();
    
    const noteResults = notes.filter(n => n.content.toLowerCase().includes(q));
    const todoResults = todos.filter(t => t.task.toLowerCase().includes(q));
    const ideaResults = ideas.filter(i => i.content.toLowerCase().includes(q));
    
    console.log(chalk.bold(`\n🔍 Search results for "${query}":\n`));
    
    if (noteResults.length > 0) {
      console.log(chalk.cyan("Notes:"));
      noteResults.forEach(n => console.log(`  • ${truncate(n.content, 60)}`));
      console.log();
    }
    
    if (todoResults.length > 0) {
      console.log(chalk.cyan("Todos:"));
      todoResults.forEach(t => {
        const status = t.done ? "✓" : "○";
        console.log(`  ${status} ${truncate(t.task, 60)}`);
      });
      console.log();
    }
    
    if (ideaResults.length > 0) {
      console.log(chalk.cyan("Ideas:"));
      ideaResults.forEach(i => console.log(`  💡 ${truncate(i.content, 60)}`));
      console.log();
    }
    
    const total = noteResults.length + todoResults.length + ideaResults.length;
    if (total === 0) {
      info("No results found");
    } else {
      success(`Found ${total} result(s)`);
    }
  });

program
  .command("stats")
  .description("Show your productivity stats")
  .action(() => {
    banner();
    
    const notes = loadData(NOTES_FILE);
    const todos = loadData(TODOS_FILE);
    const ideas = loadData(IDEAS_FILE);
    
    const completedTodos = todos.filter(t => t.done).length;
    const pendingTodos = todos.length - completedTodos;
    const totalVotes = ideas.reduce((sum, i) => sum + i.votes, 0);
    
    const table = new Table({
      head: [chalk.bold("Category"), chalk.bold("Count")],
      colWidths: [20, 15]
    });
    
    table.push(
      ["📝 Notes", chalk.cyan(notes.length)],
      ["☑️  Todos (pending)", chalk.yellow(pendingTodos)],
      ["☑️  Todos (done)", chalk.green(completedTodos)],
      ["💡 Ideas", chalk.magenta(ideas.length)],
      ["🔺 Total Upvotes", chalk.yellow(totalVotes)]
    );
    
    console.log();
    console.log(table.toString());
    
    // Recent activity
    console.log(chalk.bold("\n📅 Recent Activity:"));
    const recentNotes = notes.slice(0, 3);
    const recentTodos = todos.slice(0, 3);
    
    if (recentNotes.length === 0 && recentTodos.length === 0) {
      console.log(chalk.dim("  No recent activity"));
    } else {
      recentNotes.forEach(n => {
        console.log(chalk.dim(`  ${formatDate(n.createdAt)} - Note: "${truncate(n.content, 35)}"`));
      });
      recentTodos.forEach(t => {
        console.log(chalk.dim(`  ${formatDate(t.createdAt)} - Todo: "${truncate(t.task, 35)}"`));
      });
    }
  });

program
  .command("clear")
  .description("Clear completed todos or all data")
  .option("-t, --todos", "Clear completed todos")
  .option("-T, --TODOS", "Clear completed todos (case-insensitive)")
  .option("-a, --all", "Clear ALL data (⚠️ destructive)")
  .option("-A, --ALL", "Clear ALL data (case-insensitive)")
  .action(async (opts) => {
    banner();
    
    if (opts.all || opts.ALL) {
      const { confirm } = await inquirer.prompt([{
        name: "confirm",
        message: "Delete ALL notes, todos, and ideas? This cannot be undone!",
        type: "confirm",
        default: false
      }]);
      
      if (confirm) {
        saveData(NOTES_FILE, []);
        saveData(TODOS_FILE, []);
        saveData(IDEAS_FILE, []);
        success("All data cleared");
      } else {
        info("Cancelled");
      }
      return;
    }
    
    if (opts.todos || opts.TODOS) {
      const todos = loadData(TODOS_FILE);
      const remaining = todos.filter(t => !t.done);
      const cleared = todos.length - remaining.length;
      saveData(TODOS_FILE, remaining);
      success(`Cleared ${cleared} completed todo(s)`);
      return;
    }
    
    info("Use --todos to clear completed todos, or --all to clear everything");
  });

// ============ HELPERS ============

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function extractTags(content) {
  const matches = content.match(/#(\w+)/g);
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : [];
}

function getPriorityIcon(priority) {
  const icons = { high: "🔴", medium: "🟡", low: "🟢" };
  return icons[priority] || "⚪";
}

function getStatusIcon(status) {
  const icons = {
    new: "✨",
    wip: "🔨",
    done: "✅",
    archived: "📦"
  };
  return icons[status] || "○";
}

// Help text
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
});

program.addHelpText("after", `
${chalk.bold("Quick Examples:")}
  ${chalk.cyan("kirit note")}              Add a note interactively
  ${chalk.cyan("kirit note Buy milk")}     Quick note from command line
  ${chalk.cyan("kirit todo Fix bug -p high")}  Add high priority todo
  ${chalk.cyan("kirit todos")}             View pending todos
  ${chalk.cyan("kirit done 1")}            Mark todo #1 as complete
  ${chalk.cyan("kirit idea")}              Capture an idea
  ${chalk.cyan("kirit ideas")}             List all ideas
  ${chalk.cyan("kirit search bug")}        Search everything
  ${chalk.cyan("kirit stats")}             View your productivity

${chalk.dim("All data is stored in:")} ${chalk.gray(kirit_DIR)}
`);

program.parse(process.argv);

// Show banner + help if no args
if (process.argv.length <= 2) {
  banner();
  program.help();
}
