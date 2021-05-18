import { Tar, Untar, ensureDir, path } from "../deps.ts";
export async function uncompress(src, dest) {
    const reader = await Deno.open(src, {
        read: true
    });
    const untar = new Untar(reader);
    for await (const entry of untar){
        const filePath = path.resolve(dest, entry.fileName);
        if (entry.type === "directory") {
            await ensureDir(filePath);
            continue;
        }
        const file = await Deno.open(filePath, {
            write: true,
            create: true
        });
        await Deno.copy(entry, file);
        await file.close();
    }
    reader.close();
}
export async function compress(src, dest, options) {
    const tar = new Tar();
    const stat = await Deno.lstat(src);
    if (stat.isFile) {
        await tar.append(path.basename(src), {
            filePath: src,
            contentSize: stat.size,
            mtime: (stat?.mtime ?? new Date()).valueOf() / 1000
        });
    } else {
        const appendFolder = async (folder, prefix)=>{
            for await (const entry of Deno.readDir(folder)){
                const { isDirectory , name  } = entry;
                const fileName = prefix ? `${prefix}/${name}` : name;
                const filePath = path.resolve(folder, name);
                const stat = await Deno.stat(filePath);
                if (isDirectory) {
                    await tar.append(`${fileName}/`, {
                        reader: new Deno.Buffer(),
                        contentSize: 0,
                        type: "directory",
                        mtime: (stat?.mtime ?? new Date()).valueOf() / 1000
                    });
                    await appendFolder(filePath, fileName);
                } else {
                    await tar.append(fileName, {
                        filePath,
                        mtime: (stat?.mtime ?? new Date()).valueOf() / 1000,
                        contentSize: stat.size
                    });
                }
            }
        };
        if (options?.excludeSrc) {
            await appendFolder(src);
        } else {
            const folderName = path.basename(src);
            await tar.append(`${folderName}/`, {
                filePath: src
            });
            await appendFolder(src, folderName);
        }
    }
    const writer = await Deno.open(dest, {
        write: true,
        create: true
    });
    await Deno.copy(tar.getReader(), writer);
    writer.close();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi90YXIvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUYXIsIFVudGFyLCBlbnN1cmVEaXIsIHBhdGggfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBjb21wcmVzc0ludGVyZmFjZSB9IGZyb20gXCIuLi9pbnRlcmZhY2UudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVuY29tcHJlc3Moc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZWFkZXIgPSBhd2FpdCBEZW5vLm9wZW4oc3JjLCB7IHJlYWQ6IHRydWUgfSk7XG4gIGNvbnN0IHVudGFyID0gbmV3IFVudGFyKHJlYWRlcik7XG4gIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2YgdW50YXIpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShkZXN0LCBlbnRyeS5maWxlTmFtZSk7XG4gICAgaWYgKGVudHJ5LnR5cGUgPT09IFwiZGlyZWN0b3J5XCIpIHtcbiAgICAgIGF3YWl0IGVuc3VyZURpcihmaWxlUGF0aCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihmaWxlUGF0aCwgeyB3cml0ZTogdHJ1ZSwgY3JlYXRlOiB0cnVlIH0pO1xuICAgIGF3YWl0IERlbm8uY29weShlbnRyeSwgZmlsZSk7XG4gICAgYXdhaXQgZmlsZS5jbG9zZSgpO1xuICB9XG4gIHJlYWRlci5jbG9zZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3MoXG4gIHNyYzogc3RyaW5nLFxuICBkZXN0OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBjb21wcmVzc0ludGVyZmFjZSxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0YXIgPSBuZXcgVGFyKCk7XG4gIGNvbnN0IHN0YXQgPSBhd2FpdCBEZW5vLmxzdGF0KHNyYyk7XG4gIGlmIChzdGF0LmlzRmlsZSkge1xuICAgIGF3YWl0IHRhci5hcHBlbmQocGF0aC5iYXNlbmFtZShzcmMpLCB7XG4gICAgICBmaWxlUGF0aDogc3JjLFxuICAgICAgY29udGVudFNpemU6IHN0YXQuc2l6ZSxcbiAgICAgIG10aW1lOiAoc3RhdD8ubXRpbWUgPz8gbmV3IERhdGUoKSkudmFsdWVPZigpIC8gMTAwMCxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhcHBlbmRGb2xkZXIgPSBhc3luYyAoZm9sZGVyOiBzdHJpbmcsIHByZWZpeD86IHN0cmluZykgPT4ge1xuICAgICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBEZW5vLnJlYWREaXIoZm9sZGVyKSkge1xuICAgICAgICBjb25zdCB7IGlzRGlyZWN0b3J5LCBuYW1lIH0gPSBlbnRyeTtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwcmVmaXggPyBgJHtwcmVmaXh9LyR7bmFtZX1gIDogbmFtZTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUoZm9sZGVyLCBuYW1lKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IERlbm8uc3RhdChmaWxlUGF0aCk7XG4gICAgICAgIGlmIChpc0RpcmVjdG9yeSkge1xuICAgICAgICAgIGF3YWl0IHRhci5hcHBlbmQoXG4gICAgICAgICAgICBgJHtmaWxlTmFtZX0vYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmVhZGVyOiBuZXcgRGVuby5CdWZmZXIoKSxcbiAgICAgICAgICAgICAgY29udGVudFNpemU6IDAsXG4gICAgICAgICAgICAgIHR5cGU6IFwiZGlyZWN0b3J5XCIsXG4gICAgICAgICAgICAgIG10aW1lOiAoc3RhdD8ubXRpbWUgPz8gbmV3IERhdGUoKSkudmFsdWVPZigpIC8gMTAwMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgICBhd2FpdCBhcHBlbmRGb2xkZXIoZmlsZVBhdGgsIGZpbGVOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCB0YXIuYXBwZW5kKGZpbGVOYW1lLCB7XG4gICAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICAgIG10aW1lOiAoc3RhdD8ubXRpbWUgPz8gbmV3IERhdGUoKSkudmFsdWVPZigpIC8gMTAwMCxcbiAgICAgICAgICAgIGNvbnRlbnRTaXplOiBzdGF0LnNpemUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGlmIChvcHRpb25zPy5leGNsdWRlU3JjKSB7XG4gICAgICBhd2FpdCBhcHBlbmRGb2xkZXIoc3JjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZm9sZGVyTmFtZSA9IHBhdGguYmFzZW5hbWUoc3JjKTtcbiAgICAgIGF3YWl0IHRhci5hcHBlbmQoXG4gICAgICAgIGAke2ZvbGRlck5hbWV9L2AsXG4gICAgICAgIHtcbiAgICAgICAgICBmaWxlUGF0aDogc3JjLFxuICAgICAgICAgIC8vIHR5cGU6IFwiZGlyZWN0b3J5XCIsXG4gICAgICAgICAgLy8gbXRpbWU6IChzdGF0Py5tdGltZSA/PyBuZXcgRGF0ZSgpKS52YWx1ZU9mKCkgLyAxMDAwLFxuICAgICAgICAgIC8vIGNvbnRlbnRTaXplOiAwLFxuICAgICAgICAgIC8vIHJlYWRlcjogbmV3IERlbm8uQnVmZmVyKCksXG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgYXdhaXQgYXBwZW5kRm9sZGVyKHNyYywgZm9sZGVyTmFtZSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHdyaXRlciA9IGF3YWl0IERlbm8ub3BlbihkZXN0LCB7IHdyaXRlOiB0cnVlLCBjcmVhdGU6IHRydWUgfSk7XG4gIGF3YWl0IERlbm8uY29weSh0YXIuZ2V0UmVhZGVyKCksIHdyaXRlcik7XG4gIHdyaXRlci5jbG9zZSgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsRUFB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