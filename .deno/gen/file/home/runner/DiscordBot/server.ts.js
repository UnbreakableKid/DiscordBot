import { opine } from "https://deno.land/x/opine@1.3.4/mod.ts";
const server = opine();
server.all("/", (req, res)=>{
    res.send("OK");
});
function keepAlive() {
    server.listen(3000, ()=>{
        console.log("Server is ready!" + Date.now);
    });
}
export default keepAlive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc2VydmVyLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBvcGluZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L21vZC50c1wiO1xuXG5jb25zdCBzZXJ2ZXIgPSBvcGluZSgpO1xuXG5zZXJ2ZXIuYWxsKFwiL1wiLCAocmVxLCByZXMpID0+IHtcbiAgcmVzLnNlbmQoXCJPS1wiKTtcbn0pO1xuXG5mdW5jdGlvbiBrZWVwQWxpdmUoKSB7XG4gIHNlcnZlci5saXN0ZW4oMzAwMCwgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiU2VydmVyIGlzIHJlYWR5IVwiICsgRGF0ZS5ub3cpO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQga2VlcEFsaXZlO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssU0FBUSxzQ0FBd0M7TUFFeEQsTUFBTSxHQUFHLEtBQUs7QUFFcEIsTUFBTSxDQUFDLEdBQUcsRUFBQyxDQUFHLElBQUcsR0FBRyxFQUFFLEdBQUc7SUFDdkIsR0FBRyxDQUFDLElBQUksRUFBQyxFQUFJOztTQUdOLFNBQVM7SUFDaEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLEVBQUMsZ0JBQWtCLElBQUcsSUFBSSxDQUFDLEdBQUc7OztlQUk5QixTQUFTIn0=