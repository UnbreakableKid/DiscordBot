import { bgYellow, black, Collection } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { log } from "./logger.ts";
export function registerTasks() {
  for (const task of bot.tasks.values()) {
    bot.runningTasks.initialTimeouts.push(setTimeout(async () => {
      log.info(`[TASK: ${bgYellow(black(task.name))}] Started.`);
      try {
        await task.execute();
      } catch (error) {
        log.error(error);
      }
      bot.runningTasks.initialTimeouts.push(setInterval(async () => {
        if (!bot.fullyReady) return;
        log.info(`[TASK: ${bgYellow(black(task.name))}] Started.`);
        try {
          await task.execute();
        } catch (error) {
          log.error(error);
        }
      }, task.interval));
    }, task.interval - Date.now() % task.interval));
  }
}
export function clearTasks() {
  for (const timeout of bot.runningTasks.initialTimeouts) clearTimeout(timeout);
  for (const task of bot.runningTasks.intervals) clearInterval(task);
  bot.tasks = new Collection();
  bot.runningTasks = {
    initialTimeouts: [],
    intervals: [],
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL3Rhc2tfaGVscGVyLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBiZ1llbGxvdywgYmxhY2ssIENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgVGFzayB9IGZyb20gXCIuLy4uL3R5cGVzL3Rhc2tzLnRzXCI7XG5pbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJUYXNrcygpIHtcbiAgZm9yIChjb25zdCB0YXNrIG9mIGJvdC50YXNrcy52YWx1ZXMoKSkge1xuICAgIGJvdC5ydW5uaW5nVGFza3MuaW5pdGlhbFRpbWVvdXRzLnB1c2goXG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgbG9nLmluZm8oYFtUQVNLOiAke2JnWWVsbG93KGJsYWNrKHRhc2submFtZSkpfV0gU3RhcnRlZC5gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0YXNrLmV4ZWN1dGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBsb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgYm90LnJ1bm5pbmdUYXNrcy5pbml0aWFsVGltZW91dHMucHVzaChcbiAgICAgICAgICBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWJvdC5mdWxseVJlYWR5KSByZXR1cm47XG4gICAgICAgICAgICBsb2cuaW5mbyhgW1RBU0s6ICR7YmdZZWxsb3coYmxhY2sodGFzay5uYW1lKSl9XSBTdGFydGVkLmApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGFzay5leGVjdXRlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBsb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRhc2suaW50ZXJ2YWwpLFxuICAgICAgICApO1xuICAgICAgfSwgdGFzay5pbnRlcnZhbCAtIChEYXRlLm5vdygpICUgdGFzay5pbnRlcnZhbCkpLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyVGFza3MoKSB7XG4gIGZvciAoY29uc3QgdGltZW91dCBvZiBib3QucnVubmluZ1Rhc2tzLmluaXRpYWxUaW1lb3V0cykgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICBmb3IgKGNvbnN0IHRhc2sgb2YgYm90LnJ1bm5pbmdUYXNrcy5pbnRlcnZhbHMpIGNsZWFySW50ZXJ2YWwodGFzayk7XG5cbiAgYm90LnRhc2tzID0gbmV3IENvbGxlY3Rpb248c3RyaW5nLCBUYXNrPigpO1xuICBib3QucnVubmluZ1Rhc2tzID0geyBpbml0aWFsVGltZW91dHM6IFtdLCBpbnRlcnZhbHM6IFtdIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLFNBQVEsYUFBZTtTQUVsRCxHQUFHLFNBQVEsY0FBZ0I7U0FDM0IsR0FBRyxTQUFRLFdBQWE7Z0JBRWpCLGFBQWE7ZUFDaEIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTTtRQUNqQyxHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQ25DLFVBQVU7WUFDUixHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVTs7c0JBRWhELElBQUksQ0FBQyxPQUFPO3FCQUNYLEtBQUs7Z0JBQ1osR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLOztZQUdqQixHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQ25DLFdBQVc7cUJBQ0osR0FBRyxDQUFDLFVBQVU7Z0JBQ25CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVOzswQkFFaEQsSUFBSSxDQUFDLE9BQU87eUJBQ1gsS0FBSztvQkFDWixHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUs7O2VBRWhCLElBQUksQ0FBQyxRQUFRO1dBRWpCLElBQUksQ0FBQyxRQUFRLEdBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsUUFBUTs7O2dCQUtwQyxVQUFVO2VBQ2IsT0FBTyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLFlBQVksQ0FBQyxPQUFPO2VBQ2pFLElBQUksSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBRSxhQUFhLENBQUMsSUFBSTtJQUVqRSxHQUFHLENBQUMsS0FBSyxPQUFPLFVBQVU7SUFDMUIsR0FBRyxDQUFDLFlBQVk7UUFBSyxlQUFlO1FBQU0sU0FBUyJ9
