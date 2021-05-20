import { ws } from "./ws.ts";
/** Allows users to hook in and change to communicate to different clusters across different servers or anything they like. For example using redis pubsub to talk to other servers. */ export async function tellClusterToIdentify(
  _workerId,
  shardId,
  _bucketId,
) {
  await ws.identify(shardId, ws.maxShards);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL3RlbGxfY2x1c3Rlcl90b19pZGVudGlmeS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd3MgfSBmcm9tIFwiLi93cy50c1wiO1xuXG4vKiogQWxsb3dzIHVzZXJzIHRvIGhvb2sgaW4gYW5kIGNoYW5nZSB0byBjb21tdW5pY2F0ZSB0byBkaWZmZXJlbnQgY2x1c3RlcnMgYWNyb3NzIGRpZmZlcmVudCBzZXJ2ZXJzIG9yIGFueXRoaW5nIHRoZXkgbGlrZS4gRm9yIGV4YW1wbGUgdXNpbmcgcmVkaXMgcHVic3ViIHRvIHRhbGsgdG8gb3RoZXIgc2VydmVycy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZWxsQ2x1c3RlclRvSWRlbnRpZnkoXG4gIF93b3JrZXJJZDogbnVtYmVyLFxuICBzaGFyZElkOiBudW1iZXIsXG4gIF9idWNrZXRJZDogbnVtYmVyLFxuKSB7XG4gIGF3YWl0IHdzLmlkZW50aWZ5KHNoYXJkSWQsIHdzLm1heFNoYXJkcyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsRUFBRSxTQUFRLE9BQVM7QUFFNUIsRUFBdUwsQUFBdkwsbUxBQXVMLEFBQXZMLEVBQXVMLHVCQUNqSyxxQkFBcUIsQ0FDekMsU0FBaUIsRUFDakIsT0FBZSxFQUNmLFNBQWlCO1VBRVgsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFNBQVMifQ==