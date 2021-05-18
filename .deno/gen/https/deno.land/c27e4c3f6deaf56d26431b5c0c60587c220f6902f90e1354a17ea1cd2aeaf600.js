const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");
export class SabrTable {
    /** The name of the table. Defaults to "sabr" */ name = "sabr";
    /** The main sabr class */ sabr;
    constructor(sabr, name){
        this.sabr = sabr;
        this.name = name;
        this.sabr.tables.set(name, this);
    }
    async getAll(returnArray = false) {
        const files = Deno.readDirSync(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`));
        const data = new Map();
        for (const file of files){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) data.set(name, json);
            } catch (error) {
                this.sabr.error(`[Sabr Error: getAll]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
        return returnArray ? [
            ...data.values()
        ] : data;
    }
    async findMany(filter, returnArray = false) {
        const files = Deno.readDirSync(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`));
        const data = new Map();
        for (const file of files){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) {
                    if (typeof filter === "function") {
                        if (filter(json)) data.set(name, json);
                    } else {
                        const invalid = Object.keys(filter).find((key)=>json[key] !== filter[key]
                        );
                        if (!invalid) data.set(name, json);
                    }
                }
            } catch (error) {
                this.sabr.error(`[Sabr Error: findMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
        return returnArray ? [
            ...data.values()
        ] : data;
    }
    /** Gets the first document from a table that match a filter */ async findOne(filter) {
        for await (const file of Deno.readDir(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`))){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) {
                    if (typeof filter === "function") {
                        if (filter(json)) return json;
                    } else {
                        const invalid = Object.keys(filter).find((key)=>json[key] !== filter[key]
                        );
                        if (!invalid) return json;
                    }
                }
            } catch (error) {
                this.sabr.error(`[Sabr Error: findOne]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
    }
    /** Get a document from a table. */ async get(id) {
        try {
            const data = await Deno.readFile(`${this.sabr.directoryPath}${this.name}/${id}.json`);
            return JSON.parse(decoder.decode(data));
        } catch (error) {
            this.sabr.error(`[Sabr Error: get] Unable to read file file://${this.sabr.directoryPath}${this.name}/${id}.json`, error);
        }
    }
    /** Checks if a document exists. */ has(id) {
        try {
            Deno.readFileSync(`${this.sabr.directoryPath}${this.name}/${id}.json`);
            return true;
        } catch  {
            return false;
        }
    }
    /** Creates a new document into a table. */ create(id, data = {
    }) {
        if (this.has(id)) {
            this.sabr.error(`[Sabr Error: create] Cannot create already existing file file://${this.sabr.directoryPath}${this.name}/${id}.json`);
        }
        const encoded = encoder.encode(JSON.stringify({
            id,
            ...data
        }));
        return Deno.writeFileSync(`${this.sabr.directoryPath}${this.name}/${id}.json`, encoded);
    }
    /** Updates a documents data. If this document does not exist, it will create the document. */ async update(id, data = {
    }) {
        const existing = await this.get(id) || {
        };
        return this.create(id, existing ? {
            ...existing,
            ...data
        } : data);
    }
    /** Gets the first document from a table that match a filter */ async updateOne(filter, data) {
        for await (const file of Deno.readDir(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`))){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) {
                    if (typeof filter === "function") {
                        if (filter(json)) return this.update(name, data);
                    } else {
                        // deno-lint-ignore no-explicit-any
                        const invalid = Object.keys(filter).find((key)=>json[key] !== filter[key]
                        );
                        if (!invalid) return this.update(name, data);
                    }
                }
            } catch (error) {
                this.sabr.error(`[Sabr Error: updateOne]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
    }
    /** Deletes a document from the table. */ delete(id) {
        Deno.removeSync(`${this.sabr.directoryPath}${this.name}/${id}.json`);
    }
    /** Deletes one document in a table that match a filter */ async deleteOne(filter) {
        const files = Deno.readDirSync(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`));
        for (const file of files){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) {
                    if (typeof filter === "function") {
                        return this.delete(name);
                    } else {
                        // deno-lint-ignore no-explicit-any
                        const invalid = Object.keys(filter).find((key)=>json[key] !== filter[key]
                        );
                        if (!invalid) return this.delete(name);
                    }
                }
            } catch (error) {
                this.sabr.error(`[Sabr Error: deleteMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
    }
    /** Deletes all documents in a table that match a filter */ async deleteMany(filter) {
        const files = Deno.readDirSync(Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`));
        for (const file of files){
            if (!file.name || !file.isFile) continue;
            try {
                // Substring remove the file type `.json` from file.name
                const name = file.name.substring(0, file.name.lastIndexOf("."));
                const json = await this.get(name);
                if (json) {
                    if (typeof filter === "function") {
                        this.delete(name);
                    } else {
                        // deno-lint-ignore no-explicit-any
                        const invalid = Object.keys(filter).find((key)=>json[key] !== filter[key]
                        );
                        if (!invalid) this.delete(name);
                    }
                }
            } catch (error) {
                this.sabr.error(`[Sabr Error: deleteMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`, error);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L3NhYnJAMS4xLjQvdGFibGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNhYnIgfSBmcm9tIFwiLi9zYWJyLnRzXCI7XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoXCJ1dGYtOFwiKTtcblxuZXhwb3J0IGNsYXNzIFNhYnJUYWJsZTxUPiB7XG4gIC8qKiBUaGUgbmFtZSBvZiB0aGUgdGFibGUuIERlZmF1bHRzIHRvIFwic2FiclwiICovXG4gIG5hbWUgPSBcInNhYnJcIjtcbiAgLyoqIFRoZSBtYWluIHNhYnIgY2xhc3MgKi9cbiAgc2FicjogU2FicjtcblxuICBjb25zdHJ1Y3RvcihzYWJyOiBTYWJyLCBuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNhYnIgPSBzYWJyO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICB0aGlzLnNhYnIudGFibGVzLnNldChuYW1lLCB0aGlzKTtcbiAgfVxuXG4gIC8qKiBHZXQgYWxsIGRvY3VtZW50cyBmcm9tIGEgdGFibGUuICovXG4gIGFzeW5jIGdldEFsbChyZXR1cm5BcnJheT86IGZhbHNlKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBUPj47XG4gIGFzeW5jIGdldEFsbChyZXR1cm5BcnJheT86IHRydWUpOiBQcm9taXNlPFRbXT47XG4gIGFzeW5jIGdldEFsbChyZXR1cm5BcnJheSA9IGZhbHNlKSB7XG4gICAgY29uc3QgZmlsZXMgPSBEZW5vLnJlYWREaXJTeW5jKFxuICAgICAgRGVuby5yZWFsUGF0aFN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9YCksXG4gICAgKTtcblxuICAgIGNvbnN0IGRhdGEgPSBuZXcgTWFwPHN0cmluZywgVD4oKTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgaWYgKCFmaWxlLm5hbWUgfHwgIWZpbGUuaXNGaWxlKSBjb250aW51ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gU3Vic3RyaW5nIHJlbW92ZSB0aGUgZmlsZSB0eXBlIGAuanNvbmAgZnJvbSBmaWxlLm5hbWVcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZS5zdWJzdHJpbmcoMCwgZmlsZS5uYW1lLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCB0aGlzLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGpzb24pIGRhdGEuc2V0KG5hbWUsIGpzb24pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5zYWJyLmVycm9yKFxuICAgICAgICAgIGBbU2FiciBFcnJvcjogZ2V0QWxsXTogVW5hYmxlIHRvIHJlYWQgZmlsZSAke3RoaXMuc2Fici5kaXJlY3RvcnlQYXRofSR7dGhpcy5uYW1lfS8ke2ZpbGUubmFtZX1gLFxuICAgICAgICAgIGVycm9yLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXR1cm5BcnJheSA/IFsuLi5kYXRhLnZhbHVlcygpXSA6IGRhdGE7XG4gIH1cblxuICAvKiogR2V0IGFsbCBkb2N1bWVudHMgZnJvbSBhIHRhYmxlIHRoYXQgbWF0Y2ggYSBmaWx0ZXIgKi9cbiAgYXN5bmMgZmluZE1hbnkoXG4gICAgZmlsdGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8ICgodmFsdWU6IFQpID0+IGJvb2xlYW4pLFxuICAgIHJldHVybkFycmF5PzogZmFsc2UsXG4gICk6IFByb21pc2U8TWFwPHN0cmluZywgVD4+O1xuICBhc3luYyBmaW5kTWFueShcbiAgICBmaWx0ZXI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgKCh2YWx1ZTogVCkgPT4gYm9vbGVhbiksXG4gICAgcmV0dXJuQXJyYXk/OiB0cnVlLFxuICApOiBQcm9taXNlPFRbXT47XG4gIGFzeW5jIGZpbmRNYW55KFxuICAgIGZpbHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCAoKHZhbHVlOiBUKSA9PiBib29sZWFuKSxcbiAgICByZXR1cm5BcnJheSA9IGZhbHNlLFxuICApIHtcbiAgICBjb25zdCBmaWxlcyA9IERlbm8ucmVhZERpclN5bmMoXG4gICAgICBEZW5vLnJlYWxQYXRoU3luYyhgJHt0aGlzLnNhYnIuZGlyZWN0b3J5UGF0aH0ke3RoaXMubmFtZX1gKSxcbiAgICApO1xuXG4gICAgY29uc3QgZGF0YSA9IG5ldyBNYXA8c3RyaW5nLCBUPigpO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBpZiAoIWZpbGUubmFtZSB8fCAhZmlsZS5pc0ZpbGUpIGNvbnRpbnVlO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBTdWJzdHJpbmcgcmVtb3ZlIHRoZSBmaWxlIHR5cGUgYC5qc29uYCBmcm9tIGZpbGUubmFtZVxuICAgICAgICBjb25zdCBuYW1lID0gZmlsZS5uYW1lLnN1YnN0cmluZygwLCBmaWxlLm5hbWUubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHRoaXMuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoanNvbikge1xuICAgICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIoanNvbikpIGRhdGEuc2V0KG5hbWUsIGpzb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnZhbGlkID0gT2JqZWN0LmtleXMoZmlsdGVyKS5maW5kKChrZXkpID0+XG4gICAgICAgICAgICAgIChqc29uIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldICE9PSBmaWx0ZXJba2V5XVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICghaW52YWxpZCkgZGF0YS5zZXQobmFtZSwganNvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aGlzLnNhYnIuZXJyb3IoXG4gICAgICAgICAgYFtTYWJyIEVycm9yOiBmaW5kTWFueV06IFVuYWJsZSB0byByZWFkIGZpbGUgJHt0aGlzLnNhYnIuZGlyZWN0b3J5UGF0aH0ke3RoaXMubmFtZX0vJHtmaWxlLm5hbWV9YCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmV0dXJuQXJyYXkgPyBbLi4uZGF0YS52YWx1ZXMoKV0gOiBkYXRhO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGZpcnN0IGRvY3VtZW50IGZyb20gYSB0YWJsZSB0aGF0IG1hdGNoIGEgZmlsdGVyICovXG4gIGFzeW5jIGZpbmRPbmUoZmlsdGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8ICgodmFsdWU6IFQpID0+IGJvb2xlYW4pKSB7XG4gICAgZm9yIGF3YWl0IChcbiAgICAgIGNvbnN0IGZpbGUgb2YgRGVuby5yZWFkRGlyKFxuICAgICAgICBEZW5vLnJlYWxQYXRoU3luYyhgJHt0aGlzLnNhYnIuZGlyZWN0b3J5UGF0aH0ke3RoaXMubmFtZX1gKSxcbiAgICAgIClcbiAgICApIHtcbiAgICAgIGlmICghZmlsZS5uYW1lIHx8ICFmaWxlLmlzRmlsZSkgY29udGludWU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFN1YnN0cmluZyByZW1vdmUgdGhlIGZpbGUgdHlwZSBgLmpzb25gIGZyb20gZmlsZS5uYW1lXG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlLm5hbWUuc3Vic3RyaW5nKDAsIGZpbGUubmFtZS5sYXN0SW5kZXhPZihcIi5cIikpO1xuICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgdGhpcy5nZXQobmFtZSk7XG4gICAgICAgIGlmIChqc29uKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgaWYgKGZpbHRlcihqc29uKSkgcmV0dXJuIGpzb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGludmFsaWQgPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmZpbmQoKGtleSkgPT5cbiAgICAgICAgICAgICAgKGpzb24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0gIT09IGZpbHRlcltrZXldXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSByZXR1cm4ganNvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRoaXMuc2Fici5lcnJvcihcbiAgICAgICAgICBgW1NhYnIgRXJyb3I6IGZpbmRPbmVdOiBVbmFibGUgdG8gcmVhZCBmaWxlICR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7ZmlsZS5uYW1lfWAsXG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCBhIGRvY3VtZW50IGZyb20gYSB0YWJsZS4gKi9cbiAgYXN5bmMgZ2V0KGlkOiBzdHJpbmcpOiBQcm9taXNlPFQgfCB1bmRlZmluZWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IERlbm8ucmVhZEZpbGUoXG4gICAgICAgIGAke3RoaXMuc2Fici5kaXJlY3RvcnlQYXRofSR7dGhpcy5uYW1lfS8ke2lkfS5qc29uYCxcbiAgICAgICk7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkZWNvZGVyLmRlY29kZShkYXRhKSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMuc2Fici5lcnJvcihcbiAgICAgICAgYFtTYWJyIEVycm9yOiBnZXRdIFVuYWJsZSB0byByZWFkIGZpbGUgZmlsZTovLyR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7aWR9Lmpzb25gLFxuICAgICAgICBlcnJvcixcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENoZWNrcyBpZiBhIGRvY3VtZW50IGV4aXN0cy4gKi9cbiAgaGFzKGlkOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgRGVuby5yZWFkRmlsZVN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7aWR9Lmpzb25gKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbmV3IGRvY3VtZW50IGludG8gYSB0YWJsZS4gKi9cbiAgY3JlYXRlKGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWw8VD4gPSB7fSkge1xuICAgIGlmICh0aGlzLmhhcyhpZCkpIHtcbiAgICAgIHRoaXMuc2Fici5lcnJvcihcbiAgICAgICAgYFtTYWJyIEVycm9yOiBjcmVhdGVdIENhbm5vdCBjcmVhdGUgYWxyZWFkeSBleGlzdGluZyBmaWxlIGZpbGU6Ly8ke3RoaXMuc2Fici5kaXJlY3RvcnlQYXRofSR7dGhpcy5uYW1lfS8ke2lkfS5qc29uYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZW5jb2RlZCA9IGVuY29kZXIuZW5jb2RlKEpTT04uc3RyaW5naWZ5KHsgaWQsIC4uLmRhdGEgfSkpO1xuICAgIHJldHVybiBEZW5vLndyaXRlRmlsZVN5bmMoXG4gICAgICBgJHt0aGlzLnNhYnIuZGlyZWN0b3J5UGF0aH0ke3RoaXMubmFtZX0vJHtpZH0uanNvbmAsXG4gICAgICBlbmNvZGVkLFxuICAgICk7XG4gIH1cblxuICAvKiogVXBkYXRlcyBhIGRvY3VtZW50cyBkYXRhLiBJZiB0aGlzIGRvY3VtZW50IGRvZXMgbm90IGV4aXN0LCBpdCB3aWxsIGNyZWF0ZSB0aGUgZG9jdW1lbnQuICovXG4gIGFzeW5jIHVwZGF0ZShpZDogc3RyaW5nLCBkYXRhOiBQYXJ0aWFsPFQ+ID0ge30pIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuZ2V0KGlkKSB8fCB7fTtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGUoaWQsIGV4aXN0aW5nID8geyAuLi5leGlzdGluZywgLi4uZGF0YSB9IDogZGF0YSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZmlyc3QgZG9jdW1lbnQgZnJvbSBhIHRhYmxlIHRoYXQgbWF0Y2ggYSBmaWx0ZXIgKi9cbiAgYXN5bmMgdXBkYXRlT25lKFxuICAgIGZpbHRlcjogUGFydGlhbDxUPiB8ICgodmFsdWU6IFQpID0+IGJvb2xlYW4pLFxuICAgIGRhdGE6IFBhcnRpYWw8VD4sXG4gICkge1xuICAgIGZvciBhd2FpdCAoXG4gICAgICBjb25zdCBmaWxlIG9mIERlbm8ucmVhZERpcihcbiAgICAgICAgRGVuby5yZWFsUGF0aFN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9YCksXG4gICAgICApXG4gICAgKSB7XG4gICAgICBpZiAoIWZpbGUubmFtZSB8fCAhZmlsZS5pc0ZpbGUpIGNvbnRpbnVlO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBTdWJzdHJpbmcgcmVtb3ZlIHRoZSBmaWxlIHR5cGUgYC5qc29uYCBmcm9tIGZpbGUubmFtZVxuICAgICAgICBjb25zdCBuYW1lID0gZmlsZS5uYW1lLnN1YnN0cmluZygwLCBmaWxlLm5hbWUubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHRoaXMuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoanNvbikge1xuICAgICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIoanNvbikpIHJldHVybiB0aGlzLnVwZGF0ZShuYW1lLCBkYXRhKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgICAgIGNvbnN0IGludmFsaWQgPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmZpbmQoKGtleSkgPT5cbiAgICAgICAgICAgICAgKGpzb24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0gIT09IChmaWx0ZXIgYXMgYW55KVtrZXldXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSByZXR1cm4gdGhpcy51cGRhdGUobmFtZSwgZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aGlzLnNhYnIuZXJyb3IoXG4gICAgICAgICAgYFtTYWJyIEVycm9yOiB1cGRhdGVPbmVdOiBVbmFibGUgdG8gcmVhZCBmaWxlICR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7ZmlsZS5uYW1lfWAsXG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZXMgYSBkb2N1bWVudCBmcm9tIHRoZSB0YWJsZS4gKi9cbiAgZGVsZXRlKGlkOiBzdHJpbmcpIHtcbiAgICBEZW5vLnJlbW92ZVN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7aWR9Lmpzb25gKTtcbiAgfVxuXG4gIC8qKiBEZWxldGVzIG9uZSBkb2N1bWVudCBpbiBhIHRhYmxlIHRoYXQgbWF0Y2ggYSBmaWx0ZXIgKi9cbiAgYXN5bmMgZGVsZXRlT25lKGZpbHRlcjogUGFydGlhbDxUPiB8ICgodmFsdWU6IFQpID0+IGJvb2xlYW4pKSB7XG4gICAgY29uc3QgZmlsZXMgPSBEZW5vLnJlYWREaXJTeW5jKFxuICAgICAgRGVuby5yZWFsUGF0aFN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9YCksXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgaWYgKCFmaWxlLm5hbWUgfHwgIWZpbGUuaXNGaWxlKSBjb250aW51ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gU3Vic3RyaW5nIHJlbW92ZSB0aGUgZmlsZSB0eXBlIGAuanNvbmAgZnJvbSBmaWxlLm5hbWVcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZS5zdWJzdHJpbmcoMCwgZmlsZS5uYW1lLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCB0aGlzLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGpzb24pIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGUobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgICBjb25zdCBpbnZhbGlkID0gT2JqZWN0LmtleXMoZmlsdGVyKS5maW5kKChrZXkpID0+XG4gICAgICAgICAgICAgIChqc29uIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldICE9PSAoZmlsdGVyIGFzIGFueSlba2V5XVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICghaW52YWxpZCkgcmV0dXJuIHRoaXMuZGVsZXRlKG5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5zYWJyLmVycm9yKFxuICAgICAgICAgIGBbU2FiciBFcnJvcjogZGVsZXRlTWFueV06IFVuYWJsZSB0byByZWFkIGZpbGUgJHt0aGlzLnNhYnIuZGlyZWN0b3J5UGF0aH0ke3RoaXMubmFtZX0vJHtmaWxlLm5hbWV9YCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogRGVsZXRlcyBhbGwgZG9jdW1lbnRzIGluIGEgdGFibGUgdGhhdCBtYXRjaCBhIGZpbHRlciAqL1xuICBhc3luYyBkZWxldGVNYW55KGZpbHRlcjogUGFydGlhbDxUPiB8ICgodmFsdWU6IFQpID0+IGJvb2xlYW4pKSB7XG4gICAgY29uc3QgZmlsZXMgPSBEZW5vLnJlYWREaXJTeW5jKFxuICAgICAgRGVuby5yZWFsUGF0aFN5bmMoYCR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9YCksXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgaWYgKCFmaWxlLm5hbWUgfHwgIWZpbGUuaXNGaWxlKSBjb250aW51ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gU3Vic3RyaW5nIHJlbW92ZSB0aGUgZmlsZSB0eXBlIGAuanNvbmAgZnJvbSBmaWxlLm5hbWVcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZS5zdWJzdHJpbmcoMCwgZmlsZS5uYW1lLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCB0aGlzLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGpzb24pIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgICAgIGNvbnN0IGludmFsaWQgPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmZpbmQoKGtleSkgPT5cbiAgICAgICAgICAgICAgKGpzb24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0gIT09IChmaWx0ZXIgYXMgYW55KVtrZXldXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSB0aGlzLmRlbGV0ZShuYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRoaXMuc2Fici5lcnJvcihcbiAgICAgICAgICBgW1NhYnIgRXJyb3I6IGRlbGV0ZU1hbnldOiBVbmFibGUgdG8gcmVhZCBmaWxlICR7dGhpcy5zYWJyLmRpcmVjdG9yeVBhdGh9JHt0aGlzLm5hbWV9LyR7ZmlsZS5uYW1lfWAsXG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BRU0sT0FBTyxPQUFPLFdBQVc7TUFDekIsT0FBTyxPQUFPLFdBQVcsRUFBQyxLQUFPO2FBRTFCLFNBQVM7SUFDcEIsRUFBZ0QsQUFBaEQsNENBQWdELEFBQWhELEVBQWdELENBQ2hELElBQUksSUFBRyxJQUFNO0lBQ2IsRUFBMEIsQUFBMUIsc0JBQTBCLEFBQTFCLEVBQTBCLENBQzFCLElBQUk7Z0JBRVEsSUFBVSxFQUFFLElBQVk7YUFDN0IsSUFBSSxHQUFHLElBQUk7YUFDWCxJQUFJLEdBQUcsSUFBSTthQUVYLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUk7O1VBTXJCLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSztjQUN4QixLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FDNUIsSUFBSSxDQUFDLFlBQVksU0FBUyxJQUFJLENBQUMsYUFBYSxRQUFRLElBQUk7Y0FHcEQsSUFBSSxPQUFPLEdBQUc7bUJBRVQsSUFBSSxJQUFJLEtBQUs7aUJBQ2pCLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLE1BQU07O2dCQUc1QixFQUF3RCxBQUF4RCxzREFBd0Q7c0JBQ2xELElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUMsQ0FBRztzQkFDdkQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxJQUFJO29CQUM1QixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSTtxQkFDdEIsS0FBSztxQkFDUCxJQUFJLENBQUMsS0FBSyxFQUNaLDBDQUEwQyxP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