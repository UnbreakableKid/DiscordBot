const embedLimits = {
  title: 256,
  description: 2048,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  fields: 25,
  total: 6000,
};
export class Embed {
  /** The amount of characters in the embed. */ currentTotal = 0;
  /** Whether the limits should be enforced or not. */ enforceLimits = true;
  /** If a file is attached to the message it will be added here. */ file;
  color = 4320244;
  fields = [];
  author;
  description;
  footer;
  image;
  timestamp;
  title;
  thumbnail;
  url;
  constructor(enforceLimits = true) {
    // By default we will always want to enforce discord limits but this option allows us to bypass for whatever reason.
    if (!enforceLimits) this.enforceLimits = false;
    return this;
  }
  fitData(data, max) {
    // If the string is bigger then the allowed max shorten it.
    if (data.length > max) data = data.substring(0, max);
    // Check the amount of characters left for this embed
    const availableCharacters = embedLimits.total - this.currentTotal;
    // If it is maxed out already return empty string as nothing can be added anymore
    if (!availableCharacters) return ``;
    // If the string breaks the maximum embed limit then shorten it.
    if (this.currentTotal + data.length > embedLimits.total) {
      return data.substring(0, availableCharacters);
    }
    // Return the data as is with no changes.
    return data;
  }
  setAuthor(name, icon, url) {
    const finalName = this.enforceLimits
      ? this.fitData(name, embedLimits.authorName)
      : name;
    this.author = {
      name: finalName,
      iconUrl: icon,
      url,
    };
    return this;
  }
  setColor(color) {
    this.color = color.toLowerCase() === `random`
      ? Math.floor(Math.random() * (16777215 + 1))
      : parseInt(color.replace("#", ""), 16);
    return this;
  }
  setDescription(description) {
    if (Array.isArray(description)) description = description.join("\n");
    this.description = this.fitData(description, embedLimits.description);
    return this;
  }
  addField(name, value, inline = false) {
    if (this.fields.length >= 25) return this;
    this.fields.push({
      name: this.fitData(name, embedLimits.fieldName),
      value: this.fitData(value, embedLimits.fieldValue),
      inline,
    });
    return this;
  }
  addBlankField(inline = false) {
    return this.addField("\u200B", "\u200B", inline);
  }
  attachFile(file, name) {
    this.file = {
      blob: file,
      name,
    };
    this.setImage(`attachment://${name}`);
    return this;
  }
  setFooter(text, icon) {
    this.footer = {
      text: this.fitData(text, embedLimits.footerText),
      iconUrl: icon,
    };
    return this;
  }
  setImage(url) {
    this.image = {
      url,
    };
    return this;
  }
  setTimestamp(time = Date.now()) {
    this.timestamp = new Date(time).toISOString();
    return this;
  }
  setTitle(title, url) {
    this.title = this.fitData(title, embedLimits.title);
    if (url) this.url = url;
    return this;
  }
  setThumbnail(url) {
    this.thumbnail = {
      url,
    };
    return this;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL0VtYmVkLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFbWJlZEF1dGhvcixcbiAgRW1iZWRGaWVsZCxcbiAgRW1iZWRGb290ZXIsXG4gIEVtYmVkSW1hZ2UsXG59IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbmNvbnN0IGVtYmVkTGltaXRzID0ge1xuICB0aXRsZTogMjU2LFxuICBkZXNjcmlwdGlvbjogMjA0OCxcbiAgZmllbGROYW1lOiAyNTYsXG4gIGZpZWxkVmFsdWU6IDEwMjQsXG4gIGZvb3RlclRleHQ6IDIwNDgsXG4gIGF1dGhvck5hbWU6IDI1NixcbiAgZmllbGRzOiAyNSxcbiAgdG90YWw6IDYwMDAsXG59O1xuXG5leHBvcnQgY2xhc3MgRW1iZWQge1xuICAvKiogVGhlIGFtb3VudCBvZiBjaGFyYWN0ZXJzIGluIHRoZSBlbWJlZC4gKi9cbiAgY3VycmVudFRvdGFsID0gMDtcbiAgLyoqIFdoZXRoZXIgdGhlIGxpbWl0cyBzaG91bGQgYmUgZW5mb3JjZWQgb3Igbm90LiAqL1xuICBlbmZvcmNlTGltaXRzID0gdHJ1ZTtcbiAgLyoqIElmIGEgZmlsZSBpcyBhdHRhY2hlZCB0byB0aGUgbWVzc2FnZSBpdCB3aWxsIGJlIGFkZGVkIGhlcmUuICovXG4gIGZpbGU/OiBFbWJlZEZpbGU7XG5cbiAgY29sb3IgPSAweDQxZWJmNDtcbiAgZmllbGRzOiBFbWJlZEZpZWxkW10gPSBbXTtcbiAgYXV0aG9yPzogRW1iZWRBdXRob3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBmb290ZXI/OiBFbWJlZEZvb3RlcjtcbiAgaW1hZ2U/OiBFbWJlZEltYWdlO1xuICB0aW1lc3RhbXA/OiBzdHJpbmc7XG4gIHRpdGxlPzogc3RyaW5nO1xuICB0aHVtYm5haWw/OiBFbWJlZEltYWdlO1xuICB1cmw/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZW5mb3JjZUxpbWl0cyA9IHRydWUpIHtcbiAgICAvLyBCeSBkZWZhdWx0IHdlIHdpbGwgYWx3YXlzIHdhbnQgdG8gZW5mb3JjZSBkaXNjb3JkIGxpbWl0cyBidXQgdGhpcyBvcHRpb24gYWxsb3dzIHVzIHRvIGJ5cGFzcyBmb3Igd2hhdGV2ZXIgcmVhc29uLlxuICAgIGlmICghZW5mb3JjZUxpbWl0cykgdGhpcy5lbmZvcmNlTGltaXRzID0gZmFsc2U7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGZpdERhdGEoZGF0YTogc3RyaW5nLCBtYXg6IG51bWJlcikge1xuICAgIC8vIElmIHRoZSBzdHJpbmcgaXMgYmlnZ2VyIHRoZW4gdGhlIGFsbG93ZWQgbWF4IHNob3J0ZW4gaXQuXG4gICAgaWYgKGRhdGEubGVuZ3RoID4gbWF4KSBkYXRhID0gZGF0YS5zdWJzdHJpbmcoMCwgbWF4KTtcbiAgICAvLyBDaGVjayB0aGUgYW1vdW50IG9mIGNoYXJhY3RlcnMgbGVmdCBmb3IgdGhpcyBlbWJlZFxuICAgIGNvbnN0IGF2YWlsYWJsZUNoYXJhY3RlcnMgPSBlbWJlZExpbWl0cy50b3RhbCAtIHRoaXMuY3VycmVudFRvdGFsO1xuICAgIC8vIElmIGl0IGlzIG1heGVkIG91dCBhbHJlYWR5IHJldHVybiBlbXB0eSBzdHJpbmcgYXMgbm90aGluZyBjYW4gYmUgYWRkZWQgYW55bW9yZVxuICAgIGlmICghYXZhaWxhYmxlQ2hhcmFjdGVycykgcmV0dXJuIGBgO1xuICAgIC8vIElmIHRoZSBzdHJpbmcgYnJlYWtzIHRoZSBtYXhpbXVtIGVtYmVkIGxpbWl0IHRoZW4gc2hvcnRlbiBpdC5cbiAgICBpZiAodGhpcy5jdXJyZW50VG90YWwgKyBkYXRhLmxlbmd0aCA+IGVtYmVkTGltaXRzLnRvdGFsKSB7XG4gICAgICByZXR1cm4gZGF0YS5zdWJzdHJpbmcoMCwgYXZhaWxhYmxlQ2hhcmFjdGVycyk7XG4gICAgfVxuICAgIC8vIFJldHVybiB0aGUgZGF0YSBhcyBpcyB3aXRoIG5vIGNoYW5nZXMuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBzZXRBdXRob3IobmFtZTogc3RyaW5nLCBpY29uPzogc3RyaW5nLCB1cmw/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaW5hbE5hbWUgPSB0aGlzLmVuZm9yY2VMaW1pdHNcbiAgICAgID8gdGhpcy5maXREYXRhKG5hbWUsIGVtYmVkTGltaXRzLmF1dGhvck5hbWUpXG4gICAgICA6IG5hbWU7XG4gICAgdGhpcy5hdXRob3IgPSB7IG5hbWU6IGZpbmFsTmFtZSwgaWNvblVybDogaWNvbiwgdXJsIH07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldENvbG9yKGNvbG9yOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNvbG9yID0gY29sb3IudG9Mb3dlckNhc2UoKSA9PT0gYHJhbmRvbWBcbiAgICAgID8gLy8gUmFuZG9tIGNvbG9yXG4gICAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICgweGZmZmZmZiArIDEpKVxuICAgICAgOiAvLyBDb252ZXJ0IHRoZSBoZXggdG8gYSBhY2NlcHRhYmxlIGNvbG9yIGZvciBkaXNjb3JkXG4gICAgICAgIHBhcnNlSW50KGNvbG9yLnJlcGxhY2UoXCIjXCIsIFwiXCIpLCAxNik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGRlc2NyaXB0aW9uKSkgZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbi5qb2luKFwiXFxuXCIpO1xuICAgIHRoaXMuZGVzY3JpcHRpb24gPSB0aGlzLmZpdERhdGEoZGVzY3JpcHRpb24sIGVtYmVkTGltaXRzLmRlc2NyaXB0aW9uKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYWRkRmllbGQobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBpbmxpbmUgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmZpZWxkcy5sZW5ndGggPj0gMjUpIHJldHVybiB0aGlzO1xuXG4gICAgdGhpcy5maWVsZHMucHVzaCh7XG4gICAgICBuYW1lOiB0aGlzLmZpdERhdGEobmFtZSwgZW1iZWRMaW1pdHMuZmllbGROYW1lKSxcbiAgICAgIHZhbHVlOiB0aGlzLmZpdERhdGEodmFsdWUsIGVtYmVkTGltaXRzLmZpZWxkVmFsdWUpLFxuICAgICAgaW5saW5lLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhZGRCbGFua0ZpZWxkKGlubGluZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkRmllbGQoXCJcXHUyMDBCXCIsIFwiXFx1MjAwQlwiLCBpbmxpbmUpO1xuICB9XG5cbiAgYXR0YWNoRmlsZShmaWxlOiB1bmtub3duLCBuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLmZpbGUgPSB7XG4gICAgICBibG9iOiBmaWxlLFxuICAgICAgbmFtZSxcbiAgICB9O1xuICAgIHRoaXMuc2V0SW1hZ2UoYGF0dGFjaG1lbnQ6Ly8ke25hbWV9YCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEZvb3Rlcih0ZXh0OiBzdHJpbmcsIGljb24/OiBzdHJpbmcpIHtcbiAgICB0aGlzLmZvb3RlciA9IHtcbiAgICAgIHRleHQ6IHRoaXMuZml0RGF0YSh0ZXh0LCBlbWJlZExpbWl0cy5mb290ZXJUZXh0KSxcbiAgICAgIGljb25Vcmw6IGljb24sXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW1hZ2UodXJsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmltYWdlID0geyB1cmwgfTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VGltZXN0YW1wKHRpbWUgPSBEYXRlLm5vdygpKSB7XG4gICAgdGhpcy50aW1lc3RhbXAgPSBuZXcgRGF0ZSh0aW1lKS50b0lTT1N0cmluZygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUaXRsZSh0aXRsZTogc3RyaW5nLCB1cmw/OiBzdHJpbmcpIHtcbiAgICB0aGlzLnRpdGxlID0gdGhpcy5maXREYXRhKHRpdGxlLCBlbWJlZExpbWl0cy50aXRsZSk7XG4gICAgaWYgKHVybCkgdGhpcy51cmwgPSB1cmw7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRodW1ibmFpbCh1cmw6IHN0cmluZykge1xuICAgIHRoaXMudGh1bWJuYWlsID0geyB1cmwgfTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1iZWRGaWxlIHtcbiAgYmxvYjogdW5rbm93bjtcbiAgbmFtZTogc3RyaW5nO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQU9NLFdBQVc7SUFDZixLQUFLLEVBQUUsR0FBRztJQUNWLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLFNBQVMsRUFBRSxHQUFHO0lBQ2QsVUFBVSxFQUFFLElBQUk7SUFDaEIsVUFBVSxFQUFFLElBQUk7SUFDaEIsVUFBVSxFQUFFLEdBQUc7SUFDZixNQUFNLEVBQUUsRUFBRTtJQUNWLEtBQUssRUFBRSxJQUFJOzthQUdBLEtBQUs7SUFDaEIsRUFBNkMsQUFBN0MseUNBQTZDLEFBQTdDLEVBQTZDLENBQzdDLFlBQVksR0FBRyxDQUFDO0lBQ2hCLEVBQW9ELEFBQXBELGdEQUFvRCxBQUFwRCxFQUFvRCxDQUNwRCxhQUFhLEdBQUcsSUFBSTtJQUNwQixFQUFrRSxBQUFsRSw4REFBa0UsQUFBbEUsRUFBa0UsQ0FDbEUsSUFBSTtJQUVKLEtBQUssR0FBRyxPQUFRO0lBQ2hCLE1BQU07SUFDTixNQUFNO0lBQ04sV0FBVztJQUNYLE1BQU07SUFDTixLQUFLO0lBQ0wsU0FBUztJQUNULEtBQUs7SUFDTCxTQUFTO0lBQ1QsR0FBRztnQkFFUyxhQUFhLEdBQUcsSUFBSTtRQUM5QixFQUFvSCxBQUFwSCxrSEFBb0g7YUFDL0csYUFBYSxPQUFPLGFBQWEsR0FBRyxLQUFLOzs7SUFLaEQsT0FBTyxDQUFDLElBQVksRUFBRSxHQUFXO1FBQy9CLEVBQTJELEFBQTNELHlEQUEyRDtZQUN2RCxJQUFJLENB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
