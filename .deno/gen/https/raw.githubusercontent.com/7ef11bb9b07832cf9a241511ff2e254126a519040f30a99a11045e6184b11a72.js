import { ws } from "./ws.ts";
/** Handler for processing all dispatch payloads that should be sent/forwarded to another server/vps/process. */ export async function handleDiscordPayload(data, shardId) {
    await fetch(ws.url, {
        headers: {
            authorization: ws.secretKey
        },
        method: "post",
        body: JSON.stringify({
            shardId,
            data
        })
    }).catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2hhbmRsZV9kaXNjb3JkX3BheWxvYWQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuL3dzLnRzXCI7XG5cbi8qKiBIYW5kbGVyIGZvciBwcm9jZXNzaW5nIGFsbCBkaXNwYXRjaCBwYXlsb2FkcyB0aGF0IHNob3VsZCBiZSBzZW50L2ZvcndhcmRlZCB0byBhbm90aGVyIHNlcnZlci92cHMvcHJvY2Vzcy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVEaXNjb3JkUGF5bG9hZChcbiAgZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkLFxuICBzaGFyZElkOiBudW1iZXIsXG4pIHtcbiAgYXdhaXQgZmV0Y2god3MudXJsLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgYXV0aG9yaXphdGlvbjogd3Muc2VjcmV0S2V5LFxuICAgIH0sXG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzaGFyZElkLFxuICAgICAgZGF0YSxcbiAgICB9KSxcbiAgfSkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ1MsRUFBRSxTQUFRLE9BQVM7QUFFNUIsRUFBZ0gsQUFBaEgsNEdBQWdILEFBQWhILEVBQWdILHVCQUMxRixvQkFBb0IsQ0FDeEMsSUFBMkIsRUFDM0IsT0FBZTtVQUVULEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNoQixPQUFPO1lBQ0wsYUFBYSxFQUFFLEVBQUUsQ0FBQyxTQUFTOztRQUU3QixNQUFNLEdBQUUsSUFBTTtRQUNkLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUztZQUNsQixPQUFPO1lBQ1AsSUFBSTs7T0FFTCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUsifQ==