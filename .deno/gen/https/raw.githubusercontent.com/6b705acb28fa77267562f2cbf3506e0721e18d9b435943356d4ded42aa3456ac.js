import { loopObject } from "../util/loop_object.ts";
import { delay } from "../util/utils.ts";
import { ws } from "./ws.ts";
export async function processQueue(id) {
    const shard = ws.shards.get(id);
    // If no items or its already processing then exit
    if (!shard?.queue.length || shard.processingQueue) return;
    shard.processingQueue = true;
    while(shard.queue.length){
        if (shard.ws.readyState !== WebSocket.OPEN) {
            shard.processingQueue = false;
            return;
        }
        const now = Date.now();
        if (now - shard.queueStartedAt >= 60000) {
            shard.queueStartedAt = now;
            shard.queueCounter = 0;
        }
        // Send a request that is next in line
        const request = shard.queue.shift();
        if (!request) return;
        if (request?.d) {
            request.d = loopObject(request.d, (value)=>typeof value === "bigint" ? value.toString() : Array.isArray(value) ? value.map((v)=>typeof v === "bigint" ? v.toString() : v
                ) : value
            , `Running forEach loop in ws.processQueue function for changing bigints to strings.`);
        }
        ws.log("RAW_SEND", shard.id, request);
        shard.ws.send(JSON.stringify(request));
        // Counter is useful for preventing 120/m requests.
        shard.queueCounter++;
        // Handle if the requests have been maxed
        if (shard.queueCounter >= 118) {
            ws.log("DEBUG", {
                message: "Max gateway requests per minute reached setting timeout for one minute",
                shardId: shard.id
            });
            await delay(60000);
            shard.queueCounter = 0;
            continue;
        }
    }
    shard.processingQueue = false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL3Byb2Nlc3NfcXVldWUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvb3BPYmplY3QgfSBmcm9tIFwiLi4vdXRpbC9sb29wX29iamVjdC50c1wiO1xuaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwiLi4vdXRpbC91dGlscy50c1wiO1xuaW1wb3J0IHsgd3MgfSBmcm9tIFwiLi93cy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1F1ZXVlKGlkOiBudW1iZXIpIHtcbiAgY29uc3Qgc2hhcmQgPSB3cy5zaGFyZHMuZ2V0KGlkKTtcbiAgLy8gSWYgbm8gaXRlbXMgb3IgaXRzIGFscmVhZHkgcHJvY2Vzc2luZyB0aGVuIGV4aXRcbiAgaWYgKCFzaGFyZD8ucXVldWUubGVuZ3RoIHx8IHNoYXJkLnByb2Nlc3NpbmdRdWV1ZSkgcmV0dXJuO1xuXG4gIHNoYXJkLnByb2Nlc3NpbmdRdWV1ZSA9IHRydWU7XG5cbiAgd2hpbGUgKHNoYXJkLnF1ZXVlLmxlbmd0aCkge1xuICAgIGlmIChzaGFyZC53cy5yZWFkeVN0YXRlICE9PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgc2hhcmQucHJvY2Vzc2luZ1F1ZXVlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gc2hhcmQucXVldWVTdGFydGVkQXQgPj0gNjAwMDApIHtcbiAgICAgIHNoYXJkLnF1ZXVlU3RhcnRlZEF0ID0gbm93O1xuICAgICAgc2hhcmQucXVldWVDb3VudGVyID0gMDtcbiAgICB9XG5cbiAgICAvLyBTZW5kIGEgcmVxdWVzdCB0aGF0IGlzIG5leHQgaW4gbGluZVxuICAgIGNvbnN0IHJlcXVlc3QgPSBzaGFyZC5xdWV1ZS5zaGlmdCgpO1xuICAgIGlmICghcmVxdWVzdCkgcmV0dXJuO1xuXG4gICAgaWYgKHJlcXVlc3Q/LmQpIHtcbiAgICAgIHJlcXVlc3QuZCA9IGxvb3BPYmplY3QoXG4gICAgICAgIHJlcXVlc3QuZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgICAgKHZhbHVlKSA9PlxuICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIlxuICAgICAgICAgICAgPyB2YWx1ZS50b1N0cmluZygpXG4gICAgICAgICAgICA6IEFycmF5LmlzQXJyYXkodmFsdWUpXG4gICAgICAgICAgICA/IHZhbHVlLm1hcCgodikgPT4gKHR5cGVvZiB2ID09PSBcImJpZ2ludFwiID8gdi50b1N0cmluZygpIDogdikpXG4gICAgICAgICAgICA6IHZhbHVlLFxuICAgICAgICBgUnVubmluZyBmb3JFYWNoIGxvb3AgaW4gd3MucHJvY2Vzc1F1ZXVlIGZ1bmN0aW9uIGZvciBjaGFuZ2luZyBiaWdpbnRzIHRvIHN0cmluZ3MuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgd3MubG9nKFwiUkFXX1NFTkRcIiwgc2hhcmQuaWQsIHJlcXVlc3QpO1xuXG4gICAgc2hhcmQud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG5cbiAgICAvLyBDb3VudGVyIGlzIHVzZWZ1bCBmb3IgcHJldmVudGluZyAxMjAvbSByZXF1ZXN0cy5cbiAgICBzaGFyZC5xdWV1ZUNvdW50ZXIrKztcblxuICAgIC8vIEhhbmRsZSBpZiB0aGUgcmVxdWVzdHMgaGF2ZSBiZWVuIG1heGVkXG4gICAgaWYgKHNoYXJkLnF1ZXVlQ291bnRlciA+PSAxMTgpIHtcbiAgICAgIHdzLmxvZyhcIkRFQlVHXCIsIHtcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIk1heCBnYXRld2F5IHJlcXVlc3RzIHBlciBtaW51dGUgcmVhY2hlZCBzZXR0aW5nIHRpbWVvdXQgZm9yIG9uZSBtaW51dGVcIixcbiAgICAgICAgc2hhcmRJZDogc2hhcmQuaWQsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IGRlbGF5KDYwMDAwKTtcbiAgICAgIHNoYXJkLnF1ZXVlQ291bnRlciA9IDA7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cblxuICBzaGFyZC5wcm9jZXNzaW5nUXVldWUgPSBmYWxzZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxVQUFVLFNBQVEsc0JBQXdCO1NBQzFDLEtBQUssU0FBUSxnQkFBa0I7U0FDL0IsRUFBRSxTQUFRLE9BQVM7c0JBRU4sWUFBWSxDQUFDLEVBQVU7VUFDckMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDOUIsRUFBa0QsQUFBbEQsZ0RBQWtEO1NBQzdDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlO0lBRWpELEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSTtVQUVyQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDbkIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDLElBQUk7WUFDeEMsS0FBSyxDQUFDLGVBQWUsR0FBRyxLQUFLOzs7Y0FJekIsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHO1lBQ2hCLEdBQUcsR0FBRyxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUs7WUFDckMsS0FBSyxDQUFDLGNBQWMsR0FBRyxHQUFHO1lBQzFCLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQzs7UUFHeEIsRUFBc0MsQUFBdEMsb0NBQXNDO2NBQ2hDLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUs7YUFDNUIsT0FBTztZQUVSLE9BQU8sRUFBRSxDQUFDO1lBQ1osT0FBTyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQ3BCLE9BQU8sQ0FBQyxDQUFDLEdBQ1IsS0FBSyxVQUNHLEtBQUssTUFBSyxNQUFRLElBQ3JCLEtBQUssQ0FBQyxRQUFRLEtBQ2QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQ25CLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFhLENBQUMsTUFBSyxNQUFRLElBQUcsQ0FBQyxDQUFDLFFBQVEsS0FBSyxDQUFDO29CQUMxRCxLQUFLO2VBQ1YsaUZBQWlGOztRQUl0RixFQUFFLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU87UUFFcEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPO1FBRXBDLEVBQW1ELEFBQW5ELGlEQUFtRDtRQUNuRCxLQUFLLENBQUMsWUFBWTtRQUVsQixFQUF5QyxBQUF6Qyx1Q0FBeUM7WUFDckMsS0FBSyxDQUFDLFlBQVksSUFBSSxHQUFHO1lBQzNCLEVBQUUsQ0FBQyxHQUFHLEVBQUMsS0FBTztnQkFDWixPQUFPLEdBQ0wsc0VBQXdFO2dCQUMxRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7O2tCQUViLEtBQUssQ0FBQyxLQUFLO1lBQ2pCLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQzs7OztJQUsxQixLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUsifQ==