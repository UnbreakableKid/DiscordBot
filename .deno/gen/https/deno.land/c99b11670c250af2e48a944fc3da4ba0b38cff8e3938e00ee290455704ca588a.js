/** very fast */ import { gzip, gunzip } from "../zlib/mod.ts";
/** slow */ // import { gzip, gunzip } from "./gzip.ts";
export async function gzipFile(src, dest) {
    const reader = await Deno.open(src, {
        read: true
    });
    const writer = await Deno.open(dest, {
        write: true,
        create: true,
        truncate: true
    });
    await Deno.writeAll(writer, gzip(await Deno.readAll(reader), undefined));
    writer.close();
    reader.close();
}
export async function gunzipFile(src, dest) {
    const reader = await Deno.open(src, {
        read: true
    });
    const writer = await Deno.open(dest, {
        write: true,
        create: true,
        truncate: true
    });
    await Deno.writeAll(writer, gunzip(await Deno.readAll(reader)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi9nemlwL2d6aXBfZmlsZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIHZlcnkgZmFzdCAqL1xuaW1wb3J0IHsgZ3ppcCwgZ3VuemlwIH0gZnJvbSBcIi4uL3psaWIvbW9kLnRzXCI7XG4vKiogc2xvdyAqL1xuLy8gaW1wb3J0IHsgZ3ppcCwgZ3VuemlwIH0gZnJvbSBcIi4vZ3ppcC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ3ppcEZpbGUoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZWFkZXIgPSBhd2FpdCBEZW5vLm9wZW4oc3JjLCB7XG4gICAgcmVhZDogdHJ1ZSxcbiAgfSk7XG4gIGNvbnN0IHdyaXRlciA9IGF3YWl0IERlbm8ub3BlbihkZXN0LCB7XG4gICAgd3JpdGU6IHRydWUsXG4gICAgY3JlYXRlOiB0cnVlLFxuICAgIHRydW5jYXRlOiB0cnVlLFxuICB9KTtcbiAgYXdhaXQgRGVuby53cml0ZUFsbCh3cml0ZXIsIGd6aXAoYXdhaXQgRGVuby5yZWFkQWxsKHJlYWRlciksIHVuZGVmaW5lZCkpO1xuICB3cml0ZXIuY2xvc2UoKTtcbiAgcmVhZGVyLmNsb3NlKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBndW56aXBGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVhZGVyID0gYXdhaXQgRGVuby5vcGVuKHNyYywge1xuICAgIHJlYWQ6IHRydWUsXG4gIH0pO1xuICBjb25zdCB3cml0ZXIgPSBhd2FpdCBEZW5vLm9wZW4oZGVzdCwge1xuICAgIHdyaXRlOiB0cnVlLFxuICAgIGNyZWF0ZTogdHJ1ZSxcbiAgICB0cnVuY2F0ZTogdHJ1ZSxcbiAgfSk7XG4gIGF3YWl0IERlbm8ud3JpdGVBbGwod3JpdGVyLCBndW56aXAoYXdhaXQgRGVuby5yZWFkQWxsKHJlYWRlcikpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFnQixBQUFoQixZQUFnQixBQUFoQixFQUFnQixVQUNQLElBQUksRUFBRSxNQUFNLFNBQVEsY0FBZ0I7QUFDN0MsRUFBVyxBQUFYLE9BQVcsQUFBWCxFQUFXLENBQ1gsRUFBNEMsQUFBNUMsMENBQTRDO3NCQUV0QixRQUFRLENBQUMsR0FBVyxFQUFFLElBQVk7VUFDaEQsTUFBTSxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRztRQUNoQyxJQUFJLEVBQUUsSUFBSTs7VUFFTixNQUFNLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1FBQ2pDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7UUFDWixRQUFRLEVBQUUsSUFBSTs7VUFFVixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUztJQUN0RSxNQUFNLENBQUMsS0FBSztJQUNaLE1BQU0sQ0FBQyxLQUFLOztzQkFHUSxVQUFVLENBQUMsR0FBVyxFQUFFLElBQVk7VUFDbEQsTUFBTSxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRztRQUNoQyxJQUFJLEVBQUUsSUFBSTs7VUFFTixNQUFNLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1FBQ2pDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7UUFDWixRQUFRLEVBQUUsSUFBSTs7VUFFVixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxNQUFNLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNIn0=