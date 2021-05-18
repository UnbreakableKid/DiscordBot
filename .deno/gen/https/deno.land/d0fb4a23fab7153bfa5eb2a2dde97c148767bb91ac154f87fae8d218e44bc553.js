import { EventEmitter, Crc32Stream } from "../deps.ts";
import { concatUint8Array } from "../utils/uint8.ts";
import { getHeader, putLong } from "./gzip.ts";
import { Deflate } from "../zlib/mod.ts";
class Writer extends EventEmitter {
    writer;
    bytesWritten = 0;
    path;
    chuncks = [];
    onceSize;
    chuncksBytes = 0;
    crc32Stream = new Crc32Stream();
    deflate = new Deflate({
        raw: true
    });
    constructor(path, options){
        super();
        this.path = path;
        this.onceSize = options?.onceSize ?? 1024 * 1024;
    }
    async setup(name, timestamp) {
        this.writer = await Deno.open(this.path, {
            write: true,
            create: true,
            truncate: true
        });
        const headers = getHeader({
            timestamp,
            name
        });
        await Deno.write(this.writer.rid, headers);
    }
    async write(p) {
        const readed = p.byteLength;
        const copy = new Uint8Array(p);
        this.chuncks.push(copy);
        this.chuncksBytes += readed;
        this.bytesWritten += readed;
        this.crc32Stream.append(copy);
        if (readed < 16384) {
            const buf = concatUint8Array(this.chuncks);
            const compressed = this.deflate.push(buf, true);
            await Deno.writeAll(this.writer, compressed);
            const tail = this.getTail();
            await Deno.write(this.writer.rid, tail);
        } else if (this.chuncksBytes >= this.onceSize) {
            const buf = concatUint8Array(this.chuncks);
            const compressed = this.deflate.push(buf, false);
            await Deno.writeAll(this.writer, compressed);
            this.chuncks.length = 0;
            this.chuncksBytes = 0;
            this.emit("bytesWritten", this.bytesWritten);
        }
        return readed;
    }
    close() {
        this.emit("bytesWritten", this.bytesWritten);
        Deno.close(this.writer.rid);
    }
    getTail() {
        const arr = [];
        putLong(parseInt(this.crc32Stream.crc32, 16), arr);
        putLong(this.bytesWritten, arr);
        return new Uint8Array(arr);
    }
}
export { Writer as default };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi9nemlwL3dyaXRlcl9nemlwLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIENyYzMyU3RyZWFtIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGNvbmNhdFVpbnQ4QXJyYXkgfSBmcm9tIFwiLi4vdXRpbHMvdWludDgudHNcIjtcbmltcG9ydCB7IGdldEhlYWRlciwgcHV0TG9uZyB9IGZyb20gXCIuL2d6aXAudHNcIjtcbmltcG9ydCB7IERlZmxhdGUgfSBmcm9tIFwiLi4vemxpYi9tb2QudHNcIjtcblxudHlwZSBGaWxlID0gRGVuby5GaWxlO1xuXG5pbnRlcmZhY2UgT3B0aW9ucyB7XG4gIG9uY2VTaXplPzogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXcml0ZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBEZW5vLldyaXRlciB7XG4gIHByaXZhdGUgd3JpdGVyITogRmlsZTtcbiAgcHJpdmF0ZSBieXRlc1dyaXR0ZW4gPSAwO1xuICBwcml2YXRlIHBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSBjaHVuY2tzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgcHJpdmF0ZSBvbmNlU2l6ZTogbnVtYmVyO1xuICBwcml2YXRlIGNodW5ja3NCeXRlcyA9IDA7XG4gIHByaXZhdGUgY3JjMzJTdHJlYW0gPSBuZXcgQ3JjMzJTdHJlYW0oKTtcbiAgcHJpdmF0ZSBkZWZsYXRlOiBEZWZsYXRlID0gbmV3IERlZmxhdGUoeyByYXc6IHRydWUgfSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5vbmNlU2l6ZSA9IG9wdGlvbnM/Lm9uY2VTaXplID8/IDEwMjQgKiAxMDI0O1xuICB9XG5cbiAgYXN5bmMgc2V0dXAobmFtZT86IHN0cmluZywgdGltZXN0YW1wPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy53cml0ZXIgPSBhd2FpdCBEZW5vLm9wZW4odGhpcy5wYXRoLCB7XG4gICAgICB3cml0ZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZTogdHJ1ZSxcbiAgICAgIHRydW5jYXRlOiB0cnVlLFxuICAgIH0pO1xuICAgIGNvbnN0IGhlYWRlcnMgPSBnZXRIZWFkZXIoe1xuICAgICAgdGltZXN0YW1wLFxuICAgICAgbmFtZSxcbiAgICB9KTtcbiAgICBhd2FpdCBEZW5vLndyaXRlKHRoaXMud3JpdGVyLnJpZCwgaGVhZGVycyk7XG4gIH1cblxuICBhc3luYyB3cml0ZShwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCByZWFkZWQgPSBwLmJ5dGVMZW5ndGg7XG4gICAgY29uc3QgY29weSA9IG5ldyBVaW50OEFycmF5KHApO1xuICAgIHRoaXMuY2h1bmNrcy5wdXNoKGNvcHkpO1xuICAgIHRoaXMuY2h1bmNrc0J5dGVzICs9IHJlYWRlZDtcbiAgICB0aGlzLmJ5dGVzV3JpdHRlbiArPSByZWFkZWQ7XG4gICAgdGhpcy5jcmMzMlN0cmVhbS5hcHBlbmQoY29weSk7XG4gICAgaWYgKHJlYWRlZCA8IDE2Mzg0KSB7XG4gICAgICBjb25zdCBidWYgPSBjb25jYXRVaW50OEFycmF5KHRoaXMuY2h1bmNrcyk7XG4gICAgICBjb25zdCBjb21wcmVzc2VkID0gdGhpcy5kZWZsYXRlLnB1c2goYnVmLCB0cnVlKTtcbiAgICAgIGF3YWl0IERlbm8ud3JpdGVBbGwodGhpcy53cml0ZXIsIGNvbXByZXNzZWQpO1xuICAgICAgY29uc3QgdGFpbCA9IHRoaXMuZ2V0VGFpbCgpO1xuICAgICAgYXdhaXQgRGVuby53cml0ZSh0aGlzLndyaXRlci5yaWQsIHRhaWwpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jaHVuY2tzQnl0ZXMgPj0gdGhpcy5vbmNlU2l6ZSkge1xuICAgICAgY29uc3QgYnVmID0gY29uY2F0VWludDhBcnJheSh0aGlzLmNodW5ja3MpO1xuICAgICAgY29uc3QgY29tcHJlc3NlZCA9IHRoaXMuZGVmbGF0ZS5wdXNoKGJ1ZiwgZmFsc2UpO1xuICAgICAgYXdhaXQgRGVuby53cml0ZUFsbCh0aGlzLndyaXRlciwgY29tcHJlc3NlZCk7XG4gICAgICB0aGlzLmNodW5ja3MubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuY2h1bmNrc0J5dGVzID0gMDtcbiAgICAgIHRoaXMuZW1pdChcImJ5dGVzV3JpdHRlblwiLCB0aGlzLmJ5dGVzV3JpdHRlbik7XG4gICAgfVxuICAgIHJldHVybiByZWFkZWQ7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmVtaXQoXCJieXRlc1dyaXR0ZW5cIiwgdGhpcy5ieXRlc1dyaXR0ZW4pO1xuICAgIERlbm8uY2xvc2UodGhpcy53cml0ZXIucmlkKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGFpbCgpIHtcbiAgICBjb25zdCBhcnI6IG51bWJlcltdID0gW107XG4gICAgcHV0TG9uZyhwYXJzZUludCh0aGlzLmNyYzMyU3RyZWFtLmNyYzMyLCAxNiksIGFycik7XG4gICAgcHV0TG9uZyh0aGlzLmJ5dGVzV3JpdHRlbiwgYXJyKTtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXJyKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLFlBQVksRUFBRSxXQUFXLFNBQVEsVUFBWTtTQUM3QyxnQkFBZ0IsU0FBUSxpQkFBbUI7U0FDM0MsU0FBUyxFQUFFLE9BQU8sU0FBUSxTQUFXO1NBQ3JDLE9BQU8sU0FBUSxjQUFnQjtNQVFuQixNQUFNLFNBQVMsWUFBWTtJQUN0QyxNQUFNO0lBQ04sWUFBWSxHQUFHLENBQUM7SUFDaEIsSUFBSTtJQUNKLE9BQU87SUFDUCxRQUFRO0lBQ1IsWUFBWSxHQUFHLENBQUM7SUFDaEIsV0FBVyxPQUFPLFdBQVc7SUFDN0IsT0FBTyxPQUFnQixPQUFPO1FBQUcsR0FBRyxFQUFFLElBQUk7O2dCQUdoRCxJQUFZLEVBQ1osT0FBaUI7UUFFakIsS0FBSzthQUNBLElBQUksR0FBRyxJQUFJO2FBQ1gsUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksSUFBSSxHQUFHLElBQUk7O1VBRzVDLEtBQUssQ0FBQyxJQUFhLEVBQUUsU0FBa0I7YUFDdEMsTUFBTSxTQUFTLElBQUksQ0FBQyxJQUFJLE1BQU0sSUFBSTtZQUNyQyxLQUFLLEVBQUUsSUFBSTtZQUNYLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLElBQUk7O2NBRVYsT0FBTyxHQUFHLFNBQVM7WUFDdkIsU0FBUztZQUNULElBQUk7O2NBRUEsSUFBSSxDQUFDLEtBQUssTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU87O1VBR3JDLEtBQUssQ0FBQyxDQUFhO2NBQ2pCLE1BQU0sR0FBRyxDQUFDLENBQUMsVUFBVTtjQUNyQixJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUM7YUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJO2FBQ2pCLFlBQVksSUFBSSxNQUFNO2FBQ3RCLFlBQVksSUFBSSxNQUFNO2FBQ3RCLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSTtZQUN4QixNQUFNLEdBQUcsS0FBSztrQkFDVixHQUFHLEdBQUcsZ0JBQWdCLE1BQU0sT0FBTztrQkFDbkMsVUFBVSxRQUFRLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUk7a0JBQ3hDLElBQUksQ0FBQyxRQUFRLE1BQU0sTUFBTSxFQUFFLFVBQVU7a0JBQ3JDLElBQUksUUFBUSxPQUFPO2tCQUNuQixJQUFJLENBQUMsS0FBSyxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSTt3QkFDeEIsWUFBWSxTQUFTLFFBQVE7a0JBQ3JDLEdBQUcsR0FBRyxnQkFBZ0IsTUFBTSxPQUFPO2tCQUNuQyxVQUFVLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSztrQkFDekMsSUFBSSxDQUFDLFFBQVEsTUFBTSxNQUFNLEVBQUUsVUFBVTtpQkFDdEMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO2lCQUNsQixZQUFZLEdBQUcsQ0FBQztpQkFDaEIsSUFBSSxFQUFDLFlBQWMsUUFBTyxZQUFZOztlQUV0QyxNQUFNOztJQUdmLEtBQUs7YUFDRSxJQUFJLEVBQUMsWUFBYyxRQUFPLFlBQVk7UUFDM0MsSUFBSSxDQUFDLEtBQUssTUFBTSxNQUFNLENBQUMsR0FBRzs7SUFHcEIsT0FBTztjQUNQLEdBQUc7UUFDVCxPQUFPLENBQUMsUUFBUSxNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEdBQUc7UUFDakQsT0FBTyxNQUFNLFlBQVksRUFBRSxHQUFHO21CQUNuQixVQUFVLENBQUMsR0FBRzs7O1NBakVSLE1BQU0ifQ==