import { EventEmitter } from "../deps.ts";
import GzipWriter from "./writer_gzip.ts";
import GunzipWriter from "./writer_gunzip.ts";
export class GzipStream extends EventEmitter {
  constructor() {
    super();
  }
  async compress(src, dest) {
    // reader
    const stat = await Deno.stat(src);
    const size = stat.size;
    const reader = await Deno.open(src, {
      read: true,
    });
    // writer
    const writer = new GzipWriter(dest, {
      onceSize: size > 50 * 1024 * 1024 ? 1024 * 1024 : 512 * 1024,
    });
    await writer.setup(
      src,
      stat.mtime ? Math.round(stat.mtime.getTime() / 1000) : 0,
    );
    writer.on("bytesWritten", (bytesWritten) => {
      const progress = (100 * bytesWritten / size).toFixed(2) + "%";
      this.emit("progress", progress);
    });
    /** 1: use Deno.copy */ await Deno.copy(reader, writer, {
      bufSize: 1024 * 1024,
    });
    /** 2: not use Deno.copy */
    // let readed: number | null;
    // const n = 16384; //16kb
    // while (true) {
    //   const p: Uint8Array = new Uint8Array(n);
    //   readed = await reader.read(p);
    //   if (readed === null) break;
    //   if (readed < n) {
    //     await writer.write(p.subarray(0, readed));
    //     break;
    //   } else {
    //     await writer.write(p);
    //   }
    // }
    writer.close();
    reader.close();
  }
  async uncompress(src, dest) {
    // reader
    const size = (await Deno.stat(src)).size;
    const reader = await Deno.open(src, {
      read: true,
    });
    // writer
    const writer = new GunzipWriter(dest, {
      onceSize: size > 50 * 1024 * 1024 ? 1024 * 1024 : 512 * 1024,
    });
    await writer.setup();
    writer.on("bytesWritten", (bytesWritten) => {
      const progress = (100 * bytesWritten / size).toFixed(2) + "%";
      this.emit("progress", progress);
    });
    // write
    await Deno.copy(reader, writer, {
      bufSize: 1024 * 1024,
    });
    // close
    writer.close();
    reader.close();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi9nemlwL2d6aXBfc3RyZWFtLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IEd6aXBXcml0ZXIgZnJvbSBcIi4vd3JpdGVyX2d6aXAudHNcIjtcbmltcG9ydCBHdW56aXBXcml0ZXIgZnJvbSBcIi4vd3JpdGVyX2d1bnppcC50c1wiO1xuXG5leHBvcnQgY2xhc3MgR3ppcFN0cmVhbSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBhc3luYyBjb21wcmVzcyhzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gcmVhZGVyXG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IERlbm8uc3RhdChzcmMpO1xuICAgIGNvbnN0IHNpemUgPSBzdGF0LnNpemU7XG4gICAgY29uc3QgcmVhZGVyID0gYXdhaXQgRGVuby5vcGVuKHNyYywge1xuICAgICAgcmVhZDogdHJ1ZSxcbiAgICB9KTtcbiAgICAvLyB3cml0ZXJcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgR3ppcFdyaXRlcihkZXN0LCB7XG4gICAgICBvbmNlU2l6ZTogc2l6ZSA+IDUwICogMTAyNCAqIDEwMjQgPyAxMDI0ICogMTAyNCA6IDUxMiAqIDEwMjQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVyLnNldHVwKFxuICAgICAgc3JjLFxuICAgICAgc3RhdC5tdGltZSA/IE1hdGgucm91bmQoc3RhdC5tdGltZS5nZXRUaW1lKCkgLyAxMDAwKSA6IDAsXG4gICAgKTtcbiAgICB3cml0ZXIub24oXCJieXRlc1dyaXR0ZW5cIiwgKGJ5dGVzV3JpdHRlbjogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBwcm9ncmVzcyA9ICgxMDAgKiBieXRlc1dyaXR0ZW4gLyBzaXplKS50b0ZpeGVkKDIpICsgXCIlXCI7XG4gICAgICB0aGlzLmVtaXQoXCJwcm9ncmVzc1wiLCBwcm9ncmVzcyk7XG4gICAgfSk7XG5cbiAgICAvKiogMTogdXNlIERlbm8uY29weSAqL1xuICAgIGF3YWl0IERlbm8uY29weShyZWFkZXIsIHdyaXRlciwge1xuICAgICAgYnVmU2l6ZTogMTAyNCAqIDEwMjQsXG4gICAgfSk7XG5cbiAgICAvKiogMjogbm90IHVzZSBEZW5vLmNvcHkgKi9cbiAgICAvLyBsZXQgcmVhZGVkOiBudW1iZXIgfCBudWxsO1xuICAgIC8vIGNvbnN0IG4gPSAxNjM4NDsgLy8xNmtiXG4gICAgLy8gd2hpbGUgKHRydWUpIHtcbiAgICAvLyAgIGNvbnN0IHA6IFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShuKTtcbiAgICAvLyAgIHJlYWRlZCA9IGF3YWl0IHJlYWRlci5yZWFkKHApO1xuICAgIC8vICAgaWYgKHJlYWRlZCA9PT0gbnVsbCkgYnJlYWs7XG4gICAgLy8gICBpZiAocmVhZGVkIDwgbikge1xuICAgIC8vICAgICBhd2FpdCB3cml0ZXIud3JpdGUocC5zdWJhcnJheSgwLCByZWFkZWQpKTtcbiAgICAvLyAgICAgYnJlYWs7XG4gICAgLy8gICB9IGVsc2Uge1xuICAgIC8vICAgICBhd2FpdCB3cml0ZXIud3JpdGUocCk7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuXG4gICAgd3JpdGVyLmNsb3NlKCk7XG4gICAgcmVhZGVyLmNsb3NlKCk7XG4gIH1cblxuICBhc3luYyB1bmNvbXByZXNzKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyByZWFkZXJcbiAgICBjb25zdCBzaXplID0gKGF3YWl0IERlbm8uc3RhdChzcmMpKS5zaXplO1xuICAgIGNvbnN0IHJlYWRlciA9IGF3YWl0IERlbm8ub3BlbihzcmMsIHtcbiAgICAgIHJlYWQ6IHRydWUsXG4gICAgfSk7XG4gICAgLy8gd3JpdGVyXG4gICAgY29uc3Qgd3JpdGVyID0gbmV3IEd1bnppcFdyaXRlcihkZXN0LCB7XG4gICAgICBvbmNlU2l6ZTogc2l6ZSA+IDUwICogMTAyNCAqIDEwMjQgPyAxMDI0ICogMTAyNCA6IDUxMiAqIDEwMjQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVyLnNldHVwKCk7XG4gICAgd3JpdGVyLm9uKFwiYnl0ZXNXcml0dGVuXCIsIChieXRlc1dyaXR0ZW46IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSAoMTAwICogYnl0ZXNXcml0dGVuIC8gc2l6ZSkudG9GaXhlZCgyKSArIFwiJVwiO1xuICAgICAgdGhpcy5lbWl0KFwicHJvZ3Jlc3NcIiwgcHJvZ3Jlc3MpO1xuICAgIH0pO1xuICAgIC8vIHdyaXRlXG4gICAgYXdhaXQgRGVuby5jb3B5KHJlYWRlciwgd3JpdGVyLCB7XG4gICAgICBidWZTaXplOiAxMDI0ICogMTAyNCxcbiAgICB9KTtcbiAgICAvLyBjbG9zZVxuICAgIHdyaXRlci5jbG9zZSgpO1xuICAgIHJlYWRlci5jbG9zZSgpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsWUFBWSxTQUFRLFVBQVk7T0FDbEMsVUFBVSxPQUFNLGdCQUFrQjtPQUNsQyxZQUFZLE9BQU0sa0JBQW9CO2FBRWhDLFVBQVUsU0FBUyxZQUFZOztRQUV4QyxLQUFLOztVQUdELFFBQVEsQ0FBQyxHQUFXLEVBQUUsSUFBWTtRQUN0QyxFQUFTLEFBQVQsT0FBUztjQUNILElBQUksU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7Y0FDMUIsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJO2NBQ2hCLE1BQU0sU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7WUFDaEMsSUFBSSxFQUFFLElBQUk7O1FBRVosRUFBUyxBQUFULE9BQVM7Y0FDSCxNQUFNLE9BQU8sVUFBVSxDQUFDLElBQUk7WUFDaEMsUUFBUSxFQUFFLElBQUksR0FBRyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJOztjQUV4RCxNQUFNLENBQUMsS0FBSyxDQUNoQixHQUFHLEVBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDO1FBRTFELE1BQU0sQ0FBQyxFQUFFLEVBQUMsWUFBYyxJQUFHLFlBQW9CO2tCQUN2QyxRQUFRLElBQUksR0FBRyxHQUFHLFlBQVksR0FBRyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSSxDQUFHO2lCQUN4RCxJQUFJLEVBQUMsUUFBVSxHQUFFLFFBQVE7O1FBR2hDLEVBQXVCLEFBQXZCLG1CQUF1QixBQUF2QixFQUF1QixPQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNO1lBQzVCLE9BQU8sRUFBRSxJQUFJLEdBQUcsSUFBSTs7UUFHdEIsRUFBMkIsQUFBM0IsdUJBQTJCLEFBQTNCLEVBQTJCLENBQzNCLEVBQTZCLEFBQTdCLDJCQUE2QjtRQUM3QixFQUEwQixBQUExQix3QkFBMEI7UUFDMUIsRUFBaUIsQUFBakIsZUFBaUI7UUFDakIsRUFBNkMsQUFBN0MsMkNBQTZDO1FBQzdDLEVBQW1DLEFBQW5DLGlDQUFtQztRQUNuQyxFQUFnQyxBQUFoQyw4QkFBZ0M7UUFDaEMsRUFBc0IsQUFBdEIsb0JBQXNCO1FBQ3RCLEVBQWlELEFBQWpELCtDQUFpRDtRQUNqRCxFQUFhLEFBQWIsV0FBYTtRQUNiLEVBQWEsQUFBYixXQUFhO1FBQ2IsRUFBNkIsQUFBN0IsMkJBQTZCO1FBQzdCLEVBQU0sQUFBTixJQUFNO1FBQ04sRUFBSSxBQUFKLEVBQUk7UUFFSixNQUFNLENBQUMsS0FBSztRQUNaLE1BQU0sQ0FBQyxLQUFLOztVQUdSLFVBQVUsQ0FBQyxHQUFXLEVBQUUsSUFBWTtRQUN4QyxFQUFTLEFBQVQsT0FBUztjQUNILElBQUksVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJO2NBQ2xDLE1BQU0sU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7WUFDaEMsSUFBSSxFQUFFLElBQUk7O1FBRVosRUFBUyxBQUFULE9BQVM7Y0FDSCxNQUFNLE9BQU8sWUFBWSxDQUFDLElBQUk7WUFDbEMsUUFBUSxFQUFFLElBQUksR0FBRyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJOztjQUV4RCxNQUFNLENBQUMsS0FBSztRQUNsQixNQUFNLENBQUMsRUFBRSxFQUFDLFlBQWMsSUFBRyxZQUFvQjtrQkFDdkMsUUFBUSxJQUFJLEdBQUcsR0FBRyxZQUFZLEdBQUcsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQUksQ0FBRztpQkFDeEQsSUFBSSxFQUFDLFFBQVUsR0FBRSxRQUFROztRQUVoQyxFQUFRLEFBQVIsTUFBUTtjQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU07WUFDNUIsT0FBTyxFQUFFLElBQUksR0FBRyxJQUFJOztRQUV0QixFQUFRLEFBQVIsTUFBUTtRQUNSLE1BQU0sQ0FBQyxLQUFLO1FBQ1osTUFBTSxDQUFDLEtBQUsifQ==
