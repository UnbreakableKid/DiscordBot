export var DiscordMessageFlags;
(function (DiscordMessageFlags) {
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message has been published to subscribed channels (via Channel Following) */ "Crossposted"
    ] = 1
  ] = "Crossposted";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message originated from a message in another channel (via Channel Following) */ "IsCrosspost"
    ] = 2
  ] = "IsCrosspost";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** Do not include any embeds when serializing this message */ "SuppressEmbeeds"
    ] = 4
  ] = "SuppressEmbeeds";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** The source message for this crosspost has been deleted (via Channel Following) */ "SourceMessageDeleted"
    ] = 8
  ] = "SourceMessageDeleted";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message came from the urgent message system */ "Urgent"
    ] = 16
  ] = "Urgent";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message has an associated thread, with the same id as the message */ "HasThread"
    ] = 32
  ] = "HasThread";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message is only visible to the user who invoked the Interaction */ "Empheral"
    ] = 64
  ] = "Empheral";
  DiscordMessageFlags[
    DiscordMessageFlags[
      /** This message is an Interaction Response and the bot is "thinking" */ "Loading"
    ] = 128
  ] = "Loading";
})(DiscordMessageFlags || (DiscordMessageFlags = {}));
export const MessageFlags = DiscordMessageFlags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL21lc3NhZ2VzL21lc3NhZ2VfZmxhZ3MudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvY2hhbm5lbCNtZXNzYWdlLW9iamVjdC1tZXNzYWdlLWZsYWdzICovXG5leHBvcnQgZW51bSBEaXNjb3JkTWVzc2FnZUZsYWdzIHtcbiAgLyoqIFRoaXMgbWVzc2FnZSBoYXMgYmVlbiBwdWJsaXNoZWQgdG8gc3Vic2NyaWJlZCBjaGFubmVscyAodmlhIENoYW5uZWwgRm9sbG93aW5nKSAqL1xuICBDcm9zc3Bvc3RlZCA9IDEgPDwgMCxcbiAgLyoqIFRoaXMgbWVzc2FnZSBvcmlnaW5hdGVkIGZyb20gYSBtZXNzYWdlIGluIGFub3RoZXIgY2hhbm5lbCAodmlhIENoYW5uZWwgRm9sbG93aW5nKSAqL1xuICBJc0Nyb3NzcG9zdCA9IDEgPDwgMSxcbiAgLyoqIERvIG5vdCBpbmNsdWRlIGFueSBlbWJlZHMgd2hlbiBzZXJpYWxpemluZyB0aGlzIG1lc3NhZ2UgKi9cbiAgU3VwcHJlc3NFbWJlZWRzID0gMSA8PCAyLFxuICAvKiogVGhlIHNvdXJjZSBtZXNzYWdlIGZvciB0aGlzIGNyb3NzcG9zdCBoYXMgYmVlbiBkZWxldGVkICh2aWEgQ2hhbm5lbCBGb2xsb3dpbmcpICovXG4gIFNvdXJjZU1lc3NhZ2VEZWxldGVkID0gMSA8PCAzLFxuICAvKiogVGhpcyBtZXNzYWdlIGNhbWUgZnJvbSB0aGUgdXJnZW50IG1lc3NhZ2Ugc3lzdGVtICovXG4gIFVyZ2VudCA9IDEgPDwgNCxcbiAgLyoqIFRoaXMgbWVzc2FnZSBoYXMgYW4gYXNzb2NpYXRlZCB0aHJlYWQsIHdpdGggdGhlIHNhbWUgaWQgYXMgdGhlIG1lc3NhZ2UgKi9cbiAgSGFzVGhyZWFkID0gMSA8PCA1LFxuICAvKiogVGhpcyBtZXNzYWdlIGlzIG9ubHkgdmlzaWJsZSB0byB0aGUgdXNlciB3aG8gaW52b2tlZCB0aGUgSW50ZXJhY3Rpb24gKi9cbiAgRW1waGVyYWwgPSAxIDw8IDYsXG4gIC8qKiBUaGlzIG1lc3NhZ2UgaXMgYW4gSW50ZXJhY3Rpb24gUmVzcG9uc2UgYW5kIHRoZSBib3QgaXMgXCJ0aGlua2luZ1wiICovXG4gIExvYWRpbmcgPSAxIDw8IDcsXG59XG5cbmV4cG9ydCB0eXBlIE1lc3NhZ2VGbGFncyA9IERpc2NvcmRNZXNzYWdlRmxhZ3M7XG5leHBvcnQgY29uc3QgTWVzc2FnZUZsYWdzID0gRGlzY29yZE1lc3NhZ2VGbGFncztcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1VBQ1ksbUJBQW1CO0lBQW5CLG1CQUFtQixDQUFuQixtQkFBbUIsQ0FDN0IsRUFBcUYsQUFBckYsaUZBQXFGLEFBQXJGLEVBQXFGLEVBQ3JGLFdBQVcsS0FBWCxDQUFXLEtBQVgsV0FBVztJQUZELG1CQUFtQixDQUFuQixtQkFBbUIsQ0FHN0IsRUFBd0YsQUFBeEYsb0ZBQXdGLEFBQXhGLEVBQXdGLEVBQ3hGLFdBQVcsS0FBWCxDQUFXLEtBQVgsV0FBVztJQUpELG1CQUFtQixDQUFuQixtQkFBbUIsQ0FLN0IsRUFBOEQsQUFBOUQsMERBQThELEFBQTlELEVBQThELEVBQzlELGVBQWUsS0FBZixDQUFlLEtBQWYsZUFBZTtJQU5MLG1CQUFtQixDQUFuQixtQkFBbUIsQ0FPN0IsRUFBcUYsQUFBckYsaUZBQXFGLEFBQXJGLEVBQXFGLEVBQ3JGLG9CQUFvQixLQUFwQixDQUFvQixLQUFwQixvQkFBb0I7SUFSVixtQkFBbUIsQ0FBbkIsbUJBQW1CLENBUzdCLEVBQXVELEFBQXZELG1EQUF1RCxBQUF2RCxFQUF1RCxFQUN2RCxNQUFNLEtBQU4sRUFBTSxLQUFOLE1BQU07SUFWSSxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBVzdCLEVBQTZFLEFBQTdFLHlFQUE2RSxBQUE3RSxFQUE2RSxFQUM3RSxTQUFTLEtBQVQsRUFBUyxLQUFULFNBQVM7SUFaQyxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBYTdCLEVBQTJFLEFBQTNFLHVFQUEyRSxBQUEzRSxFQUEyRSxFQUMzRSxRQUFRLEtBQVIsRUFBUSxLQUFSLFFBQVE7SUFkRSxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBZTdCLEVBQXdFLEFBQXhFLG9FQUF3RSxBQUF4RSxFQUF3RSxFQUN4RSxPQUFPLEtBQVAsR0FBTyxLQUFQLE9BQU87R0FoQkcsbUJBQW1CLEtBQW5CLG1CQUFtQjs7YUFvQmxCLFlBQVksR0FBRyxtQkFBbUIifQ==
