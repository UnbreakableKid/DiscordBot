/*!
 * Based on https://github.com/jshttp/negotiator/blob/master/index.js
 * Copyright(c) 2012 Federico Romero
 * Copyright(c) 2012-2014 Isaac Z. Schlueter
 * Copyright(c) 2015 Douglas Christopher Wilson
 * Copyright(c) 2020 Henry Zhuang
 * MIT Licensed
 */ import { preferredCharsets } from "./src/charset.ts";
import { preferredEncodings } from "./src/encoding.ts";
import { preferredLanguages } from "./src/language.ts";
import { preferredMediaTypes } from "./src/media_type.ts";
class Negotiator {
    constructor(headers){
        this.headers = headers;
    }
    headers;
    charset(available) {
        const set = this.charsets(available);
        return set && set[0];
    }
    charsets(available) {
        return preferredCharsets(this.headers.get("accept-charset"), available);
    }
    encoding(available) {
        const set = this.encodings(available);
        return set && set[0];
    }
    encodings(available) {
        return preferredEncodings(this.headers.get("accept-encoding"), available);
    }
    language(available) {
        const set = this.languages(available);
        return set && set[0];
    }
    languages(available) {
        return preferredLanguages(this.headers.get("accept-language"), available);
    }
    mediaType(available) {
        const set = this.mediaTypes(available);
        return set && set[0];
    }
    mediaTypes(available) {
        return preferredMediaTypes(this.headers.get("accept"), available);
    }
}
export default Negotiator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L25lZ290aWF0b3JAMS4wLjEvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvbmVnb3RpYXRvci9ibG9iL21hc3Rlci9pbmRleC5qc1xuICogQ29weXJpZ2h0KGMpIDIwMTIgRmVkZXJpY28gUm9tZXJvXG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IElzYWFjIFouIFNjaGx1ZXRlclxuICogQ29weXJpZ2h0KGMpIDIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb25cbiAqIENvcHlyaWdodChjKSAyMDIwIEhlbnJ5IFpodWFuZ1xuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuaW1wb3J0IHsgcHJlZmVycmVkQ2hhcnNldHMgfSBmcm9tIFwiLi9zcmMvY2hhcnNldC50c1wiO1xuaW1wb3J0IHsgcHJlZmVycmVkRW5jb2RpbmdzIH0gZnJvbSBcIi4vc3JjL2VuY29kaW5nLnRzXCI7XG5pbXBvcnQgeyBwcmVmZXJyZWRMYW5ndWFnZXMgfSBmcm9tIFwiLi9zcmMvbGFuZ3VhZ2UudHNcIjtcbmltcG9ydCB7IHByZWZlcnJlZE1lZGlhVHlwZXMgfSBmcm9tIFwiLi9zcmMvbWVkaWFfdHlwZS50c1wiO1xuXG5jbGFzcyBOZWdvdGlhdG9yIHtcbiAgY29uc3RydWN0b3IoaGVhZGVyczogSGVhZGVycykge1xuICAgIHRoaXMuaGVhZGVycyA9IGhlYWRlcnM7XG4gIH1cbiAgcHJpdmF0ZSBoZWFkZXJzOiBIZWFkZXJzO1xuXG4gIGNoYXJzZXQoYXZhaWxhYmxlPzogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IHNldCA9IHRoaXMuY2hhcnNldHMoYXZhaWxhYmxlKTtcbiAgICByZXR1cm4gc2V0ICYmIHNldFswXTtcbiAgfVxuXG4gIGNoYXJzZXRzKGF2YWlsYWJsZT86IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBwcmVmZXJyZWRDaGFyc2V0cyh0aGlzLmhlYWRlcnMuZ2V0KFwiYWNjZXB0LWNoYXJzZXRcIiksIGF2YWlsYWJsZSk7XG4gIH1cblxuICBlbmNvZGluZyhhdmFpbGFibGU/OiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5lbmNvZGluZ3MoYXZhaWxhYmxlKTtcbiAgICByZXR1cm4gc2V0ICYmIHNldFswXTtcbiAgfVxuXG4gIGVuY29kaW5ncyhhdmFpbGFibGU/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gcHJlZmVycmVkRW5jb2RpbmdzKHRoaXMuaGVhZGVycy5nZXQoXCJhY2NlcHQtZW5jb2RpbmdcIiksIGF2YWlsYWJsZSk7XG4gIH1cblxuICBsYW5ndWFnZShhdmFpbGFibGU/OiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5sYW5ndWFnZXMoYXZhaWxhYmxlKTtcbiAgICByZXR1cm4gc2V0ICYmIHNldFswXTtcbiAgfVxuXG4gIGxhbmd1YWdlcyhhdmFpbGFibGU/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gcHJlZmVycmVkTGFuZ3VhZ2VzKHRoaXMuaGVhZGVycy5nZXQoXCJhY2NlcHQtbGFuZ3VhZ2VcIiksIGF2YWlsYWJsZSk7XG4gIH1cblxuICBtZWRpYVR5cGUoYXZhaWxhYmxlPzogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IHNldCA9IHRoaXMubWVkaWFUeXBlcyhhdmFpbGFibGUpO1xuICAgIHJldHVybiBzZXQgJiYgc2V0WzBdO1xuICB9XG5cbiAgbWVkaWFUeXBlcyhhdmFpbGFibGU/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gcHJlZmVycmVkTWVkaWFUeXBlcyh0aGlzLmhlYWRlcnMuZ2V0KFwiYWNjZXB0XCIpLCBhdmFpbGFibGUpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE5lZ290aWF0b3I7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLFVBRU0saUJBQWlCLFNBQVEsZ0JBQWtCO1NBQzNDLGtCQUFrQixTQUFRLGlCQUFtQjtTQUM3QyxrQkFBa0IsU0FBUSxpQkFBbUI7U0FDN0MsbUJBQW1CLFNBQVEsbUJBQXFCO01BRW5ELFVBQVU7Z0JBQ0YsT0FBZ0I7YUFDckIsT0FBTyxHQUFHLE9BQU87O0lBRWhCLE9BQU87SUFFZixPQUFPLENBQUMsU0FBb0I7Y0FDcEIsR0FBRyxRQUFRLFFBQVEsQ0FBQyxTQUFTO2VBQzVCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQzs7SUFHckIsUUFBUSxDQUFDLFNBQW9CO2VBQ3BCLGlCQUFpQixNQUFNLE9BQU8sQ0FBQyxHQUFHLEVBQUMsY0FBZ0IsSUFBRyxTQUFTOztJQUd4RSxRQUFRLENBQUMsU0FBb0I7Y0FDckIsR0FBRyxRQUFRLFNBQVMsQ0FBQyxTQUFTO2VBQzdCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQzs7SUFHckIsU0FBUyxDQUFDLFNBQW9CO2VBQ3JCLGtCQUFrQixNQUFNLE9BQU8sQ0FBQyxHQUFHLEVBQUMsZUFBaUIsSUFBRyxTQUFTOztJQUcxRSxRQUFRLENBQUMsU0FBb0I7Y0FDckIsR0FBRyxRQUFRLFNBQVMsQ0FBQyxTQUFTO2VBQzdCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQzs7SUFHckIsU0FBUyxDQUFDLFNBQW9CO2VBQ3JCLGtCQUFrQixNQUFNLE9BQU8sQ0FBQyxHQUFHLEVBQUMsZUFBaUIsSUFBRyxTQUFTOztJQUcxRSxTQUFTLENBQUMsU0FBb0I7Y0FDdEIsR0FBRyxRQUFRLFVBQVUsQ0FBQyxTQUFTO2VBQzlCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQzs7SUFHckIsVUFBVSxDQUFDLFNBQW9CO2VBQ3RCLG1CQUFtQixNQUFNLE9BQU8sQ0FBQyxHQUFHLEVBQUMsTUFBUSxJQUFHLFNBQVM7OztlQUlyRCxVQUFVIn0=