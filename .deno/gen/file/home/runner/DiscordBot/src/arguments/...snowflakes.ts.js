import { bot } from "../../cache.ts";
const SNOWFLAKE_REGEX = /[0-9]{17,19}/;
bot.arguments.set("...snowflakes", {
    name: "...snowflakes",
    execute: function(_argument, parameters) {
        const cleaned = parameters.map((p)=>{
            // If its just a normal id number
            if (!p.startsWith("<")) return p;
            // If its a nickname mention or role mention
            if (p.startsWith("<@!") || p.startsWith("<@&")) {
                return p.substring(3, p.length - 1);
            }
            // If it's a user mention or channel mention
            if (p.startsWith("<@") || p.startsWith("<#")) {
                return p.substring(2, p.length - 1);
            }
            // Unknown
            return p;
        });
        return cleaned.filter((text)=>SNOWFLAKE_REGEX.test(text)
        );
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy8uLi5zbm93Zmxha2VzLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuY29uc3QgU05PV0ZMQUtFX1JFR0VYID0gL1swLTldezE3LDE5fS87XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwiLi4uc25vd2ZsYWtlc1wiLCB7XG4gIG5hbWU6IFwiLi4uc25vd2ZsYWtlc1wiLFxuICBleGVjdXRlOiBmdW5jdGlvbiAoX2FyZ3VtZW50LCBwYXJhbWV0ZXJzKSB7XG4gICAgY29uc3QgY2xlYW5lZCA9IHBhcmFtZXRlcnMubWFwKChwKSA9PiB7XG4gICAgICAvLyBJZiBpdHMganVzdCBhIG5vcm1hbCBpZCBudW1iZXJcbiAgICAgIGlmICghcC5zdGFydHNXaXRoKFwiPFwiKSkgcmV0dXJuIHA7XG4gICAgICAvLyBJZiBpdHMgYSBuaWNrbmFtZSBtZW50aW9uIG9yIHJvbGUgbWVudGlvblxuICAgICAgaWYgKHAuc3RhcnRzV2l0aChcIjxAIVwiKSB8fCBwLnN0YXJ0c1dpdGgoXCI8QCZcIikpIHtcbiAgICAgICAgcmV0dXJuIHAuc3Vic3RyaW5nKDMsIHAubGVuZ3RoIC0gMSk7XG4gICAgICB9XG4gICAgICAvLyBJZiBpdCdzIGEgdXNlciBtZW50aW9uIG9yIGNoYW5uZWwgbWVudGlvblxuICAgICAgaWYgKHAuc3RhcnRzV2l0aChcIjxAXCIpIHx8IHAuc3RhcnRzV2l0aChcIjwjXCIpKSB7XG4gICAgICAgIHJldHVybiBwLnN1YnN0cmluZygyLCBwLmxlbmd0aCAtIDEpO1xuICAgICAgfVxuXG4gICAgICAvLyBVbmtub3duXG4gICAgICByZXR1cm4gcDtcbiAgICB9KTtcblxuICAgIHJldHVybiBjbGVhbmVkLmZpbHRlcigodGV4dCkgPT4gU05PV0ZMQUtFX1JFR0VYLnRlc3QodGV4dCkpO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGNBQWdCO01BQzlCLGVBQWU7QUFFckIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsYUFBZTtJQUMvQixJQUFJLEdBQUUsYUFBZTtJQUNyQixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVU7Y0FDaEMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixFQUFpQyxBQUFqQywrQkFBaUM7aUJBQzVCLENBQUMsQ0FBQyxVQUFVLEVBQUMsQ0FBRyxXQUFVLENBQUM7WUFDaEMsRUFBNEMsQUFBNUMsMENBQTRDO2dCQUN4QyxDQUFDLENBQUMsVUFBVSxFQUFDLEdBQUssTUFBSyxDQUFDLENBQUMsVUFBVSxFQUFDLEdBQUs7dUJBQ3BDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzs7WUFFcEMsRUFBNEMsQUFBNUMsMENBQTRDO2dCQUN4QyxDQUFDLENBQUMsVUFBVSxFQUFDLEVBQUksTUFBSyxDQUFDLENBQUMsVUFBVSxFQUFDLEVBQUk7dUJBQ2xDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzs7WUFHcEMsRUFBVSxBQUFWLFFBQVU7bUJBQ0gsQ0FBQzs7ZUFHSCxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksR0FBSyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUkifQ==