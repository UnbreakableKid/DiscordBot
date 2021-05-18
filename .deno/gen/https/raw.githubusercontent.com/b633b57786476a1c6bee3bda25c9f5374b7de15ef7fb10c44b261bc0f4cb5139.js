import { editMember } from "./edit_member.ts";
/**
 * Move a member from a voice channel to another.
 * @param guildId the id of the guild which the channel exists in
 * @param memberId the id of the member to move.
 * @param channelId id of channel to move user to (if they are connected to voice)
 */ export function moveMember(guildId, memberId, channelId) {
    return editMember(guildId, memberId, {
        channelId
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVtYmVycy9tb3ZlX21lbWJlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZWRpdE1lbWJlciB9IGZyb20gXCIuL2VkaXRfbWVtYmVyLnRzXCI7XG5cbi8qKlxuICogTW92ZSBhIG1lbWJlciBmcm9tIGEgdm9pY2UgY2hhbm5lbCB0byBhbm90aGVyLlxuICogQHBhcmFtIGd1aWxkSWQgdGhlIGlkIG9mIHRoZSBndWlsZCB3aGljaCB0aGUgY2hhbm5lbCBleGlzdHMgaW5cbiAqIEBwYXJhbSBtZW1iZXJJZCB0aGUgaWQgb2YgdGhlIG1lbWJlciB0byBtb3ZlLlxuICogQHBhcmFtIGNoYW5uZWxJZCBpZCBvZiBjaGFubmVsIHRvIG1vdmUgdXNlciB0byAoaWYgdGhleSBhcmUgY29ubmVjdGVkIHRvIHZvaWNlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZU1lbWJlcihcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBtZW1iZXJJZDogYmlnaW50LFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbikge1xuICByZXR1cm4gZWRpdE1lbWJlcihndWlsZElkLCBtZW1iZXJJZCwgeyBjaGFubmVsSWQgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsVUFBVSxTQUFRLGdCQUFrQjtBQUU3QyxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLGlCQUNhLFVBQVUsQ0FDeEIsT0FBZSxFQUNmLFFBQWdCLEVBQ2hCLFNBQWlCO1dBRVYsVUFBVSxDQUFDLE9BQU8sRUFBRSxRQUFRO1FBQUksU0FBUyJ9