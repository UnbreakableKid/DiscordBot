import { fromFileUrl } from "./deps.ts";
import { SabrTable } from "./table.ts";
export class Sabr {
    directoryPath = `${fromFileUrl(Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/")))}/db/`;
    tables = new Map();
    /** Initializes the database which makes sure that the folder exists. */ async init() {
        // Must make the db folder before making the tables themselves
        await Deno.mkdir(this.directoryPath).catch(()=>undefined
        );
        // Make the folders for each table
        for (let table of this.tables){
            await Deno.mkdir(`${this.directoryPath}/${table[1].name}`).catch(()=>undefined
            );
        }
        return this;
    }
    /** This method allows you to customize how to handle errors from Sabr. */ // deno-lint-ignore no-explicit-any
    async error(...data) {
        console.error(...data);
    }
    /** Checks if a table exists. */ hasTable(tableName) {
        try {
            Deno.readDirSync(`${this.directoryPath}/${tableName}`);
            return true;
        } catch  {
            return false;
        }
    }
    /** Creates a new table. */ async createTable(tableName) {
        try {
            await Deno.mkdir(`${this.directoryPath}/${tableName}`);
            const table = new SabrTable(this, tableName);
            return table;
        } catch  {
        // Something went wrong
        }
    }
    /** Deletes a table. */ deleteTable(tableName) {
        Deno.removeSync(`${this.directoryPath}/${tableName}`, {
            recursive: true
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L3NhYnJAMS4xLjQvc2Fici50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBTYWJyVGFibGUgfSBmcm9tIFwiLi90YWJsZS50c1wiO1xuXG5leHBvcnQgY2xhc3MgU2FiciB7XG4gIGRpcmVjdG9yeVBhdGggPSBgJHtcbiAgICBmcm9tRmlsZVVybChEZW5vLm1haW5Nb2R1bGUuc3Vic3RyaW5nKDAsIERlbm8ubWFpbk1vZHVsZS5sYXN0SW5kZXhPZihcIi9cIikpKVxuICB9L2RiL2A7XG4gIHRhYmxlcyA9IG5ldyBNYXA8c3RyaW5nLCBTYWJyVGFibGU8dW5rbm93bj4+KCk7XG5cbiAgLyoqIEluaXRpYWxpemVzIHRoZSBkYXRhYmFzZSB3aGljaCBtYWtlcyBzdXJlIHRoYXQgdGhlIGZvbGRlciBleGlzdHMuICovXG4gIGFzeW5jIGluaXQoKSB7XG4gICAgLy8gTXVzdCBtYWtlIHRoZSBkYiBmb2xkZXIgYmVmb3JlIG1ha2luZyB0aGUgdGFibGVzIHRoZW1zZWx2ZXNcbiAgICBhd2FpdCBEZW5vLm1rZGlyKHRoaXMuZGlyZWN0b3J5UGF0aCkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICAvLyBNYWtlIHRoZSBmb2xkZXJzIGZvciBlYWNoIHRhYmxlXG4gICAgZm9yIChsZXQgdGFibGUgb2YgdGhpcy50YWJsZXMpIHtcbiAgICAgIGF3YWl0IERlbm8ubWtkaXIoYCR7dGhpcy5kaXJlY3RvcnlQYXRofS8ke3RhYmxlWzFdLm5hbWV9YCkuY2F0Y2goKCkgPT5cbiAgICAgICAgdW5kZWZpbmVkXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFRoaXMgbWV0aG9kIGFsbG93cyB5b3UgdG8gY3VzdG9taXplIGhvdyB0byBoYW5kbGUgZXJyb3JzIGZyb20gU2Fici4gKi9cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgYXN5bmMgZXJyb3IoLi4uZGF0YTogYW55W10pIHtcbiAgICBjb25zb2xlLmVycm9yKC4uLmRhdGEpO1xuICB9XG5cbiAgLyoqIENoZWNrcyBpZiBhIHRhYmxlIGV4aXN0cy4gKi9cbiAgaGFzVGFibGUodGFibGVOYW1lOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgRGVuby5yZWFkRGlyU3luYyhgJHt0aGlzLmRpcmVjdG9yeVBhdGh9LyR7dGFibGVOYW1lfWApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBuZXcgdGFibGUuICovXG4gIGFzeW5jIGNyZWF0ZVRhYmxlPFQ+KHRhYmxlTmFtZTogc3RyaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IERlbm8ubWtkaXIoYCR7dGhpcy5kaXJlY3RvcnlQYXRofS8ke3RhYmxlTmFtZX1gKTtcbiAgICAgIGNvbnN0IHRhYmxlID0gbmV3IFNhYnJUYWJsZTxUPih0aGlzLCB0YWJsZU5hbWUpO1xuICAgICAgcmV0dXJuIHRhYmxlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9XG4gIH1cblxuICAvKiogRGVsZXRlcyBhIHRhYmxlLiAqL1xuICBkZWxldGVUYWJsZSh0YWJsZU5hbWU6IHN0cmluZykge1xuICAgIERlbm8ucmVtb3ZlU3luYyhgJHt0aGlzLmRpcmVjdG9yeVBhdGh9LyR7dGFibGVOYW1lfWAsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsV0FBVyxTQUFRLFNBQVc7U0FDOUIsU0FBUyxTQUFRLFVBQVk7YUFFekIsSUFBSTtJQUNmLGFBQWEsTUFDWCxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFDLENBQUcsS0FDekUsSUFBSTtJQUNMLE1BQU0sT0FBTyxHQUFHO0lBRWhCLEVBQXdFLEFBQXhFLG9FQUF3RSxBQUF4RSxFQUF3RSxPQUNsRSxJQUFJO1FBQ1IsRUFBOEQsQUFBOUQsNERBQThEO2NBQ3hELElBQUksQ0FBQyxLQUFLLE1BQU0sYUFBYSxFQUFFLEtBQUssS0FBTyxTQUFTOztRQUMxRCxFQUFrQyxBQUFsQyxnQ0FBa0M7aUJBQ3pCLEtBQUssU0FBUyxNQUFNO2tCQUNyQixJQUFJLENBQUMsS0FBSyxTQUFTLGFBQWEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUksS0FBSyxLQUM5RCxTQUFTOzs7OztJQU9mLEVBQTBFLEFBQTFFLHNFQUEwRSxBQUExRSxFQUEwRSxDQUMxRSxFQUFtQyxBQUFuQyxpQ0FBbUM7VUFDN0IsS0FBSyxJQUFJLElBQUk7UUFDakIsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJOztJQUd2QixFQUFnQyxBQUFoQyw0QkFBZ0MsQUFBaEMsRUFBZ0MsQ0FDaEMsUUFBUSxDQUFDLFNBQWlCOztZQUV0QixJQUFJLENBQUMsV0FBVyxTQUFTLGFBQWEsQ0FBQyxDQUFDLEVBQUUsU0FBUzttQkFDNUMsSUFBSTs7bUJBRUosS0FBSzs7O0lBSWhCLEVBQTJCLEFBQTNCLHVCQUEyQixBQUEzQixFQUEyQixPQUNyQixXQUFXLENBQUksU0FBaUI7O2tCQUU1QixJQUFJLENBQUMsS0FBSyxTQUFTLGFBQWEsQ0FBQyxDQUFDLEVBQUUsU0FBUztrQkFDN0MsS0FBSyxPQUFPLFNBQVMsT0FBVSxTQUFTO21CQUN2QyxLQUFLOztRQUVaLEVBQXVCLEFBQXZCLHFCQUF1Qjs7O0lBSTNCLEVBQXVCLEFBQXZCLG1CQUF1QixBQUF2QixFQUF1QixDQUN2QixXQUFXLENBQUMsU0FBaUI7UUFDM0IsSUFBSSxDQUFDLFVBQVUsU0FBUyxhQUFhLENBQUMsQ0FBQyxFQUFFLFNBQVM7WUFBTSxTQUFTLEVBQUUsSUFBSSJ9