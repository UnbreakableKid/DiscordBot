import { delay } from "../util/utils.ts";
import { ws } from "./ws.ts";
/** Begin spawning shards. */ export function spawnShards(firstShardId = 0) {
    /** Stored as bucketId: [clusterId, [ShardIds]] */ const maxShards = ws.maxShards || ws.botGatewayData.shards;
    let cluster = 0;
    for(let index = firstShardId; index < ws.botGatewayData.sessionStartLimit.maxConcurrency; index++){
        ws.log("DEBUG", `1. Running for loop in spawnShards function.`);
        // ORGANIZE ALL SHARDS INTO THEIR OWN BUCKETS
        for(let i = 0; i < maxShards; i++){
            ws.log("DEBUG", `2. Running for loop in spawnShards function.`);
            const bucketId = i % ws.botGatewayData.sessionStartLimit.maxConcurrency;
            const bucket = ws.buckets.get(bucketId);
            if (!bucket) {
                // Create the bucket since it doesnt exist
                ws.buckets.set(bucketId, {
                    clusters: [
                        [
                            cluster,
                            i
                        ]
                    ],
                    createNextShard: true
                });
                if (cluster + 1 <= ws.maxClusters) cluster++;
            } else {
                // FIND A QUEUE IN THIS BUCKET THAT HAS SPACE
                const queue = bucket.clusters.find((q)=>q.length < ws.shardsPerCluster + 1
                );
                if (queue) {
                    // IF THE QUEUE HAS SPACE JUST ADD IT TO THIS QUEUE
                    queue.push(i);
                } else {
                    if (cluster + 1 <= ws.maxClusters) cluster++;
                    // ADD A NEW QUEUE FOR THIS SHARD
                    bucket.clusters.push([
                        cluster,
                        i
                    ]);
                }
            }
        }
    }
    // SPREAD THIS OUT TO DIFFERENT CLUSTERS TO BEGIN STARTING UP
    ws.buckets.forEach(async (bucket, bucketId)=>{
        ws.log("DEBUG", `3. Running forEach loop in spawnShards function.`);
        for (const [clusterId, ...queue] of bucket.clusters){
            ws.log("DEBUG", `4. Running for of loop in spawnShards function.`);
            let shardId = queue.shift();
            while(shardId !== undefined){
                ws.log("DEBUG", "5. Running while loop in spawnShards function.");
                if (!bucket.createNextShard) {
                    await delay(100);
                    continue;
                }
                bucket.createNextShard = false;
                await ws.tellClusterToIdentify(clusterId, shardId, bucketId);
                shardId = queue.shift();
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL3NwYXduX3NoYXJkcy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwiLi4vdXRpbC91dGlscy50c1wiO1xuaW1wb3J0IHsgd3MgfSBmcm9tIFwiLi93cy50c1wiO1xuXG4vKiogQmVnaW4gc3Bhd25pbmcgc2hhcmRzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwYXduU2hhcmRzKGZpcnN0U2hhcmRJZCA9IDApIHtcbiAgLyoqIFN0b3JlZCBhcyBidWNrZXRJZDogW2NsdXN0ZXJJZCwgW1NoYXJkSWRzXV0gKi9cbiAgY29uc3QgbWF4U2hhcmRzID0gd3MubWF4U2hhcmRzIHx8IHdzLmJvdEdhdGV3YXlEYXRhLnNoYXJkcztcbiAgbGV0IGNsdXN0ZXIgPSAwO1xuXG4gIGZvciAoXG4gICAgbGV0IGluZGV4ID0gZmlyc3RTaGFyZElkO1xuICAgIGluZGV4IDwgd3MuYm90R2F0ZXdheURhdGEuc2Vzc2lvblN0YXJ0TGltaXQubWF4Q29uY3VycmVuY3k7XG4gICAgaW5kZXgrK1xuICApIHtcbiAgICB3cy5sb2coXG4gICAgICBcIkRFQlVHXCIsXG4gICAgICBgMS4gUnVubmluZyBmb3IgbG9vcCBpbiBzcGF3blNoYXJkcyBmdW5jdGlvbi5gLFxuICAgICk7XG4gICAgLy8gT1JHQU5JWkUgQUxMIFNIQVJEUyBJTlRPIFRIRUlSIE9XTiBCVUNLRVRTXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhTaGFyZHM7IGkrKykge1xuICAgICAgd3MubG9nKFxuICAgICAgICBcIkRFQlVHXCIsXG4gICAgICAgIGAyLiBSdW5uaW5nIGZvciBsb29wIGluIHNwYXduU2hhcmRzIGZ1bmN0aW9uLmAsXG4gICAgICApO1xuICAgICAgY29uc3QgYnVja2V0SWQgPSBpICUgd3MuYm90R2F0ZXdheURhdGEuc2Vzc2lvblN0YXJ0TGltaXQubWF4Q29uY3VycmVuY3k7XG4gICAgICBjb25zdCBidWNrZXQgPSB3cy5idWNrZXRzLmdldChidWNrZXRJZCk7XG5cbiAgICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYnVja2V0IHNpbmNlIGl0IGRvZXNudCBleGlzdFxuICAgICAgICB3cy5idWNrZXRzLnNldChidWNrZXRJZCwge1xuICAgICAgICAgIGNsdXN0ZXJzOiBbW2NsdXN0ZXIsIGldXSxcbiAgICAgICAgICBjcmVhdGVOZXh0U2hhcmQ6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjbHVzdGVyICsgMSA8PSB3cy5tYXhDbHVzdGVycykgY2x1c3RlcisrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRklORCBBIFFVRVVFIElOIFRISVMgQlVDS0VUIFRIQVQgSEFTIFNQQUNFXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gYnVja2V0LmNsdXN0ZXJzLmZpbmQoKHEpID0+XG4gICAgICAgICAgcS5sZW5ndGggPCB3cy5zaGFyZHNQZXJDbHVzdGVyICsgMVxuICAgICAgICApO1xuICAgICAgICBpZiAocXVldWUpIHtcbiAgICAgICAgICAvLyBJRiBUSEUgUVVFVUUgSEFTIFNQQUNFIEpVU1QgQUREIElUIFRPIFRISVMgUVVFVUVcbiAgICAgICAgICBxdWV1ZS5wdXNoKGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjbHVzdGVyICsgMSA8PSB3cy5tYXhDbHVzdGVycykgY2x1c3RlcisrO1xuICAgICAgICAgIC8vIEFERCBBIE5FVyBRVUVVRSBGT1IgVEhJUyBTSEFSRFxuICAgICAgICAgIGJ1Y2tldC5jbHVzdGVycy5wdXNoKFtjbHVzdGVyLCBpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTUFJFQUQgVEhJUyBPVVQgVE8gRElGRkVSRU5UIENMVVNURVJTIFRPIEJFR0lOIFNUQVJUSU5HIFVQXG4gIHdzLmJ1Y2tldHMuZm9yRWFjaChhc3luYyAoYnVja2V0LCBidWNrZXRJZCkgPT4ge1xuICAgIHdzLmxvZyhcbiAgICAgIFwiREVCVUdcIixcbiAgICAgIGAzLiBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBzcGF3blNoYXJkcyBmdW5jdGlvbi5gLFxuICAgICk7XG4gICAgZm9yIChjb25zdCBbY2x1c3RlcklkLCAuLi5xdWV1ZV0gb2YgYnVja2V0LmNsdXN0ZXJzKSB7XG4gICAgICB3cy5sb2coXG4gICAgICAgIFwiREVCVUdcIixcbiAgICAgICAgYDQuIFJ1bm5pbmcgZm9yIG9mIGxvb3AgaW4gc3Bhd25TaGFyZHMgZnVuY3Rpb24uYCxcbiAgICAgICk7XG4gICAgICBsZXQgc2hhcmRJZCA9IHF1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgIHdoaWxlIChzaGFyZElkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgd3MubG9nKFwiREVCVUdcIiwgXCI1LiBSdW5uaW5nIHdoaWxlIGxvb3AgaW4gc3Bhd25TaGFyZHMgZnVuY3Rpb24uXCIpO1xuICAgICAgICBpZiAoIWJ1Y2tldC5jcmVhdGVOZXh0U2hhcmQpIHtcbiAgICAgICAgICBhd2FpdCBkZWxheSgxMDApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVja2V0LmNyZWF0ZU5leHRTaGFyZCA9IGZhbHNlO1xuICAgICAgICBhd2FpdCB3cy50ZWxsQ2x1c3RlclRvSWRlbnRpZnkoY2x1c3RlcklkLCBzaGFyZElkLCBidWNrZXRJZCk7XG4gICAgICAgIHNoYXJkSWQgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxTQUFRLGdCQUFrQjtTQUMvQixFQUFFLFNBQVEsT0FBUztBQUU1QixFQUE2QixBQUE3Qix5QkFBNkIsQUFBN0IsRUFBNkIsaUJBQ2IsV0FBVyxDQUFDLFlBQVksR0FBRyxDQUFDO0lBQzFDLEVBQWtELEFBQWxELDhDQUFrRCxBQUFsRCxFQUFrRCxPQUM1QyxTQUFTLEdBQUcsRUFBRSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU07UUFDdEQsT0FBTyxHQUFHLENBQUM7WUFHVCxLQUFLLEdBQUcsWUFBWSxFQUN4QixLQUFLLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQzFELEtBQUs7UUFFTCxFQUFFLENBQUMsR0FBRyxFQUNKLEtBQU8sSUFDTiw0Q0FBNEM7UUFFL0MsRUFBNkMsQUFBN0MsMkNBQTZDO2dCQUNwQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQztZQUM5QixFQUFFLENBQUMsR0FBRyxFQUNKLEtBQU8sSUFDTiw0Q0FBNEM7a0JBRXpDLFFBQVEsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjO2tCQUNqRSxNQUFNLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUTtpQkFFakMsTUFBTTtnQkFDVCxFQUEwQyxBQUExQyx3Q0FBMEM7Z0JBQzFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVE7b0JBQ3JCLFFBQVE7OzRCQUFJLE9BQU87NEJBQUUsQ0FBQzs7O29CQUN0QixlQUFlLEVBQUUsSUFBSTs7b0JBR25CLE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxPQUFPOztnQkFFMUMsRUFBNkMsQUFBN0MsMkNBQTZDO3NCQUN2QyxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUNuQyxDQUFDLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDOztvQkFFaEMsS0FBSztvQkFDUCxFQUFtRCxBQUFuRCxpREFBbUQ7b0JBQ25ELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzs7d0JBRVIsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU87b0JBQzFDLEVBQWlDLEFBQWpDLCtCQUFpQztvQkFDakMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJO3dCQUFFLE9BQU87d0JBQUUsQ0FBQzs7Ozs7O0lBTXhDLEVBQTZELEFBQTdELDJEQUE2RDtJQUM3RCxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sUUFBUSxNQUFNLEVBQUUsUUFBUTtRQUN4QyxFQUFFLENBQUMsR0FBRyxFQUNKLEtBQU8sSUFDTixnREFBZ0Q7b0JBRXZDLFNBQVMsS0FBSyxLQUFLLEtBQUssTUFBTSxDQUFDLFFBQVE7WUFDakQsRUFBRSxDQUFDLEdBQUcsRUFDSixLQUFPLElBQ04sK0NBQStDO2dCQUU5QyxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUs7a0JBRWxCLE9BQU8sS0FBSyxTQUFTO2dCQUMxQixFQUFFLENBQUMsR0FBRyxFQUFDLEtBQU8sSUFBRSw4Q0FBZ0Q7cUJBQzNELE1BQU0sQ0FBQyxlQUFlOzBCQUNuQixLQUFLLENBQUMsR0FBRzs7O2dCQUlqQixNQUFNLENBQUMsZUFBZSxHQUFHLEtBQUs7c0JBQ3hCLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVE7Z0JBQzNELE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyJ9