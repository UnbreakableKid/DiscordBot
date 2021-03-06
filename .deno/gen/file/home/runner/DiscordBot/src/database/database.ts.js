import { Sabr, SabrTable } from "../../deps.ts";
import { loadLanguages } from "./../utils/lang_helper.ts";
// Create the database class
const sabr = new Sabr();
export const db = {
  // This will allow us to access table methods easily as we will see below.
  sabr,
  client: new SabrTable(sabr, "client"),
  guilds: new SabrTable(sabr, "guilds"),
  users: new SabrTable(sabr, "users"),
};
// This is important as it prepares all the tables.
await sabr.init();
loadLanguages();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2RhdGFiYXNlL2RhdGFiYXNlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTYWJyLCBTYWJyVGFibGUgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQ2xpZW50U2NoZW1hLCBHdWlsZFNjaGVtYSwgVXNlclNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYXMudHNcIjtcbmltcG9ydCB7IGxvYWRMYW5ndWFnZXMgfSBmcm9tIFwiLi8uLi91dGlscy9sYW5nX2hlbHBlci50c1wiO1xuXG4vLyBDcmVhdGUgdGhlIGRhdGFiYXNlIGNsYXNzXG5jb25zdCBzYWJyID0gbmV3IFNhYnIoKTtcblxuZXhwb3J0IGNvbnN0IGRiID0ge1xuICAvLyBUaGlzIHdpbGwgYWxsb3cgdXMgdG8gYWNjZXNzIHRhYmxlIG1ldGhvZHMgZWFzaWx5IGFzIHdlIHdpbGwgc2VlIGJlbG93LlxuICBzYWJyLFxuICBjbGllbnQ6IG5ldyBTYWJyVGFibGU8Q2xpZW50U2NoZW1hPihzYWJyLCBcImNsaWVudFwiKSxcbiAgZ3VpbGRzOiBuZXcgU2FiclRhYmxlPEd1aWxkU2NoZW1hPihzYWJyLCBcImd1aWxkc1wiKSxcbiAgdXNlcnM6IG5ldyBTYWJyVGFibGU8VXNlclNjaGVtYT4oc2FiciwgXCJ1c2Vyc1wiKSxcbn07XG5cbi8vIFRoaXMgaXMgaW1wb3J0YW50IGFzIGl0IHByZXBhcmVzIGFsbCB0aGUgdGFibGVzLlxuYXdhaXQgc2Fici5pbml0KCk7XG5cbmxvYWRMYW5ndWFnZXMoKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLEVBQUUsU0FBUyxTQUFRLGFBQWU7U0FFdEMsYUFBYSxTQUFRLHlCQUEyQjtBQUV6RCxFQUE0QixBQUE1QiwwQkFBNEI7TUFDdEIsSUFBSSxPQUFPLElBQUk7YUFFUixFQUFFO0lBQ2IsRUFBMEUsQUFBMUUsd0VBQTBFO0lBQzFFLElBQUk7SUFDSixNQUFNLE1BQU0sU0FBUyxDQUFlLElBQUksR0FBRSxNQUFRO0lBQ2xELE1BQU0sTUFBTSxTQUFTLENBQWMsSUFBSSxHQUFFLE1BQVE7SUFDakQsS0FBSyxNQUFNLFNBQVMsQ0FBYSxJQUFJLEdBQUUsS0FBTzs7QUFHaEQsRUFBbUQsQUFBbkQsaURBQW1EO01BQzdDLElBQUksQ0FBQyxJQUFJO0FBRWYsYUFBYSJ9
