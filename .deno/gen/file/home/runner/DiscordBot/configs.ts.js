// Step 1: Remove the `.example` from this file name so it is called `configs.ts` or copy the contents of the `configs.example.ts` file into a new `configs.ts` file
// Step 2: Add all your bot's information below. The only required one is token and prefix. NOTE: As long as `.gitignore` file is ignoring configs.ts your configurations will be kept private!
// Step 3: Remove these comments if you like.
export const configs = {
  // The default prefix for your bot. Don't worry guilds can change this later.
  prefix: "-",
  // This isn't required but you can add bot list api keys here.
  botListTokens: {
    DISCORD_BOTS_CO: "",
    DISCORD_BOT_ORG: "",
    BOTS_ON_DISCORD: "",
    DISCORD_BOT_LIST: "",
    BOTS_FOR_DISCORD: "",
    DISCORD_BOATS: "",
    DISCORD_BOTS_GG: "",
    DISCORD_BOTS_GROUP: "",
  },
  // This is the server id for your bot's main server where users can get help/support
  supportServerId: "",
  // These are the role ids that will enable some functionality.
  roleIds: {
    // If you have a patreon set up you can add the patreon vip role id here.
    patreonVIPRoleId: "",
  },
  // These are the user ids that will enable some functionality.
  userIds: {
    // You can delete the `as string[]` when you add atleast 1 id in them.
    // The user ids for the support team
    botSupporters: [],
    // The user ids for the other devs on your team
    botDevs: [],
    // The user ids who have complete 100% access to your bot
    botOwners: [],
  },
  webhooks: {
    // the webhook to use when the bot finds a missing translation
    missingTranslation: {
      id: "",
      token: "",
    },
  },
  // Lavadeno nodes
  nodes: [
    {
      // Id of the client which is connecting to the lavalink
      id: "main",
      host: "lavalink-deno.herokuapp.com",
      port: 80,
      password: "youshallnotpass",
    },
  ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3QvY29uZmlncy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gU3RlcCAxOiBSZW1vdmUgdGhlIGAuZXhhbXBsZWAgZnJvbSB0aGlzIGZpbGUgbmFtZSBzbyBpdCBpcyBjYWxsZWQgYGNvbmZpZ3MudHNgIG9yIGNvcHkgdGhlIGNvbnRlbnRzIG9mIHRoZSBgY29uZmlncy5leGFtcGxlLnRzYCBmaWxlIGludG8gYSBuZXcgYGNvbmZpZ3MudHNgIGZpbGVcbi8vIFN0ZXAgMjogQWRkIGFsbCB5b3VyIGJvdCdzIGluZm9ybWF0aW9uIGJlbG93LiBUaGUgb25seSByZXF1aXJlZCBvbmUgaXMgdG9rZW4gYW5kIHByZWZpeC4gTk9URTogQXMgbG9uZyBhcyBgLmdpdGlnbm9yZWAgZmlsZSBpcyBpZ25vcmluZyBjb25maWdzLnRzIHlvdXIgY29uZmlndXJhdGlvbnMgd2lsbCBiZSBrZXB0IHByaXZhdGUhXG4vLyBTdGVwIDM6IFJlbW92ZSB0aGVzZSBjb21tZW50cyBpZiB5b3UgbGlrZS5cblxuZXhwb3J0IGNvbnN0IGNvbmZpZ3MgPSB7XG4gIC8vIFRoZSBkZWZhdWx0IHByZWZpeCBmb3IgeW91ciBib3QuIERvbid0IHdvcnJ5IGd1aWxkcyBjYW4gY2hhbmdlIHRoaXMgbGF0ZXIuXG4gIHByZWZpeDogXCItXCIsXG4gIC8vIFRoaXMgaXNuJ3QgcmVxdWlyZWQgYnV0IHlvdSBjYW4gYWRkIGJvdCBsaXN0IGFwaSBrZXlzIGhlcmUuXG4gIGJvdExpc3RUb2tlbnM6IHtcbiAgICBESVNDT1JEX0JPVFNfQ086IFwiXCIsXG4gICAgRElTQ09SRF9CT1RfT1JHOiBcIlwiLFxuICAgIEJPVFNfT05fRElTQ09SRDogXCJcIixcbiAgICBESVNDT1JEX0JPVF9MSVNUOiBcIlwiLFxuICAgIEJPVFNfRk9SX0RJU0NPUkQ6IFwiXCIsXG4gICAgRElTQ09SRF9CT0FUUzogXCJcIixcbiAgICBESVNDT1JEX0JPVFNfR0c6IFwiXCIsXG4gICAgRElTQ09SRF9CT1RTX0dST1VQOiBcIlwiLFxuICB9LFxuICAvLyBUaGlzIGlzIHRoZSBzZXJ2ZXIgaWQgZm9yIHlvdXIgYm90J3MgbWFpbiBzZXJ2ZXIgd2hlcmUgdXNlcnMgY2FuIGdldCBoZWxwL3N1cHBvcnRcbiAgc3VwcG9ydFNlcnZlcklkOiBcIlwiLFxuICAvLyBUaGVzZSBhcmUgdGhlIHJvbGUgaWRzIHRoYXQgd2lsbCBlbmFibGUgc29tZSBmdW5jdGlvbmFsaXR5LlxuICByb2xlSWRzOiB7XG4gICAgLy8gSWYgeW91IGhhdmUgYSBwYXRyZW9uIHNldCB1cCB5b3UgY2FuIGFkZCB0aGUgcGF0cmVvbiB2aXAgcm9sZSBpZCBoZXJlLlxuICAgIHBhdHJlb25WSVBSb2xlSWQ6IFwiXCIsXG4gIH0sXG4gIC8vIFRoZXNlIGFyZSB0aGUgdXNlciBpZHMgdGhhdCB3aWxsIGVuYWJsZSBzb21lIGZ1bmN0aW9uYWxpdHkuXG4gIHVzZXJJZHM6IHtcbiAgICAvLyBZb3UgY2FuIGRlbGV0ZSB0aGUgYGFzIHN0cmluZ1tdYCB3aGVuIHlvdSBhZGQgYXRsZWFzdCAxIGlkIGluIHRoZW0uXG4gICAgLy8gVGhlIHVzZXIgaWRzIGZvciB0aGUgc3VwcG9ydCB0ZWFtXG4gICAgYm90U3VwcG9ydGVyczogW10gYXMgc3RyaW5nW10sXG4gICAgLy8gVGhlIHVzZXIgaWRzIGZvciB0aGUgb3RoZXIgZGV2cyBvbiB5b3VyIHRlYW1cbiAgICBib3REZXZzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAvLyBUaGUgdXNlciBpZHMgd2hvIGhhdmUgY29tcGxldGUgMTAwJSBhY2Nlc3MgdG8geW91ciBib3RcbiAgICBib3RPd25lcnM6IFtdIGFzIHN0cmluZ1tdLFxuICB9LFxuICB3ZWJob29rczoge1xuICAgIC8vIHRoZSB3ZWJob29rIHRvIHVzZSB3aGVuIHRoZSBib3QgZmluZHMgYSBtaXNzaW5nIHRyYW5zbGF0aW9uXG4gICAgbWlzc2luZ1RyYW5zbGF0aW9uOiB7XG4gICAgICBpZDogXCJcIixcbiAgICAgIHRva2VuOiBcIlwiLFxuICAgIH0sXG4gIH0sXG4gIC8vIExhdmFkZW5vIG5vZGVzXG4gIG5vZGVzOiBbXG4gICAge1xuICAgICAgLy8gSWQgb2YgdGhlIGNsaWVudCB3aGljaCBpcyBjb25uZWN0aW5nIHRvIHRoZSBsYXZhbGlua1xuICAgICAgaWQ6IFwibWFpblwiLFxuICAgICAgaG9zdDogXCJsYXZhbGluay1kZW5vLmhlcm9rdWFwcC5jb21cIixcbiAgICAgIHBvcnQ6ODAsXG4gICAgICBwYXNzd29yZDogXCJ5b3VzaGFsbG5vdHBhc3NcIixcbiAgICB9LFxuICBdLFxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFvSyxBQUFwSyxrS0FBb0s7QUFDcEssRUFBK0wsQUFBL0wsNkxBQStMO0FBQy9MLEVBQTZDLEFBQTdDLDJDQUE2QzthQUVoQyxPQUFPO0lBQ2xCLEVBQTZFLEFBQTdFLDJFQUE2RTtJQUM3RSxNQUFNLEdBQUUsQ0FBRztJQUNYLEVBQThELEFBQTlELDREQUE4RDtJQUM5RCxhQUFhO1FBQ1gsZUFBZTtRQUNmLGVBQWU7UUFDZixlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixhQUFhO1FBQ2IsZUFBZTtRQUNmLGtCQUFrQjs7SUFFcEIsRUFBb0YsQUFBcEYsa0ZBQW9GO0lBQ3BGLGVBQWU7SUFDZixFQUE4RCxBQUE5RCw0REFBOEQ7SUFDOUQsT0FBTztRQUNMLEVBQXlFLEFBQXpFLHVFQUF5RTtRQUN6RSxnQkFBZ0I7O0lBRWxCLEVBQThELEFBQTlELDREQUE4RDtJQUM5RCxPQUFPO1FBQ0wsRUFBc0UsQUFBdEUsb0VBQXNFO1FBQ3RFLEVBQW9DLEFBQXBDLGtDQUFvQztRQUNwQyxhQUFhO1FBQ2IsRUFBK0MsQUFBL0MsNkNBQStDO1FBQy9DLE9BQU87UUFDUCxFQUF5RCxBQUF6RCx1REFBeUQ7UUFDekQsU0FBUzs7SUFFWCxRQUFRO1FBQ04sRUFBOEQsQUFBOUQsNERBQThEO1FBQzlELGtCQUFrQjtZQUNoQixFQUFFO1lBQ0YsS0FBSzs7O0lBR1QsRUFBaUIsQUFBakIsZUFBaUI7SUFDakIsS0FBSzs7WUFFRCxFQUF1RCxBQUF2RCxxREFBdUQ7WUFDdkQsRUFBRSxHQUFFLElBQU07WUFDVixJQUFJLEdBQUUsMkJBQTZCO1lBQ25DLElBQUksRUFBQyxFQUFFO1lBQ1AsUUFBUSxHQUFFLGVBQWlCIn0=
