import { bot } from "../../cache.ts";
import { humanizeMilliseconds } from "../utils/helpers.ts";
const membersInCooldown = new Map();
bot.inhibitors.set("cooldown", function(message, command) {
    if (!command.cooldown) return false;
    const key = `${message.authorId}-${command.name}`;
    const cooldown = membersInCooldown.get(key);
    if (cooldown) {
        if (cooldown.used >= (command.cooldown.allowedUses || 1)) {
            const now = Date.now();
            if (cooldown.timestamp > now) {
                message.reply(`You must wait **${humanizeMilliseconds(cooldown.timestamp - now)}** before using this command again.`);
                return true;
            } else {
                cooldown.used = 0;
            }
        }
        membersInCooldown.set(key, {
            used: cooldown.used + 1,
            timestamp: Date.now() + command.cooldown.seconds * 1000
        });
        return false;
    }
    membersInCooldown.set(key, {
        used: 1,
        timestamp: Date.now() + command.cooldown.seconds * 1000
    });
    return false;
});
setInterval(()=>{
    const now = Date.now();
    membersInCooldown.forEach((cooldown, key)=>{
        if (cooldown.timestamp > now) return;
        membersInCooldown.delete(key);
    });
}, 30000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2luaGliaXRvcnMvY29vbGRvd24udHMjMT4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBodW1hbml6ZU1pbGxpc2Vjb25kcyB9IGZyb20gXCIuLi91dGlscy9oZWxwZXJzLnRzXCI7XG5cbmNvbnN0IG1lbWJlcnNJbkNvb2xkb3duID0gbmV3IE1hcDxzdHJpbmcsIENvb2xkb3duPigpO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvb2xkb3duIHtcbiAgdXNlZDogbnVtYmVyO1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxuYm90LmluaGliaXRvcnMuc2V0KFwiY29vbGRvd25cIiwgZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbW1hbmQpIHtcbiAgaWYgKCFjb21tYW5kLmNvb2xkb3duKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3Qga2V5ID0gYCR7bWVzc2FnZS5hdXRob3JJZH0tJHtjb21tYW5kLm5hbWV9YDtcbiAgY29uc3QgY29vbGRvd24gPSBtZW1iZXJzSW5Db29sZG93bi5nZXQoa2V5KTtcbiAgaWYgKGNvb2xkb3duKSB7XG4gICAgaWYgKGNvb2xkb3duLnVzZWQgPj0gKGNvbW1hbmQuY29vbGRvd24uYWxsb3dlZFVzZXMgfHwgMSkpIHtcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBpZiAoY29vbGRvd24udGltZXN0YW1wID4gbm93KSB7XG4gICAgICAgIG1lc3NhZ2UucmVwbHkoXG4gICAgICAgICAgYFlvdSBtdXN0IHdhaXQgKioke1xuICAgICAgICAgICAgaHVtYW5pemVNaWxsaXNlY29uZHMoXG4gICAgICAgICAgICAgIGNvb2xkb3duLnRpbWVzdGFtcCAtIG5vdyxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KiogYmVmb3JlIHVzaW5nIHRoaXMgY29tbWFuZCBhZ2Fpbi5gLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvb2xkb3duLnVzZWQgPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbWJlcnNJbkNvb2xkb3duLnNldChrZXksIHtcbiAgICAgIHVzZWQ6IGNvb2xkb3duLnVzZWQgKyAxLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpICsgY29tbWFuZC5jb29sZG93bi5zZWNvbmRzICogMTAwMCxcbiAgICB9KTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBtZW1iZXJzSW5Db29sZG93bi5zZXQoa2V5LCB7XG4gICAgdXNlZDogMSxcbiAgICB0aW1lc3RhbXA6IERhdGUubm93KCkgKyBjb21tYW5kLmNvb2xkb3duLnNlY29uZHMgKiAxMDAwLFxuICB9KTtcbiAgcmV0dXJuIGZhbHNlO1xufSk7XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICBtZW1iZXJzSW5Db29sZG93bi5mb3JFYWNoKChjb29sZG93biwga2V5KSA9PiB7XG4gICAgaWYgKGNvb2xkb3duLnRpbWVzdGFtcCA+IG5vdykgcmV0dXJuO1xuICAgIG1lbWJlcnNJbkNvb2xkb3duLmRlbGV0ZShrZXkpO1xuICB9KTtcbn0sIDMwMDAwKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7U0FDM0Isb0JBQW9CLFNBQVEsbUJBQXFCO01BRXBELGlCQUFpQixPQUFPLEdBQUc7QUFPakMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUMsUUFBVSxZQUFZLE9BQU8sRUFBRSxPQUFPO1NBQ2xELE9BQU8sQ0FBQyxRQUFRLFNBQVMsS0FBSztVQUU3QixHQUFHLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUk7VUFDekMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHO1FBQ3RDLFFBQVE7WUFDTixRQUFRLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLENBQUM7a0JBQy9DLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztnQkFDaEIsUUFBUSxDQUFDLFNBQVMsR0FBRyxHQUFHO2dCQUMxQixPQUFPLENBQUMsS0FBSyxFQUNWLGdCQUFnQixFQUNmLG9CQUFvQixDQUNsQixRQUFRLENBQUMsU0FBUyxHQUFHLEdBQUcsRUFFM0IsbUNBQW1DO3VCQUUvQixJQUFJOztnQkFFWCxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUM7OztRQUlyQixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRztZQUN2QixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUk7O2VBRWxELEtBQUs7O0lBR2QsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUc7UUFDdkIsSUFBSSxFQUFFLENBQUM7UUFDUCxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJOztXQUVsRCxLQUFLOztBQUdkLFdBQVc7VUFDSCxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUc7SUFFcEIsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHO1lBQ2xDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsR0FBRztRQUM1QixpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRzs7R0FFN0IsS0FBSyJ9